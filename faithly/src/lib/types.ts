export interface Verse { verse: number; text: string }

export interface VerifiedPassage {
  reference: string;
  bookId: number;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  translation: string;
  verses: Verse[];
  note?: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  is_admin: boolean;
  onboarding_completed: boolean;
}

export interface Preferences {
  user_id: string;
  reasons: string[];
  focus_areas: string[];
  bible_familiarity: string | null;
  daily_minutes: number | null;
  translation_code: string;
  wants_reminders: boolean | null;
  tradition: string | null;
  theme: 'system' | 'light' | 'dark';
  font_scale: number;
  new_to_christianity: boolean;
  ai_memory_enabled: boolean;
  ai_memory: string;
  tts_voice: string | null;
  tts_rate: number;
}

export interface Subscription {
  plan: 'monthly' | 'yearly' | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  provider: string;
}

export interface ChatPayload {
  answer: string;
  passages: VerifiedPassage[];
  unverified_references?: string[];
  explanation?: string;
  context?: string;
  interpretations?: string;
  reflection?: string;
  prayer?: string;
  follow_ups: string[];
  safety?: boolean;
  resources?: { name: string; detail: string }[];
  deeper?: DeeperPayload;
  conversationId?: string;
  usage?: { used: number; limit: number };
}

export interface DeeperPayload {
  historical_context: string;
  related_passages: VerifiedPassage[];
  interpretations: string;
  application: string;
  follow_ups: string[];
}

export interface JourneyDay {
  id: string;
  journey_id: string;
  day_number: number;
  theme: string;
  book_id: number;
  chapter: number;
  verse_start: number;
  verse_end: number;
  explanation: string;
  reflection_question: string;
  activity: string;
  prayer: string;
  journal_prompt: string;
}

export interface Journey {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  day_count: number;
  focus_tags: string[];
  is_premium: boolean;
}

export interface JourneyProgress {
  id: string;
  journey_id: string;
  status: 'active' | 'paused' | 'completed';
  completed_days: number[];
  started_at: string;
  last_activity_at: string;
}

export interface Devotional {
  id: string;
  slug: string;
  title: string;
  book_id: number;
  chapter: number;
  verse_start: number;
  verse_end: number;
  reflection: string;
  takeaway: string;
  reflection_question: string;
  prayer: string;
  focus_tags: string[];
  is_premium: boolean;
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  title: string;
  body: string;
  scripture_refs: string[];
  mood: string | null;
  is_prayer: boolean;
  prayer_status: 'praying' | 'reflected' | 'answered' | null;
  journey_id: string | null;
  journey_day: number | null;
  created_at: string;
}

export interface PrayerEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  is_ai_generated: boolean;
  is_favourite: boolean;
  reflection: string;
  status: 'praying' | 'reflected' | 'answered';
  created_at: string;
}
