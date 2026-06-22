import { useState } from 'react';
import { Plus, Tag, Trash2, Users, X } from 'lucide-react';
import { LABEL_COLORS, MEMBER_COLORS } from '../../constants/columns';
import { getInitials } from '../../lib/utils';
import type { Label, TeamMember } from '../../types';

interface TeamPanelProps {
  members: TeamMember[];
  labels: Label[];
  userId: string;
  onAddMember: (name: string, color: string) => Promise<void>;
  onRemoveMember: (id: string) => Promise<void>;
  onAddLabel: (name: string, color: string) => Promise<void>;
  onRemoveLabel: (id: string) => Promise<void>;
  onClose: () => void;
}

export function TeamPanel({
  members,
  labels,
  onAddMember,
  onRemoveMember,
  onAddLabel,
  onRemoveLabel,
  onClose,
}: TeamPanelProps) {
  const [memberName, setMemberName] = useState('');
  const [memberColor, setMemberColor] = useState(MEMBER_COLORS[0]);
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState(LABEL_COLORS[0]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;
    await onAddMember(memberName.trim(), memberColor);
    setMemberName('');
    setMemberColor(MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)]);
  };

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelName.trim()) return;
    await onAddLabel(labelName.trim(), labelColor);
    setLabelName('');
    setLabelColor(LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)]);
  };

  return (
    <aside className="sidebar-panel">
      <div className="sidebar-header">
        <h2>Team & Labels</h2>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close sidebar">
          <X size={18} />
        </button>
      </div>

      <section className="sidebar-section">
        <div className="sidebar-section-header">
          <Users size={16} />
          <h3>Team Members</h3>
        </div>

        <form onSubmit={handleAddMember} className="sidebar-form">
          <input
            type="text"
            placeholder="Member name"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
          />
          <div className="color-picker">
            {MEMBER_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-swatch ${memberColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setMemberColor(color)}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-sm btn-full">
            <Plus size={14} />
            Add Member
          </button>
        </form>

        <ul className="sidebar-list">
          {members.length === 0 ? (
            <li className="sidebar-empty">No team members yet</li>
          ) : (
            members.map((member) => (
              <li key={member.id} className="sidebar-item">
                <span className="member-avatar" style={{ backgroundColor: member.color }}>
                  {getInitials(member.name)}
                </span>
                <span className="member-name">{member.name}</span>
                <button
                  type="button"
                  className="item-delete"
                  onClick={() => onRemoveMember(member.id)}
                  aria-label={`Remove ${member.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="sidebar-section">
        <div className="sidebar-section-header">
          <Tag size={16} />
          <h3>Labels</h3>
        </div>

        <form onSubmit={handleAddLabel} className="sidebar-form">
          <input
            type="text"
            placeholder="Label name"
            value={labelName}
            onChange={(e) => setLabelName(e.target.value)}
          />
          <div className="color-picker">
            {LABEL_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-swatch ${labelColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setLabelColor(color)}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-sm btn-full">
            <Plus size={14} />
            Add Label
          </button>
        </form>

        <ul className="sidebar-list">
          {labels.length === 0 ? (
            <li className="sidebar-empty">No labels yet</li>
          ) : (
            labels.map((label) => (
              <li key={label.id} className="sidebar-item">
                <span
                  className="label-dot"
                  style={{ backgroundColor: label.color }}
                />
                <span className="member-name">{label.name}</span>
                <button
                  type="button"
                  className="item-delete"
                  onClick={() => onRemoveLabel(label.id)}
                  aria-label={`Remove ${label.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </aside>
  );
}
