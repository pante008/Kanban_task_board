# Flowboard — Kanban Task Board

A polished, full-featured Kanban task board built for the Next Play Games internship assessment. Inspired by Linear and Asana, with drag-and-drop columns, guest authentication, and rich task management.

![React](https://img.shields.io/badge/React-19-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![Supabase](https://img.shields.io/badge/Supabase-Auth+%26_DB-3ECF8E)

## Live Demo

**https://kanban-flowboard-pante008.netlify.app**

## Features

### Required
- Kanban board with **To Do**, **In Progress**, **In Review**, **Done** columns
- Drag-and-drop tasks between columns (updates status on drop)
- Supabase persistence with Row Level Security
- Anonymous guest accounts — each user sees only their own tasks
- Create tasks with title, description, priority, and due date
- Loading and error states

### Advanced (All 7 implemented)
1. **Team Members & Assignees** — Add team members with colors; assign to tasks; avatars on cards
2. **Task Comments** — Comment thread in task detail panel with timestamps
3. **Task Activity Log** — Timeline of status changes, edits, and comments
4. **Labels / Tags** — Custom labels with colors; assign multiple per task; filter by label
5. **Due Date Indicators** — Overdue, today, tomorrow, and soon badges on cards
6. **Search & Filtering** — Search by title/description; filter by priority, assignee, label
7. **Board Summary / Stats** — Total, in progress, completed, and overdue counts

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Drag & Drop:** @dnd-kit
- **Backend:** Supabase (PostgreSQL + Auth)
- **Icons:** Lucide React
- **Dates:** date-fns

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/kanban-task-board.git
cd kanban-task-board
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In **Authentication → Providers**, enable **Anonymous Sign-Ins**
3. In **SQL Editor**, run the full schema from `supabase/schema.sql`
4. Copy your **Project URL** and **anon public key** from **Settings → API**

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> Never commit `.env` or use the service role key in the frontend.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Deploy (Netlify)

Push to GitHub, then either:

- **Netlify CLI:** `npx netlify deploy --prod` (after `netlify login` and setting env vars)
- **Netlify Dashboard:** Import the GitHub repo and add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in Site settings → Environment variables

## Database Schema

The full SQL schema is in [`supabase/schema.sql`](./supabase/schema.sql). Tables:

| Table | Purpose |
|-------|---------|
| `tasks` | Core task data (title, status, priority, due_date, user_id) |
| `team_members` | User's team roster |
| `task_assignees` | Many-to-many task ↔ member |
| `labels` | Custom labels |
| `task_labels` | Many-to-many task ↔ label |
| `comments` | Task comments |
| `activity_log` | Change history |

All tables have RLS policies scoped to `auth.uid()`.

## Project Structure

```
src/
├── components/
│   ├── Board/          # Kanban columns, cards, DnD
│   ├── TaskDetail/     # Detail panel, comments, activity
│   ├── Team/           # Team & labels sidebar
│   ├── Filters/        # Search and filter bar
│   ├── Stats/          # Board summary stats
│   ├── modals/         # Create task modal
│   └── ui/             # Loading, error components
├── hooks/              # Data fetching hooks
├── lib/                # Supabase client, utilities
├── types/              # TypeScript interfaces
└── constants/          # Column config, colors
```

## Design Decisions

- **Dark theme** with indigo accent — inspired by Linear's aesthetic
- **Optimistic drag-and-drop** with rollback on failure
- **Slide-in detail panel** for focused task editing without leaving the board
- **Chip-based selectors** for assignees and labels — fast, visual, mobile-friendly
- **Guest sessions** via Supabase anonymous auth — zero friction onboarding

## Tradeoffs & Future Improvements

- **No real-time subscriptions** — tasks refresh on mutation; would add Supabase Realtime for multi-tab sync
- **Single board** — would add multiple boards/projects with a sidebar navigator
- **No undo** — would add optimistic undo stack for drag and delete actions
- **Guest identity is ephemeral** — clearing browser storage creates a new user; could add optional account linking
- **No keyboard shortcuts** — would add Linear-style `C` for create, `/` for search
- **Mobile columns stack vertically** — a swipeable carousel would feel more native on phones

## License

MIT — built for internship assessment purposes.
