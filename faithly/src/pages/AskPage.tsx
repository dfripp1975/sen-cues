import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/dates';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { SUGGESTED_QUESTIONS } from '../content/options';
import { Composer } from '../components/Composer';
import { PageHeader, Spinner } from '../components/ui';
import { Sprig } from '../components/Landscape';

interface Conv { id: string; title: string; updated_at: string }

export default function AskPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { isPremium } = useAuth();
  const [convs, setConvs] = useState<Conv[] | null>(null);
  const [usage, setUsage] = useState<number | null>(null);

  useEffect(() => {
    supabase.from('chat_conversations').select('id, title, updated_at').order('updated_at', { ascending: false }).limit(50)
      .then(({ data }) => setConvs(data ?? []));
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    supabase.from('usage_tracking').select('id', { count: 'exact', head: true }).gte('created_at', since.toISOString())
      .then(({ count }) => setUsage(count ?? 0));
  }, []);

  const ask = (q: string) => nav('/ask/new', { state: { question: q } });

  const remove = async (id: string) => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    const { error } = await supabase.from('chat_conversations').delete().eq('id', id);
    if (error) return toast('Could not delete conversation.', 'error');
    setConvs((c) => c?.filter((x) => x.id !== id) ?? null);
    toast('Conversation deleted');
  };

  const limit = isPremium ? 100 : 10;

  return (
    <div>
      <PageHeader title="Ask Faithly" subtitle="Explore Scripture and faith questions with an AI companion." />
      <div className="card mb-6 overflow-hidden">
        <div className="flex items-start gap-3 bg-gradient-to-br from-sage/25 to-transparent p-5">
          <Sprig className="h-10 w-10 shrink-0 text-accent" />
          <p className="text-sm text-subtle">
            Faithly is an AI, not a pastor or a divine voice. Bible passages are retrieved from the World English Bible and labelled as Scripture;
            everything else is AI commentary to help you think and pray. For personal or urgent matters, please talk to someone you trust.
          </p>
        </div>
        <div className="p-4">
          <Composer onSend={ask} autoFocus={false} />
          {usage != null && (
            <p className="mt-2 px-2 text-xs text-subtle">
              {Math.max(0, limit - usage)} of {limit} AI requests left today{!isPremium && <> · <Link to="/premium" className="underline">Premium gives 100 a day</Link></>}
            </p>
          )}
        </div>
      </div>

      <h2 className="eyebrow mb-3">Try asking</h2>
      <div className="mb-8 flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((q) => <button key={q} onClick={() => ask(q)} className="chip bg-surface text-left hover:bg-muted">{q}</button>)}
      </div>

      <h2 className="eyebrow mb-3">Your conversations</h2>
      {!convs && <Spinner />}
      {convs?.length === 0 && <p className="text-sm text-subtle">Your conversations will appear here. They're private to you, and you can delete them at any time.</p>}
      {convs && convs.length > 0 && (
        <ul className="card divide-y divide-line">
          {convs.map((c) => (
            <li key={c.id} className="flex items-center">
              <Link to={`/ask/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3 px-5 py-4 hover:bg-muted/50">
                <MessageCircle className="h-5 w-5 shrink-0 text-accent" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.title}</p>
                  <p className="text-xs text-subtle">{formatDate(c.updated_at)}</p>
                </div>
              </Link>
              <button onClick={() => remove(c.id)} className="mr-3 rounded-full p-2 text-subtle hover:bg-muted hover:text-red-700" aria-label={`Delete conversation ${c.title}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
