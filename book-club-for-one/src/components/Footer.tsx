import { Link } from 'react-router-dom';
import { Logo } from './Logo';

const sections = [
  {
    title: 'Explore',
    links: [
      { label: 'All books', to: '/books' },
      { label: 'Popular books', to: '/books?filter=popular' },
      { label: 'Classic books', to: '/books?filter=classic' },
      { label: 'All free tools', to: '/tools' },
    ],
  },
  {
    title: 'Popular tools',
    links: [
      { label: 'Discussion questions', to: '/tools/book-club-question-generator' },
      { label: 'Reading time calculator', to: '/tools/reading-time-calculator' },
      { label: 'What should I read next?', to: '/tools/what-should-i-read-next' },
      { label: 'Book club name generator', to: '/tools/book-club-name-generator' },
    ],
  },
  {
    title: 'My reading',
    links: [
      { label: 'My library', to: '/library' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Reading goals', to: '/reading-goals' },
      { label: 'Add a book', to: '/library/add' },
      { label: 'Premium', to: '/pricing' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Contact', to: '/contact' },
    ],
  },
];

const legal = [
  { label: 'Privacy', to: '/privacy' },
  { label: 'Cookies', to: '/cookies' },
  { label: 'Terms', to: '/terms' },
  { label: 'Disclaimer', to: '/disclaimer' },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-forest-500 text-ivory dark:bg-forest-800 dark:text-dark-text">
      <div className="container-page pb-10 pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2.7fr]">
          <div className="max-w-xs">
            <Logo tone="inverse" />
            <p className="mt-5 font-serif text-xl leading-snug text-ivory/85 dark:text-dark-text/85">
              Your personal book club for every book you read.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {sections.map(section => (
              <div key={section.title}>
                <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-ivory/55 dark:text-dark-sub">
                  {section.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {section.links.map(link => (
                    <li key={link.to}>
                      <Link to={link.to} className="text-[0.95rem] text-ivory/85 underline-offset-4 transition-colors hover:text-white hover:underline dark:text-dark-text/85">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-ivory/15 pt-6 text-sm text-ivory/60 sm:flex-row sm:items-center sm:justify-between dark:border-dark-border dark:text-dark-sub">
          <p>© {new Date().getFullYear()} The Book Club For One</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legal.map(l => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-white">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
