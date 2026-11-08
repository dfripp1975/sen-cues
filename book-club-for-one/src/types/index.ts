export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  authorId: string;
  year: number;
  genre: string[];
  subgenres: string[];
  pages: number;
  chapters: number;
  description: string;
  coverColor: string;
  coverAccent: string;
  isbn?: string;
  publicDomain: boolean;
  trending?: boolean;
  popular?: boolean;
  classic?: boolean;
  reviewCommentary?: string;
  whyRead?: string;
  /** Set when the full text can be read on the site (public domain worldwide). */
  readSlug?: string;
  /** Local cover image for readable books (Standard Ebooks cover design). */
  coverImage?: string;
  /** One of the books every reader can read for free; the rest need Premium. */
  freeToRead?: boolean;
  translators?: string[];
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  birthYear?: number;
  deathYear?: number;
  nationality?: string;
}

export interface Character {
  name: string;
  role: string;
  description: string;
  firstChapter: number;
  family?: string[];
  friends?: string[];
  enemies?: string[];
  romantic?: string[];
  alliances?: string[];
  connections?: { name: string; type: string; chapter: number }[];
}

export interface ChapterInfo {
  number: number;
  title: string;
  summary: string;
  themes: string[];
  vocabulary: { word: string; definition: string; context: string }[];
}

export interface ToolMeta {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  category: string;
  icon: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  howItWorks: string[];
  howToUse: string[];
  example: string;
  tips: string[];
  faq: { q: string; a: string }[];
  relatedTools: string[];
}

export interface ReadingGoal {
  booksPerMonth: number;
  booksPerWeek: number;
  pagesPerMonth: number;
  pagesPerWeek: number;
  pagesPerDay: number;
}

export interface BookClubQuestion {
  text: string;
  category: string;
}

export interface GeneratedName {
  name: string;
  style: string;
}

export interface ReadingChallengeTask {
  description: string;
  icon: string;
}

export interface IcebreakerQuestion {
  text: string;
  category: string;
}

export interface MeetingAgendaItem {
  activity: string;
  duration: number;
  description: string;
}

export interface ScheduleMeeting {
  meetingNumber: number;
  date: string;
  chapters: string;
  pages: string;
}

export interface ReadingListItem {
  id: string;
  title: string;
  author: string;
  category: 'want-to-read' | 'next-up' | 'priority' | 'someday';
  order: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  daysReadThisMonth: number;
  totalReadingDays: number;
  lastReadDate: string;
}

export interface BookRating {
  plot: number;
  characters: number;
  writing: number;
  pacing: number;
  originality: number;
  enjoyment: number;
}
