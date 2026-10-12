# Public discovery design

## Purpose

Make Inside the Model easy to discover in search and compelling when shared, without user accounts, tracking, or a server runtime. The audience is broadly curious people and newer ML practitioners who want a rigorous, approachable explanation of modern language models.

## Goals

- Establish `https://insidethemodel.app` as the stable canonical site URL.
- Ensure search engines can crawl every public page and find the generated sitemap.
- Give social platforms a complete, branded link preview.
- Add accurate machine-readable context about the site as an interactive learning resource.
- Make the resulting behavior testable in the static build.

## Non-goals

- No analytics service, cookies, accounts, newsletter, or data collection.
- No misleading schema types or promises of rich-result placement.
- No keyword-stuffed content or generic SEO articles.
- No server-side rendering or backend.

## Architecture

The site remains a static Astro/Starlight deployment on Cloudflare Pages.

`SITE_URL` remains an optional build-time override for previews and alternative environments. `https://insidethemodel.app` is the fallback in `astro.config.mjs`, preventing a missing Cloudflare variable from removing canonical URLs and the sitemap in production.

The source tree adds a generated crawler route and two static discovery assets:

- A static `robots.txt` route that permits crawlers and points to the configured sitemap origin.
- A 1200 × 630 PNG social card in `public/`, built from the existing brand identity and describing the site as an interactive guide to how LLMs work.
- A default Open Graph and X/Twitter metadata block referencing that card with absolute URLs generated from `site`.

The Starlight configuration emits global `WebSite` and `LearningResource` JSON-LD. Its title, description, and canonical URL match the home page’s visible purpose. A `Course` schema is deliberately excluded: the site is a self-guided resource and does not meet Google’s instructor-and-roster requirement. The 404 page adds a `robots` meta tag with `noindex`.

## Metadata behavior

Every page retains its existing specific title and description. The site-level metadata provides a consistent title suffix, canonical domain, social image, Open Graph site name, and X summary-large-image card. Page-specific social title and description continue to come from Starlight’s existing page metadata.

All links in robots, JSON-LD, canonical tags, Open Graph URLs, and sitemap output resolve to `https://insidethemodel.app` unless an explicit `SITE_URL` is supplied at build time.

## Validation

Extend the existing static deployment check to assert that a production build contains:

- canonical and sitemap URLs at the canonical domain;
- a crawlable robots file that names the sitemap;
- one social-card image and its Open Graph/X metadata;
- parseable JSON-LD with `WebSite` and `LearningResource` types;
- a noindex 404 page;
- no localhost URLs or retired progress API calls.

Run the generated-site link, brand, JavaScript, and public-deployment checks after a production build. After deployment, verify the domain in Google Search Console, submit `/sitemap-index.xml`, inspect the home URL, and test link previews in LinkedIn and Facebook’s sharing debuggers. Search engines may take days to crawl and are not required to show any rich result.

## Files affected

- `guide/astro.config.mjs`
- `guide/src/content/docs/404.md`
- `guide/src/pages/robots.txt.ts`
- `guide/public/social-card.png`
- `guide/tools/check-public-deploy.mjs`
- `README.md`
