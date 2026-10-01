# AI-CT TEACHER — secure server (Cloudflare Worker)

> **This folder is the BACKEND. It is deployed to Cloudflare, never uploaded to GitHub Pages.** The website (frontend) is the other package.

One small server gives the site two optional abilities, switched on by one setting:

- **Live AI (Gemini)** in the Consult stage.
- **Classes**: a teacher creates a class and a join link, students join, and the teacher sees their scores.

**Honest status.** All of the server's logic is tested here: the Worker code runs against a mocked Google API and a real SQLite database (`node tests/worker.test.mjs`, `node tests/classes.test.mjs`), and the whole app was tested end to end against it (a teacher and several students in separate browsers). It has **not** been deployed to Cloudflare and has **not** been called against the real Gemini API, because the place it was built had no internet access and no key. Do the checks in step 6 after you deploy.

```
Student/teacher browser (GitHub Pages)  --HTTPS-->  Cloudflare Worker  -->  Gemini API   (key = Worker secret)
                                                                       -->  D1 database  (classes, scores)
```

## What is stored, and what is not

- Stored on the server: class name, a **display name** (can be a nickname) for each student, and **scores only**: task id, level in each of the six stages, totals, XP, decision (accept/modify/reject), game results.
- **Never sent or stored:** the text students write (answers, reasons, reflections), their prompts, or the AI answers. Those stay on the student's own device.
- The Gemini key and the teacher/student secrets are never in the web page. Teacher keys and student tokens are stored on the server only as SHA-256 hashes. A teacher key is shown once, when the class is created.
- A student can leave a class at any time (their results are deleted). A teacher can remove a student or delete the whole class.

## 1. What you need

A free Cloudflare account, Node.js on your computer, and (for live AI) a Gemini API key from Google AI Studio. Check Google's and Cloudflare's current terms, quotas and data-use rules before using real student names.

## 2. Install Wrangler and deploy

```
npm install -g wrangler
wrangler login
cd backend/cloudflare-worker
wrangler deploy
```

Wrangler prints an address like `https://ai-ct-teacher-api.YOUR-SUBDOMAIN.workers.dev`. This is your **API address**.

## 3. Live AI with your Gemini key (optional)

You already have a key in Google AI Studio. It goes to the server in exactly one way, typed into Wrangler on your own computer:

```
cd backend/cloudflare-worker
wrangler secret put GEMINI_API_KEY
```

Paste the key when Wrangler asks. Cloudflare stores it as a secret named `GEMINI_API_KEY`; the Worker reads it as `env.GEMINI_API_KEY`. It is **never** in a file, in this package, in GitHub, in the web page or in `localStorage`, and students never enter a key. Never send the key to anyone, including in a chat.

**How the Worker calls Gemini:** `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` with the key in the `x-goog-api-key` header, a fixed system prompt, and the official structured-output settings (`responseMimeType: application/json` with a `responseSchema`), so Gemini returns exactly `response`, `claims_to_check`, `possible_assumptions`, `uncertainty`, `follow_up_question`. The frontend only ever calls the Worker's `/api/ai`.

**Models.** Google's model page (read on 2026-10-01) recommends Gemini 3.8 Flash for new projects and announces Gemini 2.5 Flash for shutdown. The Worker tries `gemini-3.8-flash`, then `gemini-3.6-flash`, then `gemini-2.5-flash`, moving to the next only when Google answers 404 (model not found). To put your own model first, add a plain variable `GEMINI_MODEL` (Cloudflare dashboard > Worker > Settings > Variables). These names come from Google's documentation; they have not been run against a live key by the author of this package.

### 3b. Test your real key on your computer (needs Node.js 22+)

This runs the same Worker code against the **real** Gemini API and checks the structured answer. The key is read only from an environment variable you set in your own terminal, and is not written to any file:

```
# macOS / Linux
GEMINI_API_KEY="paste-your-key" node tests/live-gemini-check.mjs

# Windows PowerShell
$env:GEMINI_API_KEY="paste-your-key"; node tests/live-gemini-check.mjs
```

Without a key it prints `NOT TESTED — REQUIRES LIVE GEMINI KEY`. With a key it prints PASS/FAIL lines, the first part of the answer, and a hint if Google rejects the call (403 key or API access, 404 model, 429 quota). It exits with code 0 only if live Gemini answered with all five fields.

For `wrangler dev` (running the Worker locally) put `GEMINI_API_KEY=...` in a file named `.dev.vars` inside `backend/cloudflare-worker/`. That file is listed in `.gitignore` and must never be committed or zipped.

