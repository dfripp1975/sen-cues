// Static option lists and authored content used across the app.
// Scripture references only — text is always loaded from the Bible database.

export const REASONS = [
  { id: 'grow', label: 'To grow closer to God' },
  { id: 'understand', label: 'To understand the Bible better' },
  { id: 'peace', label: 'To find peace in a hard season' },
  { id: 'habit', label: 'To build a daily habit' },
  { id: 'prayer', label: 'To pray more' },
  { id: 'exploring', label: "I'm exploring Christianity" },
];

export const FOCUS_AREAS = [
  { id: 'strengthening_faith', label: 'Strengthening faith' },
  { id: 'finding_peace', label: 'Finding peace' },
  { id: 'understanding_scripture', label: 'Understanding Scripture' },
  { id: 'prayer', label: 'Prayer' },
  { id: 'anxiety', label: 'Anxiety and worry' },
  { id: 'forgiveness', label: 'Forgiveness' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'grief', label: 'Grief' },
  { id: 'finding_purpose', label: 'Finding purpose' },
  { id: 'building_habits', label: 'Building daily habits' },
];

export const FAMILIARITY = [
  { id: 'new', label: "I'm new to the Bible" },
  { id: 'some', label: "I've read some of it" },
  { id: 'familiar', label: 'I read it fairly regularly' },
  { id: 'very_familiar', label: 'I know it well' },
];

export const DAILY_MINUTES = [5, 10, 15, 20, 30];

export const TRADITIONS = [
  'No preference', 'Anglican / Church of England', 'Baptist', 'Catholic', 'Evangelical', 'Methodist',
  'Non-denominational', 'Orthodox', 'Pentecostal / Charismatic', 'Presbyterian / Reformed', 'Still exploring',
];

export type Mood = 'happy' | 'anxious' | 'sad' | 'grateful' | 'overwhelmed' | 'lonely' | 'hopeful' | 'uncertain';

export const MOODS: { id: Mood; label: string; emoji: string; refs: string[]; exercise: string; prayer: string }[] = [
  {
    id: 'happy', label: 'Happy', emoji: '😊', refs: ['Psalms 118:24', 'James 1:17'],
    exercise: 'Take a moment to notice where today\'s joy came from. Write down one good gift and thank God for it by name.',
    prayer: 'Thank you, God, for the joy of today. Help me to notice your goodness and to share this gladness with someone else. Amen.',
  },
  {
    id: 'anxious', label: 'Anxious', emoji: '😟', refs: ['Philippians 4:6-7', '1 Peter 5:7'],
    exercise: 'Try slow breathing: in for four counts, out for six, five times. Then name one worry and hand it to God in a single sentence.',
    prayer: 'Lord, my mind is restless. I bring you what is worrying me. Thank you that you care for me. Guard my heart with your peace. Amen.',
  },
  {
    id: 'sad', label: 'Sad', emoji: '😔', refs: ['Psalms 34:18', 'Matthew 5:4'],
    exercise: 'It is all right to be sad. Tell God honestly how you feel, without tidying it up. If you can, reach out to someone you trust today.',
    prayer: 'God, you are close to the broken-hearted. Meet me in this sadness. I do not need to pretend with you. Hold me today. Amen.',
  },
  {
    id: 'grateful', label: 'Grateful', emoji: '🙏', refs: ['Psalms 103:1-2', '1 Thessalonians 5:18'],
    exercise: 'List three specific things you are grateful for, and consider telling one person why you are thankful for them.',
    prayer: 'Thank you, Lord, for every good thing you have given. Keep my heart thankful, and let my gratitude overflow into kindness. Amen.',
  },
  {
    id: 'overwhelmed', label: 'Overwhelmed', emoji: '😮‍💨', refs: ['Matthew 11:28-30', 'Psalms 61:2'],
    exercise: 'Write everything on your mind as a list. Circle just one thing to do next, and give the rest to God for now.',
    prayer: 'Jesus, there is too much for me today. I come to you for rest. Help me to take just the next step, and to trust you with the rest. Amen.',
  },
  {
    id: 'lonely', label: 'Lonely', emoji: '🫂', refs: ['Deuteronomy 31:8', 'Psalms 68:5-6'],
    exercise: 'Remember that God is with you right now. Then think of one person you could message today, even briefly.',
    prayer: 'Lord, I feel alone. Thank you that you never leave me. Please bring good people alongside me, and help me to reach out. Amen.',
  },
  {
    id: 'hopeful', label: 'Hopeful', emoji: '🌱', refs: ['Romans 15:13', 'Jeremiah 29:11'],
    exercise: 'Write down what you are hoping for, and one small step you could take toward it today with God\'s help.',
    prayer: 'God of hope, thank you for this hope in my heart. Guide my steps and keep me trusting you whatever happens. Amen.',
  },
  {
    id: 'uncertain', label: 'Uncertain', emoji: '🤔', refs: ['Proverbs 3:5-6', 'James 1:5'],
    exercise: 'Write down the decision or question you are unsure about. Ask God for wisdom, and consider who you could talk it through with.',
    prayer: 'Lord, I do not know the way forward. I ask you for wisdom. Help me to trust you even when I cannot see the whole path. Amen.',
  },
];

export const PRAYER_CATEGORIES = [
  { id: 'morning', label: 'Morning prayer' },
  { id: 'evening', label: 'Evening prayer' },
  { id: 'family', label: 'For family' },
  { id: 'friends', label: 'For friends' },
  { id: 'strength', label: 'For strength' },
  { id: 'forgiveness', label: 'For forgiveness' },
  { id: 'peace', label: 'For peace' },
  { id: 'guidance', label: 'For guidance' },
  { id: 'gratitude', label: 'For gratitude' },
  { id: 'custom', label: 'Custom prayer' },
];

export const SUGGESTED_QUESTIONS = [
  'What does the Bible say about anxiety?',
  'How can I learn to forgive someone?',
  'Why does God allow suffering?',
  'How do I become closer to God?',
  'Explain Psalm 23.',
  'What can I learn from the story of Job?',
  'How do I start praying?',
];

export const DAILY_ACTIVITIES = [
  { id: 'scripture', label: "Today's Scripture" },
  { id: 'reflection', label: 'Personal reflection' },
  { id: 'prayer', label: 'Daily prayer' },
  { id: 'journal', label: 'Spiritual journal' },
  { id: 'challenge', label: 'Bible challenge' },
] as const;
export type DailyActivity = (typeof DAILY_ACTIVITIES)[number]['id'];
