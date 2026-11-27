import { supabase } from '@/lib/supabase';

// The limits and spoiler rules are enforced by the database
// (supabase/migrations/20261127120000_book_clubs.sql); this file only reads and writes.

export interface Club {
  id: string;
  name: string;
  book_slug: string;
  owner_id: string;
  invite_code: string;
  next_meeting_at: string | null;
  read_to_chapter: number | null;
  meeting_note: string | null;
  created_at: string;
}

export interface ClubMember {
  club_id: string;
  user_id: string;
  display_name: string;
  role: 'owner' | 'member';
  current_chapter: number;
  joined_at: string;
}

export interface ClubPost {
  id: string;
  club_id: string;
  user_id: string;
  chapter: number;
  body: string;
  created_at: string;
}

export interface ClubSummary extends Club {
  members: number;
  myRole: 'owner' | 'member';
  myChapter: number;
}

export interface ClubLimits { premium: boolean; max_clubs: number; max_members: number; owned: number }
export interface InvitePreview { name: string; book_slug: string; host: string; members: number; cap: number }

const MESSAGES: Record<string, string> = {
  club_limit: "You've reached your club limit. Premium readers can run up to 5 clubs of 12 people.",
  club_full: 'This club is full. Ask the host about room, or start your own club.',
  invite_not_found: "That invite link doesn't work. Check it with whoever sent it.",
  sign_in_required: 'Please sign in first.',
  invalid_name: 'Give the club a name of up to 60 characters.',
  invalid_display_name: 'Choose a name of up to 40 characters for the club to see.',
  invalid_book: 'Choose a book for the club.',
};

function friendly(error: { message?: string } | null): Error {
  const code = Object.keys(MESSAGES).find(k => error?.message?.includes(k));
  return new Error(code ? MESSAGES[code] : error?.message || 'Something went wrong. Please try again.');
}

async function myId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error(MESSAGES.sign_in_required);
  return user.id;
}

/** Accepts a full invite link or just the code. */
export function inviteCodeFrom(input: string): string {
  const m = input.trim().match(/([a-z0-9]{6,20})\/?$/i);
  return m ? m[1].toLowerCase() : input.trim().toLowerCase();
}

export const ClubService = {
  async limits(): Promise<ClubLimits> {
    const { data, error } = await supabase.rpc('my_club_limits');
    if (error) throw friendly(error);
    return data as ClubLimits;
  },

  async myClubs(): Promise<ClubSummary[]> {
    const me = await myId();
    const { data: mine, error } = await supabase.from('club_members').select('club_id, role, current_chapter').eq('user_id', me);
    if (error) throw friendly(error);
    if (!mine?.length) return [];
    const ids = mine.map(m => m.club_id);
    const [{ data: clubs, error: e2 }, { data: everyone, error: e3 }] = await Promise.all([
      supabase.from('clubs').select('*').in('id', ids).order('created_at', { ascending: false }),
      supabase.from('club_members').select('club_id').in('club_id', ids),
    ]);
    if (e2 || e3) throw friendly(e2 || e3);
    return (clubs as Club[]).map(c => {
      const m = mine.find(x => x.club_id === c.id)!;
      return { ...c, members: everyone!.filter(x => x.club_id === c.id).length, myRole: m.role, myChapter: m.current_chapter };
    });
  },

  async create(name: string, bookSlug: string, displayName: string): Promise<{ id: string; invite_code: string }> {
    const { data, error } = await supabase.rpc('create_club', { p_name: name, p_book_slug: bookSlug, p_display_name: displayName });
    if (error) throw friendly(error);
    return data as { id: string; invite_code: string };
  },

  async preview(code: string): Promise<InvitePreview | null> {
    const { data, error } = await supabase.rpc('club_invite_preview', { p_code: code });
    if (error) throw friendly(error);
    return (data as InvitePreview) ?? null;
  },

  async join(code: string, displayName: string): Promise<string> {
    const { data, error } = await supabase.rpc('join_club', { p_code: code, p_display_name: displayName });
    if (error) throw friendly(error);
    return data as string;
  },

  async get(id: string): Promise<{ club: Club; members: ClubMember[] } | null> {
    const [{ data: club, error }, { data: members, error: e2 }] = await Promise.all([
      supabase.from('clubs').select('*').eq('id', id).maybeSingle(),
      supabase.from('club_members').select('*').eq('club_id', id).order('joined_at'),
    ]);
    if (error || e2) throw friendly(error || e2);
    return club ? { club: club as Club, members: (members ?? []) as ClubMember[] } : null;
  },

  /** Only the comments up to the reader's own chapter come back (the database filters the rest). */
  async posts(clubId: string): Promise<ClubPost[]> {
    const { data, error } = await supabase.from('club_posts').select('*').eq('club_id', clubId)
      .order('chapter').order('created_at');
    if (error) throw friendly(error);
    return (data ?? []) as ClubPost[];
  },

  /** Counts of comments in chapters the reader hasn't reached yet. */
  async waiting(clubId: string): Promise<{ chapter: number; comments: number }[]> {
    const { data, error } = await supabase.rpc('club_waiting_comments', { p_club: clubId });
    if (error) throw friendly(error);
    return ((data ?? []) as { chapter: number; comments: number }[]).map(r => ({ chapter: Number(r.chapter), comments: Number(r.comments) }));
  },

  async addPost(clubId: string, chapter: number, body: string): Promise<void> {
    const me = await myId();
    const { error } = await supabase.from('club_posts').insert({ club_id: clubId, user_id: me, chapter, body: body.trim() });
    if (error) throw friendly(error.message.includes('row-level security') ? { message: "You can only comment on chapters you've reached." } : error);
  },

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase.from('club_posts').delete().eq('id', id);
    if (error) throw friendly(error);
  },

  async setMyChapter(clubId: string, chapter: number): Promise<void> {
    const me = await myId();
    const { error } = await supabase.from('club_members').update({ current_chapter: chapter }).eq('club_id', clubId).eq('user_id', me);
    if (error) throw friendly(error);
  },

  async updateMeeting(clubId: string, fields: Pick<Club, 'next_meeting_at' | 'read_to_chapter' | 'meeting_note'>): Promise<void> {
    const { error } = await supabase.from('clubs').update(fields).eq('id', clubId);
    if (error) throw friendly(error);
  },

  async leave(clubId: string): Promise<void> {
    const me = await myId();
    const { error } = await supabase.from('club_members').delete().eq('club_id', clubId).eq('user_id', me);
    if (error) throw friendly(error);
  },

  async removeMember(clubId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('club_members').delete().eq('club_id', clubId).eq('user_id', userId);
    if (error) throw friendly(error);
  },

  async deleteClub(clubId: string): Promise<void> {
    const { error } = await supabase.from('clubs').delete().eq('id', clubId);
    if (error) throw friendly(error);
  },
};
