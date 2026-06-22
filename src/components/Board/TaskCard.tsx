import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, GripVertical } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { PRIORITY_COLORS } from '../../constants/columns';
import { getDueDateUrgency, getInitials } from '../../lib/utils';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const urgency = getDueDateUrgency(task.due_date);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
    >
      <div className="task-card-header">
        <button
          type="button"
          className="drag-handle"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag task"
        >
          <GripVertical size={14} />
        </button>
        {task.labels && task.labels.length > 0 && (
          <div className="task-labels">
            {task.labels.map((label) => (
              <span
                key={label.id}
                className="task-label"
                style={{ backgroundColor: `${label.color}22`, color: label.color }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <h3 className="task-title">{task.title}</h3>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-card-footer">
        <div className="task-meta">
          <span
            className="priority-badge"
            style={{ color: PRIORITY_COLORS[task.priority] }}
          >
            {task.priority}
          </span>

          {task.due_date && (
            <span className={`due-date due-date-${urgency}`}>
              <Calendar size={12} />
              {format(parseISO(task.due_date), 'MMM d')}
            </span>
          )}
        </div>

        {task.assignees && task.assignees.length > 0 && (
          <div className="assignee-avatars">
            {task.assignees.slice(0, 3).map((member) => (
              <span
                key={member.id}
                className="assignee-avatar"
                style={{ backgroundColor: member.color }}
                title={member.name}
              >
                {getInitials(member.name)}
              </span>
            ))}
            {task.assignees.length > 3 && (
              <span className="assignee-avatar assignee-overflow">
                +{task.assignees.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
