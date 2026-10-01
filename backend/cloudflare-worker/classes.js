/**
 * Class system (teacher creates a class, students join by link, teacher sees scores).
 * Storage: Cloudflare D1 (SQLite). Only scores are stored, never students' written answers.
 * Secrets: the teacher key and each student's token are random, shown/returned once, and only
 * their SHA-256 hashes are stored. Tokens travel in the Authorization header, not in URLs.
 */
import { json, readJson, rateLimit, sha256Hex, randomString, bearer, cleanText } from './common.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no I, O, 0, 1: easy to read aloud and type
const HEX = '0123456789abcdef';
const MAX_STUDENTS = 80;
const MAX_RESULTS_PER_STUDENT = 2000;
const KINDS = ['6c', 'method', 'competition'];
const BANDS = ['Beginning', 'Developing', 'Proficient', 'Advanced'];
const DIFFS = ['easy', 'medium', 'advanced'];

const first = (env, sql, ...b) => env.DB.prepare(sql).bind(...b).first();
const all = async (env, sql, ...b) => (await env.DB.prepare(sql).bind(...b).all()).results || [];
const stmt = (env, sql, ...b) => env.DB.prepare(sql).bind(...b);
const normKey = k => String(k || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const formatKey = raw => raw.match(/.{1,4}/g).join('-');
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const int = (v, min, max) => (typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max) ? v : null;

/* ---------- validation of what students send (scores only) ---------- */
function validate6c(d) {
  if (!isObj(d)) return null;
  const levels = Array.isArray(d.levels) && d.levels.length === 6 ? d.levels.map(l => int(l, 1, 4)) : null;
  if (!levels || levels.includes(null)) return null;
  const total = int(d.total, 6, 24), pct = int(d.pct, 0, 100), conf = int(d.conf, 0, 5), xp = int(d.xp, 0, 200), hit = int(d.hit, 0, 10), flaws = int(d.flaws, 0, 10), align = int(d.align, -1, 100);
  if ([total, pct, conf, xp, hit, flaws, align].includes(null)) return null;
  if (d.max !== 24 || total !== levels.reduce((a, b) => a + b, 0)) return null;
  if (!/^t\d{1,3}$/.test(d.task) || !BANDS.includes(d.band) || !['accept', 'modify', 'reject', ''].includes(d.decision) || !['demo', 'live', 'backend'].includes(d.aiMode)) return null;
  return { task: d.task, total, max: 24, pct, band: d.band, levels, decision: d.decision, conf, aiMode: d.aiMode, xp, hit, flaws, align };
}
function validateMethod(d) {
  if (!isObj(d)) return null;
  const total = int(d.total, 1, 20), correct = total == null ? null : int(d.correct, 0, total), xp = int(d.xp, 0, 200);
  if ([total, correct, xp].includes(null) || !['easy', 'medium', 'advanced', 'mixed'].includes(d.diff)) return null;
  return { diff: d.diff, correct, total, xp };
}
function validateCompetition(d) {
  if (!isObj(d)) return null;
  const mode = int(d.mode, 1, 4), questions = int(d.questions, 1, 150);
  if (mode == null || questions == null || !DIFFS.includes(d.diff) || !['mixed', 'methods', 'situations', 'grammar'].includes(d.topic)) return null;
  const scores = Array.isArray(d.scores) && d.scores.length === mode ? d.scores.map(s => int(s, 0, 400)) : null;
  if (!scores || scores.includes(null)) return null;
  return { mode, diff: d.diff, topic: d.topic, questions, scores };
}
function validateItem(item, now) {
  if (!isObj(item) || typeof item.cid !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(item.cid)) return null;
  if (!KINDS.includes(item.kind)) return null;
  const ref = item.ref == null ? '' : item.ref;
  if (typeof ref !== 'string' || !/^[A-Za-z0-9_-]{0,40}$/.test(ref)) return null;
  const at = (typeof item.at === 'number' && Number.isFinite(item.at) && item.at > now - 2 * 365 * 864e5 && item.at < now + 864e5) ? Math.floor(item.at) : now;
  const data = item.kind === '6c' ? validate6c(item.data) : item.kind === 'method' ? validateMethod(item.data) : validateCompetition(item.data);
  return data ? { cid: item.cid, kind: item.kind, ref, at, data: JSON.stringify(data) } : null;
}

/* ---------- authentication ---------- */
async function studentFor(request, env, code) {
  const t = bearer(request);
  return t ? first(env, 'SELECT id, name FROM students WHERE code = ? AND token_hash = ?', code, await sha256Hex(t)) : null;
}
/** Returns {cls} when the teacher key is right, or {resp} with the error to send. */
async function teacherFor(request, env, code, cors) {
  const cls = await first(env, 'SELECT code, name, created_at AS createdAt, key_hash AS keyHash FROM classes WHERE code = ?', code);
  if (!cls) return { resp: json({ error: 'not_found' }, 404, cors) };
  const k = normKey(bearer(request));
  if (!k || (await sha256Hex(k)) !== cls.keyHash) return { resp: json({ error: 'forbidden' }, 403, cors) };
  return { cls };
}

/* ---------- handlers ---------- */
async function createClass(request, env, cors) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors);
  const rl = await rateLimit(request, 'create', 6, 3600);
  if (!rl.ok) return json({ error: 'rate_limited', retryAfterSeconds: rl.retryAfterSeconds }, 429, cors);
  const body = await readJson(request, 4000);
  if (!body) return json({ error: 'invalid_json' }, 400, cors);
  const className = cleanText(body.className, 60), teacherName = cleanText(body.teacherName, 40);
  if (!className) return json({ error: 'invalid_input' }, 400, cors);
  for (let i = 0; i < 6; i++) {
    const code = randomString(CODE_ALPHABET, 6), key = formatKey(randomString(CODE_ALPHABET, 20));
    try {
      await stmt(env, 'INSERT INTO classes (code, name, teacher_name, key_hash, created_at) VALUES (?, ?, ?, ?, ?)', code, className, teacherName, await sha256Hex(normKey(key)), Date.now()).run();
      return json({ code, teacherKey: key, className }, 201, cors);
    } catch (e) { if (!/UNIQUE|constraint/i.test(String(e && e.message))) throw e; }   // code collision: try another
  }
  return json({ error: 'server_error' }, 500, cors);
}

