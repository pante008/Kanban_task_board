/**
 * Guest account isolation test
 * Simulates User A and User B with separate anonymous sessions
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

function client() {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signInAnonymous() {
  const sb = client();
  const { data, error } = await sb.auth.signInAnonymously();
  if (error) throw new Error(`Anonymous sign-in failed: ${error.message}`);
  return { sb, user: data.user, token: data.session.access_token };
}

async function createTask(sb, userId, title) {
  const { data, error } = await sb
    .from('tasks')
    .insert({ title, user_id: userId, status: 'todo', priority: 'normal', position: 0 })
    .select()
    .single();
  if (error) throw new Error(`Create task failed: ${error.message}`);
  return data;
}

async function listTasks(sb) {
  const { data, error } = await sb.from('tasks').select('id, title, user_id');
  if (error) throw new Error(`List tasks failed: ${error.message}`);
  return data ?? [];
}

async function fetchTaskById(sb, taskId) {
  const { data, error } = await sb.from('tasks').select('id, title, user_id').eq('id', taskId).maybeSingle();
  return { data, error };
}

async function updateTask(sb, taskId) {
  const { data, error } = await sb.from('tasks').update({ title: 'HACKED' }).eq('id', taskId).select();
  return { data, error };
}

async function deleteTask(sb, taskId) {
  const { data, error } = await sb.from('tasks').delete().eq('id', taskId).select();
  return { data, error };
}

async function run() {
  console.log('=== Guest Account Isolation Test ===\n');

  // 1. Anonymous sign-in for User A and User B
  console.log('1. Creating anonymous sessions...');
  const userA = await signInAnonymous();
  const userB = await signInAnonymous();

  console.log(`   User A ID: ${userA.user.id}`);
  console.log(`   User B ID: ${userB.user.id}`);
  console.log(`   Different users: ${userA.user.id !== userB.user.id ? 'PASS' : 'FAIL'}\n`);

  // 2. Each user creates a task
  console.log('2. Creating tasks...');
  const taskA = await createTask(userA.sb, userA.user.id, 'User A Secret Task');
  const taskB = await createTask(userB.sb, userB.user.id, 'User B Secret Task');
  console.log(`   User A task: "${taskA.title}" (user_id: ${taskA.user_id})`);
  console.log(`   User B task: "${taskB.title}" (user_id: ${taskB.user_id})`);
  console.log(`   Tasks tied to correct user_id: ${
    taskA.user_id === userA.user.id && taskB.user_id === userB.user.id ? 'PASS' : 'FAIL'
  }\n`);

  // 3. User A only sees their tasks
  console.log('3. User A lists tasks...');
  const listA = await listTasks(userA.sb);
  const aSeesOnlyOwn = listA.length === 1 && listA[0].id === taskA.id && listA[0].title === 'User A Secret Task';
  console.log(`   User A sees ${listA.length} task(s): ${listA.map((t) => t.title).join(', ') || '(none)'}`);
  console.log(`   User A sees only own tasks: ${aSeesOnlyOwn ? 'PASS' : 'FAIL'}\n`);

  // 4. User B only sees their tasks
  console.log('4. User B lists tasks...');
  const listB = await listTasks(userB.sb);
  const bSeesOnlyOwn = listB.length === 1 && listB[0].id === taskB.id && listB[0].title === 'User B Secret Task';
  console.log(`   User B sees ${listB.length} task(s): ${listB.map((t) => t.title).join(', ') || '(none)'}`);
  console.log(`   User B sees only own tasks: ${bSeesOnlyOwn ? 'PASS' : 'FAIL'}\n`);

  // 5. User A cannot read User B's task by ID
  console.log('5. User A tries to read User B task by ID...');
  const readCross = await fetchTaskById(userA.sb, taskB.id);
  const cannotReadCross = readCross.data === null && !readCross.error;
  console.log(`   Result: ${readCross.data ? `LEAKED: ${readCross.data.title}` : 'null (blocked)'}`);
  console.log(`   Cross-user read blocked: ${cannotReadCross ? 'PASS' : 'FAIL'}\n`);

  // 6. User A cannot update User B's task
  console.log('6. User A tries to update User B task...');
  const updateCross = await updateTask(userA.sb, taskB.id);
  const cannotUpdateCross = !updateCross.data?.length;
  console.log(`   Rows updated: ${updateCross.data?.length ?? 0}`);
  console.log(`   Cross-user update blocked: ${cannotUpdateCross ? 'PASS' : 'FAIL'}\n`);

  // 7. User A cannot delete User B's task
  console.log('7. User A tries to delete User B task...');
  const deleteCross = await deleteTask(userA.sb, taskB.id);
  const cannotDeleteCross = !deleteCross.data?.length;
  console.log(`   Rows deleted: ${deleteCross.data?.length ?? 0}`);
  console.log(`   Cross-user delete blocked: ${cannotDeleteCross ? 'PASS' : 'FAIL'}\n`);

  // 8. Verify User B's task still exists
  console.log('8. Verify User B task still intact...');
  const bStillHasTask = await listTasks(userB.sb);
  const taskIntact = bStillHasTask.length === 1 && bStillHasTask[0].title === 'User B Secret Task';
  console.log(`   User B still has task: ${taskIntact ? 'PASS' : 'FAIL'}\n`);

  // Cleanup test data
  await deleteTask(userA.sb, taskA.id);
  await deleteTask(userB.sb, taskB.id);
  console.log('Cleanup: test tasks deleted.\n');

  const allPassed =
    userA.user.id !== userB.user.id &&
    taskA.user_id === userA.user.id &&
    taskB.user_id === userB.user.id &&
    aSeesOnlyOwn &&
    bSeesOnlyOwn &&
    cannotReadCross &&
    cannotUpdateCross &&
    cannotDeleteCross &&
    taskIntact;

  console.log('=== RESULT ===');
  console.log(allPassed ? 'ALL TESTS PASSED - Guest account isolation works' : 'SOME TESTS FAILED');
  process.exit(allPassed ? 0 : 1);
}

run().catch((err) => {
  console.error('Test error:', err.message);
  process.exit(1);
});
