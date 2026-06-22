import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { COLUMNS } from '../../constants/columns';
import { filterTasks } from '../../lib/utils';
import type { FilterState, Task, TaskStatus } from '../../types';
import { Column } from './Column';
import { TaskCard } from './TaskCard';

interface BoardProps {
  tasks: Task[];
  filters: FilterState;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  onReorder: (
    taskId: string,
    newStatus: TaskStatus,
    newPosition: number,
    oldStatus: TaskStatus,
  ) => void;
}

export function Board({ tasks, filters, onTaskClick, onAddTask, onReorder }: BoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    };

    for (const task of filteredTasks) {
      grouped[task.status].push(task);
    }

    for (const status of Object.keys(grouped) as TaskStatus[]) {
      grouped[status].sort((a, b) => a.position - b.position);
    }

    return grouped;
  }, [filteredTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const overId = over.id as string;
    const columnIds: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

    let newStatus: TaskStatus;
    let newPosition: number;

    if (columnIds.includes(overId as TaskStatus)) {
      newStatus = overId as TaskStatus;
      newPosition = tasksByColumn[newStatus].length;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      newStatus = overTask.status;
      newPosition = overTask.position;
    }

    if (task.status === newStatus && task.position === newPosition) return;

    onReorder(taskId, newStatus, newPosition, task.status);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="board">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={tasksByColumn[column.id]}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="task-card-overlay">
            <TaskCard task={activeTask} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
