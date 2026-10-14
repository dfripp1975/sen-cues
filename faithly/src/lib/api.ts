import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export class ApiError extends Error {
  constructor(public code: string, message: string, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

/**
 * Call a Supabase Edge Function. The user's access token is sent automatically.
 * Errors are normalised to ApiError with a stable `code` the UI can switch on
 * (e.g. ai_not_configured, limit_reached, premium_required).
 */
export async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body: body as Record<string, unknown> });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const payload = await error.context.json();
        const e = payload?.error;
        if (e?.code) throw new ApiError(e.code, e.message, e);
      } catch (inner) {
        if (inner instanceof ApiError) throw inner;
      }
      const status = (error.context as Response).status;
      if (status === 404) throw new ApiError('function_missing', `The "${name}" server function is not deployed yet.`);
      throw new ApiError('server_error', 'Something went wrong. Please try again.');
    }
    throw new ApiError('network', 'Could not reach Faithly. Check your connection and try again.');
  }
  return data as T;
}
