import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Share2 } from 'lucide-react';
import { displayReference, fetchPassageByRef, passageText } from '../lib/bible';
import { supabase } from '../lib/supabase';
import { dayOfYear } from '../lib/dates';
import { downloadFile } from '../lib/share';
import { useToast } from '../context/ToastContext';
import type { VerifiedPassage } from '../lib/types';
import { ErrorNote, PageHeader } from '../components/ui';

type Template = 'botanical' | 'watercolour' | 'minimal' | 'sunset' | 'forest';
type Shape = 'phone' | 'square';

const TEMPLATES: { id: Template; label: string }[] = [
  { id: 'botanical', label: 'Botanical' },
  { id: 'watercolour', label: 'Watercolour hills' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'forest', label: 'Forest' },
];

const SIZES: Record<Shape, [number, number]> = { phone: [1080, 1920], square: [1080, 1080] };

export default function WallpaperPage() {
  const [params] = useSearchParams();
  const toast = useToast();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [refInput, setRefInput] = useState(params.get('ref') ?? '');
  const [passage, setPassage] = useState<VerifiedPassage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<Template>('botanical');
  const [dark, setDark] = useState(false);
  const [shape, setShape] = useState<Shape>('phone');
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    document.fonts?.ready.then(() => setFontsReady(true));
    const initial = params.get('ref');
    if (initial) { load(initial); return; }
    // Default to today's verse.
    supabase.from('daily_verses').select('id', { count: 'exact', head: true }).then(async ({ count }) => {
      if (!count) return;
      const { data } = await supabase.from('daily_verses').select('*').eq('id', dayOfYear() % count).single();
      if (!data) return;
      const ref = displayReference({ bookId: data.book_id, chapter: data.chapter, verseStart: data.verse_start, verseEnd: data.verse_end });
      setRefInput(ref);
      load(ref);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function load(ref: string) {
    setError(null);
    const p = await fetchPassageByRef(ref).catch(() => null);
    if (!p) return setError('That reference could not be found. Try a form like “Psalm 46:1” or “John 14:27”.');
    if (p.verses.length > 4) return setError('Please choose a shorter passage (up to four verses) so it fits nicely.');
    setPassage(p);
  }

  useEffect(() => {
    if (passage && canvas.current) draw(canvas.current, passage, template, dark, shape);
  }, [passage, template, dark, shape, fontsReady]);

  const save = () => {
    canvas.current?.toBlob((b) => b && downloadFile(`faithly-${passage?.reference.replace(/\W+/g, '-').toLowerCase()}.png`, b), 'image/png');
  };
  const share = () => {
    canvas.current?.toBlob(async (b) => {
      if (!b) return;
      const file = new File([b], 'faithly-verse.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: passage?.reference }); } catch { /* cancelled */ }
      } else {
        downloadFile('faithly-verse.png', b);
        toast('Sharing images isn’t supported here, so the image was downloaded instead.');
      }
    }, 'image/png');
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Verse wallpapers" subtitle="Create a beautiful image of a verse to save or share." back />
      <form onSubmit={(e) => { e.preventDefault(); load(refInput); }} className="flex gap-2">
        <label htmlFor="wref" className="sr-only">Bible reference</label>
        <input id="wref" className="input" value={refInput} onChange={(e) => setRefInput(e.target.value)} placeholder="e.g. Isaiah 41:10" />
        <button className="btn-primary">Use verse</button>
      </form>
      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Template">
        {TEMPLATES.map((t) => <button key={t.id} role="radio" aria-checked={template === t.id} onClick={() => setTemplate(t.id)} className={`chip ${template === t.id ? 'chip-on' : 'bg-surface'}`}>{t.label}</button>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setDark(false)} aria-pressed={!dark} className={`chip ${!dark ? 'chip-on' : 'bg-surface'}`}>Light</button>
        <button onClick={() => setDark(true)} aria-pressed={dark} className={`chip ${dark ? 'chip-on' : 'bg-surface'}`}>Dark</button>
        <span className="mx-2 w-px bg-line" />
        <button onClick={() => setShape('phone')} aria-pressed={shape === 'phone'} className={`chip ${shape === 'phone' ? 'chip-on' : 'bg-surface'}`}>Phone wallpaper</button>
        <button onClick={() => setShape('square')} aria-pressed={shape === 'square'} className={`chip ${shape === 'square' ? 'chip-on' : 'bg-surface'}`}>Square post</button>
      </div>

      <div className="flex justify-center">
        <canvas ref={canvas} className={`rounded-2xl shadow-lift ${shape === 'phone' ? 'w-[min(100%,300px)]' : 'w-[min(100%,420px)]'}`} role="img" aria-label={passage ? `Preview: ${passage.reference}` : 'Preview'} />
      </div>
      <div className="flex justify-center gap-2">
        <button onClick={save} disabled={!passage} className="btn-primary"><Download className="h-4 w-4" />Save image</button>
        <button onClick={share} disabled={!passage} className="btn-secondary"><Share2 className="h-4 w-4" />Share</button>
      </div>
      <p className="text-center text-xs text-subtle">To use it as your lock screen, save the image and set it from your phone's Photos or Settings app. All artwork is drawn by Faithly; the verse is from the World English Bible (public domain).</p>
    </div>
  );
}

// ── Drawing ─────────────────────────────────────────────────────────────────

function draw(c: HTMLCanvasElement, p: VerifiedPassage, t: Template, dark: boolean, shape: Shape) {
  const [W, H] = SIZES[shape];
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const ink = dark ? '#F3EFE4' : '#252D29';
  const accent = dark ? '#C5A568' : '#234638';

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  const palettes: Record<Template, [string, string, string, string]> = {
    botanical: ['#F8F6F0', '#EFEAE0', '#1c2622', '#141b18'],
    watercolour: ['#F6EBD6', '#E8EFE6', '#202b27', '#141b18'],
    minimal: ['#FBFAF6', '#F3F0E8', '#1d2421', '#151a17'],
    sunset: ['#F7D9B9', '#E9B7A0', '#3b2a2f', '#1c1a24'],
    forest: ['#DDE7DC', '#B9CBB7', '#16261f', '#0e1814'],
  };
  const pal = palettes[t];
  bg.addColorStop(0, dark ? pal[2] : pal[0]);
  bg.addColorStop(1, dark ? pal[3] : pal[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  if (t === 'watercolour' || t === 'sunset' || t === 'forest') hills(ctx, W, H, t, dark);
  if (t === 'sunset') sun(ctx, W, H, dark);
  if (t === 'botanical') { sprig(ctx, W * 0.08, H * 0.92, 1.6, accent, false); sprig(ctx, W * 0.94, H * 0.05, 0.9, accent, true); }
  if (t === 'forest') trees(ctx, W, H, dark);
  if (t === 'minimal') { ctx.strokeStyle = accent; ctx.globalAlpha = 0.5; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W / 2 - 60, H * 0.25); ctx.lineTo(W / 2 + 60, H * 0.25); ctx.stroke(); ctx.globalAlpha = 1; }

  // Verse text
  const text = `“${passageText(p)}”`;
  const maxW = W * 0.78;
  let size = shape === 'phone' ? 68 : 58;
  let lines: string[] = [];
  for (; size >= 30; size -= 2) {
    ctx.font = `italic 400 ${size}px Lora, Georgia, serif`;
    lines = wrap(ctx, text, maxW);
    if (lines.length * size * 1.45 < H * (shape === 'phone' ? 0.42 : 0.55)) break;
  }
  const lh = size * 1.45;
  const blockH = lines.length * lh;
  const top = (shape === 'phone' ? H * 0.42 : H * 0.46) - blockH / 2;
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  if (t !== 'minimal' && t !== 'botanical') { ctx.shadowColor = dark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'; ctx.shadowBlur = 18; }
  lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * lh));
  ctx.shadowBlur = 0;
  ctx.font = `600 ${Math.round(size * 0.62)}px "Playfair Display", Georgia, serif`;
  ctx.fillStyle = accent;
  ctx.fillText(p.reference, W / 2, top + blockH + size * 0.8);
  ctx.font = `500 26px Inter, sans-serif`;
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = ink;
  ctx.fillText('WEB · Faithly', W / 2, H - (shape === 'phone' ? 120 : 60));
  ctx.globalAlpha = 1;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function hills(ctx: CanvasRenderingContext2D, W: number, H: number, t: Template, dark: boolean) {
  const layers = t === 'sunset'
    ? (dark ? ['#4a3a4a', '#3a2f3e', '#241f2b'] : ['#d9a28d', '#b9806f', '#7d5a55'])
    : (dark ? ['#2d3d35', '#24332c', '#1a2621'] : ['#A9BDA7', '#7F9B83', '#234638']);
  layers.forEach((col, i) => {
    const base = H * (0.74 + i * 0.07);
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.55 + i * 0.15;
    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let x = 0; x <= W; x += W / 6) ctx.quadraticCurveTo(x + W / 12, base - 60 + ((i + x) % 3) * 30, x + W / 6, base + (i % 2 ? 20 : -10));
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function sun(ctx: CanvasRenderingContext2D, W: number, H: number, dark: boolean) {
  const g = ctx.createRadialGradient(W * 0.7, H * 0.68, 10, W * 0.7, H * 0.68, W * 0.35);
  g.addColorStop(0, dark ? 'rgba(197,165,104,0.45)' : 'rgba(255,236,200,0.95)');
  g.addColorStop(1, 'rgba(255,236,200,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function trees(ctx: CanvasRenderingContext2D, W: number, H: number, dark: boolean) {
  ctx.fillStyle = dark ? '#0b130f' : '#234638';
  for (let i = 0; i < 9; i++) {
    const x = (W / 8) * i + (i % 2 ? 20 : -10);
    const h = H * (0.16 + (i % 3) * 0.04);
    const base = H * 0.95;
    ctx.globalAlpha = 0.65 + (i % 3) * 0.1;
    ctx.beginPath();
    ctx.moveTo(x, base - h);
    ctx.lineTo(x - h * 0.28, base);
    ctx.lineTo(x + h * 0.28, base);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function sprig(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, colour: string, flip: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, flip ? -s : s);
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(40, -80, 90, -150, 170, -230);
  ctx.stroke();
  const leaves: [number, number, number][] = [[40, -70, -0.9], [70, -115, 0.6], [100, -150, -0.8], [130, -190, 0.5], [155, -215, -0.7]];
  ctx.globalAlpha = 0.25;
  for (const [lx, ly, rot] of leaves) {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(28, 0, 30, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
