import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BookmarkPlus, Layers3, LifeBuoy, Trash2, Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { callFunction } from '../lib/api';
import { narrator } from '../lib/speech';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { ChatPayload, DeeperPayload } from '../lib/types';
import { Composer } from '../components/Composer';
import { PageHeader, Paragraphs, Spinner } from '../components/ui';
import { AiLabel, PassageCard } from '../components/Scripture';
import { AiError } from '../components/AiError';

interface Msg { id: string; role: 'user' | 'assistant'; content: string; payload: ChatPayload | null }

export default function ChatPage() {
  const { id = 'new' } = useParams();
  const { state } = useLocation() as { state: { question?: string } | null };
  const nav = useNavigate();
  const toast = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [title, setTitle] = useState('New conversation');
  const [loading, setLoading] = useState(id !== 'new');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const sentInitial = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id === 'new') return;
    setLoading(true);
    Promise.all([
      supabase.from('chat_conversations').select('title').eq('id', id).maybeSingle(),
      supabase.from('chat_messages').select('id, role, content, payload').eq('conversation_id', id).order('created_at'),
    ]).then(([c, m]) => {
      if (!c.data) {
        nav('/ask', { replace: true });
        return;
      }
      setTitle(c.data.title);
      setMessages((m.data ?? []) as Msg[]);
      setLoading(false);
    });
  }, [id, nav]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, busy]);

  const send = useCallback(async (question: string) => {
    if (busy) return; // prevent duplicate requests
    setBusy(true);
    setError(null);
    setLastQuestion(question);
    const temp: Msg = { id: `tmp-${Date.now()}`, role: 'user', content: question, payload: null };
    setMessages((m) => [...m, temp]);
    try {
      const res = await callFunction<ChatPayload>('faithly-ai', { mode: 'chat', message: question, conversationId: id === 'new' ? undefined : id });
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'assistant', content: res.answer, payload: res }]);
      if (id === 'new' && res.conversationId) nav(`/ask/${res.conversationId}`, { replace: true });
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== temp.id));
      setError(e);
    } finally {
      setBusy(false);
    }
  }, [busy, id, nav]);

  useEffect(() => {
    if (id === 'new' && state?.question && !sentInitial.current) {
      sentInitial.current = true;
      send(state.question);
    }
  }, [id, state, send]);

  const remove = async () => {
    if (id === 'new' || !confirm('Delete this conversation? This cannot be undone.')) return;
    const { error } = await supabase.from('chat_conversations').delete().eq('id', id);
    if (error) return toast('Could not delete conversation.', 'error');
    toast('Conversation deleted');
    nav('/ask');
  };

  const questionFor = (index: number) => {
    for (let i = index - 1; i >= 0; i--) if (messages[i].role === 'user') return messages[i].content;
    return '';
  };

  return (
    <div className="flex min-h-[calc(100dvh-12rem)] flex-col">
      <PageHeader title={title} back="/ask"
        action={id !== 'new' && <button onClick={remove} className="rounded-full p-2.5 text-subtle hover:bg-muted hover:text-red-700" aria-label="Delete conversation"><Trash2 className="h-5 w-5" /></button>} />

      {loading ? <Spinner /> : (
        <div className="flex-1 space-y-6" aria-live="polite">
          {messages.map((m, i) => m.role === 'user'
            ? <div key={m.id} className="ml-auto max-w-[85%] rounded-3xl rounded-br-md bg-accent px-5 py-3 text-accent-ink">{m.content}</div>
            : <AnswerView key={m.id} payload={m.payload} fallback={m.content} question={questionFor(i)} conversationId={id === 'new' ? undefined : id} onFollowUp={send} />)}
          {busy && (
            <div className="card p-5"><Spinner label="Faithly is reflecting on Scripture" /></div>
          )}
          {error != null && <AiError error={error} onRetry={lastQuestion ? () => send(lastQuestion) : undefined} />}
          <div ref={bottom} />
        </div>
      )}

      <div className="sticky bottom-[72px] mt-6 bg-gradient-to-t from-bg via-bg to-transparent pt-4 md:bottom-4">
        <Composer onSend={send} busy={busy} placeholder="Ask a follow-up question…" />
      </div>
    </div>
  );
}

