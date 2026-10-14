import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { DAILY_MINUTES, FAMILIARITY, FOCUS_AREAS, REASONS, TRADITIONS } from '../content/options';
import { ErrorNote, ProgressBar } from '../components/ui';
import { Landscape } from '../components/Landscape';

interface Answers {
  name: string;
  reasons: string[];
  focus_areas: string[];
  bible_familiarity: string | null;
  daily_minutes: number | null;
  translation_code: string;
  wants_reminders: boolean | null;
  tradition: string | null;
}

const STEPS = ['welcome', 'reasons', 'focus', 'familiarity', 'time', 'translation', 'reminders', 'tradition'] as const;

export default function OnboardingPage() {
  const { profile, prefs, user, updatePrefs, updateProfile } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [a, setA] = useState<Answers>({
    name: profile?.display_name ?? '',
    reasons: prefs?.reasons ?? [],
    focus_areas: prefs?.focus_areas ?? [],
    bible_familiarity: prefs?.bible_familiarity ?? null,
    daily_minutes: prefs?.daily_minutes ?? null,
    translation_code: 'WEB',
    wants_reminders: prefs?.wants_reminders ?? null,
    tradition: prefs?.tradition ?? null,
  });

  const toggle = (key: 'reasons' | 'focus_areas', id: string) =>
    setA((s) => ({ ...s, [key]: s[key].includes(id) ? s[key].filter((x) => x !== id) : [...s[key], id] }));

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      await updatePrefs({
        reasons: a.reasons,
        focus_areas: a.focus_areas,
        bible_familiarity: a.bible_familiarity,
        daily_minutes: a.daily_minutes,
        translation_code: a.translation_code,
        wants_reminders: a.wants_reminders,
        tradition: a.tradition,
        new_to_christianity: a.bible_familiarity === 'new' || a.reasons.includes('exploring'),
      });
      if (a.wants_reminders && user) {
        // Saves the choice; actual push delivery is switched on from Settings (needs browser permission).
        await supabase.from('notification_preferences').update({
          morning_scripture: true,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London',
        }).eq('user_id', user.id);
      }
      await updateProfile({ display_name: a.name.trim() || null, onboarding_completed: true });
      nav('/', { replace: true });
    } catch (e) {
      setError((e as Error).message || 'Could not save your answers. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish());
  const current = STEPS[step];

  const Option = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-[15px] transition ${on ? 'border-accent bg-accent/10 font-medium' : 'border-line bg-surface hover:bg-muted'}`}>
      {children}
      {on && <Check className="h-5 w-5 text-accent" aria-hidden />}
    </button>
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-8 pt-safe">
      <div className="flex items-center gap-4 py-5">
        <ProgressBar value={(step + 1) / STEPS.length} label="Onboarding progress" />
        {step > 0 && <button onClick={finish} className="shrink-0 text-sm text-subtle underline" disabled={busy}>Skip all</button>}
      </div>

      <div className="page-enter flex-1" key={current}>
        {current === 'welcome' && (
          <div>
            <Landscape className="mb-6 h-36 w-full rounded-3xl" />
            <h1 className="text-3xl font-semibold">Welcome to Faithly</h1>
            <p className="mt-3 text-subtle">A few optional questions help us shape your experience. You can skip any of them and change your answers later in Settings.</p>
            <label htmlFor="ob-name" className="label mt-6">What should we call you?</label>
            <input id="ob-name" className="input" value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} maxLength={60} autoComplete="given-name" placeholder="Your first name" />
          </div>
        )}
        {current === 'reasons' && (
          <Step title="What brings you to Faithly?" hint="Choose any that apply.">
            {REASONS.map((r) => <Option key={r.id} on={a.reasons.includes(r.id)} onClick={() => toggle('reasons', r.id)}>{r.label}</Option>)}
          </Step>
        )}
        {current === 'focus' && (
          <Step title="What would you like to focus on?" hint="We'll suggest journeys and devotionals to match.">
            <div className="flex flex-wrap gap-2">
              {FOCUS_AREAS.map((f) => (
                <button key={f.id} onClick={() => toggle('focus_areas', f.id)} aria-pressed={a.focus_areas.includes(f.id)}
                  className={`chip ${a.focus_areas.includes(f.id) ? 'chip-on' : 'bg-surface hover:bg-muted'}`}>{f.label}</button>
              ))}
            </div>
          </Step>
        )}
        {current === 'familiarity' && (
          <Step title="How familiar are you with the Bible?" hint="There's no wrong answer — this just helps us explain things at the right level.">
            {FAMILIARITY.map((f) => <Option key={f.id} on={a.bible_familiarity === f.id} onClick={() => setA({ ...a, bible_familiarity: f.id })}>{f.label}</Option>)}
          </Step>
        )}
        {current === 'time' && (
          <Step title="How much time would you like to spend each day?" hint="Even five minutes is a meaningful start.">
            {DAILY_MINUTES.map((m) => <Option key={m} on={a.daily_minutes === m} onClick={() => setA({ ...a, daily_minutes: m })}>{m} minutes</Option>)}
          </Step>
        )}
        {current === 'translation' && (
          <Step title="Which Bible translation do you prefer?" hint="">
            <Option on onClick={() => {}}>World English Bible (WEB)</Option>
            <p className="text-sm text-subtle">
              The World English Bible is a modern English translation in the public domain. Other translations, such as the NIV or ESV,
              require a licence from their publishers; we'll only add them once properly licensed.
            </p>
          </Step>
        )}
        {current === 'reminders' && (
          <Step title="Would you like daily reminders?" hint="A gentle nudge each morning. You choose the time, and you can turn it off at any point.">
            <Option on={a.wants_reminders === true} onClick={() => setA({ ...a, wants_reminders: true })}>Yes, please remind me</Option>
            <Option on={a.wants_reminders === false} onClick={() => setA({ ...a, wants_reminders: false })}>No thanks</Option>
            {a.wants_reminders && <p className="text-sm text-subtle">After setup, we'll ask your browser for permission in Settings → Reminders. We never send notifications without your consent.</p>}
          </Step>
        )}
        {current === 'tradition' && (
          <Step title="Which Christian tradition, if any, would you like reflected?" hint="Faithly respects all Christian traditions. This helps the AI mention perspectives most relevant to you, while staying fair to others.">
            {TRADITIONS.map((t) => <Option key={t} on={a.tradition === t} onClick={() => setA({ ...a, tradition: t })}>{t}</Option>)}
          </Step>
        )}
      </div>

      {error && <div className="mb-3"><ErrorNote>{error}</ErrorNote></div>}
      <div className="sticky bottom-0 flex gap-3 bg-bg/90 py-4 backdrop-blur pb-safe">
        {step > 0 && <button className="btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
        <button className="btn-secondary ml-auto" onClick={next} disabled={busy}>Skip</button>
        <button className="btn-primary px-8" onClick={next} disabled={busy}>
          {busy ? 'Saving…' : step === STEPS.length - 1 ? 'Finish' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

function Step({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold leading-snug">{title}</h1>
      {hint && <p className="mt-2 text-subtle">{hint}</p>}
      <div className="mt-6 space-y-2.5">{children}</div>
    </div>
  );
}
