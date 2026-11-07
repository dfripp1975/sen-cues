import type { BookClubQuestion, GeneratedName, IcebreakerQuestion, ReadingChallengeTask } from '@/types';

const generalQuestions = [
  'What did you think of the book overall?',
  'Would you recommend this book to others? Why or why not?',
  'What was your favourite part of the book?',
  'What was your least favourite part?',
  'Did the book meet your expectations?',
  'How did this book make you feel?',
  'What will you remember most about this book?',
  'Did the book change your perspective on anything?',
  'How does this book compare to others in the same genre?',
  'Would you read more books by this author?',
  'What was the most surprising thing about the book?',
  'Did the book feel too long, too short, or just right?',
];

const deepQuestions = [
  'What deeper themes or messages did you find in the book?',
  'How did the author use symbolism to enhance the story?',
  'What social or political commentary did you notice?',
  'How does this book reflect the time period in which it was written?',
  'What moral questions does the book raise?',
  'How does the author challenge the reader\'s assumptions?',
  'What does the book say about human nature?',
  'How does the structure of the narrative affect the story?',
  'What unresolved questions do you have after finishing?',
  'How does the setting contribute to the themes?',
  'In what ways does the book explore power dynamics?',
  'What does the book suggest about fate versus free will?',
];

const characterQuestions = [
  'Which character did you relate to the most, and why?',
  'Which character underwent the most significant change?',
  'Did any character\'s actions surprise you?',
  'Who was your least favourite character, and why?',
  'Which character would you want as a friend in real life?',
  'Did any characters feel underdeveloped?',
  'How do the characters\' relationships drive the story?',
  'Which character faced the most difficult moral choice?',
  'Did you trust the narrator? Why or why not?',
  'How do the secondary characters contribute to the story?',
  'Which character made the most questionable decisions?',
  'How do the characters grow or fail to grow throughout the story?',
];

const themeQuestions = [
  'What do you think is the central theme of the book?',
  'How does the author explore the theme of love?',
  'What role does family play in the story?',
  'How is the theme of identity explored?',
  'What does the book say about society and class?',
  'How does the author handle the theme of justice?',
  'What does the book suggest about truth and deception?',
  'How is the theme of belonging portrayed?',
  'What does the book say about ambition and its consequences?',
  'How does the theme of memory shape the narrative?',
  'What role does nature or the environment play thematically?',
  'How does the book explore the tension between duty and desire?',
];

const funQuestions = [
  'If this book were a film, who would you cast in the main roles?',
  'What would the book\'s soundtrack sound like?',
  'If you could have dinner with one character, who would it be?',
  'What would a sequel to this book look like?',
  'Which character would make the worst roommate?',
  'If you could visit the book\'s setting, would you?',
  'What cocktail or drink represents this book?',
  'If the book had a tagline, what would it be?',
  'Which character would survive a zombie apocalypse?',
  'What reality show would the main character appear on?',
  'If you could rename the book, what would you call it?',
  'What three words would you use to describe this book?',
];

const chapterQuestions = [
  'What has happened so far that surprised you the most?',
  'How have the characters changed since the beginning?',
  'What do you think the author is setting up for later?',
  'Which plot thread are you most invested in so far?',
  'Has your opinion of the main character changed?',
  'What questions do you hope get answered soon?',
  'Which scene so far was the most memorable?',
  'How has the setting influenced events up to this point?',
  'What do you think the main conflict will be?',
  'Are there any clues or foreshadowing you have noticed?',
  'What would you do differently if you were the protagonist?',
  'How does the pacing feel so far?',
];

export function generateQuestions(
  style: string,
  count: number,
): BookClubQuestion[] {
  const styleMap: Record<string, string[]> = {
    'general': generalQuestions,
    'deep': deepQuestions,
    'character': characterQuestions,
    'theme': themeQuestions,
    'fun': funQuestions,
    'chapter': chapterQuestions,
  };

  const pool = styleMap[style] || generalQuestions;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((text, i) => ({
    text: `${i + 1}. ${text}`,
    category: style,
  }));
}

