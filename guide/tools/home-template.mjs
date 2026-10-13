const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const arrow = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg>';
const proofIcons = {
  operations: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 11l3.5-4M13.5 7l3.5 4M7 13l3.5 4M13.5 17l3.5-4"/><circle cx="12" cy="19" r="2"/></svg>',
  checked: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 9"/></svg>',
  browser: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8h18M7 6h.01M10 6h.01"/></svg>',
  private: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'
};

export function renderHome({ CH, PARTS, labs, rows }) {
  const mins = CH.reduce((sum, chapter) => sum + chapter[4], 0);
  let curriculum = '';
  let part = 0;

  for (const [name, description] of Object.entries(PARTS)) {
    part++;
    const items = CH.map((chapter, index) => [chapter, index]).filter(([chapter]) => chapter[2] === name);
    const partMins = items.reduce((sum, [chapter]) => sum + chapter[4], 0);
    curriculum += `<section class="home-curriculum-part"><header><span>${String(part).padStart(2, '0')}</span><div><h3>${esc(name.replace(/^[IVX]+\. /, ''))}</h3><p>${esc(description)}</p></div><small>${partMins} min</small></header><ol>` +
      items.map(([chapter, index]) => `<li><span>${index + 1}</span><a href="/guide/${chapter[1]}/">${esc(chapter[3])}</a><small>${chapter[4]} min</small></li>`).join('') +
      '</ol></section>\n';
  }

  return `---
title: See exactly how LLMs work
description: An interactive guide to the calculations, code, training, and inference behind large language models.
template: splash
head:
  - tag: style
    content: ":root { --sl-content-width: 78rem; }"
---

<div class="home-landing">
<header class="home-stage" data-home-hero>
  <div class="home-stage-inner">
    <div class="home-hero-copy">
      <h1>See exactly<br>how LLMs work.</h1>
      <p class="home-tagline">From text to tensors to understanding.</p>
      <p class="home-deck">An interactive guide to the calculations, code, training, and inference behind large language models.</p>
      <div class="home-actions">
        <a class="home-action-primary" href="/explorer/">Open the Model Explorer ${arrow}</a>
        <a class="home-action-secondary" href="/guide/gradient-descent/">Start the guide ${arrow}</a>
      </div>
    </div>
    <div class="home-specimen">
      <div class="widget hv not-content" data-w="homehero"></div>
      <span class="home-callout home-callout-attention">attention weight<br><small>from earlier tokens</small></span>
      <span class="home-callout home-callout-input">input token<br><small>selected</small></span>
      <span class="home-callout home-callout-output">next-token<br>probability</span>
    </div>
  </div>
  <div class="home-proof" role="list" aria-label="How this guide is verified">
    <div role="listitem">${proofIcons.operations}<span class="home-proof-copy"><b>26 operations</b><span>from prompt to next-token probabilities</span></span></div>
    <div role="listitem">${proofIcons.checked}<span class="home-proof-copy"><b>checked to 1e-9</b><span>against an independent implementation</span></span></div>
    <div role="listitem">${proofIcons.browser}<span class="home-proof-copy"><b>runs in your browser</b><span>no installation or GPU required</span></span></div>
    <div role="listitem">${proofIcons.private}<span class="home-proof-copy"><b>progress stays private</b><span>everything remains in this browser</span></span></div>
  </div>
</header>

<section class="home-section home-routes" aria-labelledby="home-routes-title">
  <div class="home-section-heading">
    <h2 id="home-routes-title">Choose your way in</h2>
    <p>Same model. Different starting points. Follow the route that matches what you want to understand.</p>
  </div>
  <nav class="home-route-list" aria-label="Ways to begin">
    <a class="home-route home-route-explorer" href="/explorer/"><span><b>Follow a token</b><small>Trace one prompt through the model's actual calculations.</small></span>${arrow}</a>
    <a class="home-route home-route-guide" href="/guide/gradient-descent/"><span><b>Read the chapters</b><small>Build the ideas from gradients to evaluation, in order.</small></span>${arrow}</a>
    <a class="home-route home-route-labs" href="/labs/"><span><b>Run hands-on labs</b><small>Change inputs, inspect tensors, and test the ideas yourself.</small></span>${arrow}</a>
  </nav>
</section>

<section class="home-section home-inspection" aria-labelledby="home-inspection-title">
  <div class="home-inspection-intro">
    <h2 id="home-inspection-title">Every number has a way back</h2>
    <p>The Explorer does not animate a story over a black box. It exposes the values the model actually computed, then lets you inspect the same operation as a diagram, an equation, or code.</p>
    <p class="home-verification">The browser engine is checked against an independent NumPy implementation to within 1e-9. Hand-written backpropagation is checked against finite differences.</p>
  </div>
  <div class="home-inspection-list">
    <a class="home-inspection-row home-inspection-trace" href="/explorer/"><span>Trace</span><b>Follow a token through 26 operations</b><small>Pick the token, layer, and head. Share the exact state as a link.</small></a>
    <a class="home-inspection-row home-inspection-math" href="/explorer/#step=5&amp;t=3&amp;l=0&amp;h=0&amp;v=math"><span>Math</span><b>Recompute one attention score by hand</b><small>See the real q, k, and v values substituted into each equation.</small></a>
    <a class="home-inspection-row home-inspection-code" href="/explorer/#step=7&amp;t=3&amp;l=0&amp;h=0&amp;v=code"><span>Code</span><b>Read the reference implementation</b><small>The current operation is highlighted in plain JavaScript with test fixtures.</small></a>
    <a class="home-inspection-row home-inspection-compare" href="/explorer/#step=25&amp;t=5&amp;l=1&amp;h=0&amp;v=visual&amp;w=random"><span>Compare</span><b>See what training changes</b><small>Run the same arithmetic with trained and random weights.</small></a>
  </div>
</section>

<section class="home-section home-curriculum" aria-labelledby="home-curriculum-title">
  <div class="home-curriculum-intro">
    <h2 id="home-curriculum-title">The complete route</h2>
    <p>${CH.length} chapters · about ${(mins / 60).toFixed(1)} hours</p>
    <p>Start with functions and gradients, finish with modern systems, security, and honest evaluation. Every chapter works through concrete numbers before stating the general rule.</p>
    <a href="/guide/gradient-descent/">Begin with chapter one ${arrow}</a>
  </div>
  <div class="home-curriculum-list">
${curriculum}  </div>
</section>

<section class="home-resources" aria-labelledby="home-resources-title">
  <div><h2 id="home-resources-title">Go from the toy model to the real thing</h2><p>The teaching model is deliberately tiny and says so wherever it differs from production systems. Keep going with real architectures, reproducible labs, security guidance, and the primary literature.</p></div>
  <nav aria-label="More resources">
    <a href="/teardown/"><b>Model teardowns</b><span>gpt-oss-120b and DeepSeek-V3, layer by layer</span></a>
    <a href="/labs/"><b>Hands-on labs</b><span>${labs.length} reproducible exercises</span></a>
    <a href="/reference/security-guidance/"><b>Public security guidance</b><span>NSA, CISA, and allied agencies</span></a>
    <a href="/reference/papers/"><b>All papers</b><span>${rows.length} linked references with chapter citations</span></a>
  </nav>
  <p class="home-sourcing">Every paper is linked (all but three textbooks to arXiv), and each arXiv id and title was checked against the arXiv API. Statements about specific models come from technical reports or model cards; anything that could not be confirmed is marked.</p>
</section>
</div>
`;
}
