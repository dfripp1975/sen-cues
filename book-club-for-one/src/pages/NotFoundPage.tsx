import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useSEO } from '@/lib/seo';

export function NotFoundPage() {
  useSEO({
    title: 'Page Not Found | The Book Club For One',
    description: 'The page you are looking for could not be found.',
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <Compass className="w-16 h-16 text-sage-300 mx-auto mb-6" />
      <h1 className="text-4xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4">Page Not Found</h1>
      <p className="text-lg text-warmgrey dark:text-dark-sub mb-8">
        We could not find the page you were looking for. It may have moved or no longer exists.
      </p>
      <div className="flex gap-3 justify-center">
        <Link to="/" className="btn-primary">Go Home</Link>
        <Link to="/tools" className="btn-outline">Browse Tools</Link>
        <Link to="/books" className="btn-ghost">Explore Books</Link>
      </div>
    </div>
  );
}
