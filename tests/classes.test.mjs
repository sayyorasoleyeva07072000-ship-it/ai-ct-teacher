// Tests of the class system (backend/cloudflare-worker/classes.js) against a REAL SQLite database.
// Run:  node tests/classes.test.mjs     (Node 22+; prints an ExperimentalWarning for node:sqlite, which is fine)
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { D1Shim } from './d1-shim.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const worker = (await import(pathToFileURL(path.join(here, '..', 'backend', 'cloudflare-worker', 'worker.js')).href)).default;
const ORIGIN = 'https://sssprojectai.github.io';
let DB, env, ipN = 0;
function fresh() { DB = new D1Shim(); env = { DB, GEMINI_API_KEY: 'x' }; stubCaches(); }
function stubCaches() { const m = new Map(); globalThis.caches = { default: { match: async r => m.has(r.url) ? new Response(m.get(r.url)) : undefined, put: async (r, res) => { m.set(r.url, await res.text()); } } }; }
async function call(method, p, o = {}) {
  const h = { Origin: o.origin === undefined ? ORIGIN : o.origin, 'CF-Connecting-IP': o.ip || ('10.0.0.' + (++ipN % 250)) };
  if (o.token) h.Authorization = 'Bearer ' + o.token;
  if (o.body !== undefined) h['content-type'] = 'application/json';
  const r = await worker.fetch(new Request('https://w.example' + p, { method, headers: h, body: o.raw !== undefined ? o.raw : (o.body !== undefined ? JSON.stringify(o.body) : undefined) }), o.env || env);
  let j = null; try { j = await r.clone().json(); } catch {}
  return { status: r.status, j, headers: r.headers, text: await r.text() };
}
const mk = async (name = 'Group A') => { const r = await call('POST', '/api/classes', { body: { className: name, teacherName: 'T' } }); return { code: r.j.code, key: r.j.teacherKey }; };
const join = async (code, name = 'Aziza') => (await call('POST', `/api/classes/${code}/join`, { body: { name } })).j;
const LV = [3, 2, 4, 3, 2, 3];
const r6 = (o = {}) => ({ cid: 'c' + Math.random().toString(36).slice(2, 10), kind: '6c', ref: 't1', at: Date.now(), data: { task: 't1', total: 17, max: 24, pct: 71, band: 'Proficient', levels: LV, decision: 'modify', conf: 4, aiMode: 'demo', xp: 62, hit: 3, flaws: 4, align: 75, ...o } });
const rm = () => ({ cid: 'm' + Math.random().toString(36).slice(2, 9), kind: 'method', ref: 'easy', at: Date.now(), data: { diff: 'easy', correct: 8, total: 10, xp: 80 } });
const rc = () => ({ cid: 'k' + Math.random().toString(36).slice(2, 9), kind: 'competition', ref: 'easy', at: Date.now(), data: { mode: 2, diff: 'easy', topic: 'mixed', questions: 10, scores: [60, 40] } });
const post = (code, token, items) => call('POST', `/api/classes/${code}/results`, { token, body: { items } });

let passed = 0; const out = [];
async function t(name, fn) { fresh(); try { await fn(); passed++; out.push('PASS  ' + name); } catch (e) { out.push('FAIL  ' + name + ' -> ' + (e.message || e).toString().split('\n')[0]); } }

