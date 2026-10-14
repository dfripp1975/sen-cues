import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when the app has the public Supabase settings it needs to run. */
export const isConfigured = Boolean(url && anonKey && !url.includes('your-project-ref'));

// The anon key is public by design; Row Level Security protects every table.
export const supabase: SupabaseClient = isConfigured
  ? createClient(url!, anonKey!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : (null as unknown as SupabaseClient);

export const googleAuthEnabled = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true';
