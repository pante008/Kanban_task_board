import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { STATUS_LABELS } from '../constants/columns';
import type { ActivityEntry, CreateTaskInput, Label, Task, TaskStatus, TeamMember } from '../types';

async function fetchTasksWithRelations(): Promise<Task[]> {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true });

  if (error) throw error;
  if (!tasks?.length) return [];

  const taskIds = tasks.map((t) => t.id);

  const [assigneesRes, labelsRes] = await Promise.all([
    supabase
      .from('task_assignees')
      .select('task_id, member:team_members(*)')
      .in('task_id', taskIds),
    supabase
      .from('task_labels')
      .select('task_id, label:labels(*)')
      .in('task_id', taskIds),
  ]);

  if (assigneesRes.error) throw assigneesRes.error;
  if (labelsRes.error) throw labelsRes.error;

  return tasks.map((task) => ({
    ...task,
    assignees: assigneesRes.data
      ?.filter((a) => a.task_id === task.id)
      .map((a) => {
        const member = a.member as TeamMember | TeamMember[] | null;
        return Array.isArray(member) ? member : member ? [member] : [];
      })
      .flat() ?? [],
    labels: labelsRes.data
      ?.filter((l) => l.task_id === task.id)
      .map((l) => {
        const label = l.label as Label | Label[] | null;
        return Array.isArray(label) ? label : label ? [label] : [];
      })
      .flat() ?? [],
  }));
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchTasksWithRelations();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const logActivity = async (
    taskId: string,
    userId: string,
    action: string,
    details?: Record<string, unknown>,
  ) => {
    await supabase.from('activity_log').insert({
      task_id: taskId,
      user_id: userId,
      action,
      details: details ?? null,
    });
  };

  const createTask = async (userId: string, input: CreateTaskInput) => {
    const status = input.status ?? 'todo';
    const maxPosition = tasks
      .filter((t) => t.status === status)
      .reduce((max, t) => Math.max(max, t.position), -1);

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? 'normal',
        due_date: input.due_date ?? null,
        status,
        user_id: userId,
        position: maxPosition + 1,
      })
      .select()
      .single();

    if (taskError) throw taskError;

    if (input.assignee_ids?.length) {
      await supabase.from('task_assignees').insert(
        input.assignee_ids.map((memberId) => ({
          task_id: task.id,
          member_id: memberId,
        })),
      );
    }

    if (input.label_ids?.length) {
      await supabase.from('task_labels').insert(
        input.label_ids.map((labelId) => ({
          task_id: task.id,
          label_id: labelId,
        })),
      );
    }

    await logActivity(task.id, userId, 'created', { title: input.title });
    await loadTasks();
    return task;
  };

  const updateTaskStatus = async (
    taskId: string,
    userId: string,
    newStatus: TaskStatus,
    newPosition: number,
    oldStatus: TaskStatus,
  ) => {
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: newStatus, position: newPosition })
      .eq('id', taskId);

    if (updateError) throw updateError;

    await logActivity(taskId, userId, 'status_changed', {
      from: oldStatus,
      to: newStatus,
      from_label: STATUS_LABELS[oldStatus],
      to_label: STATUS_LABELS[newStatus],
    });

    await loadTasks();
  };

  const updateTask = async (
    taskId: string,
    userId: string,
    updates: Partial<Task> & { assignee_ids?: string[]; label_ids?: string[] },
  ) => {
    const { assignee_ids, label_ids, assignees, labels, ...taskUpdates } = updates;

    if (Object.keys(taskUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update(taskUpdates)
        .eq('id', taskId);
      if (updateError) throw updateError;
    }

    if (assignee_ids !== undefined) {
      await supabase.from('task_assignees').delete().eq('task_id', taskId);
      if (assignee_ids.length) {
        await supabase.from('task_assignees').insert(
          assignee_ids.map((memberId) => ({ task_id: taskId, member_id: memberId })),
        );
      }
    }

    if (label_ids !== undefined) {
      await supabase.from('task_labels').delete().eq('task_id', taskId);
      if (label_ids.length) {
        await supabase.from('task_labels').insert(
          label_ids.map((labelId) => ({ task_id: taskId, label_id: labelId })),
        );
      }
    }

    await logActivity(taskId, userId, 'updated', { fields: Object.keys(updates) });
    await loadTasks();
  };

  const deleteTask = async (taskId: string) => {
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', taskId);
    if (deleteError) throw deleteError;
    await loadTasks();
  };

  const reorderTasks = async (
    taskId: string,
    userId: string,
    newStatus: TaskStatus,
    newPosition: number,
    oldStatus: TaskStatus,
  ) => {
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t,
      );
      return updated.sort((a, b) =>
        a.status === b.status ? a.position - b.position : a.status.localeCompare(b.status),
      );
    });

    try {
      await updateTaskStatus(taskId, userId, newStatus, newPosition, oldStatus);
    } catch {
      await loadTasks();
    }
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    refresh: loadTasks,
  };
}

export function useTaskActivity(taskId: string | null) {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!taskId) {
      setActivity([]);
      return;
    }

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (!error && data) setActivity(data);
      setLoading(false);
    }

    load();
  }, [taskId]);

  return { activity, loading };
}
