import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';

export default function NotFoundPage() {
  return <EmptyState title="Page not found" action={<Link to="/" className="btn-primary">Back to Today</Link>}>That page doesn't exist or has moved.</EmptyState>;
}
