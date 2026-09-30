# AI-CT TEACHER

**Artificial Intelligence – Critical Thinking for Future English Teachers**

An electronic methodological prototype supporting a PhD research pilot on
developing future English teachers' critical thinking through structured
interaction with AI. Dissertation topic: *"Sun'iy intellekt vositalari
asosida bo'lajak ingliz tili o'qituvchilarining tanqidiy fikrlash
ko'nikmalarini rivojlantirish metodikasi"*.

- **Author:** Sarvinoz Solexonovna
- **Institution:** Samarkand State Institute of Foreign Languages (SamDChTI)
- **Live site:** https://sssprojectai.github.io/ai-ct-teacher/
- **App:** https://sssprojectai.github.io/ai-ct-teacher/app/
- **Repository:** sssprojectai/ai-ct-teacher

## The scientific concept

AI-CT TEACHER treats artificial intelligence not as a source of ready
answers but as an **object of critical analysis**. A student works
through a realistic English-teaching scenario, consults AI once, and
then critically examines, verifies, challenges, and finally judges
what it produced — recording an independent, accountable conclusion
that includes their own reflection.

## The AI-CT 6C cycle

Exactly six stages, always in this order. There is no separate seventh
"Reflect" stage — reflection is the closing part of Conclude.

1. **Context** — analyse the classroom situation, no AI involved.
2. **Consult** — the only stage where AI is used; write your own prompt and read the response.
3. **Critique** — examine the response's claims, assumptions, and fit.
4. **Check** — verify claims against sources you find yourself.
5. **Challenge** — argue back and propose an alternative.
6. **Conclude** — state a final decision (accept / modify / reject the AI response), with reasoning, evidence, and a short reflection on how your thinking changed.

## Features

- 11 English-teaching tasks across 8 categories (Critical Thinking, AI & Teaching, Fact Checking, Communication, Ethics, Media & Information, Teaching Methods, Problem Solving).
- Transparent, indicator-based 6-component rubric (Analysis, Evaluation, Inference, Argumentation, Alternative Thinking, Reflection), explicitly labelled as a learning-activity indicator, not a validated psychological measurement.
- Method Challenge: a 30-question quiz on ten ELT methods, with shuffled answer options so the correct answer is not predictably in one position.
- Team Competition: Solo or 2–4 teams, timed rounds, shuffled options, animated scoreboard.
- XP and badges (First Step, Deep Thinker, AI Critic, Method Master, Team Player), each tied to a real, verified trigger — never awarded for merely opening a page.
- Student progress, reflection history, and a teacher dashboard (demo data, clearly labelled).
- JSON/CSV export of every completed activity, structured for research use.
- Optional real AI for Consult through a secure serverless backend that calls Gemini (see `backend/README.md`). It is disabled until you deploy it; the app works fully without it, using a clearly labelled demonstration response. The Gemini key is never in the frontend.

## Architecture

```
index.html          public landing page (SEO, JSON-LD, "Start Learning")
app/                the application (index.html + css/app.css + js/app.js)
assets/              icons, favicon, social-share image
backend/             optional serverless Gemini backend (Cloudflare Worker) — see backend/README.md
robots.txt, sitemap.xml, manifest.webmanifest, .gitignore, .env.example
```

The app is a single-page application with no framework and no build
step required to run it (the `app/css/app.css` and `app/js/app.js`
files are already built). If you edit the source modules under
`build/` (not included in this deployment package), regenerate them
with the project's `build_site.py` script.

## Data and privacy

All student progress (XP, badges, completed activities, records) is
stored in the browser's own `localStorage`. There is no server
database and no accounts in this version. Nothing personally
identifying is collected beyond what a student chooses to type into
free-text fields. See `backend/README.md` for the one piece that does
talk to an external service — the optional AI backend — and exactly
what it does and does not send.

## Local testing

Serve the folder with any static file server, for example:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/` for the landing page or
`http://localhost:8000/app/` for the application.

## Deployment

See `DEPLOYMENT.md` for GitHub Pages deployment, connecting a custom
domain, and submitting to Google Search Console. See
`backend/README.md` for deploying the optional AI backend.

## Research-use limitations

This is a prototype, not a validated instrument. Scores shown in the
app are learning-activity indicators, computed from whether certain
elements (a counterargument, a source with a verdict, a stated
assumption) are present in a student's record — not a judgment of the
quality of their thinking, and not a scientifically validated
psychological measurement. Scientific validity for a research pilot
comes from the study's design, sample, and analysis, not from the
software alone.
