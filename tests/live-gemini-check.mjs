// REAL Gemini check, to be run by YOU on YOUR computer with YOUR key. Nothing is stored or printed about the key.
//   macOS/Linux:   GEMINI_API_KEY="your-key" node tests/live-gemini-check.mjs
//   Windows (PowerShell):   $env:GEMINI_API_KEY="your-key"; node tests/live-gemini-check.mjs
// Optional: GEMINI_MODEL=model-name to test a specific model. The key is read ONLY from the environment variable.
// It runs the same Worker code that Cloudflare runs, against the real Gemini API, and checks the structured answer.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const key = process.env.GEMINI_API_KEY;
if (!key) { console.log('NOT TESTED — REQUIRES LIVE GEMINI KEY.\nSet the GEMINI_API_KEY environment variable in your terminal (not in any file) and run again.'); process.exit(2); }
const worker = (await import(pathToFileURL(path.join(here, '..', 'backend', 'cloudflare-worker', 'worker.js')).href)).default;
const store = new Map();
globalThis.caches = { default: { match: async r => store.has(r.url) ? new Response(store.get(r.url)) : undefined, put: async (r, res) => { store.set(r.url, await res.text()); } } };
const env = { GEMINI_API_KEY: key }; if (process.env.GEMINI_MODEL) env.GEMINI_MODEL = process.env.GEMINI_MODEL;
const req = (body) => new Request('https://worker.local/api/ai', { method: 'POST', headers: { 'content-type': 'application/json', Origin: 'http://localhost:8000' }, body: JSON.stringify(body) });
const hint = { 400: 'Bad request or the key is not valid for this project.', 403: 'Key rejected or API not enabled for this key/project.', 404: 'No model in the chain exists for your key. Set GEMINI_MODEL to a current model name from Google AI Studio.', 429: 'Quota or rate limit reached.', 500: 'Google-side error: try again.' };
let failed = 0; const fail = (m) => { failed++; console.log('FAIL  ' + m); }; const pass = (m) => console.log('PASS  ' + m);
for (const [label, body] of [['consult stage, with a student question', { scenario: 'You teach B1 students in Samarkand. Many are silent in speaking activities and giggle when they make mistakes.', stage: 'consult', studentResponse: 'What should I do in the next lesson, and why?' }], ['consult stage, no student text', { scenario: 'A teacher wants to use an AI-made reading text for B1 students but has not checked it.', stage: 'consult', studentResponse: '' }]]) {
  const t0 = Date.now(); const res = await worker.fetch(req(body), env); const out = await res.json(); const ms = Date.now() - t0;
  const text = JSON.stringify(out);
  if (text.includes(key)) fail('the key appeared in the response (must never happen)');
  if (res.status !== 200) { fail(`${label}: HTTP ${res.status} ${out.error || ''} ${out.status ? '(Google status ' + out.status + ')' : ''}. ${hint[out.status] || ''}`); continue; }
  const keys = Object.keys(out).sort().join(',');
  if (keys !== 'claims_to_check,follow_up_question,possible_assumptions,response,uncertainty') fail(`${label}: wrong fields: ${keys}`); else pass(`${label}: live Gemini answered in ${ms} ms with the 5 structured fields`);
  if (!out.response || out.response.length < 40) fail(`${label}: response too short`); else pass(`${label}: response has ${out.response.length} characters`);
  if (!Array.isArray(out.claims_to_check) || !out.claims_to_check.length) fail(`${label}: claims_to_check is empty`); else pass(`${label}: ${out.claims_to_check.length} claim(s) to check`);
  console.log('      response: ' + out.response.slice(0, 220).replace(/\s+/g, ' ') + '…\n      uncertainty: ' + out.uncertainty + '\n      follow-up: ' + out.follow_up_question);
}
const bad = await worker.fetch(req({ scenario: '', stage: 'consult' }), env); if (bad.status === 400) pass('empty scenario is rejected before Gemini is called'); else fail('validation did not reject an empty scenario');
console.log(failed ? `\n${failed} check(s) FAILED. Nothing is wrong with your key unless the hint above says so.` : '\nLIVE GEMINI CHECK PASSED on this computer.'); process.exit(failed ? 1 : 0);
