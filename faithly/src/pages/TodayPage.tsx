import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark, BookmarkCheck, BookOpen, CheckCircle2, Circle, Compass, Headphones, Image as ImageIcon,
  MessageCircleHeart, NotebookPen, Puzzle, Share2, Sparkles, Volume2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { dayOfYear, greeting } from '../lib/dates';
import { chapterPath, fetchPassage, fetchPassageByRef, passageText } from '../lib/bible';
import { markActivity, todaysActivities } from '../lib/progress';
import { pickTodaysDevotional } from '../lib/devotionals';
import { narrator } from '../lib/speech';
import { shareText } from '../lib/share';
import type { Devotional, VerifiedPassage } from '../lib/types';
import { DAILY_ACTIVITIES, MOODS, type DailyActivity, type Mood } from '../content/options';
import { ErrorNote, ProgressBar, Spinner } from '../components/ui';
import { Landscape } from '../components/Landscape';
import { PassageCard } from '../components/Scripture';

interface DailyVerse { id: number; book_id: number; chapter: number; verse_start: number; verse_end: number; explanation: string; theme: string | null }

export default function TodayPage() {
  const { user, profile, prefs } = useAuth();
  const toast = useToast();
  const [verse, setVerse] = useState<{ row: DailyVerse; passage: VerifiedPassage } | null>(null);
  const [verseError, setVerseError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [done, setDone] = useState<Set<DailyActivity>>(new Set());
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [moodPassages, setMoodPassages] = useState<VerifiedPassage[]>([]);
  const [activeJourney, setActiveJourney] = useState<{ slug: string; title: string; next: number; total: number } | null>(null);

  const load = useCallback(async () => {
    setVerseError(false);
    try {
      const { count } = await supabase.from('daily_verses').select('id', { count: 'exact', head: true });
      if (!count) throw new Error('no daily verses');
      const { data: row, error } = await supabase.from('daily_verses').select('*').eq('id', dayOfYear() % count).single();
      if (error) throw error;
      const passage = await fetchPassage(row.book_id, row.chapter, row.verse_start, row.verse_end);
      if (!passage.verses.length) throw new Error('Bible text not loaded');
      setVerse({ row, passage });
      if (user) {
        const { data: bm } = await supabase.from('bible_bookmarks').select('id').eq('book_id', row.book_id).eq('chapter', row.chapter)
          .eq('verse_start', row.verse_start).eq('verse_end', row.verse_end).maybeSingle();
        setSaved(!!bm);
      }
    } catch {
      setVerseError(true);
    }
  }, [user]);

  useEffect(() => {
    load();
    todaysActivities().then(setDone);
    // Today's devotional: rotate, preferring ones that match the user's focus areas.
    supabase.from('devotional_content').select('*').eq('is_published', true).order('sort_order').then(({ data }) => {
      setDevotional(pickTodaysDevotional((data ?? []) as Devotional[], prefs?.focus_areas ?? []));
    });
    supabase.from('user_journey_progress').select('completed_days, faith_journeys(slug, title, day_count)')
      .eq('status', 'active').order('last_activity_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        const j = data?.faith_journeys as unknown as { slug: string; title: string; day_count: number } | undefined;
        if (data && j) {
          const next = Array.from({ length: j.day_count }, (_, i) => i + 1).find((d) => !data.completed_days.includes(d)) ?? j.day_count;
          setActiveJourney({ slug: j.slug, title: j.title, next, total: j.day_count });
        }
      });
  }, [load, prefs?.focus_areas]);

  useEffect(() => {
    if (!mood) return;
    const m = MOODS.find((x) => x.id === mood)!;
    Promise.all(m.refs.map(fetchPassageByRef)).then((ps) => setMoodPassages(ps.filter(Boolean) as VerifiedPassage[]));
  }, [mood]);

  const tick = async (a: DailyActivity) => {
    if (!user || done.has(a)) return;
    await markActivity(user.id, a);
    setDone((s) => new Set(s).add(a));
  };

  const toggleSave = async () => {
    if (!user || !verse) return;
    const { row } = verse;
    if (saved) {
      await supabase.from('bible_bookmarks').delete().eq('book_id', row.book_id).eq('chapter', row.chapter).eq('verse_start', row.verse_start).eq('verse_end', row.verse_end);
      setSaved(false);
      toast('Removed from saved verses');
    } else {
      const { error } = await supabase.from('bible_bookmarks').insert({ user_id: user.id, book_id: row.book_id, chapter: row.chapter, verse_start: row.verse_start, verse_end: row.verse_end });
      if (error) return toast('Could not save that verse. Please try again.', 'error');
      setSaved(true);
      toast('Saved to your verses');
    }
  };

  const share = async () => {
    if (!verse) return;
    const r = await shareText(verse.passage.reference, `“${passageText(verse.passage)}” — ${verse.passage.reference} (WEB)`);
    if (r === 'copied') toast('Verse copied to clipboard');
  };

  const listen = () => {
    if (!verse) return;
    narrator.load(verse.passage.reference, [`${verse.passage.reference}.`, passageText(verse.passage), verse.row.explanation]);
    narrator.play(0);
    tick('scripture');
  };

  const name = profile?.display_name;
  const progress = done.size / DAILY_ACTIVITIES.length;
  const activityLinks: Record<DailyActivity, string> = {
    scripture: '#todays-verse',
    reflection: devotional ? `/devotionals/${devotional.slug}` : '/devotionals',
    prayer: '/you/prayers',
    journal: '/you/journal/new',
    challenge: '/games/daily',
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl">
        <Landscape className="absolute inset-0 h-full w-full" />
        <div className="relative px-6 pb-16 pt-8">
          <p className="eyebrow !text-forest/80">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="mt-2 text-[2rem] font-semibold leading-tight text-forest">{greeting()}{name ? `, ${name}` : ''}.</h1>
          <p className="mt-2 max-w-sm font-scripture italic text-charcoal/80">Take a moment. God's Word is here for you today.</p>
        </div>
      </section>

      {/* Today's verse */}
      <section id="todays-verse" aria-labelledby="tv-h" className="card -mt-16 relative p-6">
        <div className="flex items-center justify-between">
          <h2 id="tv-h" className="eyebrow">Today's verse{verse?.row.theme ? ` · ${verse.row.theme}` : ''}</h2>
          {done.has('scripture') && <CheckCircle2 className="h-5 w-5 text-accent" aria-label="Completed" />}
        </div>
        {verseError && <div className="mt-3"><ErrorNote onRetry={load}>We couldn't load today's verse. The Bible text may not be imported yet.</ErrorNote></div>}
        {!verse && !verseError && <Spinner label="Loading today's verse" />}
        {verse && (
          <>
            <blockquote className="scripture mt-3 text-xl leading-relaxed text-ink">“{passageText(verse.passage)}”</blockquote>
            <p className="mt-3 font-serif font-semibold text-accent">{verse.passage.reference} <span className="text-xs font-sans font-normal text-subtle">· World English Bible</span></p>
            <div className="mt-4 rounded-xl bg-muted/70 p-4 text-sm leading-relaxed text-subtle">{verse.row.explanation}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={toggleSave} className="chip hover:bg-muted" aria-pressed={saved}>
                {saved ? <BookmarkCheck className="h-4 w-4 text-accent" /> : <Bookmark className="h-4 w-4" />} {saved ? 'Saved' : 'Save'}
              </button>
              <button onClick={share} className="chip hover:bg-muted"><Share2 className="h-4 w-4" /> Share</button>
              <button onClick={listen} className="chip hover:bg-muted"><Volume2 className="h-4 w-4" /> Listen</button>
              <Link to={chapterPath(verse.row.book_id, verse.row.chapter, verse.row.verse_start)} onClick={() => tick('scripture')} className="chip hover:bg-muted">
                <BookOpen className="h-4 w-4" /> Read full chapter
              </Link>
            </div>
            {!done.has('scripture') && (
              <button onClick={() => tick('scripture')} className="btn-primary mt-5 w-full">I've read today's verse</button>
            )}
          </>
        )}
      </section>

      {/* Daily faith journey */}
      <section aria-labelledby="dj-h" className="card p-6">
        <div className="flex items-baseline justify-between">
          <h2 id="dj-h" className="text-xl font-semibold">Daily faith journey</h2>
          <span className="text-sm text-subtle">{done.size} of {DAILY_ACTIVITIES.length}</span>
        </div>
        <div className="mt-3"><ProgressBar value={progress} label="Today's progress" /></div>
        {progress === 1 && <p className="mt-3 text-sm text-accent">Lovely — you've completed every step today.</p>}
        <ul className="mt-4 divide-y divide-line">
          {DAILY_ACTIVITIES.map((a) => (
            <li key={a.id}>
              <Link to={activityLinks[a.id]} className="flex items-center gap-3 py-3 hover:opacity-80">
                {done.has(a.id) ? <CheckCircle2 className="h-5 w-5 text-accent" aria-hidden /> : <Circle className="h-5 w-5 text-line" aria-hidden />}
                <span className={`flex-1 ${done.has(a.id) ? 'text-subtle line-through decoration-sage' : ''}`}>{a.label}</span>
                <span className="sr-only">{done.has(a.id) ? 'completed' : 'not yet completed'}</span>
                {a.id === 'reflection' && devotional && <span className="max-w-[45%] truncate text-xs text-subtle">{devotional.title}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {activeJourney && (
        <Link to={`/journeys/${activeJourney.slug}/day/${activeJourney.next}`} className="card flex items-center gap-4 p-5 hover:shadow-lift">
          <div className="rounded-2xl bg-accent/10 p-3 text-accent"><Compass className="h-6 w-6" aria-hidden /></div>
          <div className="flex-1">
            <p className="eyebrow">Continue your journey</p>
            <p className="font-serif text-lg font-semibold">{activeJourney.title}</p>
            <p className="text-sm text-subtle">Day {activeJourney.next} of {activeJourney.total}</p>
          </div>
        </Link>
      )}

      {/* Emotional check-in */}
      <section aria-labelledby="mood-h" className="card p-6">
        <h2 id="mood-h" className="text-xl font-semibold">How are you feeling today?</h2>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {MOODS.map((m) => (
            <button key={m.id} onClick={() => setMood(mood === m.id ? null : m.id)} aria-pressed={mood === m.id}
              className={`flex flex-col items-center gap-1 rounded-2xl border px-1 py-3 text-xs transition ${mood === m.id ? 'border-accent bg-accent/10 font-semibold' : 'border-line hover:bg-muted'}`}>
              <span className="text-2xl" aria-hidden>{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>
        {mood && (() => {
          const m = MOODS.find((x) => x.id === mood)!;
          return (
            <div className="page-enter mt-5 space-y-4">
              {moodPassages.map((p) => <PassageCard key={p.reference} passage={p} compact />)}
              <div className="rounded-xl bg-muted/70 p-4">
                <p className="text-sm font-semibold">A gentle exercise</p>
                <p className="mt-1 text-sm text-subtle">{m.exercise}</p>
              </div>
              <details className="rounded-xl border border-line p-4">
                <summary className="cursor-pointer text-sm font-semibold">A prayer you could pray</summary>
                <p className="mt-2 font-scripture italic">{m.prayer}</p>
              </details>
              <p className="text-xs text-subtle">
                Faithly offers spiritual encouragement, not medical or psychological care. If you're struggling, please talk to your GP,
                call NHS 111, or Samaritans on 116 123 (free, 24/7). In an emergency, call 999.
              </p>
            </div>
          );
        })()}
      </section>

      {/* Quick access */}
      <section aria-labelledby="qa-h">
        <h2 id="qa-h" className="mb-3 text-xl font-semibold">Explore</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { to: '/ask', label: 'Ask Faithly AI', icon: MessageCircleHeart, tone: 'from-forest/15' },
            { to: '/you/journal', label: 'My Prayer Journal', icon: NotebookPen, tone: 'from-gold/20' },
            { to: '/bible', label: 'Bible Study', icon: BookOpen, tone: 'from-sage/30' },
            { to: '/journeys', label: 'Faith Journeys', icon: Compass, tone: 'from-forest/15' },
            { to: '/audio', label: 'Audio Devotionals', icon: Headphones, tone: 'from-gold/20' },
            { to: '/you/saved', label: 'Saved Scriptures', icon: Bookmark, tone: 'from-sage/30' },
            { to: '/games', label: 'Bible Challenges', icon: Puzzle, tone: 'from-sage/30' },
            { to: '/wallpaper', label: 'Verse Wallpapers', icon: ImageIcon, tone: 'from-forest/15' },
            { to: '/devotionals', label: 'Devotionals', icon: Sparkles, tone: 'from-gold/20' },
          ].map(({ to, label, icon: Icon, tone }) => (
            <Link key={to} to={to} className={`card flex min-h-[96px] flex-col justify-between bg-gradient-to-br ${tone} to-transparent p-4 transition hover:shadow-lift`}>
              <Icon className="h-6 w-6 text-accent" aria-hidden />
              <span className="mt-3 text-sm font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
