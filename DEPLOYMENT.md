# Deployment — GitHub Pages

1. Keep the repository as `sssprojectai/ai-ct-teacher`.
2. Replace the repository website files with this build.
3. Commit with a message such as `Upgrade AI-CT Teacher learning platform`.
4. Push to `main`.
5. GitHub Pages should serve `/app/` from the same repository.
6. Test `https://sssprojectai.github.io/ai-ct-teacher/app/` in a private/incognito window.
7. If Search Console is used, submit `https://sssprojectai.github.io/ai-ct-teacher/sitemap.xml`.

## AI backend
Do not put OpenAI/Claude/Gemini private API keys in GitHub Pages JavaScript. Deploy a small secure serverless endpoint and paste its URL into **AI Critical Thinking Lab → Secure AI endpoint**.
