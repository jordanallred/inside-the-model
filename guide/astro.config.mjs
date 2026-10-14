import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { CH, PARTS } from './src/chapters.mjs';
import { siteUrl, socialCardUrl, repoUrl } from './src/site-config.mjs';

const num = Object.fromEntries(CH.map((c, i) => [c[0], i + 1]));
const guideGroups = Object.keys(PARTS).map(part => ({
  label: part,
  items: CH.filter(c => c[2] === part).map(c => ({ slug: `guide/${c[1]}`, label: `${num[c[0]]}. ${c[3]}` })),
}));

const labsDir = new URL('./src/content/docs/labs/', import.meta.url);
const labItems = fs.readdirSync(labsDir).filter(f => f.endsWith('.md') && f !== 'index.md')
  .map(f => ({ f, t: fs.readFileSync(new URL(f, labsDir), 'utf8').match(/label: "(.*)"/)?.[1] ?? f }))
  .sort((a, b) => parseInt(a.t.match(/Lab (\d+)/)?.[1] ?? 99) - parseInt(b.t.match(/Lab (\d+)/)?.[1] ?? 99))
  .map(x => ({ slug: 'labs/' + x.f.replace(/\.md$/, ''), label: x.t }));

export default defineConfig({
  site: siteUrl,
  vite: { resolve: { alias: { '/brand': fileURLToPath(new URL('./public/brand', import.meta.url)) } } },
  markdown: { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] },
  integrations: [
    starlight({
      title: 'Inside the Model',
      logo: { src: '/brand/logo-horizontal-light.svg', alt: 'Inside the Model', replacesTitle: true },
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'Source and issues on GitHub', href: repoUrl }],
      components: { Footer: './src/components/Footer.astro' },
      description: 'An interactive guide to the calculations, code, training, and inference behind large language models.',
      customCss: ['katex/dist/katex.min.css', './src/styles/brand-tokens.css', './src/styles/custom.css', './src/styles/brand.css', './src/styles/widgets.css', './src/styles/explorer.css', './src/styles/home.css'],
      head: [
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400..600&family=JetBrains+Mono:wght@400..600&family=Parkinsans:wght@700&family=Plus+Jakarta+Sans:wght@700;800&display=swap' } },
        { tag: 'meta', attrs: { property: 'og:image', content: socialCardUrl } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: 'Inside the Model: See exactly how LLMs work' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: socialCardUrl } },
        { tag: 'meta', attrs: { name: 'twitter:image:alt', content: 'Inside the Model: See exactly how LLMs work' } },
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          content: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                name: 'Inside the Model',
                url: siteUrl,
                description: 'An interactive guide to the calculations, code, training, and inference behind large language models.',
                inLanguage: 'en',
              },
              {
                '@type': 'LearningResource',
                name: 'Inside the Model',
                url: siteUrl,
                description: 'An interactive guide to the calculations, code, training, and inference behind large language models.',
                learningResourceType: 'Interactive guide',
                educationalLevel: 'Beginner to intermediate',
                inLanguage: 'en',
              },
            ],
          }),
        },
      ].concat(['papers', 'glossary', 'itm-weights', 'itm-model', 'itm-train', 'explorer', 'trainer', 'home', 'compare', 'kit', 'widgets', 'widgets2', 'chapters', 'interaction', 'site'].map(f => ({ tag: 'script', attrs: { src: `/js/${f}.js`, defer: true } }))),
      sidebar: [
        { label: 'Start here', items: [{ slug: 'index', label: 'Overview' }, { slug: 'explorer', label: 'Model Explorer' }] },
        ...guideGroups,
        {
          label: 'Hands-on labs',
          collapsed: true,
          items: [{ slug: 'labs', label: 'All labs' }, ...labItems],
        },
        {
          label: 'Model teardowns',
          items: [
            { slug: 'teardown', label: 'Overview' },
            { slug: 'teardown/gpt-oss-120b', label: 'gpt-oss-120b' },
            { slug: 'teardown/deepseek-v3', label: 'DeepSeek-V3' },
            { slug: 'teardown/frontier', label: 'The newest open models' },
            { slug: 'teardown/compare', label: 'Compare with the toy model' },
          ],
        },
        {
          label: 'Reference',
          collapsed: true,
          items: [
            { slug: 'reference/security-guidance', label: 'Public AI security guidance' },
            { slug: 'reference/papers', label: 'All papers' },
          ],
        },
      ],
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      disable404Route: true,
      pagination: true,
      lastUpdated: false,
    }),
  ],
});
