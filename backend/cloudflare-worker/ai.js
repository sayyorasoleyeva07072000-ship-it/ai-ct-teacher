/**
 * Gemini AI handler for the Consult stage. The key exists ONLY as the Worker secret
 * GEMINI_API_KEY (wrangler secret put GEMINI_API_KEY). It is never sent to the browser.
 */
import { json, readJson, rateLimit } from './common.js';

/* Model names change quickly. Read from Google's model page on 2026-10-01: Gemini 3.8 Flash is the recommended stable Flash model,
   and Gemini 2.5 Flash is scheduled for shutdown (announced for 2026-10-16). If a model answers 404 (not found / retired) the next one is tried.
   You can put your own first choice in the GEMINI_MODEL variable. These names have NOT been executed against a live key by the package author. */
const DEFAULT_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
/* Statuses that mean "this attempt failed, but the model may be fine": retry the SAME model briefly, then move on. */
const TRANSIENT = [429, 500, 502, 503, 504];
/* Any other status (400, 403, 404 ...) means this model name is not usable with this key: go straight to the next model. */
const RETRY_DELAYS_MS = [600, 1800];
/* The browser gives up at 25-30s, so the whole chain of retries must finish before that. */
const TOTAL_BUDGET_MS = 20000;
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

/* The free "AI Chat" page (mode: 'chat'): a normal, honest assistant. It is NOT the 6C Consult prompt above, which makes the AI fallible on purpose. */
const CHAT_SYSTEM_PROMPT = `You are a friendly, knowledgeable assistant for university students who are future English teachers. Many are non-native speakers of English and many write in Uzbek.
Rules:
- Answer the student's question directly and helpfully, like a normal chat assistant.
- Reply in the language the student writes in (Uzbek, English or Russian). For grammar, give short clear examples.
- Be accurate. If you are not sure, say so briefly. Never invent a citation, study, statistic, author, or URL.
- Keep answers well organised and not longer than needed: short paragraphs, or a short list when it helps.
- Be respectful and professional.
- Reply with the JSON object requested by the user message and nothing else.`;
function buildChatMessage(student) {
  return ['General chat with a student.', student, '', 'Reply with ONLY a JSON object shaped exactly like this:', JSON.stringify({
    response: 'your helpful answer to the student, in the language the student used',
    claims_to_check: [], possible_assumptions: [], uncertainty: '', follow_up_question: '',
  }, null, 2), 'Leave claims_to_check and possible_assumptions as empty arrays, and uncertainty and follow_up_question as empty strings, unless something there is genuinely useful.'].join('\n');
}

/* Diagnostics. Logs the model name, the HTTP status and Google's short error message only.
   It never logs GEMINI_API_KEY, any header, the request body or the student's text, and any key-shaped
   string in Google's message is masked before logging. Visible with: npx wrangler tail */
