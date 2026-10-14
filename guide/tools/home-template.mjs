const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const arrow = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg>';

export function renderHome({ CH, PARTS, labs, rows, params }) {
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
      <p class="home-deck">A language model predicts the next token. This guide works through how it gets there, from the first gradient to the final probabilities.</p>
      <div class="home-actions">
        <a class="home-action-primary" href="/explorer/">Open the Model Explorer ${arrow}</a>
        <a class="home-action-secondary" href="/guide/gradient-descent/">Start the guide ${arrow}</a>
      </div>
      <p class="home-reading-note">${CH.length} chapters, with worked examples and a model you can take apart.</p>
    </div>
    <figure class="home-specimen">
      <div class="widget hv not-content" data-w="homehero"></div>
      <figcaption><b>Try it:</b> select a token above. The attention weights and next-token probabilities come from a trained, two-layer teaching model running in this browser.</figcaption>
    </figure>
  </div>
  <div class="home-proof">
    <p>No installation or GPU needed. Your reading progress stays in this browser.</p>
    <a href="#home-inspection-title">How the calculations are checked ${arrow}</a>
  </div>
</header>

<section class="home-section home-routes" aria-labelledby="home-routes-title">
  <div class="home-section-heading">
    <h2 id="home-routes-title">Where to start</h2>
    <p>Read in order if the maths is new to you. If you already know the basics, go straight to the model or a lab.</p>
  </div>
  <nav class="home-route-list" aria-label="Ways to begin">
    <a class="home-route home-route-explorer" href="/explorer/"><span><b>Follow a token</b><small>Trace one prompt through the model's actual calculations.</small></span>${arrow}</a>
    <a class="home-route home-route-guide" href="/guide/gradient-descent/"><span><b>Read the chapters</b><small>Build the ideas from gradients to evaluation, in order.</small></span>${arrow}</a>
    <a class="home-route home-route-labs" href="/labs/"><span><b>Run hands-on labs</b><small>Change inputs, inspect tensors, and test the ideas yourself.</small></span>${arrow}</a>
  </nav>
</section>

<section class="home-section home-inspection" aria-labelledby="home-inspection-title">
  <div class="home-inspection-intro">
    <h2 id="home-inspection-title">A small model, fully worked out</h2>
    <p>The Explorer follows a prompt through 26 operations. At each step, you can inspect the calculated values, substitute them into the equation, or read the NumPy code.</p>
    <p class="home-verification">The browser engine is checked against the NumPy reference implementation to within 1e-9. Hand-written backpropagation is checked against finite differences.</p>
    <p class="home-why-small"><b>Why ${params.toLocaleString('en-US')} parameters?</b> A model this small lets you inspect every value and check it independently. It uses the same operations as production transformers; the chapters explain where larger architectures differ.</p>
  </div>
  <div class="home-inspection-list">
    <a class="home-inspection-row home-inspection-trace" href="/explorer/"><span>Trace</span><b>Follow a token through 26 operations</b><small>Pick the token, layer, and head. Share the exact state as a link.</small></a>
    <a class="home-inspection-row home-inspection-math" href="/explorer/#step=5&amp;t=3&amp;l=0&amp;h=0&amp;v=math"><span>Math</span><b>Recompute one attention score by hand</b><small>See the real q, k, and v values substituted into each equation.</small></a>
    <a class="home-inspection-row home-inspection-code" href="/explorer/#step=7&amp;t=3&amp;l=0&amp;h=0&amp;v=code"><span>Code</span><b>Read the reference implementation</b><small>The current operation is highlighted in the NumPy reference, with downloadable test fixtures.</small></a>
    <a class="home-inspection-row home-inspection-compare" href="/explorer/#step=25&amp;t=5&amp;l=1&amp;h=0&amp;v=visual&amp;w=random"><span>Compare</span><b>See what training changes</b><small>Run the same arithmetic with trained and random weights.</small></a>
  </div>
</section>

<section class="home-section home-curriculum" aria-labelledby="home-curriculum-title">
  <div class="home-curriculum-intro">
    <h2 id="home-curriculum-title">The chapters</h2>
    <p>${CH.length} chapters · about ${(mins / 60).toFixed(1)} hours</p>
    <p>The guide starts with functions and gradients, then builds a transformer piece by piece. Later chapters cover training, inference, security, and evaluation.</p>
    <a href="/guide/gradient-descent/">Begin with chapter one ${arrow}</a>
  </div>
  <div class="home-curriculum-list">
${curriculum}  </div>
</section>

<section class="home-resources" aria-labelledby="home-resources-title">
  <div><h2 id="home-resources-title">Further reading &amp; practice</h2><p>Compare the teaching model with published architectures, work through a lab, or look up the papers behind a chapter.</p></div>
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