const nameTemplates: Record<string, string[]> = {
  funny: [
    'The {kw} Book Bandits', 'Read Between the {kw} Wines', 'The {kw} Page Turners', 'Bookworms & {kw}', 'The {kw} Bibliophiles Anonymous', 'Wine, {kw} & Words', 'The {kw} Chapter Chasers', 'Dog-Eared & {kw}', 'The {kw} Plot Twisters', 'Between Covers & {kw}', 'The {kw} Midnight Readers', 'Prose Before {kw}',
  ],
  clever: [
    'The {kw} Literary Society', 'Margin Notes & {kw}', 'The {kw} Voluminous Readers', 'Dog-Ear {kw} Society', 'The {kw} Prose Collective', 'Spine Creasers of {kw}', 'The {kw} Chapter Eleven', 'Folio & {kw} Club', 'The {kw} Well-Thumbed', 'Unbound {kw} Readers', 'The {kw} Paragraph Society', 'Ink & {kw} Book Club',
  ],
  cosy: [
    'The {kw} Reading Circle', 'Cosy Pages & {kw}', 'The {kw} Hearthside Readers', 'Tea, {kw} & Tales', 'The {kw} Blanket Readers', 'Warm Words & {kw}', 'The {kw} Fireside Book Club', 'Comfort Reads & {kw}', 'The {kw} Armchair Readers', 'Snug Stories & {kw}', 'The {kw} Reading Nest', 'Gentle Pages of {kw}',
  ],
  literary: [
    'The {kw} Brontë Society', 'Literary {kw} Guild', 'The {kw} Austen Circle', 'Classics & {kw} Collective', 'The {kw} Eliot Readers', 'Dickens & {kw} Society', 'The {kw} Woolf Salon', 'Hardy & {kw} Book Club', 'The {kw} Shakespeare Society', 'Tennyson & {kw} Readers', 'The {kw} Keats Collective', 'Wordsworth & {kw} Club',
  ],
  modern: [
    'The {kw} Book Bar', 'Page & {kw} Co.', 'The {kw} Reading Lab', 'Bookish {kw}', 'The {kw} Chapter House', '{kw} Story Society', 'The {kw} Reading Room', 'Next Chapter {kw}', 'The {kw} Book Hub', '{kw} Literary Lounge', 'The {kw} Reading Project', '{kw} Book Collective',
  ],
  friends: [
    'Friends & {kw} Fiction', 'The {kw} Girls Who Read', '{kw} Book Buddies', 'The {kw} Reading Friends', 'Girls, {kw} & Good Books', 'The {kw} Page Pals', '{kw} Book Squad', 'The {kw} Reading Sisters', '{kw} & Books Forever', 'The {kw} Literary Ladies', '{kw} Book BFFs', 'The {kw} Story Circle',
  ],
  workplace: [
    'The {kw} Office Book Club', 'Corporate {kw} Readers', 'The {kw} Boardroom Book Club', 'Lunch & {kw} Lit', 'The {kw} Professional Pages', 'Coffee, {kw} & Chapters', 'The {kw} Desk Readers', 'After-Hours {kw} Book Club', 'The {kw} Watercooler Readers', 'Break Room {kw} Books', 'The {kw} Team Literary Society', '9-to-5 {kw} Readers',
  ],
  fantasy: [
    'The {kw} Dragon Readers', 'Quest & {kw} Books', 'The {kw} Fantasy Fellowship', 'Swords, {kw} & Stories', 'The {kw} Elven Book Club', 'Magic & {kw} Manuscripts', 'The {kw} Wizard\'s Library', 'Realm & {kw} Readers', 'The {kw} Mythic Pages', 'Spellbound {kw} Book Club', 'The {kw} Hobbit Hole Readers', 'Enchanted {kw} Books',
  ],
  romance: [
    'The {kw} Romance Readers', 'Love & {kw} Literature', 'The {kw} Heartfelt Book Club', 'Passion & {kw} Pages', 'The {kw} Romantic Readers', 'Hearts & {kw} Books', 'The {kw} Love Story Club', 'Sweet {kw} Stories', 'The {kw} Heart Pages', 'Romance & {kw} Reading', 'The {kw} Tender Tales Club', 'Stolen Hearts & {kw} Books',
  ],
  mystery: [
    'The {kw} Mystery Club', 'Clues & {kw} Chapters', 'The {kw} Detective Society', 'Whodunit & {kw} Books', 'The {kw} Suspense Readers', 'Mystery & {kw} Manuscripts', 'The {kw} Crime Pages', 'Noir & {kw} Book Club', 'The {kw} Thriller Circle', 'Suspense & {kw} Stories', 'The {kw} Enigma Readers', 'Cold Case {kw} Books',
  ],
  horror: [
    'The {kw} Midnight Society', 'Dark {kw} Pages', 'The {kw} Shadow Readers', 'Fear & {kw} Fiction', 'The {kw} Nightmare Book Club', 'Gothic {kw} Readers', 'The {kw} Macabre Circle', 'Shadows & {kw} Stories', 'The {kw} Horror Society', 'Dread & {kw} Books', 'The {kw} Cursed Pages', 'Terror & {kw} Tales',
  ],
};

export function generateNames(style: string, keywords: string): GeneratedName[] {
  const templates = nameTemplates[style] || nameTemplates.clever;
  const kw = keywords.trim() || 'Book';
  const shuffled = [...templates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 12).map(t => ({
    name: t.replace(/\{kw\}/g, kw),
    style,
  }));
}

