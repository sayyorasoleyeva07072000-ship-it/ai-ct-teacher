# AI-CT TEACHER

**Artificial Intelligence – Critical Thinking for Future English Teachers**

- **Author:** PhD researcher Sarvinoz Solexonovna
- **Institution:** Samarkand State Institute of Foreign Languages (SamDChTI)
- **Repository:** https://github.com/sssprojectai/ai-ct-teacher
- **Site (GitHub Pages):** https://sssprojectai.github.io/ai-ct-teacher/

This is the author's research prototype. It is not an official product of, or endorsed by, any institution.

## Two separate parts

| | GitHub Pages FRONTEND | Secure BACKEND |
|---|---|---|
| What | The website: `index.html`, `app/`, `assets/` | One Cloudflare Worker that talks to Gemini |
| Package | `ai-ct-teacher-github-pages.zip` | `ai-ct-teacher-backend.zip` |
| Needs Node.js to run? | No | Only to deploy it (`npx wrangler`) |
| Holds secrets? | **Never** | The Gemini key, as a Worker secret only |

There is **one** backend address, set in one place: `const API_BASE='https://ai-ct-teacher-ai.ai-ct-teacher-api.workers.dev';` in `app/js/app.js`. The website also works without it (demo mode).

## What the platform is

An electronic methodological prototype that develops future English teachers' critical thinking by treating AI as an **object of critical analysis**: the student thinks first, consults AI, then examines, checks and challenges its answer, and records an accountable decision with a short reflection. The interface is in **English**; short Uzbek notes appear only as smaller support text.

### The AI-CT 6C cycle (exactly six stages)

1. **Context** – read the situation and think for yourself. No AI.
2. **Consult** – talk with the AI about the situation (the only AI stage of the cycle).
3. **Critique** – mark the parts that are convincing, questionable or worth checking.
4. **Check** – say where you would verify each claim and give a verdict.
5. **Challenge** – improve the suggestion and name its risk.
6. **Conclude** – accept, modify or reject; explain; say what you learned. Reflection is the closing part of this stage; there is no seventh stage.

### What is in the app

- **Task library:** 32 tasks in 8 categories, each worked through the 6C cycle, with instant feedback and stage-by-stage indicators (level 1–4 per stage, total 6–24; learning-activity indicators, not a validated test).
- **AI Chat:** a free, general conversation with Gemini about English, grammar, teaching or studies. It is separate from the 6C Consult stage and is not scored.
- **Method Challenge** (75 questions) and **Team Competition** (156 questions; 5, 10 or 20 questions per team; 1–4 teams; 20-second timer).
- **My progress:** profile (a name stored on the device), XP, streak, badges, history of records, JSON/CSV export.
- Projector mode and full screen for interactive whiteboards, light and dark themes, sound with a visible switch.

## Frontend deployment (GitHub Pages)

1. Unzip `ai-ct-teacher-github-pages.zip`. Its files go **directly into the repository root** (`index.html` at the top, next to `app/` and `assets/`).
2. Copy them into your local clone of `sssprojectai/ai-ct-teacher`, replacing old files. Do not touch `.git` or the Search Console verification file.
3. GitHub Desktop: **Commit to main**, then **Push origin**.
4. github.com > repository > **Settings > Pages**: Source **Deploy from a branch**, branch **main**, folder **/ (root)**.
5. Open https://sssprojectai.github.io/ai-ct-teacher/ and press Ctrl+F5. The menu footer shows the build id (for example `build 2026-10-02-e1`).

## Backend deployment (Cloudflare)

See `backend/README.md`. In short (Command Prompt, folder `backend/cloudflare-worker`): `npx wrangler deploy`, then `npx wrangler secret put GEMINI_API_KEY`. The Gemini key exists **only** on the server: students never see, enter or store a key, and it is never in the frontend, `localStorage` or GitHub. If Gemini is unavailable the app shows "AI service is temporarily unavailable", stays usable, and Consult offers the clearly labelled demonstration answer.

**Verification status:** the Worker is tested against a mocked Google API. A real Gemini request has not been executed by the author of this package (NOT TESTED — REQUIRES LIVE GEMINI KEY). Run `node tests/live-gemini-check.mjs` with your key in an environment variable to check it.

## Demo mode

While the server is not reachable, Consult shows a pre-written answer labelled "DEMONSTRATION" and AI Chat says it needs the AI service.

## Local testing

```
python3 -m http.server 8000          # serve the frontend, open http://localhost:8000/
node tests/worker.test.mjs           # backend tests (mocked Google)
node tests/dev-server.mjs            # local API with a MOCKED Gemini, for offline demonstrations
node tests/live-gemini-check.mjs     # REAL Gemini with YOUR key from an environment variable
```

Browser tests (Playwright) are in the complete-source package under `tests-browser/`.

## Updating the project

Edit the sources in the complete-source package (`source/build/*.js`, `head.html`; the Uzbek support text is in `data-uz.js`), run `python3 source/build_site.py`, run the tests, then copy the `site/` files (without `backend/` and `tests/`) to the repository as above. Set `API_BASE` again after a rebuild.

## Data and privacy

Progress, XP, badges and written answers are stored only in this browser (`localStorage`). Nothing is uploaded except the text you send to the AI (Consult messages and AI Chat messages), which goes through the secure server to Gemini. Do not type personal data about real students into the AI.

## Limits

Scores cannot judge the quality of an idea. For research, trained human raters should score the records with the same rubric; scientific validity comes from the study design, sample and analysis, not from the software alone.
