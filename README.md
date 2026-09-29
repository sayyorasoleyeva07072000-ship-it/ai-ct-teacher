# AI-CT TEACHER

**Artificial Intelligence – Critical Thinking for Future English Teachers**

Author: **Sarvinoz Solexonovna**  
Institution: **Samarkand State Institute of Foreign Languages (SamDChTI)**

## What is included
- AI-CT 7C Cycle: Context → Consult → Critique → Check → Challenge → Conclude → Reflect
- 24 short real-life education scenarios, each with 2 reasoning questions
- 60 Method Challenge questions across 12 critical-thinking methods
- 84+ Team Competition questions including Uzbekistan-friendly teaching scenarios
- Random question order and random A/B/C/D option order
- Easy / Medium / Advanced / Mixed difficulty
- Solo and 2–4 team competition, 20-second timer
- XP, levels, streaks, badges and local progress history
- Web Audio sound effects and lightweight animations
- AI Critical Thinking Lab with a local reasoning coach
- Secure AI endpoint setting for future real-model integration
- Responsive mobile/desktop layout

## Important AI note
GitHub Pages is a static host. A private AI API key must **not** be placed in `app/js/app.js`.
The AI Lab therefore works immediately with a local reasoning coach and supports a secure backend/serverless endpoint when one is available.

Expected endpoint contract:
- POST JSON: `{ "action": "critical-thinking-feedback", "prompt": "...", "context": {...} }`
- Response JSON: `{ "text": "..." }` (plain text is also accepted)

## GitHub Pages
Repository: `sssprojectai/ai-ct-teacher`
Site: `https://sssprojectai.github.io/ai-ct-teacher/`
App: `https://sssprojectai.github.io/ai-ct-teacher/app/`
