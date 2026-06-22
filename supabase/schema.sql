-- Kanban Task Board — Supabase Schema
-- Run this in the Supabase SQL Editor (copy ALL of this file's contents, not the filename)

-- ============================================================
-- TASKS
-- ============================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  due_date date,
  user_id uuid not null references auth.users(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks(user_id);
create index tasks_status_idx on public.tasks(status);

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#6366f1',
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index team_members_user_id_idx on public.team_members(user_id);

-- ============================================================
-- TASK ASSIGNEES (many-to-many)
-- ============================================================
create table public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  member_id uuid not null references public.team_members(id) on delete cascade,
  primary key (task_id, member_id)
);

-- ============================================================
-- LABELS
-- ============================================================
create table public.labels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#8b5cf6',
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index labels_user_id_idx on public.labels(user_id);

-- ============================================================
-- TASK LABELS (many-to-many)
-- ============================================================
create table public.task_labels (
  task_id uuid not null references public.tasks(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  primary key (task_id, label_id)
);

-- ============================================================
-- COMMENTS
-- ============================================================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index comments_task_id_idx on public.comments(task_id);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

create index activity_log_task_id_idx on public.activity_log(task_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.tasks enable row level security;
alter table public.team_members enable row level security;
alter table public.task_assignees enable row level security;
alter table public.labels enable row level security;
alter table public.task_labels enable row level security;
alter table public.comments enable row level security;
alter table public.activity_log enable row level security;

-- Tasks policies
create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Team members policies
create policy "Users can view own team members"
  on public.team_members for select
  using (auth.uid() = user_id);

create policy "Users can insert own team members"
  on public.team_members for insert
  with check (auth.uid() = user_id);

create policy "Users can update own team members"
  on public.team_members for update
  using (auth.uid() = user_id);

create policy "Users can delete own team members"
  on public.team_members for delete
  using (auth.uid() = user_id);

-- Task assignees policies (via task ownership)
create policy "Users can view own task assignees"
  on public.task_assignees for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignees.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can insert own task assignees"
  on public.task_assignees for insert
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignees.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can delete own task assignees"
  on public.task_assignees for delete
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignees.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Labels policies
create policy "Users can view own labels"
  on public.labels for select
  using (auth.uid() = user_id);

create policy "Users can insert own labels"
  on public.labels for insert
  with check (auth.uid() = user_id);

create policy "Users can update own labels"
  on public.labels for update
  using (auth.uid() = user_id);

create policy "Users can delete own labels"
  on public.labels for delete
  using (auth.uid() = user_id);

-- Task labels policies
create policy "Users can view own task labels"
  on public.task_labels for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_labels.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can insert own task labels"
  on public.task_labels for insert
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_labels.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can delete own task labels"
  on public.task_labels for delete
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_labels.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Comments policies
create policy "Users can view own task comments"
  on public.comments for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = comments.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can insert own task comments"
  on public.comments for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.tasks
      where tasks.id = comments.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can delete own task comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Activity log policies
create policy "Users can view own task activity"
  on public.activity_log for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = activity_log.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can insert own task activity"
  on public.activity_log for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.tasks
      where tasks.id = activity_log.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Enable anonymous sign-in in Supabase Dashboard:
-- Authentication > Providers > Anonymous Sign-Ins > Enable
