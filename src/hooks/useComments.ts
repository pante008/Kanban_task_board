import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Comment } from '../types';

export function useComments(taskId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const loadComments = useCallback(async () => {
    if (!taskId) {
      setComments([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (!error && data) setComments(data);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const addComment = async (userId: string, content: string) => {
    if (!taskId) return;

    const { error } = await supabase.from('comments').insert({
      task_id: taskId,
      user_id: userId,
      content,
    });

    if (error) throw error;

    await supabase.from('activity_log').insert({
      task_id: taskId,
      user_id: userId,
      action: 'comment_added',
      details: { preview: content.slice(0, 50) },
    });

    await loadComments();
  };

  return { comments, loading, addComment };
}
