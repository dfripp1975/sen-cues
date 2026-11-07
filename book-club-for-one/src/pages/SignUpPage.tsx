import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useAuth } from '@/lib/auth';

export function SignUpPage() {
  useSEO({
    title: 'Create Account | The Book Club For One',
    description: 'Create a free account to save books, track reading progress, and build your personal library.',
    canonical: `${window.location.origin}/signup`,
  });

  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/library'), 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-forest-500 dark:bg-forest-400 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-ivory dark:text-dark-bg" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-forest-500 dark:text-dark-sage">Create Your Account</h1>
        <p className="text-warmgrey dark:text-dark-sub mt-2">Save books, track progress, and build your personal book club.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-terracotta-50 dark:bg-terracotta-900 text-terracotta-600 dark:text-dark-terra text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-sage-50 dark:bg-forest-700 text-sage-600 dark:text-dark-sage text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Account created! Redirecting to your library...
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="input-field" placeholder="At least 6 characters" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
        <p className="text-center text-sm text-warmgrey dark:text-dark-sub">
          Already have an account? <Link to="/signin" className="link-internal">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
