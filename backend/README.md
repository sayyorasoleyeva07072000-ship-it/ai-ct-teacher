# AI-CT TEACHER — secure server (one Cloudflare Worker, Gemini only)

> This folder is the BACKEND. It is deployed to Cloudflare, never uploaded to GitHub Pages.

The Worker has two routes and nothing else:

- `GET /api/health` tells the website whether the Gemini key is set.
- `POST /api/ai` answers the 6C **Consult** stage and the free **AI Chat** page through Gemini.

```
Browser (GitHub Pages)  --HTTPS-->  Cloudflare Worker  --HTTPS, key in a header-->  Gemini API
```

The Gemini key is a Worker **secret**. It is never in a file, in GitHub, in the web page or in `localStorage`; students never enter a key. Only the origins in `common.js` (`ALLOWED_ORIGINS`) may call the Worker; opening its address directly in a browser shows `{"error":"origin_not_allowed"}`, which is expected.

**Honest status:** the logic is tested locally against a mocked Google API (`node tests/worker.test.mjs`). It has **not** been called against the real Gemini API by the author of this package. Run step 4 on your computer.

## 1. Deploy (Command Prompt "cmd", not PowerShell)

```
cd backend\cloudflare-worker
npx wrangler login
npx wrangler deploy
```

The Worker name in `wrangler.toml` is `ai-ct-teacher-ai`, so the address is `https://ai-ct-teacher-ai.ai-ct-teacher-api.workers.dev`. This is the one address the website uses (`API_BASE` in `app/js/app.js`).

If your Worker still has a database attached from an earlier version, this deploy removes that attachment: the website no longer needs one. Accept if Wrangler asks. Nothing new is created.

## 2. The Gemini key (secret, belongs to this Worker)

```
npx wrangler secret put GEMINI_API_KEY
```

Paste the key when asked (nothing is shown while you paste). Secrets belong to each Worker separately, so if the AI says "demonstration" after you switch Workers, run this command for `ai-ct-teacher-ai`. Never send the key to anyone, including in a chat.

Models: the Worker tries `gemini-3.8-flash`, then `gemini-3.6-flash`, then `gemini-2.5-flash`, moving on only when Google answers 404 (model not found). To put your own model first, add a plain variable `GEMINI_MODEL` in the Cloudflare dashboard. The names come from Google's documentation and have not been run against a live key by the author of this package.

## 3. Check it

```
curl -s https://ai-ct-teacher-ai.ai-ct-teacher-api.workers.dev/api/health -H "Origin: https://sssprojectai.github.io"
```

You should see `{"ok":true,"ai":true}`. `"ai":false` means the secret is not set (step 2). Then open the website, start a task, go to Consult, or open AI Chat.

## 4. Test your real key on your computer (Node.js 22+)

```
# macOS / Linux
GEMINI_API_KEY="paste-your-key" node tests/live-gemini-check.mjs
# Windows (cmd)
set GEMINI_API_KEY=paste-your-key
node tests/live-gemini-check.mjs
```

It runs the same Worker code against the real Gemini API and checks the structured answer. Without a key it prints `NOT TESTED — REQUIRES LIVE GEMINI KEY`.

## 5. If something fails

| Sign | Meaning and fix |
|---|---|
| Consult says "Demonstration mode" | `/api/health` answers `"ai":false`: set the secret for THIS Worker (step 2) |
| "AI service is temporarily unavailable" | The website cannot reach `API_BASE`: check the address, the deploy, and that the origin is in `ALLOWED_ORIGINS` |
| `upstream_error` with status 404 | No model of the chain exists for your key: set `GEMINI_MODEL` |
| `upstream_error` with 403 | Gemini rejected the key, or the Generative Language API is not enabled for that Google project |
| `upstream_error` with 503 or 429 | Gemini was overloaded or over quota for every model, even after the Worker's automatic retries. Wait a minute and try again; if it persists, check quota in Google AI Studio |
| "AI is busy" | More than 8 AI requests per minute from one network address (a soft limit; raise `RATE_LIMIT_PER_MINUTE` in `ai.js` for a large class on one network) |

## 6. Diagnosing Gemini errors

Run `npx wrangler tail` in this folder while you send a message. For every failed Gemini attempt the Worker logs one line such as
`[ai] model=gemini-3.8-flash status=503 message=The model is overloaded...`. It logs the model, the status and Google's short message only: never the key, headers or the student's text. The browser receives `{"error":"upstream_error","status":503,"tried":[...]}` with the models it tried.

What the Worker does automatically: 503, 429, 500, 502 and 504 are retried twice on the same model (after 0.6 s and 1.8 s); 400, 403 and 404 skip straight to the next model; the whole chain stops after 20 seconds so the page never hangs.

## 7. Limits

The rate limit uses Cloudflare's cache and is a soft limit. Set a spending or quota limit on your Gemini key.

## 8. Local tests

```
node tests/worker.test.mjs      # health, CORS, AI route, chat mode (mocked Google)
node tests/live-gemini-check.mjs
node tests/dev-server.mjs       # local API with a MOCKED Gemini (port 8790)
```
