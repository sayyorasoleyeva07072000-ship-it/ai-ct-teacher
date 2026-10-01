# AI-CT TEACHER — deployment guide

PhD researcher Sarvinoz Solexonovna · Samarkand State Institute of Foreign Languages (SamDChTI)

Repository: `sssprojectai/ai-ct-teacher`
Site (it opens straight into the app): https://sssprojectai.github.io/ai-ct-teacher/
The old address https://sssprojectai.github.io/ai-ct-teacher/app/ also works.

This folder is a complete static website: there is no build step. GitHub Pages serves it as it is.

> This guide is for the GitHub Pages **frontend** (`ai-ct-teacher-github-pages.zip`). The backend (`ai-ct-teacher-backend.zip`) is deployed to Cloudflare, never to GitHub Pages.

## 1. What is in the folder

```
index.html              the application (also holds the text search engines read)
app/                    the same application at /app/, plus css/app.css and js/app.js
assets/                 favicon, icons, social-share image
backend/                OPTIONAL secure server (live AI + classes) and its README
tests/                  tests of the server code; dev-server.mjs for offline demos
robots.txt, sitemap.xml, manifest.webmanifest, 404.html, .nojekyll, .gitignore
README.md, DEPLOYMENT.md, tools/set-domain.py
```

All links are relative, so it works under `/ai-ct-teacher/`. The canonical address, sitemap and social tags already use `https://sssprojectai.github.io/ai-ct-teacher/`.

## 2. Publish with GitHub Desktop

1. Copy everything from this folder into your local `ai-ct-teacher` repository folder, replacing old files. Do not touch the `.git` folder. Old files that are no longer used (`js/site.js`, `css/site.css`) can be deleted.
2. In GitHub Desktop write a summary, click **Commit to main**, then **Push origin**.
3. On github.com: **Settings > Pages**, source `main`, folder `/ (root)`. Wait a minute.
4. Open the site on a computer and a phone, and press Ctrl+F5 once.

Students' progress is stored in their own browsers. Records saved by an older version of the app stay on those devices but are not shown; XP and badges are kept.

## 3. Turn on live AI and classes (optional)

Follow `backend/README.md`. In short: deploy the Worker, set the Gemini secret, create the database, and put the Worker address in `API_BASE` in `app/js/app.js`. Without it the app is fully usable with clearly labelled demonstration AI answers.

## 4. Google Search Console

1. search.google.com/search-console, **Add property > URL prefix**, enter `https://sssprojectai.github.io/ai-ct-teacher/`.
2. Verify with the HTML-file or HTML-tag method: put the file Google gives you at the top of the repository (or add the meta tag inside `<head>` of `index.html`), push, click **Verify**, and keep it there.
3. **Sitemaps**: submit `sitemap.xml`. **URL Inspection**: paste the address and press **Request indexing**.

Google reads `robots.txt` only at the root of a host, which a project site does not control. That is harmless here because nothing is blocked. No one can promise a ranking or a date.

## 5. Your own domain later

Set the domain in the repository's **Settings > Pages**, turn on HTTPS, then run `python3 tools/set-domain.py https://your-domain.example/`. Add the new origin to `ALLOWED_ORIGINS` in `backend/cloudflare-worker/common.js` and redeploy the Worker. Add the new property in Search Console and resubmit the sitemap.

## 6. Quick check after each publish

- `/`, `/app/`, `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` open.
- No browser console errors.
- `GEMINI_API_KEY=` appears only in `backend/.env.example`, with an empty value.
