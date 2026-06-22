import type { ColumnConfig } from '../types';

export const COLUMNS: ColumnConfig[] = [
  { id: 'todo', title: 'To Do', color: '#64748b' },
  { id: 'in_progress', title: 'In Progress', color: '#3b82f6' },
  { id: 'in_review', title: 'In Review', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#10b981' },
];

export const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: '#64748b',
  normal: '#6366f1',
  high: '#ef4444',
};

export const MEMBER_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
];

export const LABEL_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#14b8a6', '#3b82f6', '#64748b',
];
