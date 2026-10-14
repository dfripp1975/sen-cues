import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, CheckCircle2, Share2, Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchPassage, passageText } from '../lib/bible';
import { markActivity } from '../lib/progress';
import { narrator } from '../lib/speech';
import { shareText } from '../lib/share';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Devotional, VerifiedPassage } from '../lib/types';
import { ErrorNote, PageHeader, Paragraphs, Spinner } from '../components/ui';
import { PassageCard } from '../components/Scripture';

export default function DevotionalPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [d, setD] = useState<Devotional | null>(null);
  const [passage, setPassage] = useState<VerifiedPassage | null>(null);
  const [state, setState] = useState({ completed: false, saved: false, note: '' });
  const [noteDirty, setNoteDirty] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    supabase.from('devotional_content').select('*').eq('slug', slug).maybeSingle().then(async ({ data }) => {
      if (!data) return setMissing(true);
      setD(data as Devotional);
      setPassage(await fetchPassage(data.book_id, data.chapter, data.verse_start, data.verse_end));
      const { data: c } = await supabase.from('devotional_completions').select('*').eq('devotional_id', data.id).maybeSingle();
      if (c) setState({ completed: !!c.completed_at, saved: c.is_saved, note: c.note });
    });
  }, [slug]);

  if (missing) return <ErrorNote>Devotional not found.</ErrorNote>;
  if (!d) return <Spinner />;

  const upsert = async (patch: Record<string, unknown>) => {
    if (!user) return false;
    const { error } = await supabase.from('devotional_completions').upsert({ user_id: user.id, devotional_id: d.id, ...patch }, { onConflict: 'user_id,devotional_id' });
    if (error) toast('Could not save. Please try again.', 'error');
    return !error;
  };

  const complete = async () => {
    if (await upsert({ completed_at: new Date().toISOString() })) {
      setState((s) => ({ ...s, completed: true }));
      if (user) markActivity(user.id, 'reflection');
      toast('Devotional complete');
    }
  };
  const toggleSave = async () => {
    if (await upsert({ is_saved: !state.saved })) {
      setState((s) => ({ ...s, saved: !s.saved }));
      toast(state.saved ? 'Removed from saved' : 'Saved');
    }
  };
  const saveNote = async () => {
    if (await upsert({ note: state.note })) { setNoteDirty(false); toast('Note saved'); }
  };
  const listen = () => {
    narrator.load(d.title, [d.title, passage ? `${passage.reference}. ${passageText(passage)}` : '', d.reflection, d.takeaway, d.reflection_question, d.prayer]);
    narrator.play(0);
  };
  const share = async () => {
    const r = await shareText(d.title, `${d.title} — a Faithly devotional on ${passage?.reference ?? ''}`, window.location.href);
    if (r === 'copied') toast('Link copied');
  };

  return (
    <article className="space-y-6">
      <PageHeader title={d.title} back="/devotionals" />
      <div className="flex flex-wrap gap-2">
        <button onClick={listen} className="chip hover:bg-muted"><Volume2 className="h-4 w-4" />Listen</button>
        <button onClick={toggleSave} className="chip hover:bg-muted" aria-pressed={state.saved}>{state.saved ? <BookmarkCheck className="h-4 w-4 text-accent" /> : <Bookmark className="h-4 w-4" />}{state.saved ? 'Saved' : 'Save'}</button>
        <button onClick={share} className="chip hover:bg-muted"><Share2 className="h-4 w-4" />Share</button>
      </div>
      {passage && <PassageCard passage={passage} />}
      <div className="scripture !font-sans !text-[1.0625rem]"><Paragraphs text={d.reflection} className="leading-[1.8]" /></div>
      <section className="card p-5">
        <h2 className="eyebrow mb-1">Practical takeaway</h2>
        <p>{d.takeaway}</p>
      </section>
      <section className="card p-5">
        <h2 className="eyebrow mb-1">Reflect</h2>
        <p className="font-serif text-lg">{d.reflection_question}</p>
        <label htmlFor="dnote" className="label mt-4">Your notes</label>
        <textarea id="dnote" className="input min-h-[100px]" value={state.note} maxLength={5000}
          onChange={(e) => { setState({ ...state, note: e.target.value }); setNoteDirty(true); }} placeholder="Private to you" />
        {noteDirty && <button onClick={saveNote} className="btn-secondary mt-2">Save note</button>}
      </section>
      <section className="rounded-2xl bg-muted/70 p-5">
        <h2 className="eyebrow mb-1">Prayer</h2>
        <p className="font-scripture text-[17px] italic leading-relaxed">{d.prayer}</p>
      </section>
      {state.completed
        ? <p className="flex items-center justify-center gap-2 font-semibold text-accent"><CheckCircle2 className="h-5 w-5" />Completed</p>
        : <button onClick={complete} className="btn-primary w-full py-3">Mark as complete</button>}
    </article>
  );
}
