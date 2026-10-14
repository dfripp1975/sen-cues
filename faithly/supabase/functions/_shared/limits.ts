import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.45.4';

// Daily AI request allowances. Kept in one place so the app can display them honestly.
export const DAILY_LIMIT_FREE = Number(Deno.env.get('AI_DAILY_LIMIT_FREE') ?? 10);
export const DAILY_LIMIT_PREMIUM = Number(Deno.env.get('AI_DAILY_LIMIT_PREMIUM') ?? 100);

export async function usedToday(db: SupabaseClient, userId: string): Promise<number> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count } = await db
    .from('usage_tracking')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());
  return count ?? 0;
}

// Approximate list prices in USD per million tokens; override with env vars if your rates differ.
export function estimateCostUsd(provider: string, inputTokens: number, outputTokens: number): number {
  const inPrice = Number(Deno.env.get(`${provider.toUpperCase()}_INPUT_PRICE_PER_M`) ?? (provider === 'openai' ? 0.15 : 0.3));
  const outPrice = Number(Deno.env.get(`${provider.toUpperCase()}_OUTPUT_PRICE_PER_M`) ?? (provider === 'openai' ? 0.6 : 2.5));
  return (inputTokens * inPrice + outputTokens * outPrice) / 1_000_000;
}
