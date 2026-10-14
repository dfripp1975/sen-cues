import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchPassage, fetchPassageByRef, passageText } from '../lib/bible';
import { narrator, ttsSupported } from '../lib/speech';
import { dayOfYear } from '../lib/dates';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Devotional } from '../lib/types';
import { AUDIO_CATEGORIES, MEDITATIONS, SCRIPTURE_AUDIO, meditationScript, type AudioCategory } from '../content/audio';
import { MOODS } from '../content/options';
import { ErrorNote, PageHeader } from '../components/ui';

const EVENING_PRAYER = 'Lord, thank you for this day. I place into your hands everything I have done and left undone. Grant me rest, and keep me and those I love in your peace through the night. Amen.';

interface Item { id: string; title: string; sub?: string; build: () => Promise<{ segments: string[]; rate?: number; split?: boolean }> }

export default function AudioPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { prefs } = useAuth();
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [daily, setDaily] = useState<{ id: number; book_id: number; chapter: number; verse_start: number; verse_end: number; explanation: string; theme: string }[]>([]);
  const [cat, setCat] = useState<AudioCategory>('morning');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('devotional_content').select('*').eq('is_published', true).order('sort_order').then(({ data }) => setDevotionals((data ?? []) as Devotional[]));
    supabase.from('daily_verses').select('*').order('id').then(({ data }) => setDaily(data ?? []));
  }, []);

  const scriptureSegments = async (refs: string[]) => {
    const parts: string[] = [];
    for (const r of refs) {
      const p = await fetchPassageByRef(r);
      if (p) parts.push(`${p.reference}.`, ...p.verses.map((v) => v.text));
    }
    return parts;
  };

  const items: Record<AudioCategory, Item[]> = {
    morning: devotionals.map((d) => ({
      id: d.id, title: d.title, sub: 'Devotional',
      build: async () => {
        const p = await fetchPassage(d.book_id, d.chapter, d.verse_start, d.verse_end);
        return { segments: [`Good morning. Today's devotional: ${d.title}.`, `${p.reference}.`, passageText(p), d.reflection, d.takeaway, d.reflection_question, 'Let us pray.', d.prayer] };
      },
    })),
    evening: SCRIPTURE_AUDIO.filter((a) => a.category === 'evening').map((a) => ({
      id: a.id, title: a.title, build: async () => ({ segments: [...(a.intro ? [a.intro] : []), ...(await scriptureSegments(a.refs)), EVENING_PRAYER, ...(a.outro ? [a.outro] : [])] }),
    })),
    scripture: SCRIPTURE_AUDIO.filter((a) => a.category === 'scripture').map((a) => ({ id: a.id, title: a.title, build: async () => ({ segments: await scriptureSegments(a.refs), split: false }) })),
    prayer: [
      ...SCRIPTURE_AUDIO.filter((a) => a.category === 'prayer').map((a) => ({ id: a.id, title: a.title, build: async () => ({ segments: [a.intro ?? '', ...(await scriptureSegments(a.refs)), a.outro ?? ''] }) })),
      ...MOODS.map((m) => ({ id: `prayer-${m.id}`, title: `When you feel ${m.label.toLowerCase()}`, sub: 'Guided prayer', build: async () => ({ segments: [`A prayer for when you feel ${m.label.toLowerCase()}.`, ...(await scriptureSegments([m.refs[0]])), m.exercise, '[pause:8]', m.prayer] }) })),
    ],
    reflection: daily.slice(0, 12).map((d) => ({
      id: `reflect-${d.id}`, title: d.theme, sub: 'Verse & reflection',
      build: async () => { const p = await fetchPassage(d.book_id, d.chapter, d.verse_start, d.verse_end); return { segments: [`${p.reference}.`, passageText(p), '[pause:4]', d.explanation, '[pause:6]', `${p.reference}.`, passageText(p)] }; },
    })),
    sleep: SCRIPTURE_AUDIO.filter((a) => a.category === 'sleep').map((a) => ({ id: a.id, title: a.title, build: async () => ({ segments: [...(a.intro ? [a.intro, '[pause:5]'] : []), ...(await scriptureSegments(a.refs)), '[pause:5]', 'Goodnight. May the Lord bless you and keep you.'], rate: a.rate }) })),
    meditation: MEDITATIONS.map((m) => ({ id: m.id, title: m.title, sub: `About 4 minutes · ${m.focus}`, build: async () => { const p = await fetchPassageByRef(m.ref); return { segments: meditationScript(m.title, p?.reference ?? m.ref, p ? passageText(p) : '') }; } })),
  };

  const play = async (item: Item) => {
    setLoadingId(item.id);
    try {
      const { segments, rate, split } = await item.build();
      narrator.load(item.title, segments, split ?? true);
      if (rate) narrator.setRate(rate);
      else narrator.setRate(Number(prefs?.tts_rate ?? 1));
      narrator.play(0);
      nav('/audio/player');
    } catch {
      toast('Could not load that audio. Please try again.', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const today = devotionals.length ? devotionals[dayOfYear() % devotionals.length] : null;

  return (
    <div>
      <PageHeader title="Audio" subtitle="Scripture, devotionals and prayers, read aloud by your device's voice." back />
      {!ttsSupported && <ErrorNote>Your browser doesn't support text-to-speech, so audio can't play here. Try Chrome, Edge or Safari.</ErrorNote>}
      <p className="mb-5 rounded-xl bg-muted/70 p-3 text-xs text-subtle">
        Audio is generated live on your device, so it needs the app open and isn't available offline. On some phones it may stop when the screen locks.
      </p>
      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist">
        {AUDIO_CATEGORIES.map((c) => (
          <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)} className={`chip shrink-0 ${cat === c.id ? 'chip-on' : 'bg-surface'}`}>{c.label}</button>
        ))}
      </div>
      <p className="mb-4 text-subtle">{AUDIO_CATEGORIES.find((c) => c.id === cat)?.blurb}</p>
      <ul className="card divide-y divide-line">
        {items[cat].map((it) => (
          <li key={it.id}>
            <button onClick={() => play(it)} disabled={!ttsSupported || loadingId != null} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-muted/50">
              <span className="rounded-full bg-accent/10 p-2.5 text-accent">{loadingId === it.id ? <Headphones className="h-4 w-4 animate-pulse" /> : <Play className="h-4 w-4" />}</span>
              <span className="flex-1"><span className="block font-medium">{it.title}</span>{it.sub && <span className="text-sm text-subtle">{it.sub}{today?.id === it.id ? ' · Today' : ''}</span>}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
