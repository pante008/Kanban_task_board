import { Search, X } from 'lucide-react';
import type { FilterState, Label, TaskPriority, TeamMember } from '../../types';

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  members: TeamMember[];
  labels: Label[];
}

export function FilterBar({ filters, onChange, members, labels }: FilterBarProps) {
  const hasActiveFilters =
    filters.search ||
    filters.priority !== 'all' ||
    filters.assigneeId !== 'all' ||
    filters.labelId !== 'all';

  const clearFilters = () => {
    onChange({ search: '', priority: 'all', assigneeId: 'all', labelId: 'all' });
  };

  return (
    <div className="filter-bar">
      <div className="search-input-wrapper">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="search-input"
        />
      </div>

      <select
        value={filters.priority}
        onChange={(e) =>
          onChange({ ...filters, priority: e.target.value as TaskPriority | 'all' })
        }
        className="filter-select"
      >
        <option value="all">All priorities</option>
        <option value="high">High</option>
        <option value="normal">Normal</option>
        <option value="low">Low</option>
      </select>

      <select
        value={filters.assigneeId}
        onChange={(e) => onChange({ ...filters, assigneeId: e.target.value })}
        className="filter-select"
      >
        <option value="all">All assignees</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      <select
        value={filters.labelId}
        onChange={(e) => onChange({ ...filters, labelId: e.target.value })}
        className="filter-select"
      >
        <option value="all">All labels</option>
        {labels.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}
