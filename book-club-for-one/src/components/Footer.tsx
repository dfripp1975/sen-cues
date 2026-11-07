import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export function Footer() {
  const sections = [
    {
      title: 'Explore',
      links: [
        { label: 'Books', to: '/books' },
        { label: 'Popular Books', to: '/books?filter=popular' },
        { label: 'Classic Books', to: '/books?filter=classic' },
      ],
    },
    {
      title: 'Tools',
      links: [
        { label: 'Book Club Question Generator', to: '/tools/book-club-question-generator' },
        { label: 'Reading Time Calculator', to: '/tools/reading-time-calculator' },
        { label: 'What Should I Read Next?', to: '/tools/what-should-i-read-next' },
        { label: 'Vocabulary Helper', to: '/tools/book-vocabulary-helper' },
        { label: 'Book Club Name Generator', to: '/tools/book-club-name-generator' },
        { label: 'All Tools', to: '/tools' },
      ],
    },
    {
      title: 'My Reading',
      links: [
        { label: 'My Library', to: '/library' },
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Reading Goals', to: '/reading-goals' },
        { label: 'Premium', to: '/pricing' },
        { label: 'Add a Book', to: '/library/add' },
      ],
    },
    {
      title: 'About',
      links: [
        { label: 'About', to: '/about' },
        { label: 'Contact', to: '/contact' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', to: '/privacy' },
        { label: 'Cookies', to: '/cookies' },
        { label: 'Terms', to: '/terms' },
        { label: 'Disclaimer', to: '/disclaimer' },
      ],
    },
  ];

  return (
    <footer className="mt-20 bg-forest-600 dark:bg-forest-800 text-ivory dark:text-dark-text">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-ivory/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-ivory" />
              </div>
              <span className="font-serif font-bold text-sm">The Book Club For One</span>
            </Link>
            <p className="text-sm text-ivory/70 dark:text-dark-sub leading-relaxed">
              Your personal book club for every book you read.
            </p>
          </div>
          {sections.map(section => (
            <div key={section.title}>
              <h3 className="font-serif font-bold text-sm mb-4 text-ivory dark:text-dark-sage">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-ivory/70 dark:text-dark-sub hover:text-ivory dark:hover:text-dark-sage transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-ivory/10 dark:border-dark-border">
          <p className="text-sm text-ivory/60 dark:text-dark-sub">
            © {new Date().getFullYear()} The Book Club For One. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
