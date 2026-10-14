import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Mic, MicOff, SendHorizontal } from 'lucide-react';
import { getRecognition } from '../lib/speech';

/** Text input with optional speech recognition (where the browser supports it). */
export function Composer({ onSend, busy, placeholder = 'Ask about Scripture, faith or prayer…', autoFocus = false, initial = '' }:
  { onSend: (text: string) => void; busy?: boolean; placeholder?: string; autoFocus?: boolean; initial?: string }) {
  const [text, setText] = useState(initial);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recRef = useRef<{ stop(): void } | null>(null);
  const Recognition = getRecognition();

  useEffect(() => () => recRef.current?.stop(), []);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    onSend(t.slice(0, 2000));
    setText('');
  };

  const toggleMic = () => {
    if (!Recognition) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    setMicError(null);
    const rec = new Recognition();
    rec.lang = 'en-GB';
    rec.interimResults = true;
    rec.continuous = false;
    const base = text ? text.trimEnd() + ' ' : '';
    rec.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setText(base + transcript);
    };
    rec.onerror = (e) => setMicError(e.error === 'not-allowed' ? 'Microphone permission was denied.' : 'Could not hear that. Please try again.');
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div className="card flex items-end gap-2 p-2">
        <label htmlFor="composer" className="sr-only">Your question</label>
        <textarea id="composer" value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={2000} autoFocus={autoFocus}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder={listening ? 'Listening…' : placeholder}
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] focus:outline-none" />
        {Recognition && (
          <button type="button" onClick={toggleMic} className={`rounded-full p-3 ${listening ? 'bg-red-600 text-white' : 'text-subtle hover:bg-muted'}`}
            aria-label={listening ? 'Stop voice input' : 'Speak your question'} aria-pressed={listening}>
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}
        <button type="submit" disabled={!text.trim() || busy} className="rounded-full bg-accent p-3 text-accent-ink disabled:opacity-40" aria-label="Send">
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
      {micError && <p className="mt-1 px-2 text-xs text-red-700 dark:text-red-300">{micError}</p>}
    </form>
  );
}
