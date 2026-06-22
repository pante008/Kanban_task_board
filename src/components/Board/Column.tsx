import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { ColumnConfig, Task } from '../../types';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  column: ColumnConfig;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: ColumnConfig['id']) => void;
}

export function Column({ column, tasks, onTaskClick, onAddTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { column },
  });

  return (
    <section className={`board-column ${isOver ? 'column-over' : ''}`}>
      <div className="column-header">
        <div className="column-title">
          <span className="column-dot" style={{ backgroundColor: column.color }} />
          <h2>{column.title}</h2>
          <span className="column-count">{tasks.length}</span>
        </div>
        <button
          type="button"
          className="column-add-btn"
          onClick={() => onAddTask(column.id)}
          aria-label={`Add task to ${column.title}`}
        >
          <Plus size={16} />
        </button>
      </div>

      <div ref={setNodeRef} className="column-content">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="column-empty">
              <p>No tasks yet</p>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onAddTask(column.id)}
              >
                Add a task
              </button>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))
          )}
        </SortableContext>
      </div>
    </section>
  );
}
