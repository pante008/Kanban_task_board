import { useState } from 'react';
import { Board } from './components/Board/Board';
import { FilterBar } from './components/Filters/FilterBar';
import { Header } from './components/Header';
import { CreateTaskModal } from './components/modals/CreateTaskModal';
import { BoardStats } from './components/Stats/BoardStats';
import { TaskDetailPanel } from './components/TaskDetail/TaskDetailPanel';
import { TeamPanel } from './components/Team/TeamPanel';
import { ErrorBanner } from './components/ui/ErrorBanner';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { useAuth } from './hooks/useAuth';
import { useLabels } from './hooks/useLabels';
import { useTasks } from './hooks/useTasks';
import { useTeamMembers } from './hooks/useTeamMembers';
import type { CreateTaskInput, FilterState, Task, TaskStatus } from './types';
import './App.css';

const defaultFilters: FilterState = {
  search: '',
  priority: 'all',
  assigneeId: 'all',
  labelId: 'all',
};

function App() {
  const { user, loading: authLoading, error: authError } = useAuth();
  const { tasks, loading: tasksLoading, error: tasksError, createTask, updateTask, deleteTask, reorderTasks } = useTasks();
  const { members, addMember, removeMember } = useTeamMembers();
  const { labels, addLabel, removeLabel } = useLabels();

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<TaskStatus>('todo');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dismissedError, setDismissedError] = useState(false);

  const loading = authLoading || tasksLoading;
  const error = authError || tasksError;

  const handleCreateTask = async (input: CreateTaskInput) => {
    if (!user) return;
    await createTask(user.id, input);
  };

  const handleOpenCreate = (status: TaskStatus = 'todo') => {
    setCreateDefaultStatus(status);
    setShowCreateModal(true);
  };

  const handleReorder = async (
    taskId: string,
    newStatus: TaskStatus,
    newPosition: number,
    oldStatus: TaskStatus,
  ) => {
    if (!user) return;
    await reorderTasks(taskId, user.id, newStatus, newPosition, oldStatus);
  };

  const handleUpdateTask = async (
    taskId: string,
    updates: Parameters<typeof updateTask>[2],
  ) => {
    if (!user) return;
    await updateTask(taskId, user.id, updates);
    if (selectedTask?.id === taskId) {
      const updated = tasks.find((t) => t.id === taskId);
      if (updated) setSelectedTask({ ...updated, ...updates });
    }
  };

  if (loading) {
    return (
      <div className="app app-loading">
        <LoadingSpinner message="Setting up your workspace..." />
      </div>
    );
  }

  if (authError && !user) {
    return (
      <div className="app app-loading">
        <ErrorBanner message={authError} />
        <p className="setup-hint">
          Make sure Supabase is configured. Copy <code>.env.example</code> to <code>.env</code> and
          enable anonymous sign-in in your Supabase dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        onNewTask={() => handleOpenCreate()}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
      />

      {error && !dismissedError && (
        <ErrorBanner message={error} onDismiss={() => setDismissedError(true)} />
      )}

      <main className="main-content">
        <div className="content-area">
          <BoardStats tasks={tasks} />
          <FilterBar
            filters={filters}
            onChange={setFilters}
            members={members}
            labels={labels}
          />
          <Board
            tasks={tasks}
            filters={filters}
            onTaskClick={setSelectedTask}
            onAddTask={handleOpenCreate}
            onReorder={handleReorder}
          />
        </div>

        {sidebarOpen && user && (
          <TeamPanel
            members={members}
            labels={labels}
            userId={user.id}
            onAddMember={(name, color) => addMember(user.id, name, color)}
            onRemoveMember={removeMember}
            onAddLabel={(name, color) => addLabel(user.id, name, color)}
            onRemoveLabel={removeLabel}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </main>

      <CreateTaskModal
        isOpen={showCreateModal}
        defaultStatus={createDefaultStatus}
        members={members}
        labels={labels}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTask}
      />

      {selectedTask && user && (
        <TaskDetailPanel
          task={selectedTask}
          members={members}
          labels={labels}
          userId={user.id}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}

export default App;
