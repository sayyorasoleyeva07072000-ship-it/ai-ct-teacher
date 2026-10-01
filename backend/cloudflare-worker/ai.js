/**
 * Gemini AI handler for the Consult stage. The key exists ONLY as the Worker secret
 * GEMINI_API_KEY (wrangler secret put GEMINI_API_KEY). It is never sent to the browser.
 */
import { json, readJson, rateLimit } from './common.js';

/* Model names change quickly. Read from Google's model page on 2026-10-01: Gemini 3.8 Flash is the recommended stable Flash model,
   and Gemini 2.5 Flash is scheduled for shutdown (announced for 2026-10-16). If a model answers 404 (not found / retired) the next one is tried.
   You can put your own first choice in the GEMINI_MODEL variable. These names have NOT been executed against a live key by the package author. */
const DEFAULT_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-2.5-flash'];
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const MAX_INPUT_CHARS = 4000;
const MAX_OUTPUT_TOKENS = 4096;   // roomy on purpose: newer Gemini models may spend part of the budget on thinking
const RATE_LIMIT_PER_MINUTE = 8;
const UPSTREAM_TIMEOUT_MS = 15000;
const SIX_C_STAGES = ['context', 'consult', 'critique', 'check', 'challenge', 'conclude'];

/* Official structured output: generationConfig.responseMimeType + responseSchema (OpenAPI-style subset). */
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    response: { type: 'STRING' },
    claims_to_check: { type: 'ARRAY', items: { type: 'STRING' } },
    possible_assumptions: { type: 'ARRAY', items: { type: 'STRING' } },
    uncertainty: { type: 'STRING' },
    follow_up_question: { type: 'STRING' },
  },
  required: ['response', 'claims_to_check', 'possible_assumptions', 'uncertainty', 'follow_up_question'],
};

const SYSTEM_PROMPT = `You are the AI used inside AI-CT TEACHER, an educational platform that trains future English teachers to think critically about AI output. You are a thinking partner and an OBJECT OF CRITICAL ANALYSIS, not an answer key.

Rules for every response:
- Do not write the student's final answer and do not complete their reasoning for them.
- Give a genuinely useful response to the classroom scenario, but keep it fallible: include at least one place where your reasoning is incomplete, an assumption you have not verified, or a recommendation that needs checking. Do not be right about everything.
- Never invent a citation, study, statistic, author, or URL. If you refer to evidence, say it should be verified instead of presenting it as confirmed.
- State uncertainty explicitly where it exists.
- Ask one short follow-up question that invites the student to question or verify something in your response.
- Use clear, simple English suitable for university students who are non-native speakers studying English teacher education.
- Be concrete and specific to the scenario. Avoid generic advice.
- Reply with the JSON object requested by the user message and nothing else.`;


export async function handleAI(request, env, cors) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors);
  const rl = await rateLimit(request, 'ai', RATE_LIMIT_PER_MINUTE, 60);
  if (!rl.ok) return json({ error: 'rate_limited', retryAfterSeconds: rl.retryAfterSeconds }, 429, cors);

  const body = await readJson(request, 20000);
  if (!body) return json({ error: 'invalid_json' }, 400, cors);

  const { scenario, stage, studentResponse } = body;
  if (typeof scenario !== 'string' || !scenario.trim()) return json({ error: 'invalid_input', detail: 'scenario is required' }, 400, cors);
  if (!SIX_C_STAGES.includes(stage)) return json({ error: 'invalid_input', detail: 'stage must be one of the six 6C stages' }, 400, cors);
  const student = typeof studentResponse === 'string' ? studentResponse : '';
  if (scenario.length > MAX_INPUT_CHARS || student.length > MAX_INPUT_CHARS) return json({ error: 'input_too_long', detail: 'max ' + MAX_INPUT_CHARS + ' characters' }, 400, cors);
  if (!env || !env.GEMINI_API_KEY) return json({ error: 'server_not_configured' }, 500, cors);

  const custom = (env.GEMINI_MODEL && /^[a-z0-9.\-]+$/i.test(env.GEMINI_MODEL)) ? [env.GEMINI_MODEL] : [];
  const models = custom.concat(DEFAULT_MODELS.filter(m => !custom.includes(m))).slice(0, 3);
  const payload = (model) => {
    const generationConfig = { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.7, responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA };
    // Gemini 2.5 Flash "thinks" by default and thinking tokens count against the output budget, which can truncate the JSON.
    if (/flash/i.test(model) && /2\.5/.test(model)) generationConfig.thinkingConfig = { thinkingBudget: 0 };
    return JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: buildUserMessage(scenario, stage, student) }] }],
      generationConfig,
    });
  };

  let upstream = null;
  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    try {
      upstream = await fetch(GEMINI_BASE + encodeURIComponent(model) + ':generateContent', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },   // header, not ?key=, so it stays out of URLs and logs
        body: payload(model),
        signal: controller.signal,
      });
    } catch {
      return json({ error: 'upstream_unreachable' }, 502, cors);
    } finally { clearTimeout(timer); }
    if (upstream.status !== 404) break;      // 404 = this model name is not available (retired or wrong): try the next one
  }

  if (!upstream.ok) return json({ error: 'upstream_error', status: upstream.status }, 502, cors);   // never forward Google's error body

  let data;
  try { data = await upstream.json(); } catch { return json({ error: 'upstream_invalid_response' }, 502, cors); }
  const parts = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
  const text = Array.isArray(parts) ? parts.map(p => (p && typeof p.text === 'string' ? p.text : '')).join('').trim() : '';
  const parsed = parseModelJSON(text);
  if (!parsed) return json({ error: 'malformed_model_output' }, 502, cors);

  return json({
    response: safeString(parsed.response, 3000),
    claims_to_check: safeStringArray(parsed.claims_to_check, 6, 300),
    possible_assumptions: safeStringArray(parsed.possible_assumptions, 6, 300),
    uncertainty: safeString(parsed.uncertainty, 500),
    follow_up_question: safeString(parsed.follow_up_question, 300),
  }, 200, cors);
}

function buildUserMessage(scenario, stage, student) {
  const lines = ['Current AI-CT 6C stage: ' + stage, 'Classroom scenario: ' + scenario];
  if (student) lines.push("Student's own request or response: " + student);
  lines.push('', 'Reply with ONLY a JSON object shaped exactly like this:', JSON.stringify({
    response: 'your fallible response to the scenario, 3-6 sentences',
    claims_to_check: ['a specific claim in your response worth verifying'],
    possible_assumptions: ['an assumption your response relies on'],
    uncertainty: 'one sentence naming what you are least sure about',
    follow_up_question: 'one short question inviting the student to question or verify something',
  }, null, 2));
  return lines.join('\n');
}

function parseModelJSON(text) {
  const cleaned = String(text).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    const obj = JSON.parse(cleaned);
    if (obj && typeof obj === 'object' && typeof obj.response === 'string' && obj.response.trim()) return obj;
  } catch { /* fall through */ }
  return null;
}
function safeString(v, max) { return typeof v === 'string' ? v.slice(0, max) : ''; }
function safeStringArray(v, maxItems, maxLen) {
  return Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, maxItems).map(x => x.slice(0, maxLen)) : [];
}
