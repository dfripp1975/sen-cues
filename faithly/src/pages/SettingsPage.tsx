import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, LogOut, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { callFunction, ApiError } from '../lib/api';
import { exportAllData } from '../lib/export';
import { getVoices, narrator, ttsSupported } from '../lib/speech';
import { disablePush, enablePush, hasPushSubscription, pushSupport } from '../lib/push';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DAILY_MINUTES, FAMILIARITY, FOCUS_AREAS, TRADITIONS } from '../content/options';
import { ErrorNote, PageHeader, Sheet } from '../components/ui';

interface NotifPrefs {
  timezone: string; morning_scripture: boolean; morning_time: string; evening_prayer: boolean; evening_time: string;
  daily_devotional: boolean; devotional_time: string; journey_reminder: boolean; journal_reminder: boolean;
}

export default function SettingsPage() {
  const { user, profile, prefs, updatePrefs, updateProfile, signOut, isPremium } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [name, setName] = useState(profile?.display_name ?? '');
  const [memory, setMemory] = useState(prefs?.ai_memory ?? '');
  const [notif, setNotif] = useState<NotifPrefs | null>(null);
  const [pushOn, setPushOn] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const support = pushSupport();

  useEffect(() => {
    supabase.from('notification_preferences').select('*').maybeSingle().then(({ data }) => {
      if (data) setNotif({ ...data, morning_time: data.morning_time.slice(0, 5), evening_time: data.evening_time.slice(0, 5), devotional_time: data.devotional_time.slice(0, 5) });
    });
    if (support === 'supported') hasPushSubscription().then(setPushOn);
    if (ttsSupported) {
      const load = () => setVoices(getVoices());
      load();
      window.speechSynthesis.addEventListener('voiceschanged', load);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
    }
  }, [support]);

  if (!prefs) return null;

  const save = async (patch: Parameters<typeof updatePrefs>[0], msg = 'Saved') => {
    try {
      await updatePrefs(patch);
      toast(msg);
    } catch {
      toast('Could not save. Please try again.', 'error');
    }
  };

  const toggleArray = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const saveNotif = async (patch: Partial<NotifPrefs>) => {
    if (!notif || !user) return;
    const next = { ...notif, ...patch, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || notif.timezone };
    setNotif(next);
    const { error } = await supabase.from('notification_preferences').update(next).eq('user_id', user.id);
    if (error) toast('Could not save reminder settings.', 'error');
  };

  const togglePush = async () => {
    if (!user) return;
    if (pushOn) {
      await disablePush();
      setPushOn(false);
      return toast('Notifications turned off on this device');
    }
    const r = await enablePush(user.id);
    if (r === 'enabled') { setPushOn(true); toast('Notifications enabled on this device'); }
    else if (r === 'denied') toast('Notifications were blocked. You can allow them in your browser settings.', 'error');
    else toast('Could not enable notifications on this device.', 'error');
  };

  const doExport = async () => {
    setExporting(true);
    try { await exportAllData(); toast('Your data has been downloaded'); }
    catch { toast('Export failed. Please try again.', 'error'); }
    finally { setExporting(false); }
  };

  const doDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await callFunction('delete-account', { confirm: deleteText });
      await signOut();
      nav('/welcome', { replace: true });
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : 'Could not delete your account.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" back="/you" />

      <Section title="Profile">
        <label htmlFor="sname" className="label">Name</label>
        <div className="flex gap-2">
          <input id="sname" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          <button className="btn-secondary" onClick={() => updateProfile({ display_name: name.trim() || null }).then(() => toast('Saved'), () => toast('Could not save', 'error'))}>Save</button>
        </div>
        <p className="mt-2 text-sm text-subtle">Signed in as {user?.email}</p>
      </Section>

      <Section title="Your faith preferences" hint="Used to personalise suggestions. Faithly never makes assumptions beyond what you choose here.">
        <p className="label">Focus areas</p>
        <div className="flex flex-wrap gap-2">
          {FOCUS_AREAS.map((f) => (
            <button key={f.id} onClick={() => save({ focus_areas: toggleArray(prefs.focus_areas, f.id) })} aria-pressed={prefs.focus_areas.includes(f.id)}
              className={`chip ${prefs.focus_areas.includes(f.id) ? 'chip-on' : 'bg-surface'}`}>{f.label}</button>
          ))}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Select id="fam" label="Bible familiarity" value={prefs.bible_familiarity ?? ''} onChange={(v) => save({ bible_familiarity: v || null })}
            options={[['', 'Prefer not to say'], ...FAMILIARITY.map((f) => [f.id, f.label] as [string, string])]} />
          <Select id="mins" label="Daily time" value={String(prefs.daily_minutes ?? '')} onChange={(v) => save({ daily_minutes: v ? Number(v) : null })}
            options={[['', 'Not set'], ...DAILY_MINUTES.map((m) => [String(m), `${m} minutes`] as [string, string])]} />
          <Select id="trad" label="Christian tradition" value={prefs.tradition ?? ''} onChange={(v) => save({ tradition: v || null })}
            options={[['', 'Not set'], ...TRADITIONS.map((t) => [t, t] as [string, string])]} />
          <Select id="tr" label="Bible translation" value="WEB" onChange={() => {}} options={[['WEB', 'World English Bible (public domain)']]} />
        </div>
        <Toggle className="mt-5" checked={prefs.new_to_christianity} onChange={(v) => save({ new_to_christianity: v })}
          label="Explain like I'm new to Christianity" hint="AI answers and studies will explain every term simply." />
      </Section>

      <Section title="Appearance">
        <p className="label">Theme</p>
        <div className="flex gap-2">
          {(['system', 'light', 'dark'] as const).map((t) => (
            <button key={t} onClick={() => save({ theme: t })} aria-pressed={prefs.theme === t} className={`chip capitalize ${prefs.theme === t ? 'chip-on' : 'bg-surface'}`}>{t}</button>
          ))}
        </div>
        <label htmlFor="fs" className="label mt-5">Scripture text size: {Math.round(prefs.font_scale * 100)}%</label>
        <input id="fs" type="range" min={0.8} max={1.6} step={0.1} value={prefs.font_scale} className="w-full accent-forest"
          onChange={(e) => save({ font_scale: Number(e.target.value) }, 'Text size updated')} />
        <p className="scripture mt-2 text-subtle">“Your word is a lamp to my feet, and a light for my path.” — Psalm 119:105</p>
      </Section>

      <Section title="Audio" hint="Faithly reads aloud using your device's built-in voices. Voices vary by device and browser.">
        {!ttsSupported ? <p className="text-sm text-subtle">Text-to-speech isn't supported in this browser.</p> : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select id="voice" label="Voice" value={prefs.tts_voice ?? ''} onChange={(v) => { narrator.setVoice(v || null); save({ tts_voice: v || null }); }}
              options={[['', 'Device default'], ...voices.map((v) => [v.name, `${v.name} (${v.lang})`] as [string, string])]} />
            <Select id="rate" label="Reading speed" value={String(prefs.tts_rate)} onChange={(v) => { narrator.setRate(Number(v)); save({ tts_rate: Number(v) }); }}
              options={[['0.75', '0.75×'], ['0.9', '0.9×'], ['1', '1×'], ['1.15', '1.15×'], ['1.3', '1.3×'], ['1.5', '1.5×']]} />
          </div>
        )}
      </Section>

      <Section title="Faithly AI memory" hint="Off by default. When on, Faithly includes the notes below with your questions so answers can reflect what matters to you. Nothing is remembered automatically — only what you write here.">
        <Toggle checked={prefs.ai_memory_enabled} onChange={(v) => save({ ai_memory_enabled: v }, v ? 'Memory turned on' : 'Memory turned off')} label="Use my notes to personalise answers" />
        <label htmlFor="mem" className="label mt-4">What would you like Faithly to remember?</label>
        <textarea id="mem" className="input min-h-[100px]" value={memory} onChange={(e) => setMemory(e.target.value)} maxLength={1500}
          placeholder="e.g. I'm a carer for my dad. I'm working through Mark's Gospel. I find Psalms comforting." />
        <div className="mt-2 flex gap-2">
          <button className="btn-secondary" onClick={() => save({ ai_memory: memory.trim() }, 'Memory saved')}>Save</button>
          <button className="btn-ghost" onClick={() => { setMemory(''); save({ ai_memory: '' }, 'Memory cleared'); }}>Clear memory</button>
        </div>
      </Section>

      <Section title="Reminders" hint="Gentle, optional reminders. We never send notifications without your permission.">
        {support === 'not-configured' && <p className="text-sm text-subtle">Push reminders aren't set up on this server yet (the administrator needs to add VAPID keys — see README). Your choices below are still saved.</p>}
        {support === 'needs-install' && <p className="text-sm text-subtle">On iPhone and iPad, notifications work once Faithly is added to your Home Screen (Share → Add to Home Screen, iOS 16.4 or later). Open it from there to turn them on.</p>}
        {support === 'unsupported' && <p className="text-sm text-subtle">This browser doesn't support web notifications.</p>}
        {support === 'supported' && (
          <Toggle checked={pushOn} onChange={togglePush} label="Allow notifications on this device" hint="Required for any reminder below to reach you here." />
        )}
        {notif && (
          <div className="mt-4 space-y-3">
            <ReminderRow label="Morning Scripture" checked={notif.morning_scripture} time={notif.morning_time} onToggle={(v) => saveNotif({ morning_scripture: v })} onTime={(t) => saveNotif({ morning_time: t })} />
            <ReminderRow label="Daily devotional" checked={notif.daily_devotional} time={notif.devotional_time} onToggle={(v) => saveNotif({ daily_devotional: v })} onTime={(t) => saveNotif({ devotional_time: t })} />
            <ReminderRow label="Evening prayer" checked={notif.evening_prayer} time={notif.evening_time} onToggle={(v) => saveNotif({ evening_prayer: v })} onTime={(t) => saveNotif({ evening_time: t })} />
            <Toggle checked={notif.journey_reminder} onChange={(v) => saveNotif({ journey_reminder: v })} label="Faith journey reminder" hint="Sent at your morning time, only while a journey is in progress." />
            <Toggle checked={notif.journal_reminder} onChange={(v) => saveNotif({ journal_reminder: v })} label="Prayer journal reminder" hint="Sent at your evening time." />
            <p className="text-xs text-subtle">Times use your current time zone ({notif.timezone}).</p>
          </div>
        )}
      </Section>

      <Section title="Subscription">
        <p className="text-sm">{isPremium ? 'You have Faithly Premium.' : 'You are on the free plan.'}</p>
        <Link to="/premium" className="btn-secondary mt-3">{isPremium ? 'Manage subscription' : 'See Premium'}</Link>
      </Section>

      <Section title="Privacy & data" hint="Your journal, prayers and conversations are private to you. They are never shown to other users, administrators or used to train AI models.">
        <div className="flex flex-wrap gap-2">
          <button onClick={doExport} className="btn-secondary" disabled={exporting}><Download className="h-4 w-4" />{exporting ? 'Preparing…' : 'Download all my data'}</button>
          <Link to="/privacy" className="btn-ghost">Privacy policy</Link>
          <Link to="/terms" className="btn-ghost">Terms</Link>
        </div>
        <div className="mt-6 border-t border-line pt-5">
          <button onClick={() => setDeleteOpen(true)} className="btn border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"><Trash2 className="h-4 w-4" />Delete my account</button>
        </div>
      </Section>

      <button onClick={signOut} className="btn-ghost w-full"><LogOut className="h-4 w-4" />Sign out</button>

      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete your account">
        <div className="space-y-4 text-sm">
          <p>This permanently deletes your account and everything in it: journal entries, prayers, conversations, highlights, notes and progress. It cannot be undone.</p>
          {isPremium && <p>Your Premium subscription will be cancelled automatically.</p>}
          <p>You may want to <button onClick={doExport} className="font-semibold underline">download your data</button> first.</p>
          <label htmlFor="del" className="label">Type DELETE to confirm</label>
          <input id="del" className="input" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} autoComplete="off" />
          {deleteError && <ErrorNote>{deleteError}</ErrorNote>}
          <button onClick={doDelete} disabled={deleteText !== 'DELETE' || deleting} className="btn w-full bg-red-700 py-3 text-white hover:bg-red-800">{deleting ? 'Deleting…' : 'Permanently delete my account'}</button>
        </div>
      </Sheet>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="card p-5" aria-label={title}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="mb-4 mt-1 text-sm text-subtle">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </section>
  );
}

function Select({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function Toggle({ checked, onChange, label, hint, className = '' }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; className?: string }) {
  return (
    <label className={`flex cursor-pointer items-start justify-between gap-4 ${className}`}>
      <span><span className="font-medium">{label}</span>{hint && <span className="block text-sm text-subtle">{hint}</span>}</span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-line transition peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-gold after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}

function ReminderRow({ label, checked, time, onToggle, onTime }: { label: string; checked: boolean; time: string; onToggle: (v: boolean) => void; onTime: (t: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1"><Toggle checked={checked} onChange={onToggle} label={label} /></div>
      <label className="sr-only" htmlFor={`t-${label}`}>{label} time</label>
      <input id={`t-${label}`} type="time" className="input !w-28 !py-2" value={time} disabled={!checked} onChange={(e) => onTime(e.target.value)} />
    </div>
  );
}