await t('an EMPTY D1 database is enough: tables are created automatically on first use, then create / join / results / dashboard all work', async () => {
  DB = new D1Shim({ schema: false }); env = { DB, GEMINI_API_KEY: 'x' }; stubCaches();
  assert.equal(DB.db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table'").get().n, 0, 'database starts empty');
  const r = await call('POST', '/api/classes', { body: { className: 'Auto tables', teacherName: 'T' } });
  assert.ok(r.status === 200 || r.status === 201, JSON.stringify(r.j)); assert.match(r.j.code, /^[A-HJ-NP-Z2-9]{6}$/);
  const names = DB.db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(x => x.name);
  assert.deepEqual(names, ['classes', 'results', 'students']);
  const info = await call('GET', '/api/classes/' + r.j.code); assert.equal(info.status, 200); assert.equal(info.j.name || info.j.className, 'Auto tables', JSON.stringify(info.j));
  const j = await call('POST', `/api/classes/${r.j.code}/join`, { body: { name: 'Aziza' } }); assert.ok(j.status < 300, 'join ' + j.status + JSON.stringify(j.j));
  const pr = await post(r.j.code, j.j.token, [r6()]); assert.ok(pr.status < 300, 'results ' + pr.status + JSON.stringify(pr.j));
  const d = await call('GET', `/api/classes/${r.j.code}/dashboard`, { token: r.j.teacherKey }); assert.equal(d.status, 200, JSON.stringify(d.j).slice(0, 200)); assert.equal(d.j.students.length, 1); assert.equal(d.j.results.length, 1);
});
await t('automatic table creation never wipes data (second call, new worker instance, same database)', async () => {
  const { code, teacherKey } = await mk(); const s = await join(code, 'Bobur'); await post(code, s.token, [r6()]);
  const before = DB.db.prepare('SELECT COUNT(*) n FROM results').get().n;
  await call('GET', '/api/classes/' + code); const after = DB.db.prepare('SELECT COUNT(*) n FROM results').get().n;
  assert.equal(before, 1); assert.equal(after, 1);
});
await t('the D1 binding may have ANY name (DB, ai_ct_teacher_db, MY_DATABASE): health says classes ready and create/join work', async () => {
  for (const name of ['DB', 'ai_ct_teacher_db', 'MY_DATABASE']) {
    const d = new D1Shim({ schema: false }); const e = { GEMINI_API_KEY: 'x', GEMINI_MODEL: 'm', SOME_VAR: 'text', [name]: d }; stubCaches();
    const h = await worker.fetch(new Request('https://w.example/api/health', { headers: { Origin: 'https://sssprojectai.github.io' } }), e);
    assert.deepEqual(await h.json(), { ok: true, ai: true, classes: true }, name);
    const r = await worker.fetch(new Request('https://w.example/api/classes', { method: 'POST', headers: { Origin: 'https://sssprojectai.github.io', 'content-type': 'application/json' }, body: JSON.stringify({ className: 'Named ' + name }) }), e);
    assert.ok(r.status === 200 || r.status === 201, name + ' ' + r.status);
    assert.equal(d.db.prepare('SELECT COUNT(*) n FROM classes').get().n, 1, 'class stored in the database bound as ' + name);
  }
});
await t('no database bound at all: health says classes:false (the exact state that shows "class database is not set up")', async () => {
  const h = await worker.fetch(new Request('https://w.example/api/health', { headers: { Origin: 'https://sssprojectai.github.io' } }), { GEMINI_API_KEY: 'x', SOME_VAR: 'text' });
  assert.deepEqual(await h.json(), { ok: true, ai: true, classes: false });
});
await t('CORS: the GitHub Pages origin is allowed (preflight and request); another origin is refused', async () => {
  const pre = await worker.fetch(new Request('https://w.example/api/health', { method: 'OPTIONS', headers: { Origin: 'https://sssprojectai.github.io', 'Access-Control-Request-Method': 'GET' } }), { DB: new D1Shim() });
  assert.equal(pre.status, 204); assert.equal(pre.headers.get('Access-Control-Allow-Origin'), 'https://sssprojectai.github.io');
  const ok = await worker.fetch(new Request('https://w.example/api/health', { headers: { Origin: 'https://sssprojectai.github.io' } }), { DB: new D1Shim() });
  assert.equal(ok.status, 200); assert.equal(ok.headers.get('Access-Control-Allow-Origin'), 'https://sssprojectai.github.io');
  const no = await worker.fetch(new Request('https://w.example/api/health', { headers: { Origin: 'https://evil.example' } }), { DB: new D1Shim() });
  assert.equal(no.status, 403); assert.deepEqual(await no.json(), { error: 'origin_not_allowed' });
});
await t('health reports what is ready (AI key, class database)', async () => {
  let r = await call('GET', '/api/health', { env: {} }); assert.deepEqual([r.j.ai, r.j.classes], [false, false]);
  r = await call('GET', '/api/health', { env: { DB } }); assert.deepEqual([r.j.ai, r.j.classes], [false, true]);
  r = await call('GET', '/api/health', { env: { GEMINI_API_KEY: 'k' } }); assert.deepEqual([r.j.ai, r.j.classes], [true, false]);
  r = await call('GET', '/api/health'); assert.deepEqual([r.j.ai, r.j.classes], [true, true]); assert.ok(!r.text.includes('"x"'));
});
await t('without a database every class endpoint says classes_not_configured (503), not a crash', async () => {
  const r = await call('POST', '/api/classes', { body: { className: 'A' }, env: {} }); assert.equal(r.status, 503); assert.equal(r.j.error, 'classes_not_configured');
});
await t('create class: 6-char code from the safe alphabet, formatted key, name cleaned', async () => {
  const r = await call('POST', '/api/classes', { body: { className: '  3-kurs <b>A</b>   guruh ', teacherName: 'Sarvinoz' } });
  assert.equal(r.status, 201); assert.match(r.j.code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/); assert.match(r.j.teacherKey, /^([A-Z2-9]{4}-){4}[A-Z2-9]{4}$/); assert.equal(r.j.className, '3-kurs bA/b guruh');
});
await t('create class: invalid input rejected (empty name, bad JSON, huge body)', async () => {
  assert.equal((await call('POST', '/api/classes', { body: { className: '   ' } })).status, 400);
  assert.equal((await call('POST', '/api/classes', { raw: '{nope' })).status, 400);
  assert.equal((await call('POST', '/api/classes', { body: { className: 'x'.repeat(10000) } })).status, 400);
});
await t('only HASHES are stored: neither the teacher key nor a student token is in the database', async () => {
  const { code, key } = await mk(); const s = await join(code);
  const dump = JSON.stringify([...DB.db.prepare('SELECT * FROM classes').all(), ...DB.db.prepare('SELECT * FROM students').all()]);
  assert.ok(!dump.includes(key) && !dump.includes(key.replace(/-/g, '')) && !dump.includes(s.token));
  assert.match(DB.db.prepare('SELECT key_hash FROM classes').get().key_hash, /^[0-9a-f]{64}$/);
});
await t('class info is public but minimal; codes are case-insensitive; bad codes 404', async () => {
  const { code } = await mk('Info'); let r = await call('GET', '/api/classes/' + code.toLowerCase()); assert.equal(r.status, 200); assert.deepEqual(Object.keys(r.j).sort(), ['code', 'name']);
  assert.equal((await call('GET', '/api/classes/ZZZZZZ')).status, 404); assert.equal((await call('GET', '/api/classes/abc')).status, 404);
});
await t('join: returns id and token, duplicate names become (2), (3)', async () => {
  const { code } = await mk(); const a = await join(code, 'Aziza'), b = await join(code, 'aziza'), c = await join(code, 'Aziza');
  assert.match(a.token, /^[0-9a-f]{32}$/); assert.equal(a.name, 'Aziza'); assert.equal(b.name, 'aziza (2)'); assert.equal(c.name, 'Aziza (3)'); assert.equal(a.className, 'Group A');
});
await t('join: cleans names, rejects empty names, unknown classes, and a full class', async () => {
  const { code } = await mk(); let r = await call('POST', `/api/classes/${code}/join`, { body: { name: '  <script>x</script>\n  Bek  ' } }); assert.equal(r.j.name, 'scriptx/script Bek');
  assert.equal((await call('POST', `/api/classes/${code}/join`, { body: { name: '   ' } })).status, 400);
  assert.equal((await call('POST', '/api/classes/ZZZZZZ/join', { body: { name: 'A' } })).status, 404);
  for (let i = 0; i < 78; i++) DB.db.prepare('INSERT INTO students (id,code,name,token_hash,joined_at) VALUES (?,?,?,?,?)').run('a' + String(i).padStart(11, '0'), code, 'S' + i, 'h', 1);
  r = await call('POST', `/api/classes/${code}/join`, { body: { name: 'Last' } }); assert.equal(r.status, 201);
  r = await call('POST', `/api/classes/${code}/join`, { body: { name: 'Too many' } }); assert.equal(r.status, 403); assert.equal(r.j.error, 'class_full');
});
await t('SQL injection and script text in names stay harmless', async () => {
  const { code } = await mk(); const r = await call('POST', `/api/classes/${code}/join`, { body: { name: "x'); DROP TABLE classes;--" } }); assert.equal(r.status, 201);
  assert.equal(DB.db.prepare('SELECT COUNT(*) n FROM classes').get().n, 1); assert.equal(DB.db.prepare('SELECT name FROM students').get().name, "x'); DROP TABLE classes;--");
});
await t('results: valid 6C, method and competition items are saved; response says how many', async () => {
  const { code } = await mk(); const s = await join(code); const r = await post(code, s.token, [r6(), rm(), rc()]);
  assert.equal(r.status, 200); assert.equal(r.j.saved, 3); assert.equal(DB.db.prepare('SELECT COUNT(*) n FROM results').get().n, 3);
});
await t('turn-based Team Competition results: every size the app can send is accepted (1-4 teams x 5, 10 or 20 questions each), absurd sizes are not', async () => {
  const { code } = await mk(); const s = await join(code);
  for (const mode of [1, 2, 3, 4]) for (const per of [5, 10, 20]) {
    const item = { cid: 'c' + mode + '_' + per, kind: 'competition', ref: 'easy', at: Date.now(), data: { mode, diff: 'easy', topic: 'mixed', questions: mode * per, scores: Array.from({ length: mode }, () => per * 10) } };
    const r = await post(code, s.token, [item]); assert.equal(r.status, 200, `mode ${mode} x ${per}`);
  }
  const big = { cid: 'big', kind: 'competition', ref: 'easy', at: Date.now(), data: { mode: 2, diff: 'easy', topic: 'mixed', questions: 151, scores: [10, 10] } };
  assert.equal((await post(code, s.token, [big])).status, 400);
});
await t('results are idempotent: resending the same cid never double-counts', async () => {
  const { code } = await mk(); const s = await join(code); const item = r6(); await post(code, s.token, [item]); await post(code, s.token, [item]); await post(code, s.token, [item, item]);
  assert.equal(DB.db.prepare('SELECT COUNT(*) n FROM results').get().n, 1);
});
await t('only scores are stored: extra fields such as written text are dropped', async () => {
  const { code } = await mk(); const s = await join(code); const item = r6({ reason: 'my private written answer', learned: 'secret', name: 'x' }); item.extra = 'more';
  assert.equal((await post(code, s.token, [item])).status, 200); const row = DB.db.prepare('SELECT * FROM results').get();
  assert.ok(!row.data.includes('private') && !row.data.includes('secret') && !row.data.includes('more')); assert.deepEqual(Object.keys(JSON.parse(row.data)).sort(), ['aiMode', 'align', 'band', 'conf', 'decision', 'flaws', 'hit', 'levels', 'max', 'pct', 'task', 'total', 'xp']);
});
await t('results: malformed or inconsistent data is rejected with 400 and nothing is saved', async () => {
  const { code } = await mk(); const s = await join(code);
  const bad = [r6({ levels: [1, 2, 3] }), r6({ total: 20 }), r6({ band: 'Genius' }), r6({ pct: 101 }), r6({ conf: 9 }), r6({ aiMode: 'x' }), r6({ task: 'task1' }), r6({ xp: 9999 }), { ...r6(), kind: 'quiz' }, { ...r6(), cid: 'bad cid!' }, { ...r6(), ref: 'a/b' },
    { ...rm(), data: { diff: 'easy', correct: 11, total: 10, xp: 1 } }, { ...rc(), data: { mode: 3, diff: 'easy', topic: 'mixed', questions: 5, scores: [1, 2] } }, { ...rc(), data: { mode: 2, diff: 'hard', topic: 'mixed', questions: 5, scores: [1, 2] } }, 'string', null];
  for (const b of bad) assert.equal((await post(code, s.token, [b])).status, 400, JSON.stringify(b).slice(0, 80));
  assert.equal((await post(code, s.token, Array.from({ length: 21 }, () => r6()))).status, 400); assert.equal((await post(code, s.token, [])).status, 400);
  assert.equal((await call('POST', `/api/classes/${code}/results`, { token: s.token, body: { items: 'x' } })).status, 400);
  assert.equal(DB.db.prepare('SELECT COUNT(*) n FROM results').get().n, 0);
});
await t('a batch with one bad item saves nothing (all or nothing)', async () => {
  const { code } = await mk(); const s = await join(code); assert.equal((await post(code, s.token, [r6(), r6({ total: 99 })])).status, 400); assert.equal(DB.db.prepare('SELECT COUNT(*) n FROM results').get().n, 0);
});
await t('results need the right student token: none, wrong, or another class all give 401', async () => {
  const A = await mk('A'), B = await mk('B'), sa = await join(A.code), sb = await join(B.code);
  assert.equal((await post(A.code, undefined, [r6()])).status, 401); assert.equal((await post(A.code, 'f'.repeat(32), [r6()])).status, 401); assert.equal((await post(A.code, sb.token, [r6()])).status, 401); assert.equal((await post(A.code, sa.token, [r6()])).status, 200);
});
await t('a far-future or ancient timestamp is replaced by the server time', async () => {
  const { code } = await mk(); const s = await join(code); const it = r6(); it.at = Date.now() + 9e12; await post(code, s.token, [it]); const at = DB.db.prepare('SELECT at FROM results').get().at; assert.ok(Math.abs(at - Date.now()) < 5000);
});
await t('dashboard: the teacher sees students and scores; key may be typed in any case, with or without dashes', async () => {
  const { code, key } = await mk('Dash'); const s1 = await join(code, 'Aziza'), s2 = await join(code, 'Bek'); await post(code, s1.token, [r6(), rm()]); await post(code, s2.token, [rc()]);
  for (const k of [key, key.toLowerCase(), key.replace(/-/g, '')]) { const r = await call('GET', `/api/classes/${code}/dashboard`, { token: k }); assert.equal(r.status, 200); assert.equal(r.j.class.name, 'Dash'); assert.equal(r.j.students.length, 2); assert.equal(r.j.results.length, 3); assert.equal(r.j.results.find(x => x.kind === '6c').data.total, 17); }
});
await t('dashboard never exposes tokens or hashes', async () => {
  const { code, key } = await mk(); const s = await join(code); await post(code, s.token, [r6()]); const r = await call('GET', `/api/classes/${code}/dashboard`, { token: key });
  assert.ok(!/token|hash/i.test(r.text.replace(/"studentId"/g, ''))); assert.ok(!r.text.includes(s.token));
});
await t('dashboard: wrong key, no key, a student token, or another class key are all refused (403); unknown class 404', async () => {
  const A = await mk('A'), B = await mk('B'), s = await join(A.code);
  for (const k of ['WRONGKEYWRONGKEYWRONG', undefined, s.token, B.key]) assert.equal((await call('GET', `/api/classes/${A.code}/dashboard`, { token: k })).status, 403);
  assert.equal((await call('GET', '/api/classes/ZZZZZZ/dashboard', { token: A.key })).status, 404);
});
await t('teacher can remove one student: results go, token stops working, others untouched', async () => {
  const { code, key } = await mk(); const a = await join(code, 'A'), b = await join(code, 'B'); await post(code, a.token, [r6()]); await post(code, b.token, [r6()]);
  assert.equal((await call('DELETE', `/api/classes/${code}/students/${a.studentId}`, { token: key })).status, 200);
  assert.equal(DB.db.prepare('SELECT COUNT(*) n FROM results').get().n, 1); assert.equal((await post(code, a.token, [r6()])).status, 401); assert.equal((await post(code, b.token, [r6()])).status, 200);
  assert.equal((await call('DELETE', `/api/classes/${code}/students/${b.studentId}`, { token: 'WRONG-KEY-WRONG-KEY-WRON' })).status, 403);
});
await t('a student can leave: only their own data is removed', async () => {
  const { code } = await mk(); const a = await join(code, 'A'), b = await join(code, 'B'); await post(code, a.token, [r6(), rm()]); await post(code, b.token, [r6()]);
  assert.equal((await call('DELETE', `/api/classes/${code}/me`, { token: a.token })).status, 200); assert.equal(DB.db.prepare('SELECT COUNT(*) n FROM results').get().n, 1); assert.equal(DB.db.prepare('SELECT COUNT(*) n FROM students').get().n, 1);
  assert.equal((await call('DELETE', `/api/classes/${code}/me`, { token: a.token })).status, 401);
});
await t('deleting a class removes the class, students and results; then everything 404/401', async () => {
  const A = await mk('A'), B = await mk('B'), s = await join(A.code), sb = await join(B.code); await post(A.code, s.token, [r6()]); await post(B.code, sb.token, [r6()]);
  assert.equal((await call('DELETE', `/api/classes/${A.code}`, { token: B.key })).status, 403); assert.equal((await call('DELETE', `/api/classes/${A.code}`, { token: A.key })).status, 200);
  assert.equal((await call('GET', `/api/classes/${A.code}`)).status, 404); assert.equal((await call('GET', `/api/classes/${A.code}/dashboard`, { token: A.key })).status, 404); assert.equal((await post(A.code, s.token, [r6()])).status, 401);
  assert.equal(DB.db.prepare("SELECT COUNT(*) n FROM results WHERE code=?").get(A.code).n, 0); assert.equal(DB.db.prepare("SELECT COUNT(*) n FROM results WHERE code=?").get(B.code).n, 1);
});
await t('CORS: allowed origin echoed with Authorization + DELETE allowed; other origins refused', async () => {
  let r = await call('OPTIONS', '/api/classes'); assert.equal(r.status, 204); assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN); assert.match(r.headers.get('Access-Control-Allow-Headers'), /Authorization/); assert.match(r.headers.get('Access-Control-Allow-Methods'), /DELETE/);
  r = await call('POST', '/api/classes', { origin: 'https://evil.example', body: { className: 'x' } }); assert.equal(r.status, 403); assert.notEqual(r.headers.get('Access-Control-Allow-Origin'), 'https://evil.example'); assert.equal(DB.db.prepare('SELECT COUNT(*) n FROM classes').get().n, 0);
  assert.equal((await call('POST', '/api/classes', { origin: '', body: { className: 'x' } })).status, 403);
});
await t('wrong methods and unknown paths are refused cleanly', async () => {
  const { code } = await mk(); assert.equal((await call('GET', '/api/classes')).status, 405); assert.equal((await call('PUT', `/api/classes/${code}`)).status, 405); assert.equal((await call('GET', `/api/classes/${code}/results`)).status, 405); assert.equal((await call('GET', `/api/classes/${code}/nope`)).status, 404); assert.equal((await call('GET', '/elsewhere')).status, 404);
});
await t('rate limits: at most 6 classes per hour per IP; other IPs unaffected', async () => {
  for (let i = 0; i < 6; i++) assert.equal((await call('POST', '/api/classes', { body: { className: 'c' + i }, ip: '7.7.7.7' })).status, 201);
  assert.equal((await call('POST', '/api/classes', { body: { className: 'c7' }, ip: '7.7.7.7' })).status, 429); assert.equal((await call('POST', '/api/classes', { body: { className: 'c8' }, ip: '8.8.8.8' })).status, 201);
});
await t('a database error returns a generic 500 without internal details', async () => {
  const broken = { DB: { prepare() { throw new Error('secret internal SQL detail'); }, batch() { throw new Error('x'); } } }; const r = await call('POST', '/api/classes', { body: { className: 'A' }, env: broken });
  assert.equal(r.status, 500); assert.equal(r.j.error, 'server_error'); assert.ok(!r.text.includes('secret internal'));
});
await t('the AI route still works next to classes (mocked Google) and needs no database', async () => {
  const real = globalThis.fetch; globalThis.fetch = async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ response: 'Try pair work.', claims_to_check: ['c'], possible_assumptions: [], uncertainty: 'u', follow_up_question: 'q?' }) }] } }] }), { status: 200 });
  try { const r = await call('POST', '/api/ai', { body: { scenario: 'A class', stage: 'consult', studentResponse: 'help' }, env: { GEMINI_API_KEY: 'k' } }); assert.equal(r.status, 200); assert.equal(r.j.response, 'Try pair work.'); } finally { globalThis.fetch = real; }
});

console.log(out.join('\n')); console.log('\n' + passed + '/' + out.length + ' passed'); process.exit(passed === out.length ? 0 : 1);
