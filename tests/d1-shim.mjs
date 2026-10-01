// A minimal stand-in for Cloudflare D1, backed by a REAL SQLite database (node:sqlite),
// so the SQL in classes.js is executed for real in tests and in the local dev server.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const schema = fs.readFileSync(path.join(here, '..', 'backend', 'cloudflare-worker', 'schema.sql'), 'utf8');

class Stmt {
  constructor(db, sql, params = []) { this.db = db; this.sql = sql; this.params = params; }
  bind(...p) { return new Stmt(this.db, this.sql, p); }
  async first() { const r = this.db.prepare(this.sql).get(...this.params); return r === undefined ? null : { ...r }; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.params).map(r => ({ ...r })) }; }
  async run() { const i = this.db.prepare(this.sql).run(...this.params); return { success: true, meta: { changes: i.changes } }; }
}
export class D1Shim {
  constructor(opts = {}) { this.db = new DatabaseSync(':memory:'); if (opts.schema !== false) this.db.exec(schema); }   // schema:false = an EMPTY database, like a freshly created D1
  prepare(sql) { return new Stmt(this.db, sql); }
  async batch(stmts) {
    this.db.exec('BEGIN');
    try { for (const s of stmts) await s.run(); this.db.exec('COMMIT'); }
    catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
}
