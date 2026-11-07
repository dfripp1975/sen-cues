import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useAuth } from '@/lib/auth';

export function SignInPage() {
  useSEO({
    title: 'Sign In | The Book Club For One',
    description: 'Sign in to your account to save books, track reading progress, and more.',
    canonical: `${window.location.origin}/signin`,
  });

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      navigate('/library');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-forest-500 dark:bg-forest-400 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-ivory dark:text-dark-bg" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-forest-500 dark:text-dark-sage">Welcome Back</h1>
        <p className="text-warmgrey dark:text-dark-sub mt-2">Sign in to access your library and reading progress.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-terracotta-50 dark:bg-terracotta-900 text-terracotta-600 dark:text-dark-terra text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <p className="text-center text-sm text-warmgrey dark:text-dark-sub">
          Don't have an account? <Link to="/signup" className="link-internal">Create one</Link>
        </p>
      </form>
    </div>
  );
}
