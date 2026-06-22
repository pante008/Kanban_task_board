# Submission Document Template

> `Ekta_Pant_task_manager_assessment.pdf`

---

# Kanban Task Board — Assessment Submission

**Name:** Ekta Pant  
**Date:** 22 June 2026

---

## 1. Solution Overview

Flowboard is a Kanban-style task management app built with React, TypeScript, and Supabase. Users get an anonymous guest session on first visit and can immediately create, organize, and drag tasks across four columns: To Do, In Progress, In Review, and Done.

**Design approach:** Dark theme with an indigo accent palette, inspired by Linear. Typography uses Inter for clarity. Task cards show priority, due date urgency, label chips, and assignee avatars at a glance. The board uses smooth drag-and-drop via @dnd-kit with visual feedback on column hover and card lift.

**Architecture:** The frontend calls Supabase directly (no separate backend). Custom React hooks manage auth, tasks, team members, labels, and comments. Row Level Security ensures data isolation between guest users.

---

## 2. Links


| Resource              | URL |
| --------------------- | --- |
| **Live App**          | https://kanban-flowboard-pante008.netlify.app |
| **GitHub Repository** | https://github.com/pante008/Kanban_task_board |


---

## 3. Database Schema

The full SQL is in the repository at `supabase/schema.sql`. Summary:

### `tasks`


| Column      | Type        | Notes                              |
| ----------- | ----------- | ---------------------------------- |
| id          | uuid        | PK                                 |
| title       | text        | required                           |
| description | text        | optional                           |
| status      | text        | todo, in_progress, in_review, done |
| priority    | text        | low, normal, high                  |
| due_date    | date        | optional                           |
| user_id     | uuid        | FK → auth.users                    |
| position    | integer     | sort order within column           |
| created_at  | timestamptz | auto                               |
| updated_at  | timestamptz | auto                               |


### Supporting tables

- `team_members` — name, color, user_id
- `task_assignees` — task_id ↔ member_id
- `labels` — name, color, user_id
- `task_labels` — task_id ↔ label_id
- `comments` — task_id, content, user_id, created_at
- `activity_log` — task_id, action, details (jsonb), created_at

All tables have RLS policies: users can only read/write rows where `user_id = auth.uid()` (or via task ownership for join tables).

---

## 4. Local Setup

```bash
git clone [GITHUB_URL]
cd kanban-task-board
npm install
cp .env.example .env
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

**Supabase setup:**

1. Create a free Supabase project
2. Enable Anonymous Sign-Ins (Authentication → Providers)
3. Run `supabase/schema.sql` in the SQL Editor

---

## 5. Advanced Features Implemented

### Team Members & Assignees

Users add team members via the sidebar (name + color). When creating or editing a task, members can be assigned. Avatars appear on task cards (up to 3, with overflow count).

### Task Comments

Opening a task shows a Comments tab. Users write comments with timestamps. Comments are stored in a separate `comments` table and trigger activity log entries.

### Task Activity Log

The Activity tab shows a timeline: task creation, status moves (e.g. "Moved from To Do → In Progress · 2 hours ago"), edits, and comments. Stored in `activity_log` with JSON details.

### Labels / Tags

Custom labels with colors are created in the sidebar. Tasks can have multiple labels shown as chips on cards. The filter bar supports filtering by label.

### Due Date Indicators

Tasks with due dates show a calendar badge. Color coding: red (overdue), amber (today), orange (tomorrow/soon), muted (normal).

### Search & Filtering

Search bar filters by title and description. Dropdowns filter by priority, assignee, and label. A "Clear" button resets all filters.

### Board Summary / Stats

Header area shows stat cards: total tasks, in progress, completed, and overdue (highlighted when > 0).

---

## 6. Tradeoffs & Future Improvements


| Area           | Current              | With More Time                          |
| -------------- | -------------------- | --------------------------------------- |
| Real-time sync | Refresh on mutation  | Supabase Realtime subscriptions         |
| Auth           | Anonymous guest only | Optional email signup + account linking |
| Boards         | Single board         | Multiple projects/boards                |
| Undo           | None                 | Undo stack for drag/delete              |
| Keyboard       | Mouse/touch only     | Shortcuts (C create, / search)          |
| Mobile         | Stacked columns      | Horizontal swipe carousel               |
| Testing        | Manual               | Unit tests for hooks, E2E for drag-drop |


---

## 7. Security Notes

- Only the Supabase **anon key** is used in the frontend
- **Service role key** is never committed or exposed
- RLS is enabled on all tables
- `.env` is gitignored

---

*Built for Next Play Games — Software Development Internship Assessment*