import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const sb = createClient(url, anonKey, { auth: { persistSession: false } });

async function run() {
  const { data: auth, error: authErr } = await sb.auth.signInAnonymously();
  if (authErr) throw authErr;
  const userId = auth.user.id;

  const { data: member, error: memberErr } = await sb
    .from('team_members')
    .insert({ name: 'Alice Smith', color: '#6366f1', user_id: userId })
    .select()
    .single();
  if (memberErr) throw memberErr;

  const { data: task, error: taskErr } = await sb
    .from('tasks')
    .insert({ title: 'Avatar Test Task', user_id: userId, status: 'todo', priority: 'normal', position: 0 })
    .select()
    .single();
  if (taskErr) throw taskErr;

  const { error: assignErr } = await sb
    .from('task_assignees')
    .insert({ task_id: task.id, member_id: member.id });
  if (assignErr) throw assignErr;

  const { data: assigneesRes, error: fetchErr } = await sb
    .from('task_assignees')
    .select('task_id, member:team_members(*)')
    .eq('task_id', task.id);
  if (fetchErr) throw fetchErr;

  const assignees = assigneesRes?.map((a) => a.member).filter(Boolean) ?? [];
  const initials = assignees[0]?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  console.log('Member created:', member.name, member.color);
  console.log('Task created:', task.title);
  console.log('Assignees loaded:', JSON.stringify(assignees, null, 2));
  console.log('Avatar initials would show:', initials);
  console.log('Avatars on card:', assignees.length > 0 ? 'YES' : 'NO');

  await sb.from('task_assignees').delete().eq('task_id', task.id);
  await sb.from('tasks').delete().eq('id', task.id);
  await sb.from('team_members').delete().eq('id', member.id);
}

run().catch((e) => { console.error(e.message); process.exit(1); });
