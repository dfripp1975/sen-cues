import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BookOpen, CalendarDays, Copy, Check, EyeOff, Loader2, Lock, Trash2, Users, LogOut, Send } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useAuth } from '@/lib/auth';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BookCover } from '@/components/BookCover';
import { getBookBySlug } from '@/data/books';
import { ClubService, type Club, type ClubMember, type ClubPost } from '@/services/ClubService';

const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
const shortFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
// <input type="datetime-local"> wants local time without a zone
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
function savedReaderChapter(slug: string): number | null {
  try { const v = JSON.parse(localStorage.getItem(`reading:${slug}`) || 'null'); return typeof v?.chapter === 'number' ? v.chapter : null; } catch { return null; }
}

export function ClubPage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [waiting, setWaiting] = useState<{ chapter: number; comments: number }[]>([]);
  const [cap, setCap] = useState<number | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [postChapter, setPostChapter] = useState(1);
  const [posting, setPosting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState<null | 'leave' | 'delete' | { remove: ClubMember }>(null);
  const [meeting, setMeeting] = useState({ at: '', to: '', note: '' });
  const [editingMeeting, setEditingMeeting] = useState(false);
  const isNew = params.get('new') === '1';

  useSEO({ title: `${club?.name ?? 'Book club'} | The Book Club For One`, description: 'A private book club.', canonical: `${window.location.origin}/clubs` });

  const me = members.find(m => m.user_id === user?.id);
  const isHost = !!club && club.owner_id === user?.id;
  const book = club ? getBookBySlug(club.book_slug) : undefined;
  const totalChapters = Math.max(1, book?.chapters || 1);
  const names = useMemo(() => Object.fromEntries(members.map(m => [m.user_id, m.display_name])), [members]);

  const load = useCallback(async () => {
    try {
      const got = await ClubService.get(id);
      if (!got) { setState('missing'); return; }
      setClub(got.club); setMembers(got.members);
      const [p, w, prev] = await Promise.all([ClubService.posts(id), ClubService.waiting(id), ClubService.preview(got.club.invite_code)]);
      setPosts(p); setWaiting(w); setCap(prev?.cap ?? null);
      setMeeting({ at: toLocalInput(got.club.next_meeting_at), to: got.club.read_to_chapter ? String(got.club.read_to_chapter) : '', note: got.club.meeting_note ?? '' });
      setState('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the club'); setState('ready');
    }
  }, [id]);

  useEffect(() => { if (user) load(); }, [user, load]);
  useEffect(() => { if (me) setPostChapter(me.current_chapter); }, [me?.current_chapter]); // eslint-disable-line react-hooks/exhaustive-deps

  const inviteUrl = club ? `${window.location.origin}/clubs/join/${club.invite_code}` : '';
  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(inviteUrl); } catch { /* fall back to the visible, selectable link */ }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const setMyChapter = async (n: number) => {
    setError(null);
    try { await ClubService.setMyChapter(id, n); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not update'); }
  };

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setPosting(true); setError(null);
    try { await ClubService.addPost(id, postChapter, draft); setDraft(''); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not post'); }
    setPosting(false);
  };

  const saveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ClubService.updateMeeting(id, {
        next_meeting_at: meeting.at ? new Date(meeting.at).toISOString() : null,
        read_to_chapter: meeting.to ? Number(meeting.to) : null,
        meeting_note: meeting.note.trim() || null,
      });
      setEditingMeeting(false); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save'); }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm === 'leave') { await ClubService.leave(id); navigate('/clubs'); return; }
      if (confirm === 'delete') { await ClubService.deleteClub(id); navigate('/clubs'); return; }
      await ClubService.removeMember(id, confirm.remove.user_id); setConfirm(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong'); }
  };

  if (!authLoading && !user) {
    return (
      <div className="container-page max-w-xl py-24 text-center">
        <h1 className="font-serif text-display-md text-forest-500 dark:text-dark-text">Sign in to see this club</h1>
        <Link to={`/signin?redirect=${encodeURIComponent(`/clubs/${id}`)}`} className="btn-primary mt-8">Sign in</Link>
      </div>
    );
  }
  if (state === 'loading') return <div className="container-page max-w-5xl py-24 text-warmgrey"><Loader2 className="inline h-5 w-5 animate-spin" /> Opening the club…</div>;
  if (state === 'missing' || !club) {
    return (
      <div className="container-page max-w-xl py-24 text-center">
        <h1 className="font-serif text-display-md text-forest-500 dark:text-dark-text">This club isn’t available</h1>
        <p className="mt-4 text-warmgrey dark:text-dark-sub">You may not be a member, or the host may have closed it.</p>
        <Link to="/clubs" className="btn-primary mt-8">Your book clubs</Link>
      </div>
    );
  }

  const myChapter = me?.current_chapter ?? 1;
  const readerChapter = book ? savedReaderChapter(book.slug) : null;
  const byChapter = posts.reduce<Record<number, ClubPost[]>>((acc, p) => { (acc[p.chapter] ||= []).push(p); return acc; }, {});
  const chapters = Object.keys(byChapter).map(Number).sort((a, b) => b - a);
  const sortedMembers = [...members].sort((a, b) => (a.user_id === user?.id ? -1 : b.user_id === user?.id ? 1 : b.current_chapter - a.current_chapter));

  return (
    <div className="container-page max-w-6xl py-10 md:py-14">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Book clubs', to: '/clubs' }, { label: club.name }]} />

      {isNew && (
        <div className="mb-8 rounded-2xl border border-sage-200 bg-sage-50 p-5 dark:border-dark-border dark:bg-white/[0.04]">
          <p className="font-serif text-xl text-forest-500 dark:text-dark-text">Your club is ready. Now invite a friend.</p>
          <p className="mt-1 text-sm text-warmgrey dark:text-dark-sub">Send them this link. Joining is free.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 select-all truncate rounded-lg bg-white px-3 py-2 text-sm dark:bg-dark-bg">{inviteUrl}</code>
            <button onClick={copyInvite} className="btn-primary text-sm">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy link'}</button>
            <button onClick={() => { const n = new URLSearchParams(params); n.delete('new'); setParams(n, { replace: true }); }} className="btn-ghost text-sm">Done</button>
          </div>
        </div>
      )}

      <header className="flex flex-wrap items-start gap-6">
        {book && <BookCover book={book} size="md" to={`/book/${book.slug}`} />}
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Book club</p>
          <h1 className="mt-2 font-serif text-display-lg text-forest-500 dark:text-dark-text">{club.name}</h1>
          <p className="mt-2 text-lg text-warmgrey dark:text-dark-sub">Reading {book ? <Link to={`/book/${book.slug}`} className="link-internal">{book.title}</Link> : club.book_slug}{book ? ` by ${book.author}` : ''}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {book?.readSlug && <Link to={`/read/${book.slug}`} className="btn-primary"><BookOpen className="h-4 w-4" /> Read the book</Link>}
            {book?.readSlug && !book.freeToRead && <span className="inline-flex items-center gap-1.5 text-sm text-warmgrey dark:text-dark-sub"><Lock className="h-4 w-4" /> Chapter 1 free; the rest with Premium</span>}
          </div>
        </div>
      </header>

      {error && <p className="mt-6 rounded-xl bg-terracotta-50 px-4 py-3 text-sm text-terracotta-600 dark:bg-terracotta-800/40 dark:text-dark-terra" role="alert">{error}</p>}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="where">
            <h2 id="where" className="font-serif text-display-md text-forest-500 dark:text-dark-text">Where everyone is</h2>
            <ul className="mt-5 space-y-3">
              {sortedMembers.map(m => (
                <li key={m.user_id} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3">
                  <span className="truncate font-medium text-charcoal dark:text-dark-text">
                    {m.user_id === user?.id ? 'You' : m.display_name}{m.role === 'owner' && <span className="ml-1.5 text-xs font-normal text-warmgrey">host</span>}
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-stone dark:bg-dark-border" aria-hidden="true">
                    <span className="block h-full rounded-full bg-forest-500 dark:bg-dark-sage" style={{ width: `${Math.min(100, (m.current_chapter / totalChapters) * 100)}%` }} />
                  </span>
                  <span className="text-sm tabular-nums text-warmgrey dark:text-dark-sub">Chapter {m.current_chapter}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-stone-light/70 p-4 dark:bg-white/[0.03]">
              <label htmlFor="my-chapter" className="text-sm font-semibold text-forest-500 dark:text-dark-sage">I’ve reached</label>
              <select id="my-chapter" value={myChapter} onChange={e => setMyChapter(Number(e.target.value))} className="input-field !w-auto !py-2">
                {Array.from({ length: totalChapters }, (_, i) => i + 1).map(n => <option key={n} value={n}>Chapter {n}</option>)}
              </select>
              {readerChapter && readerChapter !== myChapter && readerChapter <= totalChapters && (
                <button onClick={() => setMyChapter(readerChapter)} className="btn-ghost text-sm">Use chapter {readerChapter} from your reading</button>
              )}
            </div>
          </section>

          <section aria-labelledby="talk">
            <h2 id="talk" className="font-serif text-display-md text-forest-500 dark:text-dark-text">Discussion</h2>
            <p className="mt-2 text-sm text-warmgrey dark:text-dark-sub">You see comments up to chapter {myChapter}. Later ones stay hidden until you get there.</p>

            {waiting.length > 0 && (
              <p className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-stone-dark/70 px-4 py-3 text-sm text-charcoal dark:border-dark-border dark:text-dark-text" role="status">
                <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-terracotta-500" />
                <span>{waiting.map(w => `${w.comments} ${w.comments === 1 ? 'comment' : 'comments'} waiting at chapter ${w.chapter}`).join(' · ')}. {waiting.reduce((n, w) => n + w.comments, 0) === 1 ? 'It’ll appear when you reach it.' : waiting.length === 1 ? 'They’ll appear when you reach it.' : 'They’ll appear as you reach each chapter.'}</span>
              </p>
            )}

            <form onSubmit={post} className="mt-5 rounded-2xl border border-stone bg-ivory p-4 dark:border-dark-border dark:bg-dark-card">
              <label htmlFor="post-body" className="sr-only">Your comment</label>
              <textarea id="post-body" value={draft} onChange={e => setDraft(e.target.value)} maxLength={2000} rows={3} placeholder="What did you make of it?" className="input-field resize-y" />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label htmlFor="post-chapter" className="text-sm text-warmgrey dark:text-dark-sub">About</label>
                <select id="post-chapter" value={postChapter} onChange={e => setPostChapter(Number(e.target.value))} className="input-field !w-auto !py-2 text-sm">
                  {Array.from({ length: myChapter }, (_, i) => myChapter - i).map(n => <option key={n} value={n}>Chapter {n}</option>)}
                </select>
                <button type="submit" disabled={posting || !draft.trim()} className="btn-accent ml-auto text-sm">{posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Post</button>
              </div>
            </form>

            {chapters.length === 0 && <p className="mt-6 text-warmgrey dark:text-dark-sub">No comments yet. Start the conversation.</p>}
            <div className="mt-6 space-y-8">
              {chapters.map(ch => (
                <div key={ch}>
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-warmgrey dark:text-dark-sub">Chapter {ch}</h3>
                  <ul className="mt-3 space-y-3">
                    {byChapter[ch].map(p => (
                      <li key={p.id} className="rounded-2xl border border-stone bg-ivory px-4 py-3 dark:border-dark-border dark:bg-dark-card">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-medium text-charcoal dark:text-dark-text">{p.user_id === user?.id ? 'You' : names[p.user_id] ?? 'Former member'}</span>
                          <span className="flex items-center gap-2 text-xs text-warmgrey dark:text-dark-sub">
                            {shortFmt.format(new Date(p.created_at))}
                            {(p.user_id === user?.id || isHost) && (
                              <button onClick={async () => { await ClubService.deletePost(p.id).catch(e => setError(e.message)); load(); }} className="rounded p-1 hover:text-terracotta-600" aria-label="Delete comment"><Trash2 className="h-3.5 w-3.5" /></button>
                            )}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap leading-relaxed text-charcoal dark:text-dark-text">{p.body}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card" aria-labelledby="meet">
            <h2 id="meet" className="flex items-center gap-2 font-serif text-xl text-forest-500 dark:text-dark-text"><CalendarDays className="h-5 w-5" /> Next meeting</h2>
            {!editingMeeting ? (
              <>
                {club.next_meeting_at ? (
                  <p className="mt-3 text-charcoal dark:text-dark-text">{dateFmt.format(new Date(club.next_meeting_at))}</p>
                ) : <p className="mt-3 text-warmgrey dark:text-dark-sub">No meeting set yet.</p>}
                {club.read_to_chapter && <p className="mt-1 text-sm text-charcoal dark:text-dark-text">Read up to chapter {club.read_to_chapter}</p>}
                {club.meeting_note && <p className="mt-2 text-sm text-warmgrey dark:text-dark-sub">{club.meeting_note}</p>}
                {isHost && <button onClick={() => setEditingMeeting(true)} className="btn-outline mt-4 text-sm">{club.next_meeting_at ? 'Change' : 'Set a meeting'}</button>}
                {isHost && <Link to="/tools/book-club-schedule-generator" className="mt-3 block text-sm link-internal">Plan a reading schedule</Link>}
              </>
            ) : (
              <form onSubmit={saveMeeting} className="mt-3 space-y-3">
                <label className="block text-sm text-warmgrey">When<input type="datetime-local" value={meeting.at} onChange={e => setMeeting({ ...meeting, at: e.target.value })} className="input-field mt-1" /></label>
                <label className="block text-sm text-warmgrey">Read up to chapter<input type="number" min={1} max={totalChapters} value={meeting.to} onChange={e => setMeeting({ ...meeting, to: e.target.value })} className="input-field mt-1" /></label>
                <label className="block text-sm text-warmgrey">Note (where, or a link)<input value={meeting.note} onChange={e => setMeeting({ ...meeting, note: e.target.value })} maxLength={300} className="input-field mt-1" /></label>
                <div className="flex gap-2"><button className="btn-primary text-sm" type="submit">Save</button><button type="button" onClick={() => setEditingMeeting(false)} className="btn-ghost text-sm">Cancel</button></div>
              </form>
            )}
          </section>

          <section className="card" aria-labelledby="invite">
            <h2 id="invite" className="flex items-center gap-2 font-serif text-xl text-forest-500 dark:text-dark-text"><Users className="h-5 w-5" /> Invite friends</h2>
            <p className="mt-2 text-sm text-warmgrey dark:text-dark-sub">{members.length}{cap ? ` of ${cap}` : ''} places taken. Joining is free.</p>
            {cap && members.length >= cap ? (
              <p className="mt-3 text-sm text-charcoal dark:text-dark-text">The club is full.{isHost && cap < 12 && <> <Link to="/pricing" className="link-internal">Premium</Link> hosts can have 12.</>}</p>
            ) : (
              <>
                <code className="mt-3 block select-all break-all rounded-lg bg-stone-light/70 px-3 py-2 text-xs dark:bg-white/[0.04]">{inviteUrl}</code>
                <button onClick={copyInvite} className="btn-primary mt-3 w-full text-sm">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy invite link'}</button>
              </>
            )}
          </section>

          <section className="card" aria-labelledby="manage">
            <h2 id="manage" className="font-serif text-xl text-forest-500 dark:text-dark-text">Club settings</h2>
            {isHost && members.filter(m => m.user_id !== user?.id).length > 0 && (
              <ul className="mt-3 space-y-2 text-sm">
                {members.filter(m => m.user_id !== user?.id).map(m => (
                  <li key={m.user_id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{m.display_name}</span>
                    <button onClick={() => setConfirm({ remove: m })} className="btn-ghost !px-2 !py-1 text-xs">Remove</button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              {isHost
                ? <button onClick={() => setConfirm('delete')} className="btn-ghost text-sm text-terracotta-600"><Trash2 className="h-4 w-4" /> Close the club</button>
                : <button onClick={() => setConfirm('leave')} className="btn-ghost text-sm"><LogOut className="h-4 w-4" /> Leave the club</button>}
            </div>
            {confirm && (
              <div className="mt-3 rounded-xl bg-terracotta-50 p-3 text-sm text-charcoal dark:bg-terracotta-800/40 dark:text-dark-text" role="alert">
                <p>
                  {confirm === 'delete' ? 'Close the club for everyone? All comments are deleted.'
                    : confirm === 'leave' ? 'Leave this club? Your comments stay for the others.'
                    : `Remove ${confirm.remove.display_name} from the club?`}
                </p>
                <div className="mt-2 flex gap-2">
                  <button onClick={runConfirm} className="btn-accent !py-1.5 text-sm">Yes</button>
                  <button onClick={() => setConfirm(null)} className="btn-ghost !py-1.5 text-sm">Cancel</button>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
