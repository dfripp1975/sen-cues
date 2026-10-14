import { supabase } from './supabase';
import type { JournalEntry } from './types';
import { downloadFile } from './share';
import { formatDate } from './dates';

/** Download every journal entry as Markdown. */
export function exportJournalMarkdown(entries: JournalEntry[]) {
  const md = ['# My Faithly Journal', '', `Exported ${formatDate(new Date().toISOString())}`, ''];
  for (const e of entries) {
    md.push(`## ${e.title || formatDate(e.entry_date)}`, `*${formatDate(e.entry_date)}*${e.mood ? ` · Mood: ${e.mood}` : ''}${e.prayer_status ? ` · Prayer: ${e.prayer_status}` : ''}`, '');
    if (e.scripture_refs.length) md.push(`Scripture: ${e.scripture_refs.join(', ')}`, '');
    md.push(e.body, '', '---', '');
  }
  downloadFile(`faithly-journal-${new Date().toISOString().slice(0, 10)}.md`, md.join('\n'), 'text/markdown');
}

const TABLES = [
  'profiles', 'user_preferences', 'notification_preferences', 'subscriptions', 'journal_entries', 'prayer_entries',
  'chat_conversations', 'chat_messages', 'bible_bookmarks', 'bible_highlights', 'bible_notes', 'reading_progress',
  'devotional_completions', 'user_journey_progress', 'quiz_results', 'memory_cards', 'daily_progress', 'usage_tracking',
] as const;

/** Download all of the signed-in user's data as JSON (RLS limits every query to their own rows). */
export async function exportAllData(): Promise<void> {
  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), app: 'Faithly' };
  for (const t of TABLES) {
    const { data, error } = await supabase.from(t).select('*');
    if (error) throw new Error(`Could not export ${t}`);
    out[t] = data;
  }
  downloadFile(`faithly-data-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(out, null, 2), 'application/json');
}
