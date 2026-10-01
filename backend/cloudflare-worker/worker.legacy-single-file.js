/**
 * AI-CT TEACHER — secure serverless AI backend (Cloudflare Worker) for Gemini.
 *
 *   GitHub Pages frontend  -->  this Worker  -->  Gemini API (Google)
 *
 * The Gemini API key exists ONLY as a Worker secret named GEMINI_API_KEY
 * (set with `wrangler secret put GEMINI_API_KEY`). It is never sent to the
 * browser, never stored in localStorage, never committed to GitHub, and
 * students are never asked for it. This file must never contain a key.
 *
 * Verification status (honest):
 *  - The request/response handling in this file HAS been exercised locally
 *    with a mocked Google API (see tests/worker.test.mjs): input validation,
 *    CORS, rate limiting, error handling, and the fact that the key is never
 *    included in any response.
 *  - It has NOT been called against the real Gemini API or deployed to
 *    Cloudflare: the environment that produced it had no outbound network
 *    access and no key. Run the curl test in backend/README.md after deploying.
 */

// Only these browser origins may call the Worker. Add a custom domain here later.
const ALLOWED_ORIGINS = [
  'https://sssprojectai.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

// Model names change over time. This default can be overridden without editing
// code by setting a GEMINI_MODEL variable on the Worker. Check the current
// name in Google AI Studio if requests fail with upstream_error 404.
const DEFAULT_MODEL = 'gemini-2.5-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const MAX_INPUT_CHARS = 4000;
const MAX_OUTPUT_TOKENS = 1024;
const RATE_LIMIT_PER_MINUTE = 8;
const UPSTREAM_TIMEOUT_MS = 20000;
const SIX_C_STAGES = ['context', 'consult', 'critique', 'check', 'challenge', 'conclude'];

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

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors);
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: 'origin_not_allowed' }, 403, cors);

    const rl = await checkRateLimit(request);
    if (!rl.ok) return json({ error: 'rate_limited', retryAfterSeconds: rl.retryAfterSeconds }, 429, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400, cors); }

    const { scenario, stage, studentResponse } = body || {};
    if (typeof scenario !== 'string' || !scenario.trim()) {
      return json({ error: 'invalid_input', detail: 'scenario is required' }, 400, cors);
    }
    if (!SIX_C_STAGES.includes(stage)) {
      return json({ error: 'invalid_input', detail: 'stage must be one of the six 6C stages' }, 400, cors);
    }
    const student = typeof studentResponse === 'string' ? studentResponse : '';
    if (scenario.length > MAX_INPUT_CHARS || student.length > MAX_INPUT_CHARS) {
      return json({ error: 'input_too_long', detail: 'max ' + MAX_INPUT_CHARS + ' characters' }, 400, cors);
    }

    if (!env || !env.GEMINI_API_KEY) return json({ error: 'server_not_configured' }, 500, cors);

    const model = (env.GEMINI_MODEL && /^[a-z0-9.\-]+$/i.test(env.GEMINI_MODEL)) ? env.GEMINI_MODEL : DEFAULT_MODEL;
    const generationConfig = {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7,
      responseMimeType: 'application/json',
    };
    // Gemini 2.5 Flash "thinks" by default and thinking tokens count against the
    // output budget, which can truncate the JSON. Turn it off for 2.5 Flash only.
    if (/flash/i.test(model) && /2\.5/.test(model)) generationConfig.thinkingConfig = { thinkingBudget: 0 };

    let upstream;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    try {
      upstream = await fetch(GEMINI_BASE + encodeURIComponent(model) + ':generateContent', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          // Header, not ?key= query string: keeps the key out of URLs and access logs.
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: buildUserMessage(scenario, stage, student) }] }],
          generationConfig,
        }),
        signal: controller.signal,
      });
    } catch {
      return json({ error: 'upstream_unreachable' }, 502, cors);
    } finally {
      clearTimeout(timer);
    }

    if (!upstream.ok) {
      // Never forward Google's error body: it can echo request details.
      return json({ error: 'upstream_error', status: upstream.status }, 502, cors);
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
  },
};

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
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...cors } });
}

/** Best-effort per-IP limit using the Cache API (soft limit; see backend/README.md). */
async function checkRateLimit(request) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const cache = caches.default;
    const key = new Request('https://rate-limit.internal/' + encodeURIComponent(ip) + '/' + Math.floor(Date.now() / 60000));
    const hit = await cache.match(key);
    const count = hit ? parseInt(await hit.text(), 10) : 0;
    if (count >= RATE_LIMIT_PER_MINUTE) return { ok: false, retryAfterSeconds: 60 };
    await cache.put(key, new Response(String(count + 1), { headers: { 'Cache-Control': 'max-age=60' } }));
    return { ok: true };
  } catch {
    return { ok: true }; // never block real students because the limiter itself failed
  }
}
