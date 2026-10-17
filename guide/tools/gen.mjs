// Generates the pieces of the site that are derived from other content. Run with: npm run gen
//   src/content/docs/index.md     home page (from src/chapters.mjs)
//   src/content/docs/labs/index.md  list of labs (from each lab's front matter)
//   src/content/docs/reference/papers.md  every cited paper, with the chapters that cite it
// Chapters, labs and teardowns are hand-edited Markdown and are never overwritten here.
import fs from 'node:fs';
import vm from 'node:vm';
import { CH, PARTS } from '../src/chapters.mjs';
import { renderHome, renderCases } from './home-template.mjs';
import '../public/js/case-catalog.js';

const DOCS = 'src/content/docs';
const num = Object.fromEntries(CH.map((c, i) => [c[0], i + 1]));

/* labs index, from the labs themselves */
const labs = fs.readdirSync(`${DOCS}/labs`).filter(f => f.endsWith('.md') && f !== 'index.md').map(f => {
  const s = fs.readFileSync(`${DOCS}/labs/${f}`, 'utf8');
  const label = s.match(/label: "Lab (\d+)\. (.*)"/);
  return { slug: f.replace(/\.md$/, ''), n: +label[1], title: label[2], sub: s.match(/description: "(.*)"/)[1], min: s.match(/about (\d+) minutes/)[1] };
}).sort((a, b) => a.n - b.n);
fs.writeFileSync(`${DOCS}/labs/index.md`, `---
title: Hands-on labs
description: Short exercises that make the guide's ideas concrete.
---

Each lab pairs with chapters of the guide, runs on a laptop CPU, and ends with exercises. Do the internals labs first; the security labs assume you have read the attack chapters. Use a disposable environment (a virtual machine or throwaway folder) for anything that handles untrusted files.

${labs.map(l => `${l.n}. [${l.title}](/labs/${l.slug}/): about ${l.min} minutes. ${l.sub}.`).join('\n')}
`);

/* paper index */
const PAPERS = vm.runInNewContext('var window={};' + fs.readFileSync('public/js/papers.js', 'utf8') + ';window.PAPERS');
const cited = {};
const publishedCitations = new Set();
function collectCitations(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=dir+'/'+entry.name;
    if(entry.isDirectory())collectCitations(file);
    else if(file.endsWith('.md'))for(const match of fs.readFileSync(file,'utf8').matchAll(/data-p="([^"]+)"/g))publishedCitations.add(match[1]);
  }
}
collectCitations(DOCS);
for (const f of fs.readdirSync(`${DOCS}/guide`)) {
  const c = CH.find(x => x[1] === f.replace(/\.md$/, ''));
  if (!c) continue;
  for (const m of fs.readFileSync(`${DOCS}/guide/${f}`, 'utf8').matchAll(/data-p="([^"]+)"/g)) (cited[m[1]] = cited[m[1]] || new Set()).add(num[c[0]]);
}
const rows = Object.entries(PAPERS).filter(([k])=>publishedCitations.has(k)).map(([k, p]) => ({ k, p, ch: [...(cited[k] || [])].sort((a, b) => a - b) }))
  .sort((a, b) => a.p.y - b.p.y || a.p.a.localeCompare(b.p.a));
const link = p => (p.x ? `https://arxiv.org/abs/${p.x}` : p.u);
fs.writeFileSync(`${DOCS}/reference/papers.md`, `---
title: All papers
description: Every paper and book cited in the guide, with arXiv links and the chapters that use them.
---

${rows.length} references. Each arXiv id and title was checked against the arXiv API. Sorted by year.

| Year | Reference | Cited in chapters |
| --- | --- | --- |
${rows.map(r => `| ${r.p.y} | ${r.p.a.replace(/\.$/, '')}. [${r.p.t.replace(/\|/g, '/')}](${link(r.p)})${r.p.x ? ` (arXiv:${r.p.x})` : ''} | ${r.ch.length ? r.ch.map(n => `[${n}](/guide/${CH[n - 1][1]}/)`).join(', ') : '-'} |`).join('\n')}
`);

/* home page; the parameter count is read from the trained weights so it cannot drift */
const countNumbers = v => typeof v === 'number' ? 1 : Object.values(v).reduce((n, x) => n + countNumbers(x), 0);
const params = countNumbers(JSON.parse(fs.readFileSync('public/trace/weights.json', 'utf8')).weights);
const cases = globalThis.ITMCaseCatalog;
const home = renderHome({ CH, PARTS, labs, rows, params, cases });
fs.writeFileSync(`${DOCS}/index.md`, home.replace(/\r\n/g, '\n'));
fs.writeFileSync(`${DOCS}/cases/index.md`, renderCases(cases).replace(/\r\n/g, '\n'));
console.log(`generated: ${CH.length} chapters, ${labs.length} labs, ${rows.length} papers`);