## 4. Classes (optional): ONE command

The class database (Cloudflare D1) is created and connected by `wrangler deploy` itself, and the Worker creates its own tables the first time it is used. So the only step is to deploy again with this folder's `wrangler.toml` (it contains the `[[d1_databases]]` block):

```
npm install -g wrangler@latest
cd backend/cloudflare-worker
wrangler deploy
```

Answer **y** if Wrangler asks whether it may create the D1 database `ai-ct-teacher-db` and bind it as `DB`. Your Gemini secret and dashboard variables stay as they are. When it finishes, open the website's Teacher page and press Ctrl+F5: the "Sinf yaratish" card becomes active. (Wrangler older than 4.45 cannot auto-create it: update with the first command, or create the database by hand with `wrangler d1 create ai-ct-teacher-db`, paste its `database_id` into the `[[d1_databases]]` block, and run `wrangler d1 execute ai-ct-teacher-db --remote --file=schema.sql`.)

## 5. Connect the website (one line)

Open `app/js/app.js`, find

```js
const API_BASE='';
```

and put your API address between the quotes, for example `const API_BASE='https://ai-ct-teacher-api.YOUR-SUBDOMAIN.workers.dev';`. Commit and push with GitHub Desktop. This is an address, not a secret.

The site asks the server `GET /api/health`, which answers what is ready, for example `{"ok":true,"ai":true,"classes":true}`. If the Gemini key is set, the Consult stage switches to live Gemini by itself. If the database is connected, the Teacher dashboard and class joining switch on by themselves. You can connect AI now and classes later (or the other way round) without changing the website again. While `API_BASE` is empty, the site works fully on its own: demonstration AI answers (clearly labelled) and a Teacher page that explains classes.

If your website address is not `https://sssprojectai.github.io`, add your exact origin to `ALLOWED_ORIGINS` in `common.js` and run `wrangler deploy` again.

## 6. Check it works

```
curl -s https://YOUR-API-ADDRESS/api/health -H "Origin: https://sssprojectai.github.io"
```

You should see `"ai":true` and/or `"classes":true`. Then, on the real site:

1. Open the Teacher page, create a class, copy the join link and the **teacher key** (save the key somewhere safe).
2. Open the join link on a phone, write a name, join, and finish one task.
3. On the Teacher page open the class: the student and the score should appear.
4. In a task, press "Ask AI" in the Consult stage: the label should say "LIVE (Gemini, via server)".

## 7. Try everything on your own computer, without internet

```
node tests/dev-server.mjs                   # real server code, in-memory SQLite database, MOCKED Gemini
python3 -m http.server 8000                 # serve the site (in another terminal)
```

Set `const API_BASE='http://localhost:8790';` in `app/js/app.js` and open `http://localhost:8000/`. This is useful for a demonstration without internet; the AI answers are canned in this mode and nothing leaves your computer.

## 8. If something fails

| Message or sign | Meaning and fix |
|---|---|
| Teacher page says the server cannot be reached | Wrong `API_BASE`, no internet, or the origin is not in `ALLOWED_ORIGINS` |
| "Classes are not enabled on the server" | The D1 database is not connected: run `wrangler deploy` with this folder's `wrangler.toml` (step 4) |
| Consult still says "Demonstration mode" | `GEMINI_API_KEY` secret is not set (step 3) |
| `upstream_error` with 404 / 403 / 429 | Gemini: no model of the chain found for your key (set `GEMINI_MODEL`) / key or project problem / quota reached |
| "The teacher key is not correct" | Use the exact key shown when the class was created. It cannot be recovered; create a new class if it is lost |
| Student's results show "Waiting to send" | No connection; they are sent automatically later, without duplicates |

## 9. Limits of this prototype

The rate limits (a few classes per hour, 8 AI questions per minute per IP) use Cloudflare's cache and are soft limits. A class holds at most 80 students. There are no teacher accounts or passwords: whoever has the class code **and** the teacher key can see the class. If a Gemini key ever leaks, delete it in Google AI Studio, create a new one and run `wrangler secret put GEMINI_API_KEY` again.

## 10. Local tests

```
node tests/worker.test.mjs      # AI route (mocked Google)
node tests/live-gemini-check.mjs   # REAL Gemini, needs your key in an environment variable (see 3b)
node tests/classes.test.mjs     # class routes against a real SQLite database
```
