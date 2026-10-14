import { Link } from 'react-router-dom';
import { BookOpen, Compass, MessageCircleHeart, NotebookPen } from 'lucide-react';
import { Landscape, Sprig } from '../components/Landscape';

export default function WelcomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="relative">
        <Landscape className="h-[42dvh] w-full" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-2 pt-10 pt-safe">
          <Sprig className="h-8 w-8 text-forest" />
          <span className="font-serif text-3xl font-semibold text-forest">Faithly</span>
        </div>
      </div>
      <main className="mx-auto -mt-6 w-full max-w-md flex-1 px-6 pb-10">
        <div className="card relative p-7">
          <h1 className="text-3xl font-semibold leading-tight text-ink">Grow in Faith.<br />Find Your Peace.<br />Walk With God.</h1>
          <p className="mt-3 text-subtle">A quiet, personal space for Scripture, prayer and reflection — wherever you are on your journey.</p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-accent" aria-hidden /> Read the whole Bible, with notes and highlights</li>
            <li className="flex items-center gap-3"><MessageCircleHeart className="h-5 w-5 text-accent" aria-hidden /> Ask questions and explore Scripture with AI help</li>
            <li className="flex items-center gap-3"><Compass className="h-5 w-5 text-accent" aria-hidden /> Follow guided faith journeys day by day</li>
            <li className="flex items-center gap-3"><NotebookPen className="h-5 w-5 text-accent" aria-hidden /> Keep a private prayer journal</li>
          </ul>
          <div className="mt-8 flex flex-col gap-3">
            <Link to="/auth/sign-up" className="btn-primary py-3 text-base">Create your free account</Link>
            <Link to="/auth/sign-in" className="btn-ghost">I already have an account</Link>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-subtle">
          Faithly uses AI to help you explore Scripture. It is not a pastor, counsellor or medical service.{' '}
          <Link to="/privacy" className="underline">Privacy</Link> · <Link to="/terms" className="underline">Terms</Link>
        </p>
      </main>
    </div>
  );
}
