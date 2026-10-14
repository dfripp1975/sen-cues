import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isConfigured } from '../lib/supabase';
import type { Preferences, Profile, Subscription } from '../lib/types';
import { narrator } from '../lib/speech';

interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  prefs: Preferences | null;
  subscription: Subscription | null;
  isPremium: boolean;
  refresh: () => Promise<void>;
  updatePrefs: (patch: Partial<Preferences>) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function applyTheme(theme: 'system' | 'light' | 'dark') {
  try {
    localStorage.setItem('faithly-theme', theme);
  } catch { /* storage unavailable */ }
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const load = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      setPrefs(null);
      setSubscription(null);
      return;
    }
    const uid = s.user.id;
    const [p, pr, sub] = await Promise.all([
      supabase.from('profiles').select('id, display_name, is_admin, onboarding_completed').eq('id', uid).maybeSingle(),
      supabase.from('user_preferences').select('*').eq('user_id', uid).maybeSingle(),
      supabase.from('subscriptions').select('plan, status, current_period_end, cancel_at_period_end, provider').eq('user_id', uid).maybeSingle(),
    ]);
    setProfile(p.data as Profile | null);
    setPrefs(pr.data as Preferences | null);
    setSubscription(sub.data as Subscription | null);
    if (pr.data) {
      applyTheme(pr.data.theme);
      document.documentElement.style.setProperty('--font-scale', String(pr.data.font_scale ?? 1));
      narrator.rate = Number(pr.data.tts_rate ?? 1);
      narrator.voiceName = pr.data.tts_voice;
    }
    // Record today's activity once per day (used for retention analytics only).
    const key = `faithly-active-${uid}`;
    const today = new Date().toDateString();
    try {
      if (localStorage.getItem(key) !== today) {
        await supabase.rpc('touch_activity');
        localStorage.setItem(key, today);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await load(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // Defer: calling Supabase inside this callback can deadlock the auth client.
        setTimeout(() => load(s), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const refresh = useCallback(() => load(session), [load, session]);

  const updatePrefs = useCallback(async (patch: Partial<Preferences>) => {
    if (!session) return;
    const { data, error } = await supabase.from('user_preferences').update(patch).eq('user_id', session.user.id).select('*').single();
    if (error) throw error;
    setPrefs(data as Preferences);
    if (patch.theme) applyTheme(patch.theme);
    if (patch.font_scale) document.documentElement.style.setProperty('--font-scale', String(patch.font_scale));
  }, [session]);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    if (!session) return;
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', session.user.id).select('id, display_name, is_admin, onboarding_completed').single();
    if (error) throw error;
    setProfile(data as Profile);
  }, [session]);

  const signOut = useCallback(async () => {
    narrator.stop();
    await supabase.auth.signOut();
  }, []);

  const isPremium = !!subscription && ['active', 'trialing'].includes(subscription.status) &&
    (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());

  const value = useMemo<AuthState>(() => ({
    loading, session, user: session?.user ?? null, profile, prefs, subscription, isPremium,
    refresh, updatePrefs, updateProfile, signOut,
  }), [loading, session, profile, prefs, subscription, isPremium, refresh, updatePrefs, updateProfile, signOut]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
