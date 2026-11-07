import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun, Monitor, BookOpen, LayoutDashboard, LogOut, Target, Crown } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useDismiss } from '@/hooks/useDismiss';
import { SearchBar } from './SearchBar';
import { Logo } from './Logo';

const navLinks = [
  { label: 'Books', to: '/books' },
  { label: 'Free tools', to: '/tools' },
  { label: 'My library', to: '/library' },
  { label: 'Reading goals', to: '/reading-goals' },
  { label: 'Pricing', to: '/pricing' },
];

const themeOptions = [
  { val: 'light', icon: Sun, label: 'Light' },
  { val: 'dark', icon: Moon, label: 'Dark' },
  { val: 'system', icon: Monitor, label: 'Match device' },
] as const;

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, setTheme, isDark } = useTheme();
  const { user, signOut } = useAuth();
  const location = useLocation();

  const themeRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const closeTheme = useCallback(() => setThemeMenuOpen(false), []);
  const closeUser = useCallback(() => setUserMenuOpen(false), []);
  useDismiss(themeRef, themeMenuOpen, closeTheme);
  useDismiss(userRef, userMenuOpen, closeUser);

  // Close every menu when the route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-40 border-b border-stone/80 bg-paper/85 backdrop-blur-md supports-[backdrop-filter]:bg-paper/75 dark:border-dark-border dark:bg-dark-bg/85">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo />

          <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link ${isActive(link.to) ? 'nav-link-active' : ''}`}
                aria-current={isActive(link.to) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <div className="hidden xl:block w-64">
              <SearchBar compact />
            </div>

            <div className="relative" ref={themeRef}>
              <button
                onClick={() => setThemeMenuOpen(o => !o)}
                className="grid h-10 w-10 place-items-center rounded-full text-forest-500 transition-colors hover:bg-charcoal/[0.05] dark:text-dark-text dark:hover:bg-white/[0.06]"
                aria-label="Colour theme"
                aria-haspopup="menu"
                aria-expanded={themeMenuOpen}
              >
                {isDark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
              </button>
              {themeMenuOpen && (
                <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-stone bg-ivory py-1 shadow-lift animate-slide-up dark:border-dark-border dark:bg-dark-card">
                  {themeOptions.map(opt => (
                    <button
                      key={opt.val}
                      role="menuitemradio"
                      aria-checked={theme === opt.val}
                      onClick={() => { setTheme(opt.val); setThemeMenuOpen(false); }}
                      className={`menu-item ${theme === opt.val ? 'font-semibold text-forest-500 dark:text-dark-sage' : ''}`}
                    >
                      <opt.icon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-charcoal/[0.05] dark:hover:bg-white/[0.06]"
                  aria-label="Account menu"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-forest-500 font-serif text-sm text-ivory dark:bg-dark-sage dark:text-dark-bg">
                    {user.email?.[0]?.toUpperCase()}
                  </span>
                </button>
                {userMenuOpen && (
                  <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-stone bg-ivory py-1 shadow-lift animate-slide-up dark:border-dark-border dark:bg-dark-card">
                    <p className="truncate border-b border-stone px-4 py-3 text-sm text-warmgrey dark:border-dark-border dark:text-dark-sub">
                      {user.email}
                    </p>
                    <Link role="menuitem" to="/dashboard" className="menu-item"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
                    <Link role="menuitem" to="/library" className="menu-item"><BookOpen className="h-4 w-4" /> My library</Link>
                    <Link role="menuitem" to="/reading-goals" className="menu-item"><Target className="h-4 w-4" /> Reading goals</Link>
                    <Link role="menuitem" to="/pricing" className="menu-item"><Crown className="h-4 w-4" /> Premium</Link>
                    <button role="menuitem" onClick={() => { signOut(); setUserMenuOpen(false); }} className="menu-item border-t border-stone dark:border-dark-border">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/signin" className="btn-primary hidden sm:inline-flex !py-2 text-sm">
                Sign in
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-charcoal/[0.05] lg:hidden dark:hover:bg-white/[0.06]"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-nav" className="border-t border-stone pb-5 pt-4 animate-slide-up lg:hidden dark:border-dark-border">
            <SearchBar />
            <nav className="mt-3 flex flex-col" aria-label="Main">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center justify-between border-b border-stone/70 py-3.5 font-serif text-xl dark:border-dark-border ${isActive(link.to) ? 'text-terracotta-500 dark:text-dark-terra' : 'text-forest-500 dark:text-dark-text'}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {!user && (
              <Link to="/signin" className="btn-primary mt-5 w-full">Sign in</Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
