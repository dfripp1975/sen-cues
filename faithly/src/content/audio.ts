// Audio library definitions. Every item is narrated live by the device's voice from
// verified Bible text and authored content — nothing is pre-recorded or downloaded.

export type AudioCategory = 'morning' | 'evening' | 'scripture' | 'prayer' | 'reflection' | 'sleep' | 'meditation';

export const AUDIO_CATEGORIES: { id: AudioCategory; label: string; blurb: string }[] = [
  { id: 'morning', label: 'Morning devotionals', blurb: 'Begin the day with Scripture and a short reflection.' },
  { id: 'evening', label: 'Evening reflections', blurb: 'Psalms and prayers to close the day.' },
  { id: 'scripture', label: 'Scripture readings', blurb: 'Well-loved chapters, read aloud.' },
  { id: 'prayer', label: 'Guided prayers', blurb: 'Gentle prayers to pray along with.' },
  { id: 'reflection', label: 'Peaceful Bible reflections', blurb: 'A verse and a few quiet thoughts.' },
  { id: 'sleep', label: 'Sleep-time Scripture', blurb: 'Slow, calm readings for bedtime.' },
  { id: 'meditation', label: 'Christian meditation', blurb: 'Read, pause and reflect on a verse (lectio divina).' },
];

export interface ScriptureAudio { id: string; category: AudioCategory; title: string; refs: string[]; intro?: string; outro?: string; rate?: number }

export const SCRIPTURE_AUDIO: ScriptureAudio[] = [
  { id: 'evening-psalm-4', category: 'evening', title: 'Psalm 4 — In peace I will lie down', refs: ['Psalms 4'], outro: 'May you rest in God’s peace tonight.' },
  { id: 'evening-psalm-121', category: 'evening', title: 'Psalm 121 — My help comes from the Lord', refs: ['Psalms 121'] },
  { id: 'evening-psalm-139', category: 'evening', title: 'Psalm 139 — You know me', refs: ['Psalms 139:1-18'] },
  { id: 'read-psalm-23', category: 'scripture', title: 'Psalm 23', refs: ['Psalms 23'] },
  { id: 'read-john-1', category: 'scripture', title: 'John 1 — In the beginning was the Word', refs: ['John 1:1-18'] },
  { id: 'read-1cor-13', category: 'scripture', title: '1 Corinthians 13 — Love', refs: ['1 Corinthians 13'] },
  { id: 'read-romans-8', category: 'scripture', title: 'Romans 8 — Nothing can separate us', refs: ['Romans 8:18-39'] },
  { id: 'read-matthew-5', category: 'scripture', title: 'Matthew 5 — The Beatitudes', refs: ['Matthew 5:1-16'] },
  { id: 'read-isaiah-40', category: 'scripture', title: 'Isaiah 40 — Comfort my people', refs: ['Isaiah 40:1-11', 'Isaiah 40:28-31'] },
  { id: 'prayer-lords', category: 'prayer', title: 'The Lord’s Prayer', refs: ['Matthew 6:9-13'], intro: 'Jesus taught his disciples to pray like this. You may like to pray it slowly, line by line.', outro: 'Take a moment in silence before you continue your day.' },
  { id: 'sleep-psalm-91', category: 'sleep', title: 'Psalm 91 — Under his wings', refs: ['Psalms 91'], rate: 0.85, intro: 'Settle into a comfortable position, and breathe slowly.' },
  { id: 'sleep-psalm-131', category: 'sleep', title: 'Psalm 131 — A quiet soul', refs: ['Psalms 131', 'Psalms 62:1-2'], rate: 0.85, intro: 'Let your shoulders drop, and your breathing slow.' },
  { id: 'sleep-matthew-11', category: 'sleep', title: 'Come to me and rest', refs: ['Matthew 11:28-30', 'Psalms 4:8'], rate: 0.85 },
];

export interface MeditationAudio { id: string; title: string; ref: string; focus: string }

/** Lectio divina: the verse is read several times with silent pauses between. */
export const MEDITATIONS: MeditationAudio[] = [
  { id: 'med-be-still', title: 'Be still and know', ref: 'Psalms 46:10', focus: 'stillness' },
  { id: 'med-my-peace', title: 'My peace I give you', ref: 'John 14:27', focus: 'peace' },
  { id: 'med-shepherd', title: 'The Lord is my shepherd', ref: 'Psalms 23:1-3', focus: 'trust' },
  { id: 'med-new-mercies', title: 'New every morning', ref: 'Lamentations 3:22-23', focus: 'hope' },
];

export function meditationScript(title: string, ref: string, text: string): string[] {
  return [
    `${title}. A guided Scripture meditation.`,
    'Find a comfortable position. Close your eyes if you wish, and take three slow breaths.',
    '[pause:12]',
    `Listen to these words from ${ref}.`,
    text,
    '[pause:15]',
    'Hear them again. This time, notice which word or phrase stands out to you.',
    text,
    '[pause:20]',
    'Hold that word or phrase gently. What might God be inviting you to notice today?',
    '[pause:25]',
    'One final time, listen, and respond to God in your own words, silently.',
    text,
    '[pause:30]',
    'Rest for a moment in God’s presence, simply being with him.',
    '[pause:20]',
    'When you are ready, take a deep breath, and gently return. Amen.',
  ];
}
