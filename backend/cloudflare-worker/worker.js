/**
 * AI-CT TEACHER — secure serverless backend (Cloudflare Worker).
 *
 *   GitHub Pages frontend  -->  this Worker  -->  Gemini API (AI)   and   D1 database (classes)
 *
 * One address serves both. GET /api/health tells the frontend what is ready
 * (the Gemini key is set? the class database is connected?), so connecting
 * either one later switches that feature on without any frontend change.
 *
 * Secrets: GEMINI_API_KEY lives only as a Worker secret. It is never sent to
 * the browser, never stored in localStorage or GitHub, and students never enter it.
 *
 * Verification status (honest): the logic is tested locally against a mocked Google API
 * and a real SQLite database (tests/*.test.mjs). It has NOT been deployed to Cloudflare or
 * called against the real Gemini API from the environment that produced it (no internet).
 */
import { ALLOWED_ORIGINS, corsHeaders, json, withDB } from './common.js';
import { handleAI } from './ai.js';
import { handleClasses } from './classes.js';

export default {
  async fetch(request, env0) {
    const env = withDB(env0);     // finds the D1 binding whatever it is called
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: 'origin_not_allowed' }, 403, cors);

    const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
    try {
      if (path === '/api/health') {
        if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405, cors);
        return json({ ok: true, ai: !!(env && env.GEMINI_API_KEY), classes: !!(env && env.DB) }, 200, cors);
      }
      if (path === '/api/ai') return await handleAI(request, env, cors);
      if (path === '/api/classes' || path.startsWith('/api/classes/')) return await handleClasses(request, env, cors, path);
      return json({ error: 'not_found' }, 404, cors);
    } catch (e) {
      // Never leak internals (or the key) in an error response.
      return json({ error: 'server_error' }, 500, cors);
    }
  },
};