async function classInfo(request, env, cors, code) {
  const rl = await rateLimit(request, 'info', 60, 60);
  if (!rl.ok) return json({ error: 'rate_limited' }, 429, cors);
  const cls = await first(env, 'SELECT code, name FROM classes WHERE code = ?', code);
  return cls ? json({ code: cls.code, name: cls.name }, 200, cors) : json({ error: 'not_found' }, 404, cors);
}

async function joinClass(request, env, cors, code) {
  const rl = await rateLimit(request, 'join', 30, 60);
  if (!rl.ok) return json({ error: 'rate_limited' }, 429, cors);
  const body = await readJson(request, 2000);
  if (!body) return json({ error: 'invalid_json' }, 400, cors);
  const name = cleanText(body.name, 40);
  if (!name) return json({ error: 'invalid_input' }, 400, cors);
  const cls = await first(env, 'SELECT code, name FROM classes WHERE code = ?', code);
  if (!cls) return json({ error: 'not_found' }, 404, cors);
  const rows = await all(env, 'SELECT name FROM students WHERE code = ?', code);
  if (rows.length >= MAX_STUDENTS) return json({ error: 'class_full' }, 403, cors);
  const taken = new Set(rows.map(r => r.name.toLowerCase()));
  let final = name, k = 2;
  while (taken.has(final.toLowerCase())) final = name.slice(0, 34) + ' (' + (k++) + ')';
  const id = randomString(HEX, 12), token = randomString(HEX, 32), now = Date.now();
  await stmt(env, 'INSERT INTO students (id, code, name, token_hash, joined_at, last_at) VALUES (?, ?, ?, ?, ?, ?)', id, code, final, await sha256Hex(token), now, now).run();
  return json({ studentId: id, token, name: final, className: cls.name }, 201, cors);
}

async function postResults(request, env, cors, code) {
  const rl = await rateLimit(request, 'results', 120, 60);
  if (!rl.ok) return json({ error: 'rate_limited' }, 429, cors);
  const st = await studentFor(request, env, code);
  if (!st) return json({ error: 'unauthorized' }, 401, cors);
  const body = await readJson(request, 40000);
  if (!body || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) return json({ error: 'invalid_input' }, 400, cors);
  const now = Date.now(), clean = body.items.map(i => validateItem(i, now));
  if (clean.includes(null)) return json({ error: 'invalid_input' }, 400, cors);
  const n = await first(env, 'SELECT COUNT(*) AS n FROM results WHERE student_id = ?', st.id);
  if (n && n.n + clean.length > MAX_RESULTS_PER_STUDENT) return json({ error: 'too_many_results' }, 429, cors);
  // INSERT OR REPLACE on (student_id, cid): re-sending the same result after a network error never double-counts
  const stmts = clean.map(v => stmt(env, 'INSERT OR REPLACE INTO results (student_id, cid, code, kind, ref, at, data) VALUES (?, ?, ?, ?, ?, ?, ?)', st.id, v.cid, code, v.kind, v.ref, v.at, v.data));
  stmts.push(stmt(env, 'UPDATE students SET last_at = ? WHERE id = ?', now, st.id));
  await env.DB.batch(stmts);
  return json({ ok: true, saved: clean.length }, 200, cors);
}

async function leaveClass(request, env, cors, code) {
  const st = await studentFor(request, env, code);
  if (!st) return json({ error: 'unauthorized' }, 401, cors);
  await env.DB.batch([stmt(env, 'DELETE FROM results WHERE student_id = ?', st.id), stmt(env, 'DELETE FROM students WHERE id = ?', st.id)]);
  return json({ ok: true }, 200, cors);
}

