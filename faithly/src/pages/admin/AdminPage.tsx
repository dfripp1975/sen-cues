import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { callFunction } from '../../lib/api';
import { displayReference, parseReference } from '../../lib/bible';
import type { Devotional, Journey } from '../../lib/types';
import { PageHeader, Sheet, Spinner } from '../../components/ui';
import { AiError } from '../../components/AiError';

interface Stats {
  generated_at: string;
  users: { total: number; new_last_30_days: number; active_today: number; active_7_days: number; active_30_days: number };
  subscriptions: { premium: number; monthly: number; yearly: number; estimated_mrr_gbp: number; conversion_rate: number; ever_subscribed: number };
  ai: { requests_30_days: number; by_kind: Record<string, number>; by_day: Record<string, number>; tokens_30_days: number; estimated_cost_usd_30_days: number };
  journeys: { title: string; started: number; completed: number }[];
  retention: { day_1: { cohort: number; retained: number; rate: number | null }; month_1: { cohort: number; retained: number; rate: number | null } };
}

const pct = (r: number | null) => (r == null ? '—' : `${Math.round(r * 1000) / 10}%`);

export default function AdminPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'overview' | 'devotionals' | 'journeys' | 'quiz'>('overview');
  if (!profile?.is_admin) return <Navigate to="/" replace />;
  return (
    <div>
      <PageHeader title="Admin" subtitle="Aggregate statistics and content management. Private journals, prayers and conversations are never shown here." />
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-full bg-muted p-1" role="tablist">
        {(['overview', 'devotionals', 'journeys', 'quiz'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold capitalize ${tab === t ? 'bg-surface shadow-soft' : 'text-subtle'}`}>{t}</button>
        ))}
      </div>
      {tab === 'overview' && <Overview />}
      {tab === 'devotionals' && <DevotionalsAdmin />}
      {tab === 'journeys' && <JourneysAdmin />}
      {tab === 'quiz' && <QuizAdmin />}
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<unknown>(null);
  const load = useCallback(() => { setError(null); callFunction<Stats>('admin-stats', {}).then(setStats, setError); }, []);
  useEffect(() => { load(); }, [load]);
  if (error) return <AiError error={error} onRetry={load} />;
  if (!stats) return <Spinner label="Loading statistics" />;
  const days = Object.entries(stats.ai.by_day).sort(([a], [b]) => b.localeCompare(a)).slice(0, 14);
  return (
    <div className="space-y-6">
      <Grid>
        <Stat label="Registered users" value={stats.users.total} sub={`${stats.users.new_last_30_days} new in 30 days`} />
        <Stat label="Active today" value={stats.users.active_today} sub={`${stats.users.active_7_days} in 7 days · ${stats.users.active_30_days} in 30`} />
        <Stat label="Premium subscribers" value={stats.subscriptions.premium} sub={`${stats.subscriptions.monthly} monthly · ${stats.subscriptions.yearly} yearly`} />
        <Stat label="Estimated MRR" value={`£${stats.subscriptions.estimated_mrr_gbp.toFixed(2)}`} sub="Yearly plans spread over 12 months" />
        <Stat label="Conversion" value={pct(stats.subscriptions.conversion_rate)} sub={`${stats.subscriptions.ever_subscribed} have ever subscribed`} />
        <Stat label="AI requests (30 days)" value={stats.ai.requests_30_days} sub={`${stats.ai.tokens_30_days.toLocaleString()} tokens`} />
        <Stat label="Estimated AI cost (30 days)" value={`$${stats.ai.estimated_cost_usd_30_days.toFixed(2)}`} sub="Based on configured per-token prices" />
        <Stat label="Day-1 retention" value={pct(stats.retention.day_1.rate)} sub={`${stats.retention.day_1.retained} of ${stats.retention.day_1.cohort} recent sign-ups`} />
        <Stat label="Month-1 retention" value={pct(stats.retention.month_1.rate)} sub={`${stats.retention.month_1.retained} of ${stats.retention.month_1.cohort} (30–60 days old)`} />
      </Grid>
      <Table title="AI usage by feature (30 days)" head={['Feature', 'Requests']} rows={Object.entries(stats.ai.by_kind).map(([k, v]) => [k.replace('_', ' '), v])} />
      <Table title="AI requests per day" head={['Date', 'Requests']} rows={days.map(([d, v]) => [d, v])} />
      <Table title="Most popular journeys" head={['Journey', 'Started', 'Completed']} rows={stats.journeys.map((j) => [j.title, j.started, j.completed])} />
      <p className="text-xs text-subtle">Generated {new Date(stats.generated_at).toLocaleString('en-GB')}</p>
    </div>
  );
}

const Grid = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{children}</div>;
function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return <div className="card p-4"><p className="text-xs text-subtle">{label}</p><p className="mt-1 font-serif text-2xl font-semibold">{value}</p>{sub && <p className="mt-1 text-xs text-subtle">{sub}</p>}</div>;
}
function Table({ title, head, rows }: { title: string; head: string[]; rows: ReactNode[][] }) {
  return (
    <section className="card overflow-x-auto p-5">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-subtle">No data yet.</p> : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-subtle">{head.map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className={`py-2 ${j ? 'text-right tabular-nums' : 'capitalize'}`}>{c}</td>)}</tr>)}</tbody>
        </table>
      )}
    </section>
  );
}

// ── Content management ──────────────────────────────────────────────────────

function refFields(ref: string) {
  const r = parseReference(ref);
  if (!r || r.verseStart == null) return null;
  return { book_id: r.bookId, chapter: r.chapter, verse_start: r.verseStart, verse_end: r.verseEnd ?? r.verseStart };
}

function DevotionalsAdmin() {
  const toast = useToast();
  const [items, setItems] = useState<Devotional[] | null>(null);
  const [edit, setEdit] = useState<(Partial<Devotional> & { ref?: string; is_published?: boolean }) | null>(null);
  const load = () => supabase.from('devotional_content').select('*').order('sort_order').then(({ data }) => setItems((data ?? []) as Devotional[]));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!edit) return;
    const rf = refFields(edit.ref ?? '');
    if (!rf) return toast('Enter a valid passage, e.g. Psalm 23:1-4', 'error');
    const words = (edit.reflection ?? '').split(/\s+/).filter(Boolean).length;
    if (!edit.title || !edit.slug || words < 300 || words > 500) return toast(`Title, slug and a 300–500 word reflection are required (currently ${words} words).`, 'error');
    const row = {
      slug: edit.slug, title: edit.title, ...rf, reflection: edit.reflection, takeaway: edit.takeaway ?? '', reflection_question: edit.reflection_question ?? '',
      prayer: edit.prayer ?? '', is_premium: !!edit.is_premium, is_published: edit.is_published ?? true, focus_tags: edit.focus_tags ?? [],
    };
    const { error } = edit.id ? await supabase.from('devotional_content').update(row).eq('id', edit.id) : await supabase.from('devotional_content').insert(row);
    if (error) return toast(error.message, 'error');
    toast('Devotional saved');
    setEdit(null);
    load();
  };

  if (!items) return <Spinner />;
  return (
    <div>
      <button className="btn-primary mb-4" onClick={() => setEdit({ ref: '', is_published: true })}><Plus className="h-4 w-4" />New devotional</button>
      <ul className="card divide-y divide-line">
        {items.map((d) => (
          <li key={d.id} className="flex items-center gap-3 px-5 py-3">
            <span className="flex-1">{d.title}{(d as Devotional & { is_published: boolean }).is_published === false && <span className="ml-2 text-xs text-subtle">(draft)</span>}</span>
            <button onClick={() => setEdit({ ...d, ref: displayReference({ bookId: d.book_id, chapter: d.chapter, verseStart: d.verse_start, verseEnd: d.verse_end }) })} className="rounded-full p-2 hover:bg-muted" aria-label={`Edit ${d.title}`}><Pencil className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit devotional' : 'New devotional'}>
        {edit && (
          <div className="space-y-3">
            <Field label="Title" value={edit.title ?? ''} onChange={(v) => setEdit({ ...edit, title: v })} />
            <Field label="Slug (URL)" value={edit.slug ?? ''} onChange={(v) => setEdit({ ...edit, slug: v.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
            <Field label="Passage (verified against the Bible text)" value={edit.ref ?? ''} onChange={(v) => setEdit({ ...edit, ref: v })} placeholder="Psalm 23:1-4" />
            <Area label={`Reflection (300–500 words; currently ${(edit.reflection ?? '').split(/\s+/).filter(Boolean).length})`} value={edit.reflection ?? ''} onChange={(v) => setEdit({ ...edit, reflection: v })} rows={10} />
            <Area label="Practical takeaway" value={edit.takeaway ?? ''} onChange={(v) => setEdit({ ...edit, takeaway: v })} />
            <Area label="Reflection question" value={edit.reflection_question ?? ''} onChange={(v) => setEdit({ ...edit, reflection_question: v })} />
            <Area label="Prayer" value={edit.prayer ?? ''} onChange={(v) => setEdit({ ...edit, prayer: v })} />
            <Field label="Focus tags (comma separated)" value={(edit.focus_tags ?? []).join(', ')} onChange={(v) => setEdit({ ...edit, focus_tags: v.split(',').map((s) => s.trim()).filter(Boolean) })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!edit.is_premium} onChange={(e) => setEdit({ ...edit, is_premium: e.target.checked })} />Premium only</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.is_published ?? true} onChange={(e) => setEdit({ ...edit, is_published: e.target.checked })} />Published</label>
            <button className="btn-primary w-full" onClick={save}>Save</button>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function JourneysAdmin() {
  const toast = useToast();
  const [items, setItems] = useState<(Journey & { is_published: boolean })[] | null>(null);
  const load = () => supabase.from('faith_journeys').select('*').order('sort_order').then(({ data }) => setItems((data ?? []) as never));
  useEffect(() => { load(); }, []);
  const update = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from('faith_journeys').update(patch).eq('id', id);
    if (error) return toast(error.message, 'error');
    toast('Journey updated');
    load();
  };
  if (!items) return <Spinner />;
  return (
    <div className="space-y-3">
      <p className="text-sm text-subtle">Journey days are authored in <code>scripts/content/journeys.mjs</code> and validated against the Bible text by <code>npm run build-seed</code> before deployment, so references can't be mistyped.</p>
      {items.map((j) => (
        <div key={j.id} className="card p-4">
          <p className="font-semibold">{j.title}</p>
          <p className="text-sm text-subtle">{j.day_count} days</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={j.is_published} onChange={(e) => update(j.id, { is_published: e.target.checked })} />Published</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={j.is_premium} onChange={(e) => update(j.id, { is_premium: e.target.checked })} />Premium</label>
          </div>
        </div>
      ))}
    </div>
  );
}

interface QuizRow { id?: string; category: string; difficulty: string; question: string; options: string[]; correct_index: number; explanation: string; reference: string; is_published?: boolean }

function QuizAdmin() {
  const toast = useToast();
  const [items, setItems] = useState<QuizRow[] | null>(null);
  const [edit, setEdit] = useState<QuizRow | null>(null);
  const load = () => supabase.from('quiz_questions').select('*').order('created_at').then(({ data }) => setItems((data ?? []) as QuizRow[]));
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!edit) return;
    const options = edit.options.map((o) => o.trim()).filter(Boolean);
    if (!edit.question.trim() || options.length < 2 || edit.correct_index >= options.length) return toast('A question, at least two options and a valid answer are required.', 'error');
    if (!parseReference(edit.reference)) return toast('Please give a valid Bible reference so learners can check the answer.', 'error');
    const row = { ...edit, options };
    delete row.id;
    const { error } = edit.id ? await supabase.from('quiz_questions').update(row).eq('id', edit.id) : await supabase.from('quiz_questions').insert(row);
    if (error) return toast(error.message, 'error');
    toast('Question saved');
    setEdit(null);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    await supabase.from('quiz_questions').delete().eq('id', id);
    load();
  };
  if (!items) return <Spinner />;
  return (
    <div>
      <button className="btn-primary mb-4" onClick={() => setEdit({ category: 'trivia', difficulty: 'beginner', question: '', options: ['', '', '', ''], correct_index: 0, explanation: '', reference: '' })}><Plus className="h-4 w-4" />New question</button>
      <ul className="card divide-y divide-line">
        {items.map((q) => (
          <li key={q.id} className="flex items-center gap-3 px-5 py-3 text-sm">
            <span className="flex-1"><span className="text-xs capitalize text-subtle">{q.category} · {q.difficulty}</span><br />{q.question}</span>
            <button onClick={() => setEdit(q)} className="rounded-full p-2 hover:bg-muted" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => remove(q.id!)} className="rounded-full p-2 hover:bg-muted" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit question' : 'New question'}>
        {edit && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select className="input" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} aria-label="Category"><option value="trivia">Trivia</option><option value="character">Character</option></select>
              <select className="input" value={edit.difficulty} onChange={(e) => setEdit({ ...edit, difficulty: e.target.value })} aria-label="Difficulty"><option>beginner</option><option>intermediate</option><option>advanced</option></select>
            </div>
            <Area label="Question" value={edit.question} onChange={(v) => setEdit({ ...edit, question: v })} />
            {edit.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correct" checked={edit.correct_index === i} onChange={() => setEdit({ ...edit, correct_index: i })} aria-label={`Option ${i + 1} is correct`} />
                <input className="input" value={o} placeholder={`Option ${i + 1}`} onChange={(e) => setEdit({ ...edit, options: edit.options.map((x, j) => (j === i ? e.target.value : x)) })} />
              </div>
            ))}
            <Area label="Explanation" value={edit.explanation} onChange={(v) => setEdit({ ...edit, explanation: v })} />
            <Field label="Reference" value={edit.reference} onChange={(v) => setEdit({ ...edit, reference: v })} placeholder="Genesis 6:14" />
            <button className="btn-primary w-full" onClick={save}>Save</button>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const id = label.replace(/\W+/g, '-');
  return <div><label htmlFor={id} className="label">{label}</label><input id={id} className="input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></div>;
}
function Area({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  const id = label.replace(/\W+/g, '-');
  return <div><label htmlFor={id} className="label">{label}</label><textarea id={id} rows={rows} className="input" value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}

