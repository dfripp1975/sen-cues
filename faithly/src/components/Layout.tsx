import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { BookOpen, Compass, MessageCircleHeart, Sun, UserRound, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MiniPlayer } from './MiniPlayer';
import { Sprig } from './Landscape';

const TABS = [
  { to: '/', label: 'Today', icon: Sun, end: true },
  { to: '/bible', label: 'Bible', icon: BookOpen },
  { to: '/ask', label: 'Ask Faithly', icon: MessageCircleHeart },
  { to: '/journeys', label: 'Journeys', icon: Compass },
  { to: '/you', label: 'You', icon: UserRound },
];

export function Layout() {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-dvh md:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2">Skip to content</a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface/70 px-4 py-6 backdrop-blur md:flex" aria-label="Main navigation">
        <div className="mb-8 flex items-center gap-2 px-3">
          <Sprig className="h-8 w-8 text-accent" />
          <div>
            <p className="font-serif text-2xl font-semibold text-accent">Faithly</p>
            <p className="text-[11px] text-subtle">Walk with God</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-accent text-accent-ink' : 'text-ink hover:bg-muted'}`}>
              <Icon className="h-5 w-5" aria-hidden /> {label}
            </NavLink>
          ))}
          {profile?.is_admin && (
            <NavLink to="/admin" className={({ isActive }) => `mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-accent text-accent-ink' : 'text-subtle hover:bg-muted'}`}>
              <Shield className="h-5 w-5" aria-hidden /> Admin
            </NavLink>
          )}
        </nav>
        <div className="mt-auto px-3 text-xs text-subtle">
          <NavLink to="/privacy" className="hover:underline">Privacy</NavLink> · <NavLink to="/terms" className="hover:underline">Terms</NavLink>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <main id="main" className="page-enter mx-auto w-full max-w-3xl px-4 pb-40 pt-safe md:px-8 md:pb-24" key={pathname.split('/')[1]}>
          <div className="pt-6 md:pt-10">
            <Outlet />
          </div>
        </main>
      </div>

      <MiniPlayer />

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-safe backdrop-blur md:hidden" aria-label="Main navigation">
        <ul className="mx-auto flex max-w-lg justify-around">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink to={to} end={end}
                className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${isActive ? 'text-accent' : 'text-subtle'}`}>
                {({ isActive }) => (
                  <>
                    <span className={`rounded-full px-4 py-1 transition ${isActive ? 'bg-accent/10' : ''}`}><Icon className="h-5 w-5" aria-hidden /></span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