async function dashboard(request, env, cors, code) {
  const rl = await rateLimit(request, 'dash', 60, 60);
  if (!rl.ok) return json({ error: 'rate_limited' }, 429, cors);
  const t = await teacherFor(request, env, code, cors);
  if (t.resp) return t.resp;
  const students = await all(env, 'SELECT id, name, joined_at AS joinedAt, last_at AS lastAt FROM students WHERE code = ? ORDER BY joined_at', code);
  const rows = await all(env, 'SELECT student_id AS studentId, cid, kind, ref, at, data FROM results WHERE code = ? ORDER BY at DESC LIMIT 6000', code);
  const results = rows.map(r => { let data = {}; try { data = JSON.parse(r.data); } catch { /* skip bad row data */ } return { studentId: r.studentId, cid: r.cid, kind: r.kind, ref: r.ref, at: r.at, data }; });
  return json({ class: { code, name: t.cls.name, createdAt: t.cls.createdAt }, students, results }, 200, cors);
}

async function deleteClass(request, env, cors, code) {
  const t = await teacherFor(request, env, code, cors);
  if (t.resp) return t.resp;
  await env.DB.batch([stmt(env, 'DELETE FROM results WHERE code = ?', code), stmt(env, 'DELETE FROM students WHERE code = ?', code), stmt(env, 'DELETE FROM classes WHERE code = ?', code)]);
  return json({ ok: true }, 200, cors);
}

async function removeStudent(request, env, cors, code, sid) {
  const t = await teacherFor(request, env, code, cors);
  if (t.resp) return t.resp;
  if (!/^[0-9a-f]{12}$/.test(sid)) return json({ error: 'invalid_input' }, 400, cors);
  await env.DB.batch([stmt(env, 'DELETE FROM results WHERE student_id = ? AND code = ?', sid, code), stmt(env, 'DELETE FROM students WHERE id = ? AND code = ?', sid, code)]);
  return json({ ok: true }, 200, cors);
}

/* ---------- tables are created automatically (same SQL as schema.sql), so binding an empty D1 database is enough ---------- */
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS classes (
  code         TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  teacher_name TEXT,
  key_hash     TEXT NOT NULL,
  created_at   INTEGER NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS students (
  id         TEXT PRIMARY KEY,
  code       TEXT NOT NULL,
  name       TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  joined_at  INTEGER NOT NULL,
  last_at    INTEGER
)`,
  `CREATE INDEX IF NOT EXISTS idx_students_code ON students(code)`,
  `CREATE TABLE IF NOT EXISTS results (
  student_id TEXT NOT NULL,
  cid        TEXT NOT NULL,
  code       TEXT NOT NULL,
  kind       TEXT NOT NULL,
  ref        TEXT,
  at         INTEGER NOT NULL,
  data       TEXT NOT NULL,
  PRIMARY KEY (student_id, cid)
)`,
  `CREATE INDEX IF NOT EXISTS idx_results_code ON results(code)`,
];
let schemaReadyFor = null;
async function ensureSchema(env) {
  if (schemaReadyFor === env.DB) return;
  await env.DB.batch(SCHEMA_STATEMENTS.map(sql => env.DB.prepare(sql)));      // every statement is IF NOT EXISTS: safe to repeat
  schemaReadyFor = env.DB;
}

/* ---------- router for /api/classes... ---------- */
export async function handleClasses(request, env, cors, path) {
  if (!env || !env.DB) return json({ error: 'classes_not_configured' }, 503, cors);
  await ensureSchema(env);
  const parts = path.replace(/^\/api\/classes\/?/, '').split('/').filter(Boolean), m = request.method;
  if (parts.length === 0) return createClass(request, env, cors);
  const code = String(parts[0]).toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) return json({ error: 'not_found' }, 404, cors);
  const sub = parts[1];
  if (!sub) return m === 'GET' ? classInfo(request, env, cors, code) : m === 'DELETE' ? deleteClass(request, env, cors, code) : json({ error: 'method_not_allowed' }, 405, cors);
  if (parts.length === 2) {
    if (sub === 'join') return m === 'POST' ? joinClass(request, env, cors, code) : json({ error: 'method_not_allowed' }, 405, cors);
    if (sub === 'results') return m === 'POST' ? postResults(request, env, cors, code) : json({ error: 'method_not_allowed' }, 405, cors);
    if (sub === 'me') return m === 'DELETE' ? leaveClass(request, env, cors, code) : json({ error: 'method_not_allowed' }, 405, cors);
    if (sub === 'dashboard') return m === 'GET' ? dashboard(request, env, cors, code) : json({ error: 'method_not_allowed' }, 405, cors);
  }
  if (parts.length === 3 && sub === 'students') return m === 'DELETE' ? removeStudent(request, env, cors, code, parts[2]) : json({ error: 'method_not_allowed' }, 405, cors);
  return json({ error: 'not_found' }, 404, cors);
}
