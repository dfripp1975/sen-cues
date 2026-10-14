import { ApiError } from '../lib/api';
import { ErrorNote, PremiumNotice, SetupNotice } from './ui';

/** Renders the right state for an AI/API failure — never a fake answer. */
export function AiError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (error instanceof ApiError) {
    if (error.code === 'ai_not_configured') {
      return <SetupNotice title="Faithly AI is not set up yet">{error.message} See “AI setup” in the README.</SetupNotice>;
    }
    if (error.code === 'function_missing') {
      return <SetupNotice title="Server function not deployed">{error.message} Run <code>supabase functions deploy</code> (see README).</SetupNotice>;
    }
    if (error.code === 'premium_required') return <PremiumNotice>{error.message}</PremiumNotice>;
    if (error.code === 'limit_reached') {
      return error.extra.premium ? <ErrorNote>{error.message}</ErrorNote> : <PremiumNotice>{error.message}</PremiumNotice>;
    }
    return <ErrorNote onRetry={onRetry}>{error.message}</ErrorNote>;
  }
  return <ErrorNote onRetry={onRetry}>Something went wrong. Please try again.</ErrorNote>;
}
