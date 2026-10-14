// Detects messages that may indicate risk of harm, so the app responds with
// care and real-world help instead of a generated answer.

const PATTERNS: RegExp[] = [
  /\b(kill|hurt|harm|cut)\s+(myself|me)\b/i,
  /\bsuicid/i,
  /\b(end|take)\s+(my|my own)\s+life\b/i,
  /\bwant\s+to\s+die\b/i,
  /\b(don'?t|do not)\s+want\s+to\s+(live|be alive|be here)\b/i,
  /\bbetter\s+off\s+(dead|without me)\b/i,
  /\bself[-\s]?harm/i,
  /\boverdose\b/i,
  /\b(he|she|they|my (husband|wife|partner|dad|mum|mom|father|mother|parent|boyfriend|girlfriend))\s+(hits|beats|hurts|abuses|is abusing)\s+me\b/i,
  /\b(being|been)\s+(abused|assaulted|raped)\b/i,
  /\bnot\s+safe\s+at\s+home\b/i,
];

export function detectCrisis(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}

export const SUPPORT_RESOURCES = [
  { name: 'Emergency services', detail: 'If you or someone else is in immediate danger, call 999 (UK) or your local emergency number.' },
  { name: 'Samaritans', detail: 'Call 116 123, free, any time, day or night (UK & Ireland).' },
  { name: 'Shout', detail: 'Text SHOUT to 85258 for free, confidential text support (UK).' },
  { name: 'NHS 111', detail: 'Call 111 and choose the mental health option for urgent help (England).' },
  { name: 'National Domestic Abuse Helpline', detail: 'Call 0808 2000 247, free, 24 hours (UK).' },
  { name: 'Outside the UK', detail: 'Find a local helpline at findahelpline.com.' },
];

export const CRISIS_MESSAGE =
  "I'm really glad you told me. What you're carrying sounds incredibly heavy, and you deserve support from a real person right now. " +
  "Faithly is an app and can't keep you safe in a crisis, but there are people available who can listen and help today. " +
  'Please consider reaching out to one of the services below, or to someone you trust — a friend, family member, church leader or your GP. ' +
  'You are not alone, and reaching out is a brave and good step.';
