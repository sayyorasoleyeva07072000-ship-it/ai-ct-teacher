# AI-CT TEACHER — deployment guide

PhD researcher Sarvinoz Solexonovna · Samarkand State Institute of Foreign Languages (SamDChTI)

Repository: `sssprojectai/ai-ct-teacher` · Site: https://sssprojectai.github.io/ai-ct-teacher/

> This guide is for the GitHub Pages **frontend**. The backend (one Cloudflare Worker for Gemini) is deployed separately: see `backend/README.md`.

## 1. Folder contents

```
index.html          the application (also holds the text search engines read)
app/                the same application at /app/, plus css/app.css and js/app.js
assets/             favicon, icons, social-share image
robots.txt, sitemap.xml, manifest.webmanifest, 404.html, .nojekyll, .gitignore
README.md, DEPLOYMENT.md, tools/set-domain.py
```

The backend address is the single line `const API_BASE='https://ai-ct-teacher-ai.ai-ct-teacher-api.workers.dev';` in `app/js/app.js`.

## 2. Publish with GitHub Desktop

1. Copy everything from this folder into your local `ai-ct-teacher` repository folder, replacing old files. Do not touch `.git` or your Search Console verification file.
2. Commit to main, then Push origin.
3. github.com > Settings > Pages: source `main`, folder `/ (root)`.
4. Open the site and press Ctrl+F5. The menu footer shows the build id.

Old files that are no longer used can stay; they do no harm.

## 3. Google Search Console

URL prefix property `https://sssprojectai.github.io/ai-ct-teacher/`; verify, submit `sitemap.xml`, then Request indexing. No one can promise a ranking or a date.

## 4. Your own domain later

Set it in Settings > Pages, then run `python3 tools/set-domain.py https://your-domain.example/`. Add the new origin to `ALLOWED_ORIGINS` in `backend/cloudflare-worker/common.js` and redeploy the Worker.
