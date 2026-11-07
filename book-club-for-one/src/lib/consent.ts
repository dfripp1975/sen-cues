// Cookie consent state, shared by the banner and anything that sets
// non-essential cookies (currently only ads).
const STORAGE_KEY = 'cookie-consent-v1';
const EVENT = 'cookie-consent-change';

export type ConsentChoice = 'accepted' | 'rejected';

export function getConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'accepted' || v === 'rejected' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Storage blocked: the choice still applies for this page view
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: choice }));
}

export function onConsentChange(cb: (choice: ConsentChoice) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<ConsentChoice>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
