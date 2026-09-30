# AI-CT TEACHER — Gemini AI backend (Cloudflare Worker)

**Honest status.** The Worker code and its tests are complete, and the Worker's own logic has been tested locally against a *mocked* Google API (`node tests/worker.test.mjs`, 23 checks). It has **not** been deployed and has **not** been called against the real Gemini API, because the environment that produced it had no internet access and no key. After you deploy it, run the curl test in step 6 before giving it to students.

## Why a backend exists

The site is static and lives on GitHub Pages. A static page cannot keep a secret: anything in its JavaScript can be read by any visitor. So the Gemini API key must never be in the frontend, in `localStorage`, in GitHub, or asked from students. This Worker holds the key as a Cloudflare secret and is the only thing that talks to Google.

```
Student's browser (GitHub Pages)  --HTTPS, no key-->  Cloudflare Worker  --HTTPS, key in a header-->  Gemini API
```

Only the **Consult** stage uses AI. What is sent to Gemini: the classroom scenario text, the stage name, and the prompt the student typed. Not sent: student name, class code, progress, or any stored record.

## 1. What you need

- A free Cloudflare account (dash.cloudflare.com).
- Node.js on your own computer.
- A Gemini API key from Google AI Studio (aistudio.google.com/apikey). Check Google's current terms, quotas and data-use rules for the key type you use before sending real student text.

## 2. Install Wrangler

```
npm install -g wrangler
wrangler login
```

## 3. Deploy the Worker

```
cd backend/cloudflare-worker
wrangler deploy
```

Wrangler prints an address like `https://ai-ct-teacher-ai.YOUR-SUBDOMAIN.workers.dev`. That is your AI endpoint.

## 4. Store the key as a secret (never in a file)

```
wrangler secret put GEMINI_API_KEY
```

Paste the key when asked. Optional: to change the model without editing code, add a plain variable `GEMINI_MODEL` in the Cloudflare dashboard (Worker > Settings > Variables). The default is `gemini-2.5-flash`; model names change over time, so if requests fail with `upstream_error` and status 404, look up the current name in Google AI Studio.

## 5. Connect the frontend

In `app/js/app.js` find this line (it is in the AI section):

```js
const AI_ENDPOINT='';
```

Set it to your Worker address, for example `const AI_ENDPOINT='https://ai-ct-teacher-ai.YOUR-SUBDOMAIN.workers.dev';`, then commit and push with GitHub Desktop. This is an address, not a secret, so it is safe in the frontend.

While it is empty, the app behaves exactly as before: the Consult stage shows the clearly labelled pre-written demonstration response (and, inside Claude only, Claude's own live connection). Once set, a button "Ask AI (live, Gemini)" appears and responses are labelled "AI RESPONSE — LIVE (Gemini, via backend)".

If your site address is not `https://sssprojectai.github.io`, add your exact origin to `ALLOWED_ORIGINS` at the top of `worker.js` and redeploy.

## 6. Verify it works

```
curl -s -X POST https://YOUR-WORKER-ADDRESS \
  -H "Content-Type: application/json" \
  -H "Origin: https://sssprojectai.github.io" \
  -d '{"scenario":"A teacher wants to use an AI speaking activity for B1 students but has not checked the level.","stage":"consult","studentResponse":"Suggest steps."}'
```

A working reply has these fields: `response`, `claims_to_check`, `possible_assumptions`, `uncertainty`, `follow_up_question`.

| Reply | Meaning |
|---|---|
| `origin_not_allowed` | Add your origin to `ALLOWED_ORIGINS` and redeploy |
| `server_not_configured` | The `GEMINI_API_KEY` secret is not set (step 4) |
| `upstream_error` with a status | Google rejected the call: 400/403 key or project problem, 404 model name, 429 quota |
| `malformed_model_output` | The model did not return the expected JSON; try again |
| `rate_limited` | More than 8 requests per minute from one IP |

## 7. What the Worker does (so you can audit it)

- Accepts `POST` only, and only from the origins in `ALLOWED_ORIGINS`.
- Rejects input over 4,000 characters, and any stage that is not one of the six 6C stages (`context, consult, critique, check, challenge, conclude`).
- Sends a fixed system prompt telling Gemini to be useful but fallible, to state uncertainty, to ask a follow-up question, to never invent a source, and never to write the student's final answer.
- Sends the key in the `x-goog-api-key` header, not in the URL, so it stays out of logs.
- Times out after 20 seconds and never forwards Google's raw error text to the browser.
- Applies a best-effort limit of 8 requests per minute per IP using Cloudflare's cache. This is a soft limit, not a guarantee. For a large pilot, set a spending/quota limit on the Google key and consider adding a Durable Object limiter.
- Returns only the five fields above, trimmed and type-checked. The frontend renders them as text, never as HTML.

## 8. If the AI is unavailable

The student sees: "AI service is temporarily unavailable. You can continue the activity using the verification and reasoning steps." The demonstration response button still works and the rest of the 6C activity stays usable. This behaviour is tested for network failure, HTTP errors and malformed replies.

## 9. Running the local tests

```
node tests/worker.test.mjs
```

This exercises validation, CORS, rate limiting, error handling and key secrecy against a mocked Google API. It does not contact Google.

## 10. If the key ever leaks

Delete the key in Google AI Studio, create a new one, and run `wrangler secret put GEMINI_API_KEY` again. Never paste the key into an issue, a chat, a screenshot, or a file in the repository.
