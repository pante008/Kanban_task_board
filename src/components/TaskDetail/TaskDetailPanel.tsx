import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { MessageSquare, Send, Trash2, X } from 'lucide-react';
import { COLUMNS, STATUS_LABELS } from '../../constants/columns';
import { useComments } from '../../hooks/useComments';
import { useTaskActivity } from '../../hooks/useTasks';
import { formatRelativeTime } from '../../lib/utils';
import type { Label, Task, TeamMember } from '../../types';

interface TaskDetailPanelProps {
  task: Task;
  members: TeamMember[];
  labels: Label[];
  userId: string;
  onClose: () => void;
  onUpdate: (
    taskId: string,
    updates: Partial<Task> & { assignee_ids?: string[]; label_ids?: string[] },
  ) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskDetailPanel({
  task,
  members,
  labels,
  userId,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [dueDate, setDueDate] = useState(task.due_date ?? '');
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    task.assignees?.map((a) => a.id) ?? [],
  );
  const [labelIds, setLabelIds] = useState<string[]>(
    task.labels?.map((l) => l.id) ?? [],
  );
  const [commentText, setCommentText] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');

  const { comments, loading: commentsLoading, addComment } = useComments(task.id);
  const { activity, loading: activityLoading } = useTaskActivity(task.id);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(task.id, {
        title,
        description: description || null,
        priority,
        status,
        due_date: dueDate || null,
        assignee_ids: assigneeIds,
        label_ids: labelIds,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await addComment(userId, commentText.trim());
    setCommentText('');
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this task permanently?')) {
      await onDelete(task.id);
      onClose();
    }
  };

  const formatActivityMessage = (action: string, details: Record<string, unknown> | null) => {
    switch (action) {
      case 'created':
        return `Created task "${details?.title ?? task.title}"`;
      case 'status_changed':
        return `Moved from ${details?.from_label ?? details?.from} → ${details?.to_label ?? details?.to}`;
      case 'updated':
        return 'Updated task details';
      case 'comment_added':
        return 'Added a comment';
      default:
        return action.replace(/_/g, ' ');
    }
  };

  return (
    <div className="detail-overlay" onClick={onClose} role="presentation">
      <aside
        className="detail-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Task details"
      >
        <div className="detail-header">
          <input
            className="detail-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
          />
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="detail-tabs">
          <button
            type="button"
            className={`detail-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            type="button"
            className={`detail-tab ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            Comments ({comments.length})
          </button>
          <button
            type="button"
            className={`detail-tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
        </div>

        <div className="detail-content">
          {activeTab === 'details' && (
            <div className="detail-form">
              <div className="form-group">
                <label htmlFor="detail-description">Description</label>
                <textarea
                  id="detail-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSave}
                  rows={4}
                  placeholder="Add a description..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="detail-status">Status</label>
                  <select
                    id="detail-status"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value as Task['status']);
                      setTimeout(handleSave, 0);
                    }}
                  >
                    {COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="detail-priority">Priority</label>
                  <select
                    id="detail-priority"
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value as Task['priority']);
                      setTimeout(handleSave, 0);
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="detail-due">Due Date</label>
                  <input
                    id="detail-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      setTimeout(handleSave, 0);
                    }}
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
                        onClick={() => {
                          const next = assigneeIds.includes(member.id)
                            ? assigneeIds.filter((id) => id !== member.id)
                            : [...assigneeIds, member.id];
                          setAssigneeIds(next);
                          onUpdate(task.id, { assignee_ids: next });
                        }}
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
                        onClick={() => {
                          const next = labelIds.includes(label.id)
                            ? labelIds.filter((id) => id !== label.id)
                            : [...labelIds, label.id];
                          setLabelIds(next);
                          onUpdate(task.id, { label_ids: next });
                        }}
                      >
                        {label.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-meta">
                <span>Created {format(parseISO(task.created_at), 'MMM d, yyyy')}</span>
                <span>Status: {STATUS_LABELS[task.status]}</span>
              </div>

              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={saving}
              >
                <Trash2 size={14} />
                Delete Task
              </button>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="comments-section">
              <div className="comments-list">
                {commentsLoading ? (
                  <p className="empty-text">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <div className="empty-state-small">
                    <MessageSquare size={24} />
                    <p>No comments yet. Start the conversation!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="comment">
                      <div className="comment-avatar">G</div>
                      <div className="comment-body">
                        <div className="comment-header">
                          <span className="comment-author">Guest</span>
                          <span className="comment-time">
                            {formatRelativeTime(comment.created_at)}
                          </span>
                        </div>
                        <p>{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="comment-input">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleAddComment();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-section">
              {activityLoading ? (
                <p className="empty-text">Loading activity...</p>
              ) : activity.length === 0 ? (
                <div className="empty-state-small">
                  <p>No activity recorded yet.</p>
                </div>
              ) : (
                <ul className="activity-timeline">
                  {activity.map((entry) => (
                    <li key={entry.id} className="activity-item">
                      <div className="activity-dot" />
                      <div className="activity-content">
                        <p>{formatActivityMessage(entry.action, entry.details)}</p>
                        <span className="activity-time">
                          {formatRelativeTime(entry.created_at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