function AnswerView({ payload, fallback, question, conversationId, onFollowUp }:
  { payload: ChatPayload | null; fallback: string; question: string; conversationId?: string; onFollowUp: (q: string) => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [deeper, setDeeper] = useState<DeeperPayload | null>(payload?.deeper ?? null);
  const [deeperBusy, setDeeperBusy] = useState(false);
  const [deeperError, setDeeperError] = useState<unknown>(null);

  if (!payload) return <div className="card p-5"><Paragraphs text={fallback} /></div>;

  if (payload.safety) {
    return (
      <div className="card border-gold/60 p-5">
        <div className="mb-3 flex items-center gap-2 text-accent"><LifeBuoy className="h-5 w-5" /><span className="font-semibold">You deserve support right now</span></div>
        <p>{payload.answer}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {payload.resources?.map((r) => <li key={r.name} className="rounded-xl bg-muted p-3"><span className="font-semibold">{r.name}: </span>{r.detail}</li>)}
        </ul>
        {payload.passages.map((p) => <div key={p.reference} className="mt-4"><PassageCard passage={p} /></div>)}
      </div>
    );
  }

  const goDeeper = async () => {
    if (deeperBusy) return;
    setDeeperBusy(true);
    setDeeperError(null);
    try {
      setDeeper(await callFunction<DeeperPayload>('faithly-ai', { mode: 'deeper', question, answer: payload.answer, conversationId }));
    } catch (e) {
      setDeeperError(e);
    } finally {
      setDeeperBusy(false);
    }
  };

  const savePrayer = async () => {
    if (!user || !payload.prayer) return;
    const { error } = await supabase.from('prayer_entries').insert({ user_id: user.id, category: 'custom', title: question.slice(0, 120), content: payload.prayer, is_ai_generated: true });
    toast(error ? 'Could not save prayer.' : 'Prayer saved to your prayers', error ? 'error' : 'info');
  };

  const listen = () => {
    narrator.load('Faithly answer', [payload.answer, ...payload.passages.map((p) => `${p.reference}. ${p.verses.map((v) => v.text).join(' ')}`), payload.explanation ?? '', payload.reflection ?? '']);
    narrator.play(0);
  };

  return (
    <article className="card space-y-5 p-5">
      <div className="flex items-center justify-between">
        <AiLabel>Faithly AI</AiLabel>
        <button onClick={listen} className="rounded-full p-2 text-subtle hover:bg-muted" aria-label="Listen to this answer"><Volume2 className="h-4 w-4" /></button>
      </div>
      <Paragraphs text={payload.answer} className="text-[15px] leading-relaxed" />

      {payload.passages.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-sans text-sm font-semibold">Scripture</h3>
          {payload.passages.map((p) => <PassageCard key={p.reference} passage={p} />)}
        </section>
      )}
      {payload.unverified_references && payload.unverified_references.length > 0 && (
        <p className="text-xs text-subtle">Faithly left out {payload.unverified_references.length} reference(s) it could not verify in the Bible text.</p>
      )}

      {payload.explanation && <Section title="What this means"><Paragraphs text={payload.explanation} /></Section>}
      {payload.context && <Section title="Background"><Paragraphs text={payload.context} /></Section>}
      {payload.interpretations && <Section title="How Christians understand this"><Paragraphs text={payload.interpretations} /></Section>}
      {payload.reflection && <Section title="For reflection"><Paragraphs text={payload.reflection} /></Section>}
      {payload.prayer && (
        <section className="rounded-2xl bg-muted/70 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-sans text-sm font-semibold">A suggested prayer</h3>
            <button onClick={savePrayer} className="chip text-xs hover:bg-surface"><BookmarkPlus className="h-3.5 w-3.5" />Save</button>
          </div>
          <p className="mt-2 font-scripture italic">{payload.prayer}</p>
        </section>
      )}

      {payload.follow_ups.length > 0 && (
        <section>
          <h3 className="mb-2 font-sans text-sm font-semibold">Keep exploring</h3>
          <div className="flex flex-wrap gap-2">
            {payload.follow_ups.map((q) => <button key={q} onClick={() => onFollowUp(q)} className="chip text-left text-sm hover:bg-muted">{q}</button>)}
          </div>
        </section>
      )}

      {!deeper && (
        <button onClick={goDeeper} disabled={deeperBusy} className="btn-secondary w-full"><Layers3 className="h-4 w-4" />{deeperBusy ? 'Going deeper…' : 'Go deeper'}</button>
      )}
      {deeperError != null && <AiError error={deeperError} onRetry={goDeeper} />}
      {deeper && (
        <section className="space-y-4 border-t border-line pt-4">
          <AiLabel>Go deeper</AiLabel>
          {deeper.historical_context && <Section title="Historical context"><Paragraphs text={deeper.historical_context} /></Section>}
          {deeper.related_passages.length > 0 && (
            <section className="space-y-3"><h3 className="font-sans text-sm font-semibold">Related passages</h3>
              {deeper.related_passages.map((p) => <PassageCard key={p.reference} passage={p} compact />)}
            </section>
          )}
          {deeper.interpretations && <Section title="Interpretations"><Paragraphs text={deeper.interpretations} /></Section>}
          {deeper.application && <Section title="Practical application"><Paragraphs text={deeper.application} /></Section>}
          {deeper.follow_ups.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {deeper.follow_ups.map((q) => <button key={q} onClick={() => onFollowUp(q)} className="chip text-left text-sm hover:bg-muted">{q}</button>)}
            </div>
          )}
        </section>
      )}
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 font-sans text-sm font-semibold">{title}</h3>
      <div className="text-[15px] leading-relaxed text-subtle">{children}</div>
    </section>
  );
}
