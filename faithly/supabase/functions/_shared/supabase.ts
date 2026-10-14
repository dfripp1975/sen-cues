import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2.45.4';

/** Service-role client. Bypasses RLS — only use after checking who the caller is. */
export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Resolve the signed-in user from the request's Authorization header, or null. */
export async function getUser(req: Request): Promise<User | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const { data, error } = await adminClient().auth.getUser(auth.slice(7));
  if (error || !data.user) return null;
  return data.user;
}

export async function isPremium(db: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await db.rpc('is_premium', { uid: userId });
  return data === true;
}
