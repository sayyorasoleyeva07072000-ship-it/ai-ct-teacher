/**
 * AI-CT TEACHER — secure serverless backend (Cloudflare Worker). Gemini only.
 *
 *   GitHub Pages frontend  -->  this Worker  -->  Gemini API
 *
 * Routes:  GET /api/health   tells the frontend whether the Gemini key is set
 *          POST /api/ai      the 6C Consult stage and the free AI Chat page
 *
 * The Gemini key (GEMINI_API_KEY) lives only as a Worker secret. It is never sent to the browser,
 * never stored in localStorage or GitHub, and students never enter it.
 * Only the browser origins in common.js (ALLOWED_ORIGINS) may call this Worker.
 */
import { ALLOWED_ORIGINS, corsHeaders, json } from './common.js';
import { handleAI } from './ai.js';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: 'origin_not_allowed' }, 403, cors);

    const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
    try {
      if (path === '/api/health') {
        if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405, cors);
        return json({ ok: true, ai: !!(env && env.GEMINI_API_KEY) }, 200, cors);
      }
      if (path === '/api/ai') return await handleAI(request, env, cors);
      return json({ error: 'not_found' }, 404, cors);
    } catch (e) {
      // Never leak internals (or the key) in an error response.
      return json({ error: 'server_error' }, 500, cors);
    }
  },
};
