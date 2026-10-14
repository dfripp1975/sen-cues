// Faithly AI — one Edge Function for every AI feature.
// Modes: chat | deeper | explain_verse | study | prayer | journey_reflection
//
// Every request: authenticates the caller, enforces the daily allowance server-side,
// checks premium-only modes against the subscriptions table, verifies every Bible
// reference against bible_verses before returning it, and records usage.

import { corsHeaders, errorResponse, json } from '../_shared/cors.ts';
import { adminClient, getUser, isPremium } from '../_shared/supabase.ts';
import { AINotConfiguredError, AIProviderError, generateJson, parseModelJson, type ChatTurn } from '../_shared/ai.ts';
import { verifyReferences, loadPassage, passageToPlainText } from '../_shared/bible.ts';
import { detectCrisis, CRISIS_MESSAGE, SUPPORT_RESOURCES } from '../_shared/safety.ts';
import { DAILY_LIMIT_FREE, DAILY_LIMIT_PREMIUM, usedToday, estimateCostUsd } from '../_shared/limits.ts';
import { parseReference, bookById } from '../_shared/bibleRef.ts';
import {
  CORE, contextBlock, CHAT_SCHEMA, DEEPER_SCHEMA, EXPLAIN_VERSE_SCHEMA, studySchema, PRAYER_SCHEMA,
  JOURNEY_REFLECTION_SCHEMA, type UserContext,
} from '../_shared/prompts.ts';

type Mode = 'chat' | 'deeper' | 'explain_verse' | 'study' | 'prayer' | 'journey_reflection';
const MODES: Mode[] = ['chat', 'deeper', 'explain_verse', 'study', 'prayer', 'journey_reflection'];
const MAX_INPUT = 2000;

const PRAYER_CATEGORIES: Record<string, string> = {
  morning: 'a morning prayer to begin the day',
  evening: 'an evening prayer to close the day',
  family: 'a prayer for family',
  friends: 'a prayer for friends',
  strength: 'a prayer for strength',
  forgiveness: 'a prayer about forgiveness (receiving or giving)',
  peace: 'a prayer for peace',
  guidance: 'a prayer for guidance',
  gratitude: 'a prayer of gratitude',
  custom: 'a prayer about what the user describes',
};

