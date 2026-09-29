# AI-CT TEACHER

**Artificial Intelligence – Critical Thinking for Future English Teachers**

Author: **Sarvinoz Solexonovna**  
Institution: **Samarkand State Institute of Foreign Languages (SamDChTI)**

Scientific topic: **“SUN’IY INTELLEKT VOSITALARI ASOSIDA BO‘LAJAK INGLIZ TILI O‘QITUVCHILARINING TANQIDIY FIKRLASH KO‘NIKMALARINI RIVOJLANTIRISH METODIKASI”**

## 6C model
Context → Consult → Critique → Check → Challenge → Conclude. Reflection is integrated into Conclude.

## Architecture
- Frontend: static GitHub Pages application.
- AI: secure Node/Express server using Google Gemini API.
- Secret: `GEMINI_API_KEY` is stored only on the backend.
- Students do **not** enter or see an API key.

## Setup
1. Copy `.env.example` to `.env` in `backend/`.
2. Add your Gemini API key to `GEMINI_API_KEY`.
3. Set `GEMINI_MODEL` if needed.
4. Run `npm install` and `npm start` in `backend/`.
5. Deploy the backend to a serverless/container provider.
6. Put the deployed `/api/ai` URL into `assets/config.js` once. Students then use AI automatically.

## Important security rule
Never put `GEMINI_API_KEY` in frontend JavaScript, HTML, localStorage, or GitHub.

## GitHub Pages
Frontend URLs:
- https://sssprojectai.github.io/ai-ct-teacher/
- https://sssprojectai.github.io/ai-ct-teacher/app/

## Research-use limitation
The software provides structured learning activity data and performance indicators. It is not, by itself, a scientifically validated psychological test.
