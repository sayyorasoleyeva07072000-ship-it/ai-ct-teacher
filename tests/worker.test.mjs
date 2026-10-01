// Local test of backend/cloudflare-worker/worker.js with a MOCKED Gemini API.
// Run:  node tests/worker.test.mjs
// This proves the Worker's own logic. It does NOT call the real Gemini API.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '..', 'backend', 'cloudflare-worker');
const src = fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const worker = (await import(pathToFileURL(path.join(dir, 'worker.js')).href)).default;

const KEY = 'TEST-KEY-DO-NOT-LEAK-123456';
const ORIGIN = 'https://sssprojectai.github.io';
const env = { GEMINI_API_KEY: KEY };
const okBody = { scenario: 'A teacher wants to use an AI speaking activity for B1 students.', stage: 'consult', studentResponse: 'Suggest steps.' };
const geminiOK = (text) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });
const goodModelJSON = JSON.stringify({ response: 'Try short pair tasks, but check the level.', claims_to_check: ['Short tasks raise speaking time'], possible_assumptions: ['Students are willing'], uncertainty: 'Not sure about class size.', follow_up_question: 'How would you check it?' });
const req = (body, o = {}) => new Request('https://w.example/api/ai', { method: o.method || 'POST', headers: { 'content-type': 'application/json', 'Origin': o.origin === undefined ? ORIGIN : o.origin, 'CF-Connecting-IP': o.ip || '1.1.1.1' }, body: o.raw !== undefined ? o.raw : (o.method === 'GET' || o.method === 'OPTIONS' ? undefined : JSON.stringify(body)) });

let calls = [];
const realFetch = globalThis.fetch;
function mockGoogle(handler) { globalThis.fetch = async (url, opts) => { calls.push({ url: String(url), opts }); return handler(url, opts); }; }
// Cache API stub (Cloudflare-specific; not in Node)
function stubCaches() { const m = new Map(); globalThis.caches = { default: { match: async (r) => m.get(r.url) ? new Response(m.get(r.url)) : undefined, put: async (r, res) => { m.set(r.url, await res.text()); } } }; }

let passed = 0; const results = [];
async function t(name, fn) { try { calls = []; await fn(); passed++; results.push('PASS  ' + name); } catch (e) { results.push('FAIL  ' + name + ' -> ' + e.message); } }
const noLeak = async (res) => { const txt = await res.clone().text(); assert.ok(!txt.includes(KEY), 'response leaked the API key'); return JSON.parse(txt || 'null'); };

