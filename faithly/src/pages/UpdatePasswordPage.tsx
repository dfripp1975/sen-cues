import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ErrorNote } from '../components/ui';
import { useToast } from '../context/ToastContext';

/** Landing page for the password-reset email link (Supabase signs the user in first). */
export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const toast = useToast();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Your password needs at least 8 characters.');
    if (password !== confirm) return setError('The passwords do not match.');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    toast('Your password has been updated.');
    nav('/');
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <form onSubmit={submit} className="card space-y-4 p-7">
        <h1 className="text-2xl font-semibold">Choose a new password</h1>
        <div>
          <label htmlFor="np" className="label">New password</label>
          <input id="np" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </div>
        <div>
          <label htmlFor="cp" className="label">Confirm password</label>
          <input id="cp" type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
      </form>
    </div>
  );
}
