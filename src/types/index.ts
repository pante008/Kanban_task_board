export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  user_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  assignees?: TeamMember[];
  labels?: Label[];
}

export interface TeamMember {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface ActivityEntry {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  status?: TaskStatus;
  assignee_ids?: string[];
  label_ids?: string[];
}

export interface FilterState {
  search: string;
  priority: TaskPriority | 'all';
  assigneeId: string | 'all';
  labelId: string | 'all';
}

export interface ColumnConfig {
  id: TaskStatus;
  title: string;
  color: string;
}
