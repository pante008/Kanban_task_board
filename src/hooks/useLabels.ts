import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Label } from '../types';

export function useLabels() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLabels = useCallback(async () => {
    const { data, error } = await supabase
      .from('labels')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) setLabels(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  const addLabel = async (userId: string, name: string, color: string) => {
    const { error } = await supabase.from('labels').insert({
      name,
      color,
      user_id: userId,
    });
    if (error) throw error;
    await loadLabels();
  };

  const removeLabel = async (id: string) => {
    const { error } = await supabase.from('labels').delete().eq('id', id);
    if (error) throw error;
    await loadLabels();
  };

  return { labels, loading, addLabel, removeLabel, refresh: loadLabels };
}
