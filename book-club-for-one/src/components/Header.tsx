import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun, Monitor, BookOpen, User, LogOut, Target, Crown } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { SearchBar } from './SearchBar';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, setTheme, isDark } = useTheme();
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navLinks = [
    { label: 'Explore', to: '/books' },
    { label: 'Free Tools', to: '/tools' },
    { label: 'My Library', to: '/library' },
    { label: 'Reading Goals', to: '/reading-goals' },
    { label: 'Pricing', to: '/pricing' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 dark:bg-dark-card/95 backdrop-blur-md border-b border-stone dark:border-dark-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-lg bg-forest-500 dark:bg-forest-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-ivory dark:text-dark-bg" />
            </div>
            <span className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage hidden sm:block">
              The Book Club For One
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link ${isActive(link.to) ? 'nav-link-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-1 md:flex-initial justify-end max-w-xs md:max-w-none">
            <div className="hidden lg:block flex-1 max-w-xs">
              <SearchBar />
            </div>

            {/* Theme toggle */}
            <div className="relative">
              <button
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className="p-2 rounded-lg hover:bg-stone-light dark:hover:bg-forest-800 transition-colors"
                aria-label="Theme settings"
              >
                {isDark ? <Moon className="w-5 h-5 text-dark-sage" /> : <Sun className="w-5 h-5 text-forest-500" />}
              </button>
              {themeMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-ivory dark:bg-dark-card rounded-xl shadow-lift border border-stone dark:border-dark-border z-50 overflow-hidden animate-fade-in">
                  {([
                    { val: 'light', icon: Sun, label: 'Light' },
                    { val: 'dark', icon: Moon, label: 'Dark' },
                    { val: 'system', icon: Monitor, label: 'System' },
                  ] as const).map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => { setTheme(opt.val); setThemeMenuOpen(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-sage-50 dark:hover:bg-forest-700 transition-colors ${theme === opt.val ? 'text-forest-500 dark:text-dark-sage font-semibold' : 'text-charcoal dark:text-dark-text'}`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2 rounded-lg hover:bg-stone-light dark:hover:bg-forest-800 transition-colors flex items-center gap-2"
                  aria-label="Account menu"
                >
                  <div className="w-8 h-8 rounded-full bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg flex items-center justify-center text-sm font-bold">
                    {user.email?.[0]?.toUpperCase()}
                  </div>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-ivory dark:bg-dark-card rounded-xl shadow-lift border border-stone dark:border-dark-border z-50 overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-stone dark:border-dark-border">
                      <p className="text-sm text-charcoal dark:text-dark-text font-medium truncate">{user.email}</p>
                    </div>
                    <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-sage-50 dark:hover:bg-forest-700 transition-colors text-charcoal dark:text-dark-text">
                      <User className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link to="/library" onClick={() => setUserMenuOpen(false)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-sage-50 dark:hover:bg-forest-700 transition-colors text-charcoal dark:text-dark-text">
                      <BookOpen className="w-4 h-4" /> My Library
                    </Link>
                    <Link to="/reading-goals" onClick={() => setUserMenuOpen(false)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-sage-50 dark:hover:bg-forest-700 transition-colors text-charcoal dark:text-dark-text">
                      <Target className="w-4 h-4" /> Reading Goals
                    </Link>
                    <Link to="/pricing" onClick={() => setUserMenuOpen(false)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-sage-50 dark:hover:bg-forest-700 transition-colors text-charcoal dark:text-dark-text">
                      <Crown className="w-4 h-4" /> Premium
                    </Link>
                    <button onClick={() => { signOut(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-sage-50 dark:hover:bg-forest-700 transition-colors text-charcoal dark:text-dark-text">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/signin" className="btn-ghost text-sm hidden sm:flex">
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-stone-light dark:hover:bg-forest-800 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="mb-4">
              <SearchBar />
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-lg text-sm ${isActive(link.to) ? 'bg-forest-50 dark:bg-forest-700 text-forest-500 dark:text-dark-sage font-semibold' : 'text-charcoal dark:text-dark-text hover:bg-stone-light dark:hover:bg-forest-800'}`}
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <Link to="/signin" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 rounded-lg text-sm text-charcoal dark:text-dark-text hover:bg-stone-light dark:hover:bg-forest-800">
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
