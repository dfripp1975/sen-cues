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

export interface QuestionAllowance { daily_limit: number; daily_left: number; credits: number }

/** Raised when a question can't be asked: not Premium, out of questions, or AI paused for the month. */
export class AIQuestionError extends Error {
  constructor(public code: 'premium_required' | 'out_of_questions' | 'paused' | 'other', message: string, public allowance?: QuestionAllowance) {
    super(message);
  }
}

// Pages listen for this to keep "questions left" up to date after every answer
export const ALLOWANCE_EVENT = 'ai-allowance';
function announce(allowance: QuestionAllowance | null | undefined) {
  if (allowance) window.dispatchEvent(new CustomEvent(ALLOWANCE_EVENT, { detail: allowance }));
}

async function post(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new AIQuestionError('other', 'You must be signed in to use AI features');
  return fetch(EDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
}

async function callAI(params: AICallParams): Promise<string> {
  const response = await post({ ...params });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = ['premium_required', 'out_of_questions', 'paused'].includes(data.error) ? data.error : 'other';
    announce(data.allowance);
    throw new AIQuestionError(code, data.message || data.error || `Request failed (${response.status})`, data.allowance);
  }
  announce(data.allowance);
  return data.content || data.questions?.join('\n') || '';
}

export const AIService = {
  isConfigured(): boolean {
    return true;
  },

  /** How many questions the signed-in reader has left, without using one. Null when not Premium. */
  async getAllowance(): Promise<{ premium: boolean; allowance: QuestionAllowance | null }> {
    const response = await post({ action: 'allowance', bookTitle: '-', chapter: 1 });
    if (!response.ok) return { premium: false, allowance: null };
    const data = await response.json();
    announce(data.allowance);
    return { premium: !!data.premium, allowance: data.allowance ?? null };
  },

  async generateChapterGuide(bookTitle: string, author: string, chapter: number): Promise<string> {
    return callAI({ bookTitle, author, chapter, action: 'chapter-guide' });
  },

  async generateQuestions(bookTitle: string, author: string, chapter: number, style: string, count: number): Promise<string[]> {
    const result = await callAI({ bookTitle, author, chapter, action: 'questions', style, count });
    return result.split('\n').map(q => q.replace(/^\d+\.\s*/, '').trim()).filter(q => q.length > 0);
  },

  async generateCharacters(bookTitle: string, author: string, chapter: number): Promise<string> {
    return callAI({ bookTitle, author, chapter, action: 'characters' });
  },

  async generateThemes(bookTitle: string, author: string, chapter: number): Promise<string> {
    return callAI({ bookTitle, author, chapter, action: 'themes' });
  },

  async generateVocabulary(bookTitle: string, author: string, chapter: number): Promise<string> {
    return callAI({ bookTitle, author, chapter, action: 'vocabulary' });
  },

  async generateMissedDetails(bookTitle: string, author: string, chapter: number): Promise<string> {
    return callAI({ bookTitle, author, chapter, action: 'missed-details' });
  },

  async answerBookQuestion(bookTitle: string, author: string, chapter: number, question: string): Promise<string> {
    return callAI({ bookTitle, author, chapter, action: 'answer', question });
  },

  async explainChapter(bookTitle: string, author: string, chapter: number): Promise<string> {
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
