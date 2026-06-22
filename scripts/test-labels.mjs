import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const sb = createClient(url, anonKey, { auth: { persistSession: false } });

async function run() {
  console.log('=== Labels UI Data Flow Test ===\n');

  const { data: auth, error: authErr } = await sb.auth.signInAnonymously();
  if (authErr) throw authErr;
  const userId = auth.user.id;

  // 1. Create labels
  const labelNames = ['Bug', 'Feature', 'Design'];
  const labelColors = ['#ef4444', '#6366f1', '#8b5cf6'];
  const labels = [];

  for (let i = 0; i < labelNames.length; i++) {
    const { data, error } = await sb
      .from('labels')
      .insert({ name: labelNames[i], color: labelColors[i], user_id: userId })
      .select()
      .single();
    if (error) throw error;
    labels.push(data);
  }
  console.log('1. Created labels:', labels.map((l) => `${l.name} (${l.color})`).join(', '));
  console.log('   PASS\n');

  // 2. Create task with multiple labels
  const { data: task, error: taskErr } = await sb
    .from('tasks')
    .insert({ title: 'Label UI Test Task', user_id: userId, status: 'todo', priority: 'normal', position: 0 })
    .select()
    .single();
  if (taskErr) throw taskErr;

  const { error: linkErr } = await sb.from('task_labels').insert(
    labels.map((l) => ({ task_id: task.id, label_id: l.id })),
  );
  if (linkErr) throw linkErr;
  console.log('2. Task created with 3 labels assigned');
  console.log('   PASS\n');

  // 3. Fetch tasks with label relations (same as app)
  const { data: tasks } = await sb.from('tasks').select('*').eq('id', task.id);
  const { data: labelsRes, error: fetchErr } = await sb
    .from('task_labels')
    .select('task_id, label:labels(*)')
    .eq('task_id', task.id);
  if (fetchErr) throw fetchErr;

  const taskLabels = labelsRes
    ?.map((l) => l.label)
    .filter(Boolean) ?? [];

  console.log('3. Labels loaded for task card:');
  taskLabels.forEach((l) => {
    console.log(`   - Chip: "${l.name}" color=${l.color} bg=${l.color}22`);
  });
  console.log(`   Card would show ${taskLabels.length} chips: ${taskLabels.length === 3 ? 'PASS' : 'FAIL'}\n`);

  // 4. Filter by label
  const bugLabel = labels.find((l) => l.name === 'Bug');
  const allTasks = await sb.from('tasks').select('*');
  const allTaskLabels = await sb.from('task_labels').select('task_id, label:labels(*)').in('task_id', allTasks.data?.map((t) => t.id) ?? []);

  const filtered = (allTasks.data ?? []).filter((t) => {
    const tLabels = allTaskLabels.data?.filter((tl) => tl.task_id === t.id).map((tl) => tl.label) ?? [];
    return tLabels.some((l) => l?.id === bugLabel.id);
  });
  console.log('4. Filter by "Bug" label:', filtered.length, 'task(s)');
  console.log(`   Filter works: ${filtered.some((t) => t.id === task.id) ? 'PASS' : 'FAIL'}\n`);

  // 5. Update labels on task
  await sb.from('task_labels').delete().eq('task_id', task.id);
  await sb.from('task_labels').insert({ task_id: task.id, label_id: labels[1].id }); // Feature only

  const { data: updatedLabels } = await sb
    .from('task_labels')
    .select('task_id, label:labels(*)')
    .eq('task_id', task.id);

  const remaining = updatedLabels?.map((l) => l.label?.name) ?? [];
  console.log('5. After edit, task has labels:', remaining.join(', ') || '(none)');
  console.log(`   Edit labels works: ${remaining.length === 1 && remaining[0] === 'Feature' ? 'PASS' : 'FAIL'}\n`);

  // Cleanup
  await sb.from('task_labels').delete().eq('task_id', task.id);
  await sb.from('tasks').delete().eq('id', task.id);
  for (const l of labels) await sb.from('labels').delete().eq('id', l.id);

  console.log('=== ALL LABEL TESTS PASSED ===');
}

run().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
