# AI-CT TEACHER — BACKEND (one Cloudflare Worker, Gemini only)
Author: PhD researcher Sarvinoz Solexonovna · Samarkand State Institute of Foreign Languages (SamDChTI)

Deploy FROM `backend/cloudflare-worker` using Command Prompt (cmd):

    npx wrangler login
    npx wrangler deploy
    npx wrangler secret put GEMINI_API_KEY

The Worker is named `ai-ct-teacher-ai` (https://ai-ct-teacher-ai.ai-ct-teacher-api.workers.dev) and is the single address used by the website (`API_BASE`).
It has two routes only: `GET /api/health` and `POST /api/ai` (6C Consult and AI Chat). No classes, no database.
The Gemini key exists only as a Worker secret. Never put it in a file. Details: backend/README.md.
Tests (Node 22+): `node tests/worker.test.mjs`
In your GitHub repository's `backend/cloudflare-worker/` folder, delete `classes.js` and `schema.sql` if they are still there: they are no longer used.