function scrub(t, secret) {
  let out = String(t);
  if (secret && secret.length >= 6) out = out.split(secret).join('[redacted]');   // the real key value, whatever its shape
  return out.replace(/AIza[0-9A-Za-z_\-]{10,}/g, '[redacted]').replace(/key=[^&\s"']+/gi, 'key=[redacted]').slice(0, 300);
}
function logUpstream(model, status, message, secret) {
  console.log('[ai] model=' + model + ' status=' + status + ' message=' + scrub(message, secret));
}
async function errorSummary(res) {
  try {
    const body = await res.clone().text();
    try { const j = JSON.parse(body); return (j && j.error && (j.error.message || j.error.status)) || body; } catch { return body; }
  } catch { return '(no body)'; }
}

export async function handleAI(request, env, cors) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors);
  const rl = await rateLimit(request, 'ai', RATE_LIMIT_PER_MINUTE, 60);
  if (!rl.ok) return json({ error: 'rate_limited', retryAfterSeconds: rl.retryAfterSeconds }, 429, cors);

  const body = await readJson(request, 20000);
  if (!body) return json({ error: 'invalid_json' }, 400, cors);

  const isChat = body.mode === 'chat';
  const { stage, studentResponse } = body;
  const scenario = typeof body.scenario === 'string' && body.scenario.trim() ? body.scenario : (isChat ? 'General chat' : body.scenario);
  const student = typeof studentResponse === 'string' ? studentResponse : '';
  if (typeof scenario !== 'string' || !scenario.trim()) return json({ error: 'invalid_input', detail: 'scenario is required' }, 400, cors);
  if (!isChat && !SIX_C_STAGES.includes(stage)) return json({ error: 'invalid_input', detail: 'stage must be one of the six 6C stages' }, 400, cors);
  if (isChat && !student.trim()) return json({ error: 'invalid_input', detail: 'a message is required' }, 400, cors);
  if (scenario.length > MAX_INPUT_CHARS || student.length > MAX_INPUT_CHARS) return json({ error: 'input_too_long', detail: 'max ' + MAX_INPUT_CHARS + ' characters' }, 400, cors);
  if (!env || !env.GEMINI_API_KEY) return json({ error: 'server_not_configured' }, 500, cors);

  const custom = (env.GEMINI_MODEL && /^[a-z0-9.\-]+$/i.test(env.GEMINI_MODEL)) ? [env.GEMINI_MODEL] : [];
  const models = custom.concat(DEFAULT_MODELS.filter(m => !custom.includes(m))).slice(0, 5);
  const payload = (model) => {
    const generationConfig = { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.7, responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA };
    // Gemini 2.5 Flash "thinks" by default and thinking tokens count against the output budget, which can truncate the JSON.
    if (/flash/i.test(model) && /2\.5/.test(model)) generationConfig.thinkingConfig = { thinkingBudget: 0 };
    return JSON.stringify({
      systemInstruction: { parts: [{ text: isChat ? CHAT_SYSTEM_PROMPT : SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: isChat ? buildChatMessage(student) : buildUserMessage(scenario, stage, student) }] }],
      generationConfig,
    });
  };

  /* Google can answer 503 ("overloaded") or 429 for a model that is perfectly valid. Those are retried on the same model with a
     short backoff; a model that is simply not usable with this key (400/403/404) is skipped at once. The whole chain is tried
     before giving up, so one busy model no longer takes the whole feature down. */
  let upstream = null, lastStatus = 0;
  const tried = [], deadline = Date.now() + TOTAL_BUDGET_MS;
  for (const model of models) {
    let outOfTime = false;
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      const controller = new AbortController();
      const left = deadline - Date.now();
      if (left <= 1000) { outOfTime = true; break; }                   // out of time: answer now instead of letting the browser time out
      const timer = setTimeout(() => controller.abort(), Math.min(UPSTREAM_TIMEOUT_MS, left));
      let res = null;
      try {
        res = await fetch(GEMINI_BASE + encodeURIComponent(model) + ':generateContent', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },   // header, not ?key=, so it stays out of URLs and logs
          body: payload(model),
          signal: controller.signal,
        });
      } catch {
        tried.push(model + ':unreachable');
        logUpstream(model, 0, 'request failed or timed out', env.GEMINI_API_KEY);      // network error or our own timeout: try the next model
        lastStatus = lastStatus || 504; break;
      } finally { clearTimeout(timer); }

      if (res.ok) { upstream = res; tried.push(model + ':200'); break; }
      lastStatus = res.status;
      tried.push(model + ':' + res.status);
      logUpstream(model, res.status, await errorSummary(res), env.GEMINI_API_KEY);
      if (TRANSIENT.includes(res.status) && attempt < RETRY_DELAYS_MS.length && Date.now() + RETRY_DELAYS_MS[attempt] < deadline - 1000) {
        await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[attempt]));
        continue;                                                   // same model, one more try
      }
      break;                                                        // unusable model, or retries exhausted: next model
    }
    if (upstream || outOfTime || Date.now() >= deadline - 1000) break;
  }

  if (!upstream) {
    console.log('[ai] all models failed:', tried.join(', '));       // model names and statuses only
    return json({ error: 'upstream_error', status: lastStatus || 502, tried }, 502, cors);   // never forward Google's error body
  }

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
