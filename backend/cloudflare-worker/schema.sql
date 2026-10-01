-- AI-CT TEACHER class database (Cloudflare D1 / SQLite).
-- Normally you do NOT need to run this file: the Worker creates these tables by itself on first use (same SQL). It is kept for a manual setup:  wrangler d1 execute ai-ct-teacher-db --remote --file=schema.sql
-- Only scores and display names are stored. Secrets are stored as SHA-256 hashes.
CREATE TABLE IF NOT EXISTS classes (
  code         TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  teacher_name TEXT,
  key_hash     TEXT NOT NULL,
  created_at   INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS students (
  id         TEXT PRIMARY KEY,
  code       TEXT NOT NULL,
  name       TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  joined_at  INTEGER NOT NULL,
  last_at    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_students_code ON students(code);
CREATE TABLE IF NOT EXISTS results (
  student_id TEXT NOT NULL,
  cid        TEXT NOT NULL,
  code       TEXT NOT NULL,
  kind       TEXT NOT NULL,
  ref        TEXT,
  at         INTEGER NOT NULL,
  data       TEXT NOT NULL,
  PRIMARY KEY (student_id, cid)
);
CREATE INDEX IF NOT EXISTS idx_results_code ON results(code);
