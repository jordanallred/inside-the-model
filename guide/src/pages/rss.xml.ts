import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { siteUrl } from '../site-config.mjs';

// The feed is built from the "What's new" page, whose "## YYYY-MM-DD: Title" sections are the items.
const source = (await getEntry('docs', 'changelog'))?.body ?? '';

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (md: string) => md.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\s+/g, ' ').trim();
// Matches the heading ids Starlight generates for these headings.
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-');

const items = [...source.matchAll(/^## (\d{4}-\d{2}-\d{2}): (.+)\r?\n([\s\S]*?)(?=^## |(?![\s\S]))/gm)].map(([, date, title, body]) => {
  const link = `${siteUrl}/changelog/#${slug(`${date}: ${title}`)}`;
  return `    <item>
      <title>${xml(title)}</title>
      <link>${xml(link)}</link>
      <guid isPermaLink="true">${xml(link)}</guid>
      <pubDate>${new Date(`${date}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${xml(plain(body))}</description>
    </item>`;
});

export const GET: APIRoute = () => new Response(
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Inside the Model: What's new</title>
    <link>${siteUrl}/changelog/</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>New chapters, tools, corrections and fixes to Inside the Model, an interactive guide to how large language models work.</description>
    <language>en</language>
${items.join('\n')}
  </channel>
</rss>
`,
  { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } },
);
