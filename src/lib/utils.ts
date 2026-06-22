import { formatDistanceToNow, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import type { FilterState, Task } from '../types';

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export type DueDateUrgency = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'normal' | null;

export function getDueDateUrgency(dueDate: string | null): DueDateUrgency {
  if (!dueDate) return null;

  const date = parseISO(dueDate);
  const now = new Date();

  if (isPast(date) && !isToday(date)) return 'overdue';
  if (isToday(date)) return 'today';
  if (isTomorrow(date)) return 'tomorrow';

  const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 3) return 'soon';

  return 'normal';
}

export function filterTasks(tasks: Task[], filters: FilterState): Task[] {
  return tasks.filter((task) => {
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(query);
      const matchesDesc = task.description?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDesc) return false;
    }

    if (filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }

    if (filters.assigneeId !== 'all') {
      const hasAssignee = task.assignees?.some((a) => a.id === filters.assigneeId);
      if (!hasAssignee) return false;
    }

    if (filters.labelId !== 'all') {
      const hasLabel = task.labels?.some((l) => l.id === filters.labelId);
      if (!hasLabel) return false;
    }

    return true;
  });
}

export function getBoardStats(tasks: Task[]) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  const overdue = tasks.filter(
    (t) => t.due_date && getDueDateUrgency(t.due_date) === 'overdue' && t.status !== 'done',
  ).length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;

  return { total, completed, overdue, inProgress };
}