const str = (v: unknown, max = MAX_INPUT) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse(405, 'method_not_allowed', 'Use POST.');

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'unauthorised', 'Please sign in to use Faithly AI.');

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, 'bad_request', 'Invalid request body.');
  }
  const mode = body.mode as Mode;
  if (!MODES.includes(mode)) return errorResponse(400, 'bad_request', 'Unknown mode.');

  const db = adminClient();
  const premium = await isPremium(db, user.id);
  const limit = premium ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;

  // Load preferences for personalisation.
  const { data: prefs } = await db
    .from('user_preferences')
    .select('bible_familiarity, tradition, focus_areas, new_to_christianity, ai_memory_enabled, ai_memory, translation_code')
    .eq('user_id', user.id)
    .maybeSingle();
  const ctx: UserContext = {
    familiarity: prefs?.bible_familiarity ?? null,
    tradition: prefs?.tradition ?? null,
    focusAreas: prefs?.focus_areas ?? [],
    newToChristianity: !!prefs?.new_to_christianity || body.newToChristianity === true,
    memory: prefs?.ai_memory_enabled ? prefs?.ai_memory : null,
  };
  const translation = 'WEB';

  // ── Safety first: crisis messages get a fixed, human-written response with real help. ──
  const userText = str(body.message) || str(body.details);
  if (userText && detectCrisis(userText)) {
    const comfort = await loadPassage(db, { bookId: 19, chapter: 34, verseStart: 18, verseEnd: 18 }, translation);
    const payload = {
      safety: true,
      answer: CRISIS_MESSAGE,
      resources: SUPPORT_RESOURCES,
      passages: comfort ? [comfort] : [],
      follow_ups: [],
    };
    if (mode === 'chat') {
      const conversationId = await persistChat(db, user.id, str(body.conversationId), userText, CRISIS_MESSAGE, payload, 'Support');
      return json({ ...payload, conversationId });
    }
    return json(payload);
  }

  // ── Premium-only modes, enforced here (not just in the UI). ──
  const level = str(body.level, 20) || 'beginner';
  if (mode === 'journey_reflection' && !premium) {
    return errorResponse(402, 'premium_required', 'Personalised journey reflections are part of Faithly Premium.');
  }
  if (mode === 'study' && level === 'advanced' && !premium) {
    return errorResponse(402, 'premium_required', 'Advanced study mode is part of Faithly Premium.');
  }

  // ── Cached, non-personal requests don't count against the allowance. ──
  let cacheKey: string | null = null;
  if (mode === 'explain_verse' || mode === 'study') {
    cacheKey = await sha256(JSON.stringify([mode, str(body.reference, 40), str(body.book, 40), body.chapter, level, ctx.newToChristianity, translation]));
    const { data: cached } = await db.from('ai_cache').select('payload').eq('cache_key', cacheKey).maybeSingle();
    if (cached) return json({ ...cached.payload, cached: true, usage: { used: await usedToday(db, user.id), limit } });
  }

  const used = await usedToday(db, user.id);
  if (used >= limit) {
    return errorResponse(429, 'limit_reached', premium
      ? `You've reached today's limit of ${limit} AI requests. It resets at midnight (UTC).`
      : `You've used all ${limit} free AI requests for today. They reset at midnight (UTC), or upgrade to Premium for ${DAILY_LIMIT_PREMIUM} a day.`,
      { used, limit, premium });
  }

  try {
    let result: Record<string, unknown>;
    let usageMeta: { provider: string; model: string; inputTokens: number; outputTokens: number };

    switch (mode) {
      case 'chat': {
        const message = str(body.message);
        if (!message) return errorResponse(400, 'bad_request', 'Please type a question.');
        const conversationId = str(body.conversationId, 64);
        const history = conversationId ? await loadHistory(db, user.id, conversationId) : [];
        if (history === null) return errorResponse(404, 'not_found', 'Conversation not found.');
        const ai = await generateJson({
          system: CORE + contextBlock(ctx) + '\n\n' + CHAT_SCHEMA,
          messages: [...history, { role: 'user', content: message }],
          maxTokens: 2000,
        });
        usageMeta = ai;
        const out = parseModelJson<Record<string, any>>(ai.text);
        const { passages, unverified } = await verifyReferences(db, out.passages, translation, 4);
        result = {
          answer: str(out.answer, 6000),
          passages,
          unverified_references: unverified,
          explanation: str(out.explanation, 4000),
          context: str(out.context, 3000),
          interpretations: str(out.interpretations, 2000),
          reflection: str(out.reflection, 1500),
          prayer: str(out.prayer, 1500),
          follow_ups: (Array.isArray(out.follow_ups) ? out.follow_ups : []).slice(0, 3).map((q: unknown) => str(q, 200)).filter(Boolean),
          translation,
        };
        const id = await persistChat(db, user.id, conversationId, message, String(result.answer), result, str(out.title, 80));
        result.conversationId = id;
        break;
      }

      case 'deeper': {
        const question = str(body.question);
        const answer = str(body.answer, 4000);
        if (!question) return errorResponse(400, 'bad_request', 'Missing question.');
        const ai = await generateJson({
          system: CORE + contextBlock(ctx) + '\n\n' + DEEPER_SCHEMA,
          messages: [
            { role: 'user', content: question },
            { role: 'assistant', content: answer || '(previous answer)' },
            { role: 'user', content: 'Go deeper: historical context, related passages, interpretations and practical application.' },
          ],
          maxTokens: 2000,
        });
        usageMeta = ai;
        const out = parseModelJson<Record<string, any>>(ai.text);
        const { passages, unverified } = await verifyReferences(db, out.related_passages, translation, 5);
        result = {
          historical_context: str(out.historical_context, 5000),
          related_passages: passages,
          unverified_references: unverified,
          interpretations: str(out.interpretations, 3000),
          application: str(out.application, 2000),
          follow_ups: (Array.isArray(out.follow_ups) ? out.follow_ups : []).slice(0, 3).map((q: unknown) => str(q, 200)).filter(Boolean),
        };
        // Attach to the conversation so it is kept with the history.
        const conversationId = str(body.conversationId, 64);
        if (conversationId) await persistDeeper(db, user.id, conversationId, result);
        break;
      }

      case 'explain_verse': {
        const ref = parseReference(str(body.reference, 40));
        if (!ref) return errorResponse(400, 'bad_request', 'That reference could not be found.');
        const passage = await loadPassage(db, ref, translation);
        if (!passage) return errorResponse(404, 'not_found', 'That passage is not in the Bible database.');
        const ai = await generateJson({
          system: CORE + contextBlock({ ...ctx, memory: null, focusAreas: [] }) + '\n\n' + EXPLAIN_VERSE_SCHEMA,
          messages: [{ role: 'user', content: `Explain this passage.\n${passageToPlainText(passage)}` }],
          maxTokens: 1500,
        });
        usageMeta = ai;
        const out = parseModelJson<Record<string, any>>(ai.text);
        const { passages, unverified } = await verifyReferences(db, out.related_passages, translation, 4);
        result = {
          passage,
          summary: str(out.summary, 1000),
          context: str(out.context, 3000),
          meaning: str(out.meaning, 3000),
          key_words: (Array.isArray(out.key_words) ? out.key_words : []).slice(0, 4).map((k: any) => ({ term: str(k?.term, 80), note: str(k?.note, 400) })),
          interpretations: str(out.interpretations, 2000),
          application: str(out.application, 1500),
          related_passages: passages,
          unverified_references: unverified,
        };
        break;
      }

      case 'study': {
        const book = bookById(Number(body.bookId));
        const chapter = Number(body.chapter);
        if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
          return errorResponse(400, 'bad_request', 'Please choose a valid book and chapter.');
        }
        if (!['beginner', 'intermediate', 'advanced'].includes(level)) return errorResponse(400, 'bad_request', 'Unknown level.');
        const { data: verses } = await db
          .from('bible_verses').select('verse, text')
          .eq('translation_code', translation).eq('book_id', book.id).eq('chapter', chapter).order('verse');
        if (!verses?.length) return errorResponse(404, 'not_found', 'That chapter is not in the Bible database yet.');
        const chapterText = verses.map((v) => `[${v.verse}] ${v.text}`).join(' ').slice(0, 24000);
        const ai = await generateJson({
          system: CORE + contextBlock({ ...ctx, memory: null, focusAreas: [] }) + '\n\n' + studySchema(level),
          messages: [{ role: 'user', content: `Create a study guide for ${book.name} ${chapter} (${translation}).\n\n${chapterText}` }],
          maxTokens: 4000,
        });
        usageMeta = ai;
        const out = parseModelJson<Record<string, any>>(ai.text);
        const { passages, unverified } = await verifyReferences(db, out.related_passages, translation, 4);
        // Difficult verses must be inside this chapter.
        const difficult = (Array.isArray(out.difficult_verses) ? out.difficult_verses : [])
          .map((d: any) => ({ ref: parseReference(str(d?.reference, 40)), explanation: str(d?.explanation, 1500) }))
          .filter((d: any) => d.ref && d.ref.bookId === book.id && d.ref.chapter === chapter && d.ref.verseStart && d.ref.verseStart <= verses.length)
          .slice(0, 3)
          .map((d: any) => ({ reference: `${book.name} ${chapter}:${d.ref.verseStart}`, verse: d.ref.verseStart, explanation: d.explanation }));
        const quiz = (Array.isArray(out.quiz) ? out.quiz : [])
          .filter((q: any) => Array.isArray(q?.options) && q.options.length >= 2 && Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < q.options.length)
          .slice(0, 5)
          .map((q: any) => ({ question: str(q.question, 300), options: q.options.slice(0, 4).map((o: unknown) => str(o, 150)), answer_index: q.answer_index, explanation: str(q.explanation, 500) }));
        const list = (v: unknown, n: number, max = 300) => (Array.isArray(v) ? v : []).slice(0, n).map((x) => str(x, max)).filter(Boolean);
        result = {
          book: book.name, bookId: book.id, chapter, level,
          summary: str(out.summary, 4000),
          themes: list(out.themes, 5),
          historical_background: str(out.historical_background, 3000),
          people: (Array.isArray(out.people) ? out.people : []).slice(0, 8).map((p: any) => ({ name: str(p?.name, 80), description: str(p?.description, 400) })),
          cultural_context: str(out.cultural_context, 3000),
          key_lessons: list(out.key_lessons, 5),
          difficult_verses: difficult,
          reflection_questions: list(out.reflection_questions, 4),
          quiz,
          related_passages: passages,
          unverified_references: unverified,
        };
        break;
      }

      case 'prayer': {
        const category = str(body.category, 30) || 'custom';
        const details = str(body.details, 1000);
        if (!PRAYER_CATEGORIES[category]) return errorResponse(400, 'bad_request', 'Unknown prayer type.');
        if (category === 'custom' && !details) return errorResponse(400, 'bad_request', 'Tell Faithly what you would like to pray about.');
        const ai = await generateJson({
          system: CORE + contextBlock(ctx) + '\n\n' + PRAYER_SCHEMA,
          messages: [{ role: 'user', content: `Please suggest ${PRAYER_CATEGORIES[category]}.${details ? `\nWhat the user would like to pray about: ${details}` : ''}` }],
          maxTokens: 700,
          temperature: 0.7,
        });
        usageMeta = ai;
        const out = parseModelJson<Record<string, any>>(ai.text);
        result = { title: str(out.title, 80) || 'Suggested prayer', prayer: str(out.prayer, 3000), category, ai_generated: true };
        break;
      }

      case 'journey_reflection': {
        const dayId = str(body.dayId, 64);
        const { data: day } = await db.from('journey_days')
          .select('theme, book_id, chapter, verse_start, verse_end, explanation')
          .eq('id', dayId).maybeSingle();
        if (!day) return errorResponse(404, 'not_found', 'Journey day not found.');
        const passage = await loadPassage(db, { bookId: day.book_id, chapter: day.chapter, verseStart: day.verse_start, verseEnd: day.verse_end }, translation);
        const ai = await generateJson({
          system: CORE + contextBlock(ctx) + '\n\n' + JOURNEY_REFLECTION_SCHEMA,
          messages: [{ role: 'user', content: `Theme: ${day.theme}\nPassage: ${passage ? passageToPlainText(passage) : ''}\nAuthored explanation: ${day.explanation}` }],
          maxTokens: 800,
        });
        usageMeta = ai;
        const out = parseModelJson<Record<string, any>>(ai.text);
        result = { reflection: str(out.reflection, 3000), question: str(out.question, 300) };
        break;
      }
    }

    await db.from('usage_tracking').insert({
      user_id: user.id,
      kind: mode,
      provider: usageMeta!.provider,
      model: usageMeta!.model,
      input_tokens: usageMeta!.inputTokens,
      output_tokens: usageMeta!.outputTokens,
      estimated_cost_usd: estimateCostUsd(usageMeta!.provider, usageMeta!.inputTokens, usageMeta!.outputTokens),
    });
    if (cacheKey) await db.from('ai_cache').upsert({ cache_key: cacheKey, mode, payload: result! });

    return json({ ...result!, usage: { used: used + 1, limit } });
  } catch (e) {
    if (e instanceof AINotConfiguredError) {
      return errorResponse(503, 'ai_not_configured',
        'Faithly AI is not set up yet. An administrator needs to add a GEMINI_API_KEY or OPENAI_API_KEY secret to the faithly-ai Edge Function.');
    }
    if (e instanceof SyntaxError) {
      console.error('AI returned invalid JSON', e);
      return errorResponse(502, 'ai_bad_response', 'Faithly AI gave an unexpected response. Please try again.');
    }
    if (e instanceof AIProviderError) {
      console.error(e.message);
      return errorResponse(502, 'ai_provider_error', 'The AI service is having trouble right now. Please try again in a moment.');
    }
    console.error(e);
    return errorResponse(500, 'server_error', 'Something went wrong. Please try again.');
  }
});

