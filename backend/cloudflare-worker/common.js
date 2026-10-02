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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
