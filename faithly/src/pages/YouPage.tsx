import { Link } from 'react-router-dom';
import { Bookmark, ChevronRight, Crown, HandHeart, Headphones, Image as ImageIcon, LogOut, NotebookPen, Puzzle, Settings, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui';

export default function YouPage() {
  const { profile, user, isPremium, signOut } = useAuth();
  const items = [
    { to: '/you/journal', label: 'Prayer journal', sub: 'Private entries, prayers and reflections', icon: NotebookPen },
    { to: '/you/prayers', label: 'Prayers', sub: 'Prayer companion and your saved prayers', icon: HandHeart },
    { to: '/you/saved', label: 'Saved', sub: 'Bookmarks, highlights, notes and devotionals', icon: Bookmark },
    { to: '/devotionals', label: 'Devotionals', sub: 'Daily reflections on Scripture', icon: Sparkles },
    { to: '/audio', label: 'Audio', sub: 'Listen to Scripture, devotionals and prayers', icon: Headphones },
    { to: '/games', label: 'Bible challenges', sub: 'Trivia, memory verses and more', icon: Puzzle },
    { to: '/wallpaper', label: 'Verse wallpapers', sub: 'Create shareable verse images', icon: ImageIcon },
    { to: '/you/settings', label: 'Settings', sub: 'Preferences, reminders, privacy and account', icon: Settings },
  ];
  return (
    <div>
      <PageHeader title={profile?.display_name ? `Hello, ${profile.display_name}` : 'You'} subtitle={user?.email ?? undefined} />
      <Link to="/premium" className={`card mb-6 flex items-center gap-4 p-5 ${isPremium ? '' : 'bg-gradient-to-br from-gold/20 to-transparent'}`}>
        <Crown className="h-7 w-7 text-gold" aria-hidden />
        <div className="flex-1">
          <p className="font-semibold">{isPremium ? 'Faithly Premium' : 'Upgrade to Premium'}</p>
          <p className="text-sm text-subtle">{isPremium ? 'Thank you for supporting Faithly. Manage your subscription.' : 'More AI help, premium journeys and advanced study.'}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-subtle" aria-hidden />
      </Link>
      <ul className="card divide-y divide-line">
        {items.map(({ to, label, sub, icon: Icon }) => (
          <li key={to}>
            <Link to={to} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50">
              <Icon className="h-5 w-5 text-accent" aria-hidden />
              <div className="flex-1"><p className="font-medium">{label}</p><p className="text-sm text-subtle">{sub}</p></div>
              <ChevronRight className="h-4 w-4 text-subtle" aria-hidden />
            </Link>
          </li>
        ))}
        {profile?.is_admin && (
          <li><Link to="/admin" className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50"><Shield className="h-5 w-5 text-accent" aria-hidden /><p className="flex-1 font-medium">Admin dashboard</p></Link></li>
        )}
      </ul>
      <button onClick={signOut} className="btn-ghost mt-6 w-full"><LogOut className="h-4 w-4" />Sign out</button>
      <p className="mt-6 text-center text-xs text-subtle"><Link to="/privacy" className="underline">Privacy</Link> · <Link to="/terms" className="underline">Terms</Link></p>
    </div>
  );
}
