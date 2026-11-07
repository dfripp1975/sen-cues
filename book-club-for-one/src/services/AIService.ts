import { supabase } from '@/lib/supabase';
import { generateNames, generateIcebreakers, generateChallenge, getRandomQuestion } from '@/data/generators';

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-book-club`;

interface AICallParams {
  bookTitle: string;
  author?: string;
  chapter: number;
  action: string;
  question?: string;
  style?: string;
  count?: number;
}

async function callAI(params: AICallParams): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('You must be signed in to use AI features');

  const response = await fetch(EDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Request failed (${response.status})`);
  }

  const data = await response.json();
  return data.content || data.questions?.join('\n') || '';
}

async function trackUsage(action: string, bookTitle: string): Promise<void> {
  try {
    await supabase.from('ai_usage').insert({ action, book_title: bookTitle });
  } catch {
    // silent fail — usage tracking is best-effort
  }
}

export const AIService = {
  isConfigured(): boolean {
    return true;
  },

  async generateChapterGuide(bookTitle: string, author: string, chapter: number): Promise<string> {
    await trackUsage('chapter-guide', bookTitle);
    return callAI({ bookTitle, author, chapter, action: 'chapter-guide' });
  },

  async generateQuestions(bookTitle: string, author: string, chapter: number, style: string, count: number): Promise<string[]> {
    await trackUsage('questions', bookTitle);
    const result = await callAI({ bookTitle, author, chapter, action: 'questions', style, count });
    return result.split('\n').map(q => q.replace(/^\d+\.\s*/, '').trim()).filter(q => q.length > 0);
  },

  async generateCharacters(bookTitle: string, author: string, chapter: number): Promise<string> {
    await trackUsage('characters', bookTitle);
    return callAI({ bookTitle, author, chapter, action: 'characters' });
  },

  async generateThemes(bookTitle: string, author: string, chapter: number): Promise<string> {
    await trackUsage('themes', bookTitle);
    return callAI({ bookTitle, author, chapter, action: 'themes' });
  },

  async generateVocabulary(bookTitle: string, author: string, chapter: number): Promise<string> {
    await trackUsage('vocabulary', bookTitle);
    return callAI({ bookTitle, author, chapter, action: 'vocabulary' });
  },

  async generateMissedDetails(bookTitle: string, author: string, chapter: number): Promise<string> {
    await trackUsage('missed-details', bookTitle);
    return callAI({ bookTitle, author, chapter, action: 'missed-details' });
  },

  async answerBookQuestion(bookTitle: string, author: string, chapter: number, question: string): Promise<string> {
    await trackUsage('answer', bookTitle);
    return callAI({ bookTitle, author, chapter, action: 'answer', question });
  },

  async explainChapter(bookTitle: string, author: string, chapter: number): Promise<string> {
    await trackUsage('explain', bookTitle);
    return callAI({ bookTitle, author, chapter, action: 'explain' });
  },

  async generateNames(style: string, keywords: string) {
    return generateNames(style, keywords);
  },

  async generateIcebreakers(style: string) {
    return generateIcebreakers(style);
  },

  async generateChallenge(duration: string) {
    return generateChallenge(duration);
  },

  async getRandomQuestion(category?: string) {
    return getRandomQuestion(category);
  },
};
