import { CheckCircle2, Clock, ListTodo, AlertTriangle } from 'lucide-react';
import type { Task } from '../../types';
import { getBoardStats } from '../../lib/utils';

interface BoardStatsProps {
  tasks: Task[];
}

export function BoardStats({ tasks }: BoardStatsProps) {
  const stats = getBoardStats(tasks);

  return (
    <div className="board-stats">
      <div className="stat-card">
        <ListTodo size={18} className="stat-icon" />
        <div>
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
      </div>
      <div className="stat-card">
        <Clock size={18} className="stat-icon stat-icon-progress" />
        <div>
          <span className="stat-value">{stats.inProgress}</span>
          <span className="stat-label">In Progress</span>
        </div>
      </div>
      <div className="stat-card">
        <CheckCircle2 size={18} className="stat-icon stat-icon-done" />
        <div>
          <span className="stat-value">{stats.completed}</span>
          <span className="stat-label">Completed</span>
        </div>
      </div>
      {stats.overdue > 0 && (
        <div className="stat-card stat-card-warning">
          <AlertTriangle size={18} className="stat-icon stat-icon-overdue" />
          <div>
            <span className="stat-value">{stats.overdue}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>
      )}
    </div>
  );
}
