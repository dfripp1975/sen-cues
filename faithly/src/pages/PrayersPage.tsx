import { useEffect, useState } from 'react';
import { Heart, PenLine, Plus, Sparkles, Trash2, Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { callFunction } from '../lib/api';
import { narrator } from '../lib/speech';
import { markActivity } from '../lib/progress';
import { formatDate } from '../lib/dates';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PRAYER_CATEGORIES } from '../content/options';
import type { PrayerEntry } from '../lib/types';
import { EmptyState, PageHeader, Paragraphs, Sheet, Spinner } from '../components/ui';
import { AiLabel } from '../components/Scripture';
import { AiError } from '../components/AiError';

interface Suggested { title: string; prayer: string; category: string }
const STATUS = [['praying', 'Still praying'], ['reflected', 'Reflected on'], ['answered', 'Answered']] as const;

export default function PrayersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<'pray' | 'mine'>('pray');
  const [category, setCategory] = useState('morning');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [suggested, setSuggested] = useState<Suggested | null>(null);
  const [prayers, setPrayers] = useState<PrayerEntry[] | null>(null);
  const [favOnly, setFavOnly] = useState(false);
  const [editing, setEditing] = useState<Partial<PrayerEntry> | null>(null);

  const loadPrayers = () =>
    supabase.from('prayer_entries').select('*').order('created_at', { ascending: false }).then(({ data }) => setPrayers((data ?? []) as PrayerEntry[]));
  useEffect(() => { loadPrayers(); }, []);

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuggested(null);
    try {
      setSuggested(await callFunction<Suggested>('faithly-ai', { mode: 'prayer', category, details }));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const saveSuggested = async () => {
    if (!user || !suggested) return;
    const { error } = await supabase.from('prayer_entries').insert({ user_id: user.id, category: suggested.category, title: suggested.title, content: suggested.prayer, is_ai_generated: true });
    if (error) return toast('Could not save prayer.', 'error');
    toast('Prayer saved');
    loadPrayers();
  };

  const prayed = async () => {
    if (!user) return;
    await markActivity(user.id, 'prayer');
    toast('Marked as prayed today');
  };

  const saveEdit = async () => {
    if (!user || !editing) return;
    if (!editing.content?.trim()) return toast('Please write your prayer first.', 'error');
    const row = {
      title: (editing.title ?? '').trim().slice(0, 120), content: editing.content.trim(), reflection: (editing.reflection ?? '').trim(),
      status: editing.status ?? 'praying', category: editing.category ?? 'custom', is_favourite: editing.is_favourite ?? false,
    };
    const { error } = editing.id
      ? await supabase.from('prayer_entries').update(row).eq('id', editing.id)
      : await supabase.from('prayer_entries').insert({ ...row, user_id: user.id });
    if (error) return toast('Could not save prayer.', 'error');
    if (!editing.id) markActivity(user.id, 'prayer');
    setEditing(null);
    toast('Prayer saved');
    loadPrayers();
  };

  const toggleFav = async (p: PrayerEntry) => {
    await supabase.from('prayer_entries').update({ is_favourite: !p.is_favourite }).eq('id', p.id);
    setPrayers((list) => list?.map((x) => (x.id === p.id ? { ...x, is_favourite: !x.is_favourite } : x)) ?? null);
  };

  const remove = async (p: PrayerEntry) => {
    if (!confirm('Delete this prayer?')) return;
    await supabase.from('prayer_entries').delete().eq('id', p.id);
    setPrayers((list) => list?.filter((x) => x.id !== p.id) ?? null);
    setEditing(null);
  };

  const listen = (title: string, text: string) => { narrator.load(title, text); narrator.play(0); };
  const shown = (prayers ?? []).filter((p) => !favOnly || p.is_favourite);

  return (
    <div>
      <PageHeader title="Prayer" subtitle="A quiet space to pray, with gentle suggestions if you'd like them." back="/you" />
      <div className="mb-6 inline-flex rounded-full bg-muted p-1" role="tablist">
        {([['pray', 'Pray now'], ['mine', 'My prayers']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-5 py-2 text-sm font-semibold ${tab === k ? 'bg-surface shadow-soft' : 'text-subtle'}`}>{l}</button>
        ))}
      </div>

      {tab === 'pray' && (
        <div className="space-y-5">
          <div className="card space-y-4 p-5">
            <fieldset>
              <legend className="label">What kind of prayer?</legend>
              <div className="flex flex-wrap gap-2">
                {PRAYER_CATEGORIES.map((c) => (
                  <button key={c.id} onClick={() => setCategory(c.id)} aria-pressed={category === c.id} className={`chip ${category === c.id ? 'chip-on' : 'bg-surface hover:bg-muted'}`}>{c.label}</button>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="pd" className="label">What would you like to pray about? {category !== 'custom' && <span className="font-normal text-subtle">(optional)</span>}</label>
              <textarea id="pd" className="input min-h-[100px]" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000}
                placeholder="e.g. My mum's operation on Thursday, and peace for our family while we wait." />
              <p className="mt-1 text-xs text-subtle">Shared only with the AI service to write this suggestion. Not stored unless you save the prayer.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={generate} disabled={busy || (category === 'custom' && !details.trim())} className="btn-primary"><Sparkles className="h-4 w-4" />{busy ? 'Writing…' : 'Suggest a prayer'}</button>
              <button onClick={() => setEditing({ category, content: '', title: '' })} className="btn-secondary"><PenLine className="h-4 w-4" />Write my own</button>
            </div>
          </div>
          {busy && <Spinner label="Preparing a prayer" />}
          {error != null && <AiError error={error} onRetry={generate} />}
          {suggested && (
            <article className="card p-6">
              <AiLabel>Suggested prayer · AI-written</AiLabel>
              <h2 className="mt-3 text-xl font-semibold">{suggested.title}</h2>
              <Paragraphs text={suggested.prayer} className="mt-3 font-scripture text-[17px] leading-relaxed" />
              <p className="mt-4 text-xs text-subtle">These are words to help you pray, not a promise of any outcome. Feel free to change them or pray in your own words.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => listen(suggested.title, suggested.prayer)} className="chip hover:bg-muted"><Volume2 className="h-4 w-4" />Listen</button>
                <button onClick={saveSuggested} className="chip hover:bg-muted"><Plus className="h-4 w-4" />Save</button>
                <button onClick={() => setEditing({ category: suggested.category, title: suggested.title, content: suggested.prayer, is_ai_generated: true })} className="chip hover:bg-muted"><PenLine className="h-4 w-4" />Edit & save</button>
                <button onClick={prayed} className="chip hover:bg-muted">I've prayed this</button>
              </div>
            </article>
          )}
        </div>
      )}

      {tab === 'mine' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => setFavOnly(!favOnly)} aria-pressed={favOnly} className={`chip ${favOnly ? 'chip-on' : 'bg-surface'}`}><Heart className="h-4 w-4" />Favourites</button>
            <button onClick={() => setEditing({ category: 'custom', content: '', title: '' })} className="btn-primary !px-4"><Plus className="h-4 w-4" />New prayer</button>
          </div>
          {!prayers && <Spinner />}
          {prayers && shown.length === 0 && <EmptyState title={favOnly ? 'No favourite prayers yet' : 'No saved prayers yet'}>Prayers you write or save will appear here, privately.</EmptyState>}
          <ul className="space-y-3">
            {shown.map((p) => (
              <li key={p.id} className="card p-4">
                <div className="flex items-start gap-2">
                  <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(p)}>
                    <p className="text-xs text-subtle">{formatDate(p.created_at)} · {PRAYER_CATEGORIES.find((c) => c.id === p.category)?.label ?? 'Prayer'}{p.is_ai_generated && ' · AI-suggested'}</p>
                    <p className="mt-1 font-serif text-lg font-semibold">{p.title || 'Untitled prayer'}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-subtle">{p.content}</p>
                    <p className="mt-2 text-xs font-medium text-accent">{STATUS.find(([v]) => v === p.status)?.[1]}</p>
                  </button>
                  <button onClick={() => toggleFav(p)} className="rounded-full p-2 hover:bg-muted" aria-label={p.is_favourite ? 'Remove from favourites' : 'Add to favourites'} aria-pressed={p.is_favourite}>
                    <Heart className={`h-5 w-5 ${p.is_favourite ? 'fill-gold text-gold' : 'text-subtle'}`} />
                  </button>
                  <button onClick={() => listen(p.title || 'Prayer', p.content)} className="rounded-full p-2 text-subtle hover:bg-muted" aria-label="Listen"><Volume2 className="h-5 w-5" /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit prayer' : 'New prayer'}>
        {editing && (
          <div className="space-y-4">
            <div><label htmlFor="pt" className="label">Title</label><input id="pt" className="input" value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} maxLength={120} /></div>
            <div><label htmlFor="pc" className="label">Prayer</label><textarea id="pc" className="input min-h-[180px] font-scripture" value={editing.content ?? ''} onChange={(e) => setEditing({ ...editing, content: e.target.value })} maxLength={10000} /></div>
            <fieldset>
              <legend className="label">Status (your own assessment)</legend>
              <div className="flex flex-wrap gap-2">
                {STATUS.map(([v, l]) => <button key={v} type="button" onClick={() => setEditing({ ...editing, status: v })} aria-pressed={(editing.status ?? 'praying') === v} className={`chip ${(editing.status ?? 'praying') === v ? 'chip-on' : 'bg-surface'}`}>{l}</button>)}
              </div>
            </fieldset>
            <div><label htmlFor="pr" className="label">Personal reflection</label><textarea id="pr" className="input min-h-[90px]" value={editing.reflection ?? ''} onChange={(e) => setEditing({ ...editing, reflection: e.target.value })} maxLength={5000} placeholder="How has God met you in this?" /></div>
            <div className="flex gap-2">
              <button onClick={saveEdit} className="btn-primary flex-1">Save</button>
              {editing.id && <button onClick={() => remove(editing as PrayerEntry)} className="btn-ghost text-red-700"><Trash2 className="h-4 w-4" />Delete</button>}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
