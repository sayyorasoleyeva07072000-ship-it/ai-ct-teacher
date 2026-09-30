# AI-CT TEACHER — deployment guide

Author: Sarvinoz Solexonovna · Samarkand State Institute of Foreign Languages (SamDChTI)

Repository: `sssprojectai/ai-ct-teacher`
Site: https://sssprojectai.github.io/ai-ct-teacher/
App: https://sssprojectai.github.io/ai-ct-teacher/app/

This folder is a complete static website. There is no build step: GitHub Pages serves it as it is. Google can index it, but nothing here can promise a ranking or a date.

## 1. Folder contents

```
index.html            public landing page (SEO, structured data, "Start Learning")
app/                  the application: index.html, css/app.css, js/app.js
assets/               favicon, icons, social-share image
backend/              optional Gemini backend (Cloudflare Worker) + its README
tests/worker.test.mjs local test of the backend Worker (mocked Google API)
robots.txt, sitemap.xml, manifest.webmanifest, 404.html, .nojekyll, .gitignore
README.md, DEPLOYMENT.md, tools/set-domain.py
```

All links are relative, so the site works from `/ai-ct-teacher/` and `/ai-ct-teacher/app/`. The canonical address, sitemap and social tags already use `https://sssprojectai.github.io/ai-ct-teacher/`.

## 2. Publish with GitHub Desktop

1. Copy the files from this folder into your local clone of `sssprojectai/ai-ct-teacher`, replacing the old ones. Do not delete the `.git` folder.
2. In GitHub Desktop, review the changed files, write a summary, click **Commit to main**, then **Push origin**.
3. On github.com open the repository, **Settings > Pages**, and check that the source is the `main` branch, folder `/ (root)`. The site updates in about a minute.
4. Open the site and the app on a computer and a phone. Press Ctrl+F5 once to bypass the browser cache.

## 3. Turn on real AI (optional)

Follow `backend/README.md`. Without it the app is fully usable and shows a clearly labelled demonstration response. The Gemini key is only ever a Cloudflare secret, never in this repository.

## 4. Google Search Console

1. Go to search.google.com/search-console and sign in.
2. **Add property > URL prefix** and enter `https://sssprojectai.github.io/ai-ct-teacher/`.
3. Verify by the HTML-file or HTML-tag method: place the file Google gives you at the top of the repository (or add the `<meta name="google-site-verification">` tag inside `<head>` of `index.html`), push, then click **Verify**. Keep it there permanently.
4. **Indexing > Sitemaps**: submit `sitemap.xml`.
5. **URL Inspection**: paste the site address and the app address, and click **Request indexing** if they are not yet on Google.

Note: Google reads `robots.txt` only at the root of a host (`https://sssprojectai.github.io/robots.txt`), which a project site does not control. That is harmless here because nothing is blocked, and it is why the sitemap is submitted in Search Console instead.

## 5. Using your own domain later

1. Buy a domain and check availability first.
2. In the repository, **Settings > Pages > Custom domain**, and set the DNS records GitHub shows you. Turn on **Enforce HTTPS**.
3. Change the address everywhere: `python3 tools/set-domain.py https://your-domain.example/` (it replaces the GitHub Pages address in the HTML, XML, robots and manifest files). Also add the new origin to `ALLOWED_ORIGINS` in `backend/cloudflare-worker/worker.js` and redeploy the Worker.
4. Add the new property in Search Console and resubmit the sitemap.

## 6. Quick check after every publish

- `/`, `/app/`, `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` all open.
- No browser console errors on the landing page or the app.
- Search the repository for `GEMINI_API_KEY=`: it must appear only in `backend/.env.example` with an empty value.
