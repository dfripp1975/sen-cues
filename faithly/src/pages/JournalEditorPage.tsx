import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { parseReference, displayReference } from '../lib/bible';
import { markActivity } from '../lib/progress';
import { todayLocal } from '../lib/dates';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ErrorNote, PageHeader, Spinner } from '../components/ui';

const MOODS = ['peaceful', 'happy', 'grateful', 'hopeful', 'uncertain', 'anxious', 'sad', 'lonely', 'overwhelmed'];

export default function JournalEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState(todayLocal());
  const [mood, setMood] = useState<string | null>(null);
  const [refs, setRefs] = useState<string[]>([]);
  const [refInput, setRefInput] = useState('');
  const [isPrayer, setIsPrayer] = useState(false);
  const [status, setStatus] = useState<'praying' | 'reflected' | 'answered'>('praying');

  useEffect(() => {
    if (isNew) return;
    supabase.from('journal_entries').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (!data) return nav('/you/journal', { replace: true });
      setTitle(data.title); setBody(data.body); setDate(data.entry_date); setMood(data.mood);
      setRefs(data.scripture_refs); setIsPrayer(data.is_prayer); setStatus(data.prayer_status ?? 'praying');
      setLoading(false);
    });
  }, [id, isNew, nav]);

  const addRef = () => {
    const r = parseReference(refInput);
    if (!r) return setError(`“${refInput}” doesn't look like a Bible reference. Try a form like “Psalm 23:1”.`);
    const label = displayReference(r);
    if (!refs.includes(label)) setRefs([...refs, label]);
    setRefInput('');
    setError(null);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!body.trim()) return setError('Please write something before saving.');
    setBusy(true);
    const row = {
      user_id: user.id, title: title.trim(), body: body.trim(), entry_date: date, mood, scripture_refs: refs,
      is_prayer: isPrayer, prayer_status: isPrayer ? status : null,
    };
    const { error } = isNew ? await supabase.from('journal_entries').insert(row) : await supabase.from('journal_entries').update(row).eq('id', id);
    setBusy(false);
    if (error) return setError('Could not save your entry. Please try again.');
    if (isNew) markActivity(user.id, 'journal');
    toast('Journal entry saved');
    nav('/you/journal');
  };

  const remove = async () => {
    if (!confirm('Delete this entry permanently?')) return;
    const { error } = await supabase.from('journal_entries').delete().eq('id', id);
    if (error) return toast('Could not delete entry.', 'error');
    toast('Entry deleted');
    nav('/you/journal');
  };

  if (loading) return <Spinner />;

  return (
    <form onSubmit={save} className="space-y-5">
      <PageHeader title={isNew ? 'New entry' : 'Edit entry'} back="/you/journal"
        action={!isNew && <button type="button" onClick={remove} className="rounded-full p-2.5 text-subtle hover:bg-muted hover:text-red-700" aria-label="Delete entry"><Trash2 className="h-5 w-5" /></button>} />
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div><label htmlFor="jt" className="label">Title <span className="font-normal text-subtle">(optional)</span></label>
          <input id="jt" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} /></div>
        <div><label htmlFor="jd" className="label">Date</label>
          <input id="jd" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
      </div>
      <div><label htmlFor="jb" className="label">Your words</label>
        <textarea id="jb" className="input min-h-[220px] font-scripture text-[17px] leading-relaxed" value={body} onChange={(e) => setBody(e.target.value)} maxLength={20000} placeholder="What's on your heart today?" /></div>

      <fieldset>
        <legend className="label">Mood <span className="font-normal text-subtle">(optional)</span></legend>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => <button type="button" key={m} onClick={() => setMood(mood === m ? null : m)} aria-pressed={mood === m} className={`chip capitalize ${mood === m ? 'chip-on' : 'bg-surface'}`}>{m}</button>)}
        </div>
      </fieldset>

      <div>
        <label htmlFor="jr" className="label">Scripture references</label>
        <div className="flex gap-2">
          <input id="jr" className="input" value={refInput} onChange={(e) => setRefInput(e.target.value)} placeholder="e.g. Romans 8:28"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRef(); } }} />
          <button type="button" className="btn-secondary" onClick={addRef} disabled={!refInput.trim()}>Add</button>
        </div>
        {refs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {refs.map((r) => <span key={r} className="chip bg-sage/20">{r}<button type="button" onClick={() => setRefs(refs.filter((x) => x !== r))} aria-label={`Remove ${r}`}><X className="h-3.5 w-3.5" /></button></span>)}
          </div>
        )}
      </div>

      <div className="card space-y-3 p-4">
        <label className="flex items-center gap-3"><input type="checkbox" className="h-4 w-4 accent-forest" checked={isPrayer} onChange={(e) => setIsPrayer(e.target.checked)} /> This entry is a prayer</label>
        {isPrayer && (
          <fieldset>
            <legend className="mb-2 text-sm text-subtle">Where are you with this prayer? (your own assessment)</legend>
            <div className="flex flex-wrap gap-2">
              {([['praying', 'Still praying'], ['reflected', 'Reflected on'], ['answered', 'Answered']] as const).map(([v, l]) => (
                <button type="button" key={v} onClick={() => setStatus(v)} aria-pressed={status === v} className={`chip ${status === v ? 'chip-on' : 'bg-surface'}`}>{l}</button>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Saving…' : 'Save entry'}</button>
    </form>
  );
}
