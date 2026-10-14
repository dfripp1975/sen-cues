import { useState, type FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { supabase, googleAuthEnabled } from '../lib/supabase';
import { ErrorNote } from '../components/ui';
import { Sprig } from '../components/Landscape';

type Mode = 'sign-in' | 'sign-up' | 'reset';
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function AuthPage() {
  const { mode = 'sign-in' } = useParams<{ mode: Mode }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!['sign-in', 'sign-up', 'reset'].includes(mode)) return <Navigate to="/auth/sign-in" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!emailOk(email)) return setError('Please enter a valid email address.');
    if (mode !== 'reset' && password.length < 8) return setError('Your password needs at least 8 characters.');
    if (mode === 'sign-up' && !agree) return setError('Please agree to the Terms and Privacy Policy to continue.');
    setBusy(true);
    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'sign-up') {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { display_name: name.trim().slice(0, 60) }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setInfo('Check your email to confirm your account, then sign in.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/update-password` });
        if (error) throw error;
        setInfo('If an account exists for that email, a reset link is on its way.');
      }
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg === 'Invalid login credentials' ? 'That email and password do not match. Please try again.' : msg);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) setError(error.message);
  };

  const titles: Record<Mode, string> = { 'sign-in': 'Welcome back', 'sign-up': 'Create your account', reset: 'Reset your password' };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <Link to="/welcome" className="mb-8 flex items-center gap-2 self-center">
        <Sprig className="h-7 w-7 text-accent" /><span className="font-serif text-2xl font-semibold text-accent">Faithly</span>
      </Link>
      <div className="card p-7">
        <h1 className="text-2xl font-semibold">{titles[mode]}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {mode === 'sign-up' && (
            <div>
              <label htmlFor="name" className="label">First name <span className="font-normal text-subtle">(optional)</span></label>
              <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" maxLength={60} />
            </div>
          )}
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          {mode !== 'reset' && (
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} minLength={8} required />
              {mode === 'sign-up' && <p className="mt-1 text-xs text-subtle">At least 8 characters.</p>}
            </div>
          )}
          {mode === 'sign-up' && (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 accent-forest" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>I agree to the <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.</span>
            </label>
          )}
          {error && <ErrorNote>{error}</ErrorNote>}
          {info && <p className="rounded-xl bg-sage/20 p-3 text-sm" role="status">{info}</p>}
          <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : mode === 'sign-up' ? 'Create account' : 'Send reset link'}
          </button>
        </form>
        {googleAuthEnabled && mode !== 'reset' && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-subtle"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
            <button onClick={google} className="btn-secondary w-full py-3">Continue with Google</button>
          </>
        )}
        <div className="mt-6 space-y-2 text-center text-sm">
          {mode === 'sign-in' && (
            <>
              <p><Link to="/auth/reset" className="text-accent underline">Forgotten your password?</Link></p>
              <p>New to Faithly? <Link to="/auth/sign-up" className="font-semibold text-accent underline">Create an account</Link></p>
            </>
          )}
          {mode !== 'sign-in' && <p><Link to="/auth/sign-in" className="text-accent underline">Back to sign in</Link></p>}
        </div>
      </div>
    </div>
  );
}
