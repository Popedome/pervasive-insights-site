# Pervasive Insights Marketing Site

Single-page marketing site for **pervasiveinsights.ai**. Deploys to Cloudflare Pages. Contact form posts to a Cloudflare Worker that emails submissions to the destination inbox via Cloudflare Email Workers.

## Structure

```
pervasive-insights-site-deploy/
├── index.html                  single-page site (was pervasive_insights_site.html)
├── site_pi_logo.svg            PI logo, transparent, dark-mode colors
├── site_crs_logo.svg           CRS logo (footer link), transparent, dark-mode colors
├── site_building.jpg           PENDING — Brian to provide
├── README.md                   this file
└── cloudflare-worker/
    ├── pi-contact-form.js      contact form handler Worker
    ├── wrangler.toml           Worker config + Email Workers binding
    └── package.json            wrangler + mimetext deps
```

## Deploy steps

### 1. Cloudflare Pages (the site itself)

1. Push this repo to GitHub at `Popedome/pervasive-insights-site`.
2. Cloudflare Dashboard → Pages → Create application → Connect to Git → select repo.
3. Build settings: **leave empty** (static site, no build step). Output directory: `/`.
4. Custom domain: `pervasiveinsights.ai` → Cloudflare provisions SSL automatically (~5 min after DNS propagates).
5. Add `www.pervasiveinsights.ai` as redirect → `pervasiveinsights.ai`.

### 2. Email Worker (form handler)

```bash
cd cloudflare-worker
npm install
npx wrangler login
npx wrangler deploy
```

**Before the first deploy:** verify the destination email address at
Cloudflare Dashboard → Email → Email Routing → Destination Addresses
(click the verify link in your inbox).

After deploy, the Worker is live at `https://pi-contact-form.popedome.workers.dev` (or your custom route). The site's `index.html` already fetches this URL.

### 3. DNS

If `pervasiveinsights.ai` is at Cloudflare (registrar): nothing to do, DNS auto-wires.

If at another registrar: at the registrar set nameservers to Cloudflare's, then proceed with the Cloudflare Pages custom-domain wizard.

### 4. 301 redirect from `pervasive-insights.com`

At whichever registrar holds `pervasive-insights.com`, configure URL forwarding to `https://pervasiveinsights.ai` (most registrars have a free URL forward feature).

## Editing content

The site is plain HTML + inline CSS in `index.html`. Edit directly, push, Pages redeploys automatically on push.

Common edits:
- Hero copy: search for `<!-- HERO -->`
- Sample cards: search for `SAMPLE 1` / `SAMPLE 2` / etc.
- About section: search for `<!-- ABOUT -->`
- Contact form fields: search for `<form class="contact-form"`

## Form handler details

The Worker receives JSON `{ name, email, company, message }`, validates, and emails the destination address (default `popedome@gmail.com`, override via `wrangler.toml [vars] DESTINATION_EMAIL`).

CORS allowlist in the Worker includes:
- `https://pervasiveinsights.ai`
- `https://www.pervasiveinsights.ai`
- `https://pervasive-insights.com`
- `https://www.pervasive-insights.com`
- `http://localhost:8000` (for local testing)

To test locally: `python -m http.server 8000` from this directory, then open http://localhost:8000.

— 2026-05-15

---

## 2026-06-02 content update

Site recast around the **five portal areas in two families** (matching the live portal + Primex onboarding infographic):

- **Your own research** — 1) Research Library, 2) Ask Your Data
- **Your synthetic panel** — 3) One-on-One, 4) Surveys, 5) Focus Groups

Changes: "What it is" rebuilt as two families / five tiles; "See it in action" now shows one deliverable-grade sample per area (Library synthesis with cited sources; Ask-Your-Data generated table; One-on-One persona chat; Survey concept test with a stimulus image grid; Focus Group transcript + report); added the **Calibration Report Card** to the Calibration-check section; receipts updated (358,000+ respondents across 150+ engagements, 6,000 calibrated identities, ~1,080 calibration targets, ~3.5pp). All samples are generic/illustrative — no client names, competitor brands, proprietary segment names, or pricing. Design system, contact form, and deploy steps unchanged.

## 2026-06-02 visual polish

Swapped the five area tiles to use the actual onboarding-infographic illustrations (pi_area_*.png), added green/orange family accents, upgraded the survey sample with cleaner product icons + faceted tabs, and added a subtle scroll-reveal (respects reduced-motion). Five new assets: pi_area_library/data/oneonone/survey/focusgroup.png.


---

## 2026-09-07 restructure

The portal is now presented as one part of the **Pervasive Insights suite of City Research Solutions** (research library, calibrated synthetic panel, competitive intelligence). Added a `#suite` section before About with links to the three tool pages on cityresearchsolutions.com, a nav item "The full suite", one sentence in About, and a new footer line. The six SEO answer pages in `pervasiveinsights-ai-pages/` should be deployed under this site (see `README_FOR_DEPLOY.md` there). Deployment is Brian's, with Claude Code.