await t('OPTIONS preflight from allowed origin -> 204 + CORS', async () => { const r = await worker.fetch(req(null, { method: 'OPTIONS' }), env); assert.equal(r.status, 204); assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN); });
await t('GET rejected -> 405', async () => { const r = await worker.fetch(req(null, { method: 'GET' }), env); assert.equal(r.status, 405); });
await t('unknown origin rejected -> 403 and Google never called', async () => { const r = await worker.fetch(req(okBody, { origin: 'https://evil.example' }), env); assert.equal(r.status, 403); assert.equal(calls.length, 0); assert.notEqual(r.headers.get('Access-Control-Allow-Origin'), 'https://evil.example'); });
await t('missing Origin rejected -> 403', async () => { const r = await worker.fetch(req(okBody, { origin: '' }), env); assert.equal(r.status, 403); });
await t('invalid JSON -> 400', async () => { const r = await worker.fetch(req(null, { raw: '{not json' }), env); assert.equal(r.status, 400); assert.equal((await r.json()).error, 'invalid_json'); });
await t('missing scenario -> 400', async () => { const r = await worker.fetch(req({ stage: 'consult' }), env); assert.equal(r.status, 400); });
await t('stage "reflect" is NOT a valid stage (6C has no Reflect stage) -> 400', async () => { const r = await worker.fetch(req({ ...okBody, stage: 'reflect' }), env); assert.equal(r.status, 400); assert.equal(calls.length, 0); });
await t('all six 6C stages are accepted', async () => { mockGoogle(() => geminiOK(goodModelJSON)); for (const s of ['context', 'consult', 'critique', 'check', 'challenge', 'conclude']) { stubCaches(); const r = await worker.fetch(req({ ...okBody, stage: s }), env); assert.equal(r.status, 200, s); } });
await t('over-long input -> 400', async () => { const r = await worker.fetch(req({ ...okBody, scenario: 'x'.repeat(4001) }), env); assert.equal(r.status, 400); assert.equal(calls.length, 0); });
await t('missing GEMINI_API_KEY -> 500 server_not_configured (no crash)', async () => { const r = await worker.fetch(req(okBody), {}); assert.equal(r.status, 500); assert.equal((await r.json()).error, 'server_not_configured'); });
await t('success: request shape to Gemini is correct, key only in header, never in URL/body/response', async () => {
  stubCaches(); mockGoogle(() => geminiOK(goodModelJSON));
  const r = await worker.fetch(req(okBody), env); assert.equal(r.status, 200);
  const out = await noLeak(r);
  assert.deepEqual(Object.keys(out).sort(), ['claims_to_check', 'follow_up_question', 'possible_assumptions', 'response', 'uncertainty']);
  const c = calls[0];
  assert.ok(c.url.startsWith('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent'));
  assert.ok(!c.url.includes(KEY) && !c.url.includes('key='), 'key must not be in URL');
  assert.equal(c.opts.headers['x-goog-api-key'], KEY);
  const sent = JSON.parse(c.opts.body);
  assert.ok(!c.opts.body.includes(KEY), 'key must not be in body');
  assert.ok(/never invent a citation/i.test(sent.systemInstruction.parts[0].text));
  assert.ok(/do not write the student's final answer/i.test(sent.systemInstruction.parts[0].text));
  assert.equal(sent.generationConfig.responseMimeType, 'application/json');
  const sc = sent.generationConfig.responseSchema;
  assert.equal(sc.type, 'OBJECT'); assert.deepEqual(Object.keys(sc.properties).sort(), ['claims_to_check', 'follow_up_question', 'possible_assumptions', 'response', 'uncertainty']);
  assert.deepEqual([...sc.required].sort(), Object.keys(sc.properties).sort()); assert.equal(sc.properties.claims_to_check.type, 'ARRAY');
  assert.equal(sent.generationConfig.thinkingConfig, undefined, 'no thinkingConfig is sent to 3.x models');
  assert.ok(sent.contents[0].parts[0].text.includes('A teacher wants to use an AI speaking activity'));
});
await t('fenced ```json output is still parsed', async () => { stubCaches(); mockGoogle(() => geminiOK('```json\n' + goodModelJSON + '\n```')); const r = await worker.fetch(req(okBody), env); assert.equal(r.status, 200); });
await t('upstream 500 with secret-looking body -> generic 502, nothing forwarded', async () => { stubCaches(); mockGoogle(() => new Response('{"error":{"message":"API key ' + KEY + ' invalid for project 123"}}', { status: 500 })); const r = await worker.fetch(req(okBody), env); assert.equal(r.status, 502); const out = await noLeak(r); assert.equal(out.error, 'upstream_error'); assert.ok(!JSON.stringify(out).includes('project 123')); });
await t('upstream 429/403 -> 502 upstream_error', async () => { for (const s of [429, 403, 404]) { stubCaches(); mockGoogle(() => new Response('{}', { status: s })); const r = await worker.fetch(req(okBody), env); assert.equal(r.status, 502); assert.equal((await r.json()).status, s); } });
await t('network failure -> 502 upstream_unreachable', async () => { stubCaches(); mockGoogle(() => { throw new TypeError('fetch failed'); }); const r = await worker.fetch(req(okBody), env); assert.equal(r.status, 502); assert.equal((await r.json()).error, 'upstream_unreachable'); });
await t('non-JSON upstream body -> 502 upstream_invalid_response', async () => { stubCaches(); mockGoogle(() => new Response('<html>oops</html>', { status: 200 })); const r = await worker.fetch(req(okBody), env); assert.equal(r.status, 502); });
await t('model returns prose, not JSON -> 502 malformed_model_output', async () => { stubCaches(); mockGoogle(() => geminiOK('Sure! Here is my answer in plain prose.')); const r = await worker.fetch(req(okBody), env); assert.equal(r.status, 502); assert.equal((await r.json()).error, 'malformed_model_output'); });
await t('safety-blocked / empty candidates -> 502 malformed_model_output', async () => { stubCaches(); mockGoogle(() => new Response(JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } }), { status: 200 })); const r = await worker.fetch(req(okBody), env); assert.equal(r.status, 502); assert.equal((await r.json()).error, 'malformed_model_output'); });
await t('oversized / wrong-typed model fields are trimmed and sanitised', async () => { stubCaches(); mockGoogle(() => geminiOK(JSON.stringify({ response: 'ok '.repeat(2000), claims_to_check: Array(20).fill('c'), possible_assumptions: [1, 'a', null], uncertainty: 5, follow_up_question: 'q' }))); const r = await worker.fetch(req(okBody), env); const o = await r.json(); assert.ok(o.response.length <= 3000); assert.equal(o.claims_to_check.length, 6); assert.deepEqual(o.possible_assumptions, ['a']); assert.equal(o.uncertainty, ''); });
await t('GEMINI_MODEL override honoured; unsafe value ignored', async () => { stubCaches(); mockGoogle(() => geminiOK(goodModelJSON)); await worker.fetch(req(okBody), { ...env, GEMINI_MODEL: 'gemini-2.0-flash' }); assert.ok(calls[0].url.includes('/models/gemini-2.0-flash:')); assert.equal(JSON.parse(calls[0].opts.body).generationConfig.thinkingConfig, undefined); stubCaches(); await worker.fetch(req(okBody), { ...env, GEMINI_MODEL: '../../evil?x=' }); assert.ok(calls[1].url.includes('/models/gemini-3.8-flash:')); });
await t('model not found (404): the next model in the chain is tried, and the student gets a normal answer', async () => { stubCaches(); mockGoogle((url) => String(url).includes('gemini-3.8-flash') ? new Response('{}', { status: 404 }) : geminiOK(goodModelJSON)); const r = await worker.fetch(req(okBody), env); assert.equal(r.status, 200); assert.equal(calls.length, 2); assert.ok(calls[1].url.includes('/models/gemini-3.6-flash:')); const o = await noLeak(r); assert.ok(o.response); });
await t('every model 404: exactly 3 attempts, then a generic 502 upstream_error with status 404', async () => { stubCaches(); mockGoogle(() => new Response('{"error":{"message":"model gone"}}', { status: 404 })); const r = await worker.fetch(req(okBody), env); assert.equal(r.status, 502); const o = await noLeak(r); assert.equal(o.error, 'upstream_error'); assert.equal(o.status, 404); assert.equal(calls.length, 3); assert.ok(!JSON.stringify(o).includes('model gone')); });
await t('429 / 403 / 500 are NOT retried on other models (one call only)', async () => { for (const st of [429, 403, 500]) { stubCaches(); calls = []; mockGoogle(() => new Response('{}', { status: st })); const r = await worker.fetch(req(okBody), env); assert.equal(r.status, 502); assert.equal(calls.length, 1, 'status ' + st); } });
await t('GEMINI_MODEL=gemini-2.5-flash is tried first and gets thinkingBudget 0; chain is at most 3 long', async () => { stubCaches(); mockGoogle(() => new Response('{}', { status: 404 })); await worker.fetch(req(okBody), { ...env, GEMINI_MODEL: 'gemini-2.5-flash' }); assert.equal(calls.length, 3); assert.ok(calls[0].url.includes('/models/gemini-2.5-flash:')); assert.deepEqual(JSON.parse(calls[0].opts.body).generationConfig.thinkingConfig, { thinkingBudget: 0 }); });
await t('truncated output (MAX_TOKENS with broken JSON) -> clean 502 malformed_model_output', async () => { stubCaches(); mockGoogle(() => new Response(JSON.stringify({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{"response":"half an ans' }] } }] }), { status: 200 })); const r = await worker.fetch(req(okBody), env); assert.equal(r.status, 502); assert.equal((await r.json()).error, 'malformed_model_output'); });
await t('the key is never logged: no console output during a failing request', async () => { const logs = []; const o = { log: console.log, error: console.error, warn: console.warn }; console.log = console.error = console.warn = (...a) => logs.push(a.join(' ')); try { stubCaches(); mockGoogle(() => new Response('boom ' + KEY, { status: 500 })); await worker.fetch(req(okBody), env); } finally { Object.assign(console, o); } assert.ok(!logs.join('\n').includes(KEY)); });
await t('rate limit: 8 requests/min per IP then 429; other IP unaffected', async () => { stubCaches(); mockGoogle(() => geminiOK(goodModelJSON)); for (let i = 0; i < 8; i++) assert.equal((await worker.fetch(req(okBody, { ip: '9.9.9.9' }), env)).status, 200); const r = await worker.fetch(req(okBody, { ip: '9.9.9.9' }), env); assert.equal(r.status, 429); assert.equal((await worker.fetch(req(okBody, { ip: '8.8.8.8' }), env)).status, 200); });
await t('rate limiter failure does not block students (fail-open)', async () => { delete globalThis.caches; mockGoogle(() => geminiOK(goodModelJSON)); const r = await worker.fetch(req(okBody), env); assert.equal(r.status, 200); });
await t('worker source contains no hard-coded key', async () => { assert.ok(!/AIza[0-9A-Za-z_-]{20,}/.test(src)); assert.ok(!/sk-[A-Za-z0-9]{20,}/.test(src)); assert.ok(!/anthropic/i.test(src)); });

globalThis.fetch = realFetch; 
console.log(results.join('\n')); console.log('\n' + passed + '/' + results.length + ' passed');
process.exit(passed === results.length ? 0 : 1);
