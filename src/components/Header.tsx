import { LayoutGrid, Plus } from 'lucide-react';

interface HeaderProps {
  onNewTask: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({ onNewTask, onToggleSidebar, sidebarOpen }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo">
          <LayoutGrid size={22} />
          <span>Flowboard</span>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className={`btn btn-ghost ${sidebarOpen ? 'active' : ''}`}
          onClick={onToggleSidebar}
        >
          Team & Labels
        </button>
        <button type="button" className="btn btn-primary" onClick={onNewTask}>
          <Plus size={18} />
          New Task
        </button>
      </div>
    </header>
  );
}
