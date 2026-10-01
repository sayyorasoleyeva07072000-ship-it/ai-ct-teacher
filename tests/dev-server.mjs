// Local API for testing and offline demos: the REAL Worker code + a REAL SQLite database (in memory).
// Gemini is MOCKED here (no internet, no key), so AI answers are canned. Nothing is sent anywhere.
//   node tests/dev-server.mjs                 -> http://localhost:8790  (AI + classes)
//   NO_AI=1 / NO_DB=1 / PORT=8791 / DEV_ORIGINS=http://localhost:8001   (options)
// Serve the site on port 8000 (python3 -m http.server 8000) and set API_BASE='http://localhost:8790' in app/js/app.js.
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { D1Shim } from './d1-shim.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '..', 'backend', 'cloudflare-worker');
const worker = (await import(pathToFileURL(path.join(dir, 'worker.js')).href)).default;
const common = await import(pathToFileURL(path.join(dir, 'common.js')).href);
(process.env.DEV_ORIGINS || '').split(',').filter(Boolean).forEach(o => common.ALLOWED_ORIGINS.push(o));

const PORT = +(process.env.PORT || 8790);
const env = {};
if (process.env.NO_DB !== '1') env[process.env.DB_BINDING || 'DB'] = new D1Shim({ schema: false });   // EMPTY database: the Worker creates its own tables, like a freshly created D1
if (process.env.NO_AI !== '1') env.GEMINI_API_KEY = 'dev-only-not-a-real-key';

const store = new Map();
globalThis.caches = { default: { match: async r => store.has(r.url) ? new Response(store.get(r.url)) : undefined, put: async (r, res) => { store.set(r.url, await res.text()); } } };
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  if (String(url).includes('generativelanguage.googleapis.com')) {
    let userText = ''; try { userText = JSON.parse(opts.body).contents[0].parts[0].text; } catch { /* ignore */ }
    const fq = userText.match(/NEW QUESTION FROM THE STUDENT:\s*(.+)/);
    if (fq) {
      const earlier = (userText.match(/^AI: /gm) || []).length, said = (userText.match(/^Student: /gm) || []).length;
      const out2 = { response: `(mock follow-up) You asked: "${fq[1].trim().slice(0, 160)}". I can see ${earlier} earlier AI answer(s) and ${said} earlier student question(s). Another approach could fit some classes better, but that depends on the class size and the level.`,
        claims_to_check: ['Another approach may suit some classes better'], possible_assumptions: ['The class size stays the same'], uncertainty: 'I have no evidence about your particular students.', follow_up_question: 'What would convince you to change the plan?' };
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(out2) }] } }] }), { status: 200 });
    }
    const out = { response: 'Short pair tasks can raise speaking time, but check that every student really gets a turn in a class of this size. Many teachers also add a simple class agreement about respecting mistakes.',
      claims_to_check: ['Short pair tasks raise speaking time for every student'], possible_assumptions: ['Students are willing to speak in pairs'], uncertainty: 'I am not sure this fits a very large class.', follow_up_question: 'How would you check whether quieter students actually spoke?' };
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(out) }] } }] }), { status: 200 });
  }
  return realFetch(url, opts);
};

http.createServer(async (req, res) => {
  try {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const r = await worker.fetch(new Request('http://localhost:' + PORT + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body }), env);
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer()));
  } catch (e) { res.writeHead(500); res.end('dev server error'); }
}).listen(PORT, () => console.log(`AI-CT dev API on http://localhost:${PORT}  (AI: ${env.GEMINI_API_KEY ? 'mock Gemini' : 'off'}, classes: ${env.DB ? 'SQLite in memory' : 'off'})`));
