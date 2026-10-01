# AI-CT TEACHER

**Artificial Intelligence – Critical Thinking for Future English Teachers**

- **Author:** PhD researcher Sarvinoz Solexonovna
- **Institution:** Samarkand State Institute of Foreign Languages (SamDChTI)
- **Repository:** https://github.com/sssprojectai/ai-ct-teacher
- **Site (GitHub Pages):** https://sssprojectai.github.io/ai-ct-teacher/

This is the author's research prototype. It is not an official product of, or endorsed by, any institution.

## Two separate parts: do not mix them up

| | GitHub Pages FRONTEND | Secure BACKEND (optional) |
|---|---|---|
| What | The website: `index.html`, `app/`, `assets/` ... | A Cloudflare Worker: live Gemini AI + class database |
| Where it runs | GitHub Pages (static files, **no Node.js needed**) | Cloudflare (your own free account) |
| Package | `ai-ct-teacher-github-pages.zip` | `ai-ct-teacher-backend.zip` |
| Holds secrets? | **Never.** There is no key anywhere in it | The Gemini key, as a Cloudflare secret only |

The website works completely without the backend (demo mode, see G).

## A. What AI-CT TEACHER is

An electronic methodological prototype that develops future English teachers' critical thinking by treating AI as an **object of critical analysis**: the student thinks first, asks AI once, then examines, checks and challenges its answer, and records an accountable decision with a short reflection.

## B. The 6C methodology (exactly six stages)

1. **Context** – read the situation and think for yourself. No AI.
2. **Consult** – ask the AI. The only stage with AI.
3. **Critique** – tap the parts that are convincing, questionable or worth checking.
4. **Check** – say where you would verify each claim, what you found, and give a verdict.
5. **Challenge** – improve the suggestion and name its risk.
6. **Conclude** – accept, modify or reject, explain why, and say what you learned. Reflection is the closing part of this stage; there is no seventh stage.

Each stage has three visible indicators (level = 1 + indicators met, total 6–24). These are learning-activity indicators, **not a validated test**. Content: 32 tasks in 8 categories, Method Challenge (75 questions), Team Competition (156 questions), XP, badges, streak, profile, export (JSON/CSV), projector mode, full screen, sound switch, Uzbek and English explanations.

## C. Frontend deployment to GitHub Pages

1. Unzip `ai-ct-teacher-github-pages.zip`. Its files are meant to sit **directly in the repository root** (`index.html` at the top, next to `app/` and `assets/`).
2. Copy all of them into your local clone of `sssprojectai/ai-ct-teacher`, replacing old files. Do not touch `.git`. Delete old files that are no longer used (`js/site.js`, `css/site.css`).
3. GitHub Desktop: write a summary, **Commit to main**, **Push origin**.
4. github.com > repository > **Settings > Pages**: Source **Deploy from a branch**, Branch **main**, Folder **/ (root)**. Wait about a minute.
5. Open https://sssprojectai.github.io/ai-ct-teacher/ and press Ctrl+F5 once.

See `DEPLOYMENT.md` for Google Search Console and a custom domain.

## D. Backend deployment (optional)

Use `ai-ct-teacher-backend.zip` and follow its `backend/README.md`: `wrangler login`, `wrangler deploy`, then (E) the Gemini secret and (F) the class database. Finally put the Worker address in the single line `const API_BASE='';` of `app/js/app.js` in the frontend, and push. The backend is **never** uploaded to GitHub Pages.

## E. Gemini configuration

The Gemini key exists **only** as a Cloudflare Worker secret: `wrangler secret put GEMINI_API_KEY`. Students never see, enter or store a key; it is never in the frontend, `localStorage` or the repository. AI is used only in the Consult stage and returns `response`, `claims_to_check`, `possible_assumptions`, `uncertainty` and `follow_up_question`. If Gemini is unavailable, the app shows "AI service is temporarily unavailable", stays usable, and offers the demonstration answer, which is always labelled "DEMONSTRATION" and never presented as live.

**Status: the Worker code is tested against a mocked Google API. A real Gemini request has NOT been executed by the author of this package (no key and no access to Google in the build environment): NOT TESTED — REQUIRES LIVE GEMINI KEY. Run `node tests/live-gemini-check.mjs` on your computer with your key in an environment variable (see `backend/README.md`, step 3b), then verify on the deployed site.** Default model chain: `gemini-3.8-flash`, `gemini-3.6-flash`, `gemini-2.5-flash` (Google announced 2.5 Flash for shutdown); override with the `GEMINI_MODEL` variable.

## F. Teacher and class system

With the backend connected: a teacher creates a class and receives a class code, a join link and a one-time **teacher key** (kept on the teacher's device; whoever has the code **and** the key can open the class). Students write a name (a nickname is fine), join by link, complete activities, and **only scores** (never their written text) are sent. The teacher sees students, scores, stage averages and per-task results, can export CSV, remove students or delete the class. Students can leave at any time.

## G. Demo mode

While `API_BASE` is empty, Consult shows a pre-written demonstration answer (labelled), and the Teacher page says that classes are not connected and shows **DEMO DATA** (randomly generated, clearly labelled, never real classroom data).

## H. Local testing

```
python3 -m http.server 8000          # serve the frontend, open http://localhost:8000/
node tests/worker.test.mjs           # backend: AI route (mocked Google)      [needs the backend files]
node tests/live-gemini-check.mjs     # backend: REAL Gemini with YOUR key from an environment variable
node tests/classes.test.mjs          # backend: classes, real SQLite database  [needs the backend files]
node tests/dev-server.mjs            # local API with mocked Gemini, for offline demonstrations
```

The browser tests (Playwright, Python) are in the complete-source package under `tests-browser/`.

## I. How to update the project

Edit the sources in the complete-source package (`source/build/*.js`, `head.html`; all Uzbek text is in `data-uz.js`), run `python3 source/build_site.py` to rebuild `site/`, run the tests, and copy the `site/` files (without `backend/` and `tests/`) to the repository as in C.

## Data and privacy

Progress, XP, badges and written answers are stored only in the browser's `localStorage`. In a class, the server stores a display name and scores only. Secrets (teacher keys, student tokens) are stored on the server only as SHA-256 hashes.

## Limits

Scores cannot judge the quality of an idea. For research, trained human raters should score records with the same rubric; scientific validity comes from the study design, sample and analysis, not from the software. Teacher access has no passwords: it relies on the class code plus the teacher key.
