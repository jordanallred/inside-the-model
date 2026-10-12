# Public Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Inside the Model complete, visually polished search and messaging metadata while remaining a static, privacy-preserving site.

**Architecture:** Astro’s `site` configuration falls back to `https://insidethemodel.app`, so canonical URLs and the sitemap are always built. Static public assets supply crawler instructions and a universal 1200 × 630 social image. Starlight emits global Open Graph, X, and JSON-LD metadata; existing page titles and descriptions remain the page-specific source of truth.

**Tech Stack:** Astro 7, Starlight, static Cloudflare Pages assets, Node.js test scripts, PNG social artwork.

**Spec:** `docs/superpowers/specs/2026-10-12-public-discovery-design.md`

## Global Constraints

- Keep the site fully static; add no runtime backend, analytics, cookies, accounts, or data collection.
- Use `https://insidethemodel.app` as the fallback canonical origin; preserve `SITE_URL` as an explicit build-time override.
- Use accurate `WebSite` and `LearningResource` metadata only; do not use `Course` schema.
- The social card must be a branded 1200 × 630 PNG and contain legible text: “Inside the Model” and “See exactly how LLMs work.”
- Do not alter the unrelated working-tree changes in `guide/public/js/compare.js`.

## Review Focus

- A build without `SITE_URL` must still create canonical URLs and a sitemap at `https://insidethemodel.app`.
- A build with an explicit `SITE_URL` must use the override consistently in canonical, Open Graph, JSON-LD, sitemap, and robots URLs.
- The social image must be reachable as `/social-card.png`, be PNG, and be referenced with an absolute URL in both Open Graph and X metadata.
- The 404 page must not be indexable while normal pages remain crawlable.
- JSON-LD must parse as JSON and represent only content visible to visitors.

---

### Task 1: Extend the production-build discovery contract

**Files:**
- Modify: `guide/tools/check-public-deploy.mjs`
- Test: `guide/tools/check-public-deploy.mjs`

**Interfaces:**
- Consumes: generated files below `guide/dist/`.
- Produces: an exit status of zero only if public-discovery invariants are present.

- [ ] **Step 1: Add failing assertions for the future production artifact**

Require `dist/index.html` to contain an `https://insidethemodel.app` canonical URL, absolute Open Graph/X image metadata, `WebSite` and `LearningResource` JSON-LD types, and require `dist/robots.txt`, `dist/social-card.png`, and a noindex 404 page.

- [ ] **Step 2: Run `node tools/check-public-deploy.mjs` to verify it fails**

Expected: FAIL listing absent canonical/social/robots/JSON-LD requirements.

- [ ] **Step 3: Add the override fixture check**

Build once with `SITE_URL=https://preview.example` and assert the generated canonical URL, `og:url`, JSON-LD URL, sitemap, and robots sitemap entry all use that origin.

- [ ] **Step 4: Run the check against the fixture to verify failure before implementation**

Expected: FAIL because the current config does not provide all discovery artifacts.

### Task 2: Add the branded social card

**Files:**
- Create: `guide/public/social-card.png`
- Test: `guide/tools/check-public-deploy.mjs`

**Interfaces:**
- Consumes: existing Inside the Model visual identity in `guide/public/brand/`.
- Produces: a 1200 × 630 PNG available after build at `/social-card.png`.

- [ ] **Step 1: Generate a single social card concept**

Use the image-generation tool to create a premium dark technical editorial card: layered translucent planes and tensor-like nodes, deep navy, violet, blue and teal palette, spacious composition, with exact legible text “Inside the Model” and “See exactly how LLMs work.” Avoid stock robots, brains, chip imagery, mock UI, watermarks, and extra text.

- [ ] **Step 2: Inspect the image and place the selected asset at `guide/public/social-card.png`**

Confirm the PNG is 1200 × 630 or resize/crop it without losing required text legibility.

- [ ] **Step 3: Run `file guide/public/social-card.png` and image dimension inspection**

Expected: PNG image with a 1.90:1 social-card aspect ratio.

### Task 3: Emit canonical, crawler, social, and learning metadata

**Files:**
- Modify: `guide/astro.config.mjs`
- Create: `guide/src/pages/robots.txt.ts`
- Modify: `guide/src/content/docs/404.md`
- Test: `guide/tools/check-public-deploy.mjs`

**Interfaces:**
- Consumes: optional `SITE_URL` and the `social-card.png` static asset.
- Produces: canonical sitemap configuration, static crawler policy, social card metadata, and valid JSON-LD.

- [ ] **Step 1: Make the build artifact contract fail**

Run `SITE_URL=https://preview.example npm run build && node tools/check-public-deploy.mjs` after Task 1’s assertions.

- [ ] **Step 2: Update Astro configuration**

Set `const siteUrl = process.env.SITE_URL || 'https://insidethemodel.app'` and use it as `site`. Add global head metadata: `og:image`, `og:image:width=1200`, `og:image:height=630`, `og:image:alt`, `twitter:card=summary_large_image`, `twitter:image`, `twitter:image:alt`, `og:url`, and JSON-LD for `WebSite` and `LearningResource`. Use `new URL('/social-card.png', siteUrl).href` for all image values.

- [ ] **Step 3: Create crawl policy and 404 indexing control**

Create a prerendered `src/pages/robots.txt.ts` endpoint that returns `text/plain` with `User-agent: *`, `Allow: /`, and a sitemap entry derived from the same fallback-or-override URL used by Astro. Add `meta[name=robots][content=noindex]` to the 404 page frontmatter head.

- [ ] **Step 4: Rebuild the production and override artifacts; run the discovery check**

Run: `npm run build && npm run check`, then `SITE_URL=https://preview.example npm run build && node tools/check-public-deploy.mjs`.

Expected: both artifact checks pass; the production build uses the canonical domain and the fixture build uses `preview.example` consistently.

### Task 4: Document and publish the public-launch configuration

**Files:**
- Modify: `README.md`
- Test: `guide/tools/check-public-deploy.mjs`

**Interfaces:**
- Consumes: the completed static build and deployed origin.
- Produces: operational instructions for Cloudflare Pages and manual launch validation.

- [ ] **Step 1: Document Cloudflare environment configuration**

State that `SITE_URL` is optional because the production canonical fallback is built in, but should be set to `https://insidethemodel.app` in Cloudflare production. Note that preview deployments can explicitly set a preview origin when desired.

- [ ] **Step 2: Document post-deployment validation**

List: Google Search Console domain verification, sitemap submission at `/sitemap-index.xml`, home-page URL inspection, and social preview refresh in LinkedIn and Facebook debuggers.

- [ ] **Step 3: Run the full verification suite**

Run: `npm run build && npm run check` in `guide/`, then fetch the deployed home page and confirm canonical, Open Graph, X, JSON-LD, robots, sitemap, and social-card responses.

- [ ] **Step 4: Commit and push only discovery-related files**

Stage the discovery assets/configuration/docs/checks, preserving `guide/public/js/compare.js` unstaged, and push `main` to trigger Cloudflare Pages.
