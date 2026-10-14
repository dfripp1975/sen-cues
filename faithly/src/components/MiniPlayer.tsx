import { Pause, Play, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNarrator } from '../lib/useNarrator';

/** Persistent mini player so narration continues while navigating. */
export function MiniPlayer() {
  const n = useNarrator();
  if (!n.segments.length) return null;
  return (
    <div className="fixed inset-x-3 bottom-[76px] z-40 md:bottom-6 md:left-auto md:right-6 md:w-96">
      <div className="card flex items-center gap-3 px-4 py-3 shadow-lift">
        <button onClick={() => (n.playing ? n.pause() : n.play())} className="rounded-full bg-accent p-2.5 text-accent-ink" aria-label={n.playing ? 'Pause' : 'Play'}>
          {n.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <Link to="/audio/player" className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{n.title}</p>
          <p className="text-xs text-subtle">{n.index + 1} of {n.segments.length} · device voice</p>
        </Link>
        <button onClick={() => n.load('', [])} className="rounded-full p-2 text-subtle hover:bg-muted" aria-label="Close player"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
