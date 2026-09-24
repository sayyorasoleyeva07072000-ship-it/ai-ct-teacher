# AI-CT TEACHER: deployment guide

**AI-CT TEACHER** – Artificial Intelligence – Critical Thinking for Future English Teachers
AUTHOR: Sarvinoz Solexonovna

This folder is a complete static website. It needs no server, database or build step: any static host can serve it as it is.

> **Honest status:** the site is *technically prepared* to be crawled and indexed. It is not yet online, no domain has been bought, and it is not in Google's index. Google decides whether and how quickly pages are indexed and where they rank. Nothing here can guarantee a ranking.

---

## 1. What is in the folder

```
index.html                 Public landing page (SEO title, description, Open Graph, JSON-LD, visible text)
app/index.html             The AI-CT Teacher application page (opens at /app/)
app/css/app.css            Application styles (unchanged design)
app/js/app.js              Application logic (unchanged functionality)
css/site.css               Landing page styles
js/site.js                 Tiny landing-page helper (works without it)
robots.txt                 Allows all crawling and points to the sitemap
sitemap.xml                Lists the two public URLs
manifest.webmanifest       Name, colours and icons for "add to home screen"
404.html                   Friendly "page not found" page
assets/favicon.svg         Browser tab icon
assets/og-image.png        1200 x 630 image used when the link is shared
assets/icons/*.png         Favicon, Apple touch icon, 192 / 512 px and maskable icons
_headers                   Optional security and caching headers (Netlify, Cloudflare Pages)
.nojekyll                  Tells GitHub Pages to serve files as they are
tools/set-domain.py        Replaces the domain placeholder everywhere in one step
DEPLOYMENT.md              This guide
```

### What was changed in the application itself
The application's design, tasks, 7C cycle, rubric, scoring, dashboards, author line and AI behaviour are unchanged. Only these additions were made, and they switch on only when the app runs from `app/index.html` on a website:

- Each app page has its own address, for example `/app/#library`, `/app/#assessment`, `/app/#teacher`, so the landing page can link straight to them and the browser Back button works.
- The browser tab title changes with the page.
- **Export JSON / CSV now downloads a real file** (previously a copy-and-paste box was shown when downloads were unavailable).
- A small "About this website" link returns to the landing page.

### Things to know about the live app
- **AI responses on your own website are pre-written demonstration responses**, labelled "AI RESPONSE — DEMONSTRATION". Live AI works only inside Claude, where the platform supplies it. A public website would need its own AI service and a server to hold a secret key; that is a separate project.
- **Student work is stored in each visitor's own browser** (local storage). There are no accounts and no shared database.
- The teacher dashboard uses randomly generated **demo data** and says so on the page.

---

## 2. The domain placeholder

The placeholder is exactly `https://YOUR-DOMAIN-HERE/`. It appears **24 times** in 4 files. Do not buy or assume any name until you have checked availability with a registrar. Examples you mentioned (`aictteacher.uz`, `aictteacher.org`, `ai-ctteacher.com`) are only ideas; none is known to be available.