// ── Conversation persistence ────────────────────────────────────────────────

async function loadHistory(db: ReturnType<typeof adminClient>, userId: string, conversationId: string): Promise<ChatTurn[] | null> {
  const { data: conv } = await db.from('chat_conversations').select('id').eq('id', conversationId).eq('user_id', userId).maybeSingle();
  if (!conv) return null;
  const { data } = await db.from('chat_messages')
    .select('role, content').eq('conversation_id', conversationId)
    .order('created_at', { ascending: false }).limit(10);
  return (data ?? []).reverse().map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, 2000) }));
}

async function persistChat(
  db: ReturnType<typeof adminClient>, userId: string, conversationId: string, userMessage: string,
  answer: string, payload: Record<string, unknown>, title: string,
): Promise<string> {
  let id = conversationId;
  if (id) {
    const { data } = await db.from('chat_conversations').select('id').eq('id', id).eq('user_id', userId).maybeSingle();
    if (!data) id = '';
  }
  if (!id) {
    const { data, error } = await db.from('chat_conversations')
      .insert({ user_id: userId, title: title || userMessage.slice(0, 60) }).select('id').single();
    if (error) throw error;
    id = data.id;
  } else {
    await db.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', id);
  }
  const { error } = await db.from('chat_messages').insert([
    { conversation_id: id, user_id: userId, role: 'user', content: userMessage },
    { conversation_id: id, user_id: userId, role: 'assistant', content: answer || '(response)', payload },
  ]);
  if (error) throw error;
  return id;
}

async function persistDeeper(db: ReturnType<typeof adminClient>, userId: string, conversationId: string, deeper: Record<string, unknown>) {
  const { data: last } = await db.from('chat_messages')
    .select('id, payload').eq('conversation_id', conversationId).eq('user_id', userId).eq('role', 'assistant')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (last) await db.from('chat_messages').update({ payload: { ...(last.payload ?? {}), deeper } }).eq('id', last.id);
}

