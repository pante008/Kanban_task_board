import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { TeamMember } from '../types';

export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) setMembers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const addMember = async (userId: string, name: string, color: string) => {
    const { error } = await supabase.from('team_members').insert({
      name,
      color,
      user_id: userId,
    });
    if (error) throw error;
    await loadMembers();
  };

  const removeMember = async (id: string) => {
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (error) throw error;
    await loadMembers();
  };

  return { members, loading, addMember, removeMember, refresh: loadMembers };
}