| File | Lines | What they are |
|---|---|---|
| `index.html` | 13 | `<link rel="canonical">` |
| | 25, 26, 34 | Open Graph `og:url`, `og:image` and Twitter card image (**must be full https:// addresses**) |
| | 43 to 78 | JSON-LD structured data: WebSite, EducationalOrganization, Person, SoftwareApplication |
| `app/index.html` | 11, 20, 21, 29 | Canonical, `og:url`, `og:image`, Twitter image |
| `robots.txt` | 6 | `Sitemap:` line |
| `sitemap.xml` | 5, 9 | The two `<loc>` addresses |

### Easiest way: run the tool
Once you know your address (with `https://`), run this from the top folder:

```
python3 tools/set-domain.py https://www.yourdomain.org/
python3 tools/set-domain.py --check        # should say: 0 placeholder occurrence(s) remaining
```

Or open the folder in any editor (VS Code, Notepad++) and use **Find and Replace in files**: replace `https://YOUR-DOMAIN-HERE/` with your address, including the final slash. Then search for `DOMAIN-NOTE` and delete those three comment lines.

**If you host in a sub-folder** (for example GitHub Pages "project" sites at `https://username.github.io/ai-ct-teacher/`), use that full address, including the folder, as the replacement. Note that Google reads `robots.txt` only at the root of a host, so a project sub-folder is fine for testing but a custom domain or a `username.github.io` repository is better for search.

After replacing, also update `<lastmod>` dates in `sitemap.xml` whenever you change the pages (optional but useful).

---

## 3. Deploy to a free static host

Pick **one**. All three serve this folder as it is.

### Option A: Netlify (easiest: drag and drop)
1. Create a free account at netlify.com.
2. Go to **Sites > Add new site > Deploy manually** and drag the whole project folder (the one containing `index.html`) into the upload area.
3. Netlify gives you an address such as `https://random-name.netlify.app`. You can rename it under **Site configuration > Change site name**.
4. Run `set-domain.py` with that address, then drag the folder in again to redeploy.

### Option B: GitHub Pages
1. Create a free GitHub account and a new **public** repository (for the cleanest address, name it `USERNAME.github.io`).
2. Upload the folder contents so that `index.html` is at the top level of the repository (**Add file > Upload files**). Include the hidden `.nojekyll` file if your browser lets you.
3. Open **Settings > Pages**, set **Source** to *Deploy from a branch*, choose branch `main` and folder `/ (root)`, and **Save**.
4. After about a minute the site is live at `https://USERNAME.github.io/` (or `https://USERNAME.github.io/REPO-NAME/` for a project site).
5. Run `set-domain.py` with that address and upload the changed files again.

### Option C: Cloudflare Pages
1. Create a free Cloudflare account, go to **Workers & Pages > Create > Pages > Upload assets**.
2. Upload the folder, give the project a name, and deploy. The address is `https://PROJECT.pages.dev`.

**Check after every deployment** (replace with your address): open `/`, `/app/`, `/robots.txt`, `/sitemap.xml` and `/manifest.webmanifest`. All five must load without an error.

---

## 4. Connect your own domain later

1. **Choose and buy** a name from a domain registrar (for example Namecheap, Cloudflare Registrar, Porkbun; for `.uz` domains use an accredited registrar in Uzbekistan). Confirm availability first.
2. **In your host**, add the domain:
   - Netlify: **Domain management > Add a domain**.
   - GitHub Pages: **Settings > Pages > Custom domain** (it creates a `CNAME` file in the repository).
   - Cloudflare Pages: **Custom domains > Set up a domain**.
3. **At your registrar's DNS settings**, create the records your host shows you (typically an `A` record or `CNAME` for the main address, and a `CNAME` for `www`). DNS can take from minutes to a day to update.
4. **Turn on HTTPS** in the host (a free certificate is issued automatically once DNS is correct) and choose whether `www` or the plain domain is your main address. Set the other to redirect to it.
5. **Update the placeholder**: run `set-domain.py` with the *final* main address exactly as visitors will see it (same `https`, same `www` choice), and redeploy.

---

## 4b. Before you submit to Google

- [ ] The placeholder check reports **0** remaining.
- [ ] `https://YOUR-ADDRESS/robots.txt` shows `Allow: /` and a `Sitemap:` line with your real address.
- [ ] `https://YOUR-ADDRESS/sitemap.xml` lists your real address for both pages.
- [ ] Paste the landing page address into the [Rich Results Test](https://search.google.com/test/rich-results) and confirm the structured data has no errors.
- [ ] Open the site on a phone and on a computer; both should look correct.
- [ ] No page contains a `noindex` instruction (none does in this package).

---

## 5. Google Search Console

1. Go to **search.google.com/search-console** and sign in with a Google account.
2. Click **Add property** and choose:
   - **Domain** (recommended if you own a custom domain): covers `http`, `https`, `www` and sub-domains. Verify by adding a **TXT record** at your DNS provider, exactly as Google shows.
   - **URL prefix** (works for `github.io`, `netlify.app` and similar): enter the full address, for example `https://www.yourdomain.org/`. Verify by one of: uploading Google's HTML file to the top folder, adding the provided `<meta name="google-site-verification" ...>` tag inside `<head>` of `index.html`, or DNS.
3. Deploy the verification file or tag, then click **Verify**. Keep it in place permanently.

### Submit sitemap.xml
1. In Search Console open **Indexing > Sitemaps**.
2. In "Add a new sitemap" type `sitemap.xml` and click **Submit**.
3. Status should become **Success** and show 2 discovered pages. If it says it could not fetch, check that `https://YOUR-ADDRESS/sitemap.xml` opens in a browser and contains your real address.

### Request indexing
1. Paste the landing page address into the **URL Inspection** bar at the top and press Enter.
2. If it says the URL is not on Google, click **Request indexing** and wait for the confirmation.
3. Repeat for `https://YOUR-ADDRESS/app/`.
4. Requests are quota-limited and a request is a hint, not a command. Pages are commonly indexed within days to a few weeks, and sometimes not at all if Google judges the site low value or duplicate. Check progress under **Indexing > Pages**.

### After launch
- Search for `site:yourdomain.org` in Google to see which pages are indexed.
- Use **Performance** in Search Console to see which queries bring visitors.
- Share the link on university pages, research profiles and social media: links from real, relevant sites help discovery more than any technical setting.
- Keep the visible text accurate. Do not add claims about proven effectiveness unless research evidence exists.

---

## 6. Notes on privacy and content

- The pages load fonts from Google Fonts. If you prefer no third-party requests, download the two font families (Literata and Hanken Grotesk) and serve them from the `assets` folder; the site falls back to system fonts if they do not load.
- The structured data names the author as the person who wrote the project and describes it as an independent educational project, with **no institutional affiliation, ratings, prices or awards**. If you later have an official affiliation you want to state, add it to the `EducationalOrganization` block deliberately.
- If you add analytics, mention it in a privacy note on the site.
