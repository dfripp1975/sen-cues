import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { supabase } from '@/lib/supabase';

export function ContactPage() {
  useSEO({
    title: 'Contact | The Book Club For One',
    description: 'Get in touch with The Book Club For One. We welcome feedback, suggestions, and questions.',
    canonical: `${window.location.origin}/contact`,
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setError(true);
      return;
    }
    setSubmitting(true);
    setError(false);
    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({ name, email, message });
    setSubmitting(false);
    if (dbError) {
      setError(true);
      return;
    }
    setSent(true);
    setName(''); setEmail(''); setMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Contact' }]} />
      <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4">Contact Us</h1>
      <p className="text-warmgrey dark:text-dark-sub mb-8">We welcome feedback, suggestions, bug reports, and questions. Send us a message and we will get back to you as soon as we can.</p>
      <p className="text-warmgrey dark:text-dark-sub mb-8">
        Prefer email? Write to{' '}
        <a href="mailto:dfripp@gmail.com" className="font-semibold text-forest-500 dark:text-dark-sage hover:underline">
          dfripp@gmail.com
        </a>.
      </p>

      {sent && (
        <div className="card mb-6 flex items-center gap-2 bg-sage-50 dark:bg-forest-700">
          <CheckCircle className="w-5 h-5 text-sage-500 dark:text-dark-sage" />
          <p className="text-sage-600 dark:text-dark-sage">Thank you for your message! We will be in touch soon.</p>
        </div>
      )}
      {error && (
        <div className="card mb-6 flex items-center gap-2 bg-terracotta-50 dark:bg-terracotta-900">
          <AlertCircle className="w-5 h-5 text-terracotta-500" />
          <p className="text-terracotta-600 dark:text-dark-terra">Something went wrong. Please try again or email us directly at dfripp@gmail.com.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input-field min-h-[150px]" placeholder="Your message..." />
        </div>
        <button type="submit" disabled={submitting} className="btn-accent w-full disabled:opacity-60">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          {submitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}
