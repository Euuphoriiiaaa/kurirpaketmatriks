import { supabase } from './supabase';
import type { Result } from '@/store/gameStore';

export async function saveProgress(level: number, r: Result) {
  if (!supabase) return;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from('kpm_pemain_progres').upsert({
    user_id: data.user.id, level, stars: r.stars, score: r.score, lines: r.lines,
    updated_at: new Date().toISOString(),
  });
}
