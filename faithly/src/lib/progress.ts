import { supabase } from './supabase';
import { todayLocal } from './dates';
import type { DailyActivity } from '../content/options';

/** Tick off one of today's five Daily Faith Journey activities (idempotent). */
export async function markActivity(userId: string, activity: DailyActivity) {
  await supabase.from('daily_progress').upsert({ user_id: userId, day: todayLocal(), activity }, { onConflict: 'user_id,day,activity', ignoreDuplicates: true });
}

export async function todaysActivities(): Promise<Set<DailyActivity>> {
  const { data } = await supabase.from('daily_progress').select('activity').eq('day', todayLocal());
  return new Set((data ?? []).map((r) => r.activity as DailyActivity));
}
