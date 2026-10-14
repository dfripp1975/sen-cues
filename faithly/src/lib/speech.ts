// Text-to-speech (speechSynthesis) and speech recognition helpers.
// Both are browser features: availability and voices vary by device.

export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function splitIntoSegments(text: string): string[] {
  if (/^\[pause:\d+\]$/.test(text.trim())) return [text.trim()];
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?;:])\s+(?=[A-Z“"‘'(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
}

type Listener = () => void;

/**
 * A single shared narrator so only one thing speaks at a time. Text is spoken
 * segment by segment, which allows seeking, speed changes and a sleep timer.
 */
class Narrator {
  segments: string[] = [];
  index = 0;
  playing = false;
  title = '';
  rate = 1;
  voiceName: string | null = null;
  sleepAt: number | null = null;
  private listeners = new Set<Listener>();
  private token = 0;
  private sleepTimer: number | null = null;

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
  private emit() {
    this.listeners.forEach((l) => l());
  }

  /** Load text to narrate. Pass `split = false` with an array to keep one segment per item (e.g. per verse). */
  load(title: string, text: string | string[], split = true) {
    this.stop();
    this.title = title;
    this.segments = Array.isArray(text) ? (split ? text.flatMap(splitIntoSegments) : text.filter(Boolean)) : splitIntoSegments(text);
    this.index = 0;
    this.emit();
  }

  play(from = this.index) {
    if (!ttsSupported || !this.segments.length) return;
    window.speechSynthesis.cancel();
    this.index = Math.max(0, Math.min(from, this.segments.length - 1));
    this.playing = true;
    const token = ++this.token;
    this.speakCurrent(token);
    this.emit();
  }

  private advance(token: number) {
    if (token !== this.token) return;
    if (this.index < this.segments.length - 1) {
      this.index++;
      this.emit();
      this.speakCurrent(token);
    } else {
      this.playing = false;
      this.index = 0;
      this.emit();
    }
  }

  private speakCurrent(token: number) {
    if (token !== this.token) return;
    const seg = this.segments[this.index];
    // Silent pause segments (used by guided meditations): "[pause:10]" waits 10 seconds.
    const pause = seg.match(/^\[pause:(\d+)\]$/);
    if (pause) {
      window.setTimeout(() => this.advance(token), Number(pause[1]) * 1000);
      return;
    }
    const u = new SpeechSynthesisUtterance(seg);
    u.rate = this.rate;
    u.lang = 'en-GB';
    const voice = getVoices().find((v) => v.name === this.voiceName);
    if (voice) u.voice = voice;
    u.onend = () => this.advance(token);
    u.onerror = () => {
      if (token !== this.token) return;
      this.playing = false;
      this.emit();
    };
    window.speechSynthesis.speak(u);
  }

  pause() {
    this.token++;
    if (ttsSupported) window.speechSynthesis.cancel();
    this.playing = false;
    this.emit();
  }

  stop() {
    this.pause();
    this.index = 0;
    this.clearSleep();
    this.emit();
  }

  seek(delta: number) {
    const next = Math.max(0, Math.min(this.index + delta, this.segments.length - 1));
    if (this.playing) this.play(next);
    else {
      this.index = next;
      this.emit();
    }
  }

  setRate(rate: number) {
    this.rate = rate;
    if (this.playing) this.play(this.index);
    this.emit();
  }

  setVoice(name: string | null) {
    this.voiceName = name;
    if (this.playing) this.play(this.index);
    this.emit();
  }

  setSleep(minutes: number | null) {
    this.clearSleep();
    if (minutes) {
      this.sleepAt = Date.now() + minutes * 60000;
      this.sleepTimer = window.setTimeout(() => this.stop(), minutes * 60000);
    }
    this.emit();
  }
  private clearSleep() {
    if (this.sleepTimer) window.clearTimeout(this.sleepTimer);
    this.sleepTimer = null;
    this.sleepAt = null;
  }
}

export const narrator = new Narrator();

// ── Speech recognition ──
type RecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export function getRecognition(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
