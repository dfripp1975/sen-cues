import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Pause, Play, RotateCcw, RotateCw } from 'lucide-react';
import { getVoices, ttsSupported } from '../lib/speech';
import { useNarrator } from '../lib/useNarrator';
import { EmptyState, PageHeader } from '../components/ui';
import { Landscape } from '../components/Landscape';

const SPEEDS = [0.75, 0.85, 1, 1.15, 1.3, 1.5];
const SLEEP = [0, 5, 15, 30, 60];

export default function PlayerPage() {
  const n = useNarrator();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!ttsSupported) return;
    const load = () => setVoices(getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => { window.speechSynthesis.removeEventListener('voiceschanged', load); clearInterval(t); };
  }, []);

  if (!n.segments.length) {
    return <EmptyState title="Nothing playing" action={<Link to="/audio" className="btn-primary">Browse audio</Link>}>Choose something from the audio library to listen to.</EmptyState>;
  }

  const current = n.segments[n.index];
  const sleepLeft = n.sleepAt ? Math.max(0, Math.ceil((n.sleepAt - now) / 60000)) : 0;

  return (
    <div>
      <PageHeader title="Now playing" back="/audio" />
      <div className="card overflow-hidden">
        <Landscape className="h-40 w-full" variant="dusk" />
        <div className="p-6">
          <h2 className="text-2xl font-semibold">{n.title}</h2>
          <p className="mt-4 min-h-[5rem] font-scripture text-lg leading-relaxed text-subtle" aria-live="polite">
            {current.startsWith('[pause') ? <em>A moment of silence…</em> : current}
          </p>
          <label htmlFor="seek" className="sr-only">Position</label>
          <input id="seek" type="range" min={0} max={n.segments.length - 1} value={n.index} className="mt-4 w-full accent-forest"
            onChange={(e) => n.seek(Number(e.target.value) - n.index)} />
          <p className="text-xs text-subtle">Part {n.index + 1} of {n.segments.length}</p>
          <div className="mt-4 flex items-center justify-center gap-6">
            <button onClick={() => n.seek(-1)} className="rounded-full p-3 hover:bg-muted" aria-label="Back"><RotateCcw className="h-6 w-6" /></button>
            <button onClick={() => (n.playing ? n.pause() : n.play())} className="rounded-full bg-accent p-5 text-accent-ink shadow-lift" aria-label={n.playing ? 'Pause' : 'Play'}>
              {n.playing ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7" />}
            </button>
            <button onClick={() => n.seek(1)} className="rounded-full p-3 hover:bg-muted" aria-label="Forward"><RotateCw className="h-6 w-6" /></button>
          </div>
        </div>
      </div>

      <div className="card mt-4 grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <label htmlFor="spd" className="label">Speed</label>
          <select id="spd" className="input" value={n.rate} onChange={(e) => n.setRate(Number(e.target.value))}>
            {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="slp" className="label"><Moon className="mr-1 inline h-4 w-4" />Sleep timer</label>
          <select id="slp" className="input" value={0} onChange={(e) => n.setSleep(Number(e.target.value) || null)}>
            {SLEEP.map((s) => <option key={s} value={s}>{s ? `${s} minutes` : sleepLeft ? `Stops in ${sleepLeft} min` : 'Off'}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="vc" className="label">Voice</label>
          <select id="vc" className="input" value={n.voiceName ?? ''} onChange={(e) => n.setVoice(e.target.value || null)}>
            <option value="">Device default</option>
            {voices.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
          </select>
        </div>
      </div>
      <p className="mt-3 text-xs text-subtle">Playback continues while you browse Faithly. Whether it continues with the screen locked depends on your device and browser.</p>
    </div>
  );
}
