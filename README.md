# Inside the Model

See exactly how LLMs work.

Found a mistake or a broken widget? Use the **Report a problem with this page** link at the bottom of any page, or see [CONTRIBUTING.md](CONTRIBUTING.md). Licensing terms are in [LICENSE](LICENSE).

An interactive, public guide to how modern language models work. It is a static Astro site: the guide and its interactive tools are delivered globally, while reading progress stays private to each visitor's browser.

## Develop locally

Inside `guide/`:

| Command | What it does |
| --- | --- |
| `npm ci` | installs the locked dependencies |
| `npm run dev` | starts Astro's local development server |
| `npm run build` | syntax-checks the browser scripts and builds the site |
| `npm run check` | verifies internal links, brand rules, and public-deployment invariants |

Set `SITE_URL` when making a production build so canonical URLs, social metadata, and the sitemap use the public domain. For example, in PowerShell: `$env:SITE_URL='https://example.com'; npm run build`.

## Deploy on Cloudflare Pages

Cloudflare Pages is the recommended host for this static site. Connect the repository in **Workers & Pages**, then configure:

| Setting | Value |
| --- | --- |
| Root directory | `guide` |
| Build command | `npm ci && npm run build && npm run check` |
| Build output directory | `dist` |
| Environment variable | Optional: `SITE_URL=https://insidethemodel.app` |
| Node version | `22` (also pinned in `.nvmrc`) |

The platform publishes each build to a `pages.dev` URL and can create previews for branches. After purchasing a domain, add it through the project’s **Custom domains** screen. For an apex domain, point its nameservers to Cloudflare; for a subdomain managed elsewhere, add the CNAME Cloudflare provides. The site defaults to `https://insidethemodel.app` as its canonical production URL, so builds retain valid canonical tags and a sitemap even if the variable is absent. Set `SITE_URL` to an alternative HTTPS origin only when deliberately building a preview or another deployment environment.

## Public-launch checks

After the production deployment is live:

1. Verify `insidethemodel.app` in [Google Search Console](https://search.google.com/search-console/) and submit `https://insidethemodel.app/sitemap-index.xml`.
2. Use Search Console’s URL Inspection on the home page to request indexing and confirm Google can read the canonical URL.
3. Refresh the rich preview cache in the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) and [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/). The card should show the Inside the Model artwork, title, and description.

## Edit it

All content is Markdown in `guide/src/content/docs/`:

| Folder | What it holds |
| --- | --- |
| `guide/` | the 24 chapters; the home page is generated from them by `npm run gen` (order and metadata in `guide/src/chapters.mjs`) |
| `teardown/` | gpt-oss-120b and DeepSeek-V3 walked through layer by layer |
| `labs/` | hands-on exercises |
| `teardown/compare.md` | the comparison page (toy model against real models); its widget is `public/js/compare.js` |
| `explorer.md` | the Model Explorer page; its engine is `public/js/itm-model.js` and its UI is `public/js/explorer.js` |
| `reference/` | public security guidance (hand-written) and the paper index (generated) |

Math is LaTeX: `$...$` inline, `$$...$$` for display. The interactive widgets live in `guide/public/js/` and are placed in a page with `<div class="widget not-content" data-w="name" data-title="Title"></div>`. They are built from the shared kit in `guide/public/js/kit.js` (state binding, segmented choices, stat cards, SVG charts with draggable and keyboard-operable handles, step/play transport; styles in `guide/src/styles/widgets.css`). Each widget registers `set`, `act` and `reset` on its box so the learning frame in `interaction.js` can drive its "Try" scenarios by state key. Every cited paper is an entry in `guide/public/js/papers.js` and is cited in a page with `<cite data-p="key" data-s></cite>`.

After editing, run `npm run build` and refresh the local preview.

## Checks

Inside `guide/`:

| Command | What it does |
| --- | --- |
| `npm run build` | syntax-checks the browser scripts, then builds the site and its search index |
| `npm run check` | verifies every internal link, anchor and citation in the built site |
| `npm run verify` | checks the browser model engine against the independent NumPy reference (needs Python with numpy) and regenerates `public/trace/golden.json` |
| `python -I tools/train_model.py` | retrains the Model Explorer's toy transformer (NumPy, about a minute), after a gradient check of its hand-written backprop; rewrites `public/js/itm-weights.js` and `public/trace/weights.json`. Run `npm run verify` afterwards |
| `npm run gen` | regenerates the home page, the labs list, the paper index and the chapter metadata |

## Layout

```
guide/                   the Astro + Starlight project and deployable static output
.github/                 issue forms for reporting problems and suggestions
LICENSE                  which license covers which files
```
