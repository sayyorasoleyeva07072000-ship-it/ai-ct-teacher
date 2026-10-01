/* Shared helpers for the AI-CT TEACHER Worker. No secrets live in this file. */

// Only these browser origins may call the Worker. Add a custom domain here later.
export const ALLOWED_ORIGINS = [
  'https://sssprojectai.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

export function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
export function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...cors } });
}

/** Parse a JSON body with a size limit. Returns an object, or null if missing/invalid/too large. */
export async function readJson(request, maxChars) {
  try {
    const text = await request.text();
    if (text.length > maxChars) return null;
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch { return null; }
}

/** Best-effort per-IP limit using the Cache API (a soft limit; see backend/README.md). Fails open. */
export async function rateLimit(request, bucket, limit, windowSec) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const cache = caches.default;
    const key = new Request('https://rate-limit.internal/' + bucket + '/' + encodeURIComponent(ip) + '/' + Math.floor(Date.now() / (windowSec * 1000)));
    const hit = await cache.match(key);
    const count = hit ? parseInt(await hit.text(), 10) : 0;
    if (count >= limit) return { ok: false, retryAfterSeconds: windowSec };
    await cache.put(key, new Response(String(count + 1), { headers: { 'Cache-Control': 'max-age=' + windowSec } }));
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Unbiased random string from an alphabet (rejection sampling on crypto.getRandomValues). */
export function randomString(alphabet, length) {
  const n = alphabet.length, limit = 256 - (256 % n);
  let out = '';
  while (out.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2));
    for (const b of bytes) { if (b < limit && out.length < length) out += alphabet[b % n]; }
  }
  return out;
}

export function bearer(request) {
  const h = request.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(\S{8,200})$/i);
  return m ? m[1] : '';
}

/** Names: no control characters or angle brackets, single spaces, trimmed, limited length. */
export function cleanText(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/* The D1 binding is found by what it IS, not by what it is called: a binding named DB, ai_ct_teacher_db or anything else
   all work (Wrangler can name an auto-created binding differently). `DB` wins if several exist. */
export function findDB(env) {
  const isD1 = v => v && typeof v === 'object' && typeof v.prepare === 'function' && typeof v.batch === 'function';
  if (!env) return null;
  if (isD1(env.DB)) return env.DB;
  for (const k of Object.keys(env)) if (isD1(env[k])) return env[k];
  return null;
}
export function withDB(env) {
  const db = findDB(env);
  return db && (!env || env.DB !== db) ? { ...env, DB: db } : env;
}
