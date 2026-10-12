// Generates the pieces of the site that are derived from other content. Run with: npm run gen
//   public/js/chapters.js        chapter metadata for the browser (sidebar progress marks)
//   src/content/docs/index.md     home page (from src/chapters.mjs)
//   src/content/docs/labs/index.md  list of labs (from each lab's front matter)
//   src/content/docs/reference/papers.md  every cited paper, with the chapters that cite it
// Chapters, labs, teardowns and the security-guidance page are hand-edited Markdown and are never overwritten here.
import fs from 'node:fs';
import vm from 'node:vm';
import { CH, PARTS } from '../src/chapters.mjs';

const DOCS = 'src/content/docs';
const num = Object.fromEntries(CH.map((c, i) => [c[0], i + 1]));

/* chapter metadata for the browser */
fs.writeFileSync('public/js/chapters.js', 'window.CHAPTERS = ' + JSON.stringify(CH.map(c => ({ id: c[0], slug: c[1], part: c[2], title: c[3], min: c[4] }))) + ';\n');

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
for (const f of fs.readdirSync(`${DOCS}/guide`)) {
  const c = CH.find(x => x[1] === f.replace(/\.md$/, ''));
  if (!c) continue;
  for (const m of fs.readFileSync(`${DOCS}/guide/${f}`, 'utf8').matchAll(/data-p="([^"]+)"/g)) (cited[m[1]] = cited[m[1]] || new Set()).add(num[c[0]]);
}
const rows = Object.entries(PAPERS).map(([k, p]) => ({ k, p, ch: [...(cited[k] || [])].sort((a, b) => a - b) }))
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

/* home page */
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const mins = CH.reduce((a, c) => a + c[4], 0);
let home = `---
title: See exactly how LLMs work
description: An interactive guide to the calculations, code, training, and inference behind large language models.
template: splash
head:
  - tag: style
    content: ":root { --sl-content-width: 74rem; }"
hero:
  tagline: From text to tensors to understanding. An interactive guide to the calculations, code, training, and inference behind large language models.
  image:
    html: '<div class="widget hv not-content" data-w="homehero"></div>'
  actions:
    - text: Open the Model Explorer
      link: /explorer/
      icon: right-arrow
    - text: Start the guide
      link: /guide/gradient-descent/
      variant: secondary
    - text: Hands-on labs
      link: /labs/
      variant: minimal
---

<div class="home-stats">
<div><b>${CH.length}</b><span>chapters, about ${Math.round(mins / 60)} hours</span></div>
<div><b>${labs.length}</b><span>hands-on labs</span></div>
<div><b>3</b><span>real-model teardowns</span></div>
<div><b>${rows.length}</b><span>papers, each linked</span></div>
</div>

## Every number is inspectable

A small transformer runs in your browser, and every value it computes is on the screen. Nothing is animated for effect: if a number appears, you can see where it came from.

<div class="home-cards">
<a class="hc hc-flow" href="/explorer/"><span class="hc-k">Trace</span><b>Follow a token through 26 operations</b><span>Step from prompt to next-token probabilities. Pick the token, layer and head, and share the exact state as a link.</span></a>
<a class="hc hc-attn" href="/explorer/#step=5&t=3&l=0&h=0&v=math"><span class="hc-k">Math</span><b>Recompute it by hand</b><span>The real q, k and v values are substituted into each equation, so one attention score can be checked on paper.</span></a>
<a class="hc hc-in" href="/explorer/#step=7&t=3&l=0&h=0&v=code"><span class="hc-k">Code</span><b>Read the reference implementation</b><span>The operation you are inspecting is highlighted in plain JavaScript, with downloadable test fixtures.</span></a>
<a class="hc hc-out" href="/explorer/#step=25&t=5&l=1&h=0&v=visual&w=random"><span class="hc-k">Compare</span><b>Trained against random weights</b><span>Run the identical arithmetic with and without learning, and see exactly what training changes.</span></a>
</div>

The browser engine is checked against an independent NumPy implementation to within 1e-9, and the hand-written backpropagation is checked against finite differences. The model is deliberately tiny and says so wherever it differs from production systems.

## Start where you are

<div class="home-paths">
<a href="/guide/gradient-descent/"><b>Curious beginner</b><span>Start with functions and gradients. No machine-learning background assumed.</span></a>
<a href="/explorer/"><b>Software engineer</b><span>Connect tensor shapes and operations to code in the Explorer and the labs.</span></a>
<a href="/teardown/"><b>ML practitioner</b><span>Verify the mathematics, then compare against real open-weight models.</span></a>
<a href="/labs/"><b>Instructor or student</b><span>Share reproducible examples by link, then check understanding with the challenges and labs.</span></a>
</div>

## Curriculum

Each chapter opens with a box saying who can skip it, works through numbers before stating general rules, includes widgets you can poke, and ends with the research behind it.

<div class="home-parts">
`;
let part = 0;
for (const [name, desc] of Object.entries(PARTS)) {
  part++;
  const items = CH.map((c, i) => [c, i]).filter(([c]) => c[2] === name);
  home += `<section class="part"><span class="part-n">${String(part).padStart(2, '0')}</span><h3>${esc(name.replace(/^[IVX]+\. /, ''))}</h3><p>${esc(desc)}</p><ol>` +
    items.map(([c, i]) => `<li><em>${i + 1}.</em><a href="/guide/${c[1]}/">${esc(c[3])}</a><span>${c[4]} min</span></li>`).join('') + `</ol></section>\n`;
}
home += `</div>

## Also here

- [Model teardowns](/teardown/): follow one token through gpt-oss-120b and DeepSeek-V3, layer by layer, with their real configurations.
- [Hands-on labs](/labs/): ${labs.length} exercises that make the chapters concrete.
- [Public security guidance for AI systems](/reference/security-guidance/): what NSA, CISA and allied agencies have published.
- [All papers](/reference/papers/): every reference, with the chapters that cite it.

Every paper links to arXiv, and every id and title was checked against the arXiv API. Statements about specific models come from their technical reports or model cards, and anything that could not be confirmed is marked. Reading progress stays private to this browser.
`;
fs.writeFileSync(`${DOCS}/index.md`, home);
console.log(`generated: ${CH.length} chapters, ${labs.length} labs, ${rows.length} papers`);