const icebreakers: Record<string, string[]> = {
  funny: [
    'What book would you never admit to enjoying?',
    'Which fictional character would make the worst roommate?',
    'What is the funniest book you have ever read?',
    'If you could ban one book trope, what would it be?',
    'Which book character would you ghost and why?',
    'What is the most embarrassing book you have read in public?',
  ],
  'thought-provoking': [
    'What book changed the way you think about something?',
    'If you could unread one book to experience it again, which would it be?',
    'What book do you wish you had read sooner?',
    'Which character do you disagree with but still understand?',
    'What book challenged a belief you held?',
    'If you could ask an author one question, what would it be?',
  ],
  quick: [
    'What are you currently reading?',
    'What is your favourite genre?',
    'Hardcover, paperback, or ebook?',
    'Do you dog-ear pages?',
    'What is your favourite book-to-film adaptation?',
    'What book is on your nightstand right now?',
  ],
  'getting-to-know': [
    'What was the first book you remember loving?',
    'Who taught you to read?',
    'Did you read as a child, or come to it later?',
    'What is your reading routine?',
    'Where is your favourite place to read?',
    'What book makes you feel nostalgic?',
  ],
  'book-related': [
    'What is the last book that made you cry?',
    'Which book world would you most want to live in?',
    'What is the longest book you have ever read?',
    'Do you judge a book by its cover?',
    'Have you ever read a book in one sitting?',
    'What book has the best opening line?',
  ],
  'new-book-club': [
    'What brings you to this book club?',
    'What do you hope to get out of this group?',
    'What kind of books do you love?',
    'What is your favourite book of all time?',
    'How did you hear about this book club?',
    'What is one book you think everyone should read?',
  ],
};

export function generateIcebreakers(style: string): IcebreakerQuestion[] {
  const pool = icebreakers[style] || icebreakers.funny;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5).map(text => ({ text, category: style }));
}

const challengeTasks: ReadingChallengeTask[] = [
  { description: 'Read a classic novel', icon: 'BookMarked' },
  { description: 'Read a book under 200 pages', icon: 'BookOpen' },
  { description: 'Read a mystery or thriller', icon: 'Search' },
  { description: 'Read a debut novel', icon: 'Sparkles' },
  { description: 'Read something published before you were born', icon: 'Clock' },
  { description: 'Read a book by an author from another country', icon: 'Globe' },
  { description: 'Read a non-fiction book', icon: 'NotebookPen' },
  { description: 'Read a book recommended by a friend', icon: 'Users' },
  { description: 'Read a book in a genre you rarely read', icon: 'Compass' },
  { description: 'Read a book with a one-word title', icon: 'Type' },
  { description: 'Read a book set in a place you want to visit', icon: 'MapPin' },
  { description: 'Read a book that won an award', icon: 'Trophy' },
  { description: 'Read a collection of short stories', icon: 'Library' },
  { description: 'Read a book with a colour in the title', icon: 'Palette' },
  { description: 'Read a book over 500 pages', icon: 'BookText' },
  { description: 'Read a book by a new-to-you author', icon: 'UserPlus' },
  { description: 'Read a book adapted into a film', icon: 'Film' },
  { description: 'Read a book of poetry', icon: 'Feather' },
  { description: 'Read a book set during winter', icon: 'Snowflake' },
  { description: 'Read a book about books or reading', icon: 'BookmarkCheck' },
];

export function generateChallenge(duration: string): ReadingChallengeTask[] {
  const numTasks = duration === '7 days' ? 3 : duration === '30 days' ? 5 : duration === '3 months' ? 8 : duration === '6 months' ? 12 : 20;
  const shuffled = [...challengeTasks].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numTasks);
}

const randomQuestions = [
  ...generalQuestions, ...deepQuestions, ...characterQuestions, ...themeQuestions, ...funQuestions,
  'What scene from the book would you most like to witness?',
  'If you could change one thing about the ending, what would it be?',
  'What did the book teach you about yourself?',
  'How would the story change if it were set today?',
  'What would the antagonist say if they told the story?',
  'Which relationship in the book was the most complex?',
  'What role does silence play in the narrative?',
  'How does the title reflect the story?',
  'What was the most powerful quote or passage?',
  'How would you describe the book in one sentence?',
  'What did the book make you curious about?',
  'If you could step into the book, when would you arrive?',
  'What would the main character\'s social media look like?',
  'How does the book explore the idea of home?',
  'What secret is the author keeping from the reader?',
  'How does the book handle the passage of time?',
  'What would a prequel to this book explore?',
  'Which character carries the emotional weight of the story?',
  'What is the most important conversation in the book?',
  'How does the book define success or failure?',
];

export function getRandomQuestion(category?: string): string {
  let pool = randomQuestions;
  if (category && category !== 'any') {
    const map: Record<string, string[]> = {
      characters: characterQuestions,
      plot: generalQuestions,
      themes: themeQuestions,
      writing: deepQuestions,
      emotional: ['What did the book make you feel?', 'When did you feel most moved?', 'What made you laugh or cry?', 'What stirred your emotions most?'],
      fun: funQuestions,
      deep: deepQuestions,
    };
    pool = map[category] || randomQuestions;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
