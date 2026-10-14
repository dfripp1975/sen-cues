import { dayOfYear } from './dates';
import type { Devotional } from './types';

/** Today's devotional: rotates daily, preferring ones that match the user's focus areas. */
export function pickTodaysDevotional(all: Devotional[], focus: string[]): Devotional | null {
  if (!all.length) return null;
  const matching = focus.length ? all.filter((d) => d.focus_tags.some((t) => focus.includes(t))) : [];
  const pool = matching.length >= 3 ? matching : all;
  return pool[dayOfYear() % pool.length];
}
