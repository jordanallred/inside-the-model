# Inside the Model

See exactly how LLMs work. Brand rules: [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md).

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
| Environment variable | `SITE_URL=https://your-domain.example` |
| Node version | `22` (also pinned in `.nvmrc`) |

The platform publishes each build to a `pages.dev` URL and can create previews for branches. After purchasing a domain, add it through the project’s **Custom domains** screen. For an apex domain, point its nameservers to Cloudflare; for a subdomain managed elsewhere, add the CNAME Cloudflare provides. Keep `SITE_URL` set to the final HTTPS canonical domain, including no trailing path.

## Edit it

All content is Markdown in `guide/src/content/docs/`:

| Folder | What it holds |
| --- | --- |
| `guide/` | the 21 chapters; the home page is generated from them by `npm run gen` (order and metadata in `guide/src/chapters.mjs`) |
| `teardown/` | gpt-oss-120b and DeepSeek-V3 walked through layer by layer |
| `labs/` | hands-on exercises |
| `teardown/compare.md` | the comparison page (toy model against real models); its widget is `public/js/compare.js` |
| `explorer.md` | the Model Explorer page; its engine is `public/js/itm-model.js` and its UI is `public/js/explorer.js` |
| `reference/` | public security guidance (hand-written) and the paper index (generated) |

Math is LaTeX: `$...$` inline, `$$...$$` for display. The interactive widgets live in `guide/public/js/` and are placed in a page with `<div class="widget not-content" data-w="name" data-title="Title"></div>`. Every cited paper is an entry in `guide/public/js/papers.js` and is cited in a page with `<cite data-p="key" data-s></cite>`.

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
rebuild.bat              convenience build script for Windows
guide/                   the Astro + Starlight project and deployable static output
```
