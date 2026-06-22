import { useState } from 'react';
import { X } from 'lucide-react';
import { COLUMNS } from '../../constants/columns';
import type { CreateTaskInput, Label, TaskStatus, TeamMember } from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  defaultStatus?: TaskStatus;
  members: TeamMember[];
  labels: Label[];
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
}

export function CreateTaskModal({
  isOpen,
  defaultStatus = 'todo',
  members,
  labels,
  onClose,
  onSubmit,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleLabel = (id: string) => {
    setLabelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        status,
        assignee_ids: assigneeIds,
        label_ids: labelIds,
      });
      setTitle('');
      setDescription('');
      setPriority('normal');
      setDueDate('');
      setStatus(defaultStatus);
      setAssigneeIds([]);
      setLabelIds([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="create-task-title"
      >
        <div className="modal-header">
          <h2 id="create-task-title">Create Task</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="task-title">Title *</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-status">Status</label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-due">Due Date</label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {members.length > 0 && (
            <div className="form-group">
              <label>Assignees</label>
              <div className="chip-select">
                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    className={`chip ${assigneeIds.includes(member.id) ? 'chip-active' : ''}`}
                    style={
                      assigneeIds.includes(member.id)
                        ? { borderColor: member.color, backgroundColor: `${member.color}22` }
                        : undefined
                    }
                    onClick={() => toggleAssignee(member.id)}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {labels.length > 0 && (
            <div className="form-group">
              <label>Labels</label>
              <div className="chip-select">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    className={`chip ${labelIds.includes(label.id) ? 'chip-active' : ''}`}
                    style={
                      labelIds.includes(label.id)
                        ? { borderColor: label.color, backgroundColor: `${label.color}22` }
                        : undefined
                    }
                    onClick={() => toggleLabel(label.id)}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
