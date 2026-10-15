const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const arrow = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg>';

export function renderHome({ CH, PARTS, labs, rows, params, cases }) {
  const curriculum = Object.entries(PARTS).map(([name, description]) => {
    const items = CH.map((chapter, index) => [chapter, index]).filter(([chapter]) => chapter[2] === name);
    return `<section class="home-curriculum-part"><header><div><h3>${esc(name.replace(/^[IVX]+\. /, ''))}</h3><p>${esc(description)}</p></div></header><ol>` + items.map(([chapter, index]) => `<li><span>${index + 1}</span><a href="/guide/${chapter[1]}/">${esc(chapter[3])}</a><small>${chapter[4]} min</small></li>`).join('') + '</ol></section>';
  }).join('\n');
  return `---
title: See how a language model turns text into a prediction
description: See how a language model turns a prompt into a prediction. Explore attention, training and sampling through live computations in your browser.
template: splash
prev: false
next: false
head:
  - tag: style
    content: ":root { --sl-content-width: 78rem; }"
---

<div class="home-landing">
<header class="home-stage" data-home-hero>
  <div class="home-stage-inner">
    <div class="home-hero-copy">
      <h1>See how a language model turns text into a prediction.</h1>
      <p class="home-deck">Follow a prompt through a working model, from tokens to attention to next-word probabilities. Change the inputs, inspect the actual numbers, and understand what each step does. It all runs in your browser.</p>
      <div class="home-actions">
        <a class="home-action-primary" href="/explorer/">Open the Model Explorer</a>
        <a class="home-action-secondary" href="/cases/">Explore attention, training and sampling ${arrow}</a>
      </div>
      <p class="home-reading-note">Start in the browser. Follow the equations and reproduce the measurements in Python when you want more depth.</p>
    </div>
    <figure class="home-specimen">
      <div class="widget hv not-content" data-w="homehero"><p data-home-static>A small, trained transformer runs here in your browser. <a href="/cases/place-or-animal/">Investigate its place prediction.</a></p></div>
      <figcaption>A real computation from our two-layer teaching model. Small enough to inspect every value; trained on a 25-token synthetic language.</figcaption>
    </figure>
  </div>
  <div class="home-proof">
    <p>Live computations. Downloadable weights. Reproducible code.</p>
    <a href="#home-inspection-title">Inspect the evidence behind the model ${arrow}</a>
  </div>
</header>

<section class="home-section home-routes" aria-labelledby="home-routes-title">
  <div class="home-section-heading">
    <h2 id="home-routes-title">Explore a specific concept.</h2>
    <p>Each experiment runs the teaching model with editable inputs and explains the computed result.</p>
    <a href="/cases/">All experiments</a>
  </div>
  <nav class="home-route-list" aria-label="Featured experiments">
${['place','training','confidence'].map(id => cases.find(c => c.id === id)).map(c => `    <a class="home-route" href="/cases/${c.slug}/"><span><b>${esc(c.title)}</b><small>${esc(c.question)}</small></span>${arrow}</a>`).join('\n')}
  </nav>
</section>

<section class="home-section home-inspection" aria-labelledby="home-inspection-title">
  <div class="home-inspection-intro">
    <h2 id="home-inspection-title">Small by design.<br>Open to inspection.</h2>
    <p>Our ${params.toLocaleString('en-US')}-parameter transformer makes its calculations visible. The experiments use the same model, weights, and engine as the Model Explorer.</p>
    <p class="home-verification">The browser engine is checked against an independent NumPy implementation to within 1e-9. Hand-written backpropagation is checked against finite differences.</p>
    <p class="home-why-small">This model learns a tiny synthetic grammar. It does not have the capabilities of a production LLM. Each investigation explains what its evidence supports; architecture comparisons show where larger models differ.</p>
  </div>
  <div class="home-inspection-list">
    <a class="home-inspection-row" href="/explorer/"><b>Trace a token through 26 operations</b><small>Move between calculated values, equations, and the reference code.</small></a>
    <a class="home-inspection-row" href="/labs/explorer-forward-pass/"><b>Match the model's numbers yourself</b><small>Download the weights and rebuild the forward pass in NumPy.</small></a>
    <a class="home-inspection-row" href="/teardown/compare/"><b>Bridge the teaching model and larger architectures</b><small>Understand which operations transfer and which design choices change.</small></a>
  </div>
</section>

<section class="home-section home-curriculum" aria-labelledby="home-curriculum-title">
  <div class="home-curriculum-intro"><h2 id="home-curriculum-title">Prefer a structured read?</h2><p>Build the foundations in order, or use the chapters as a reference beside an experiment.</p><a href="/guide/gradient-descent/">Start with the foundations ${arrow}</a></div>
  <details class="home-syllabus"><summary>Browse all ${CH.length} chapters</summary><div class="home-curriculum-list">${curriculum}</div></details>
</section>
</div>
`;
}

export function renderCases(cases) {
  return `---
title: Experiments
description: Explore attention, training, causal masking and sampling through editable computations on a small transformer.
---

Change an input or setting, compare the measured outputs, and inspect the explanation. Every experiment runs locally in your browser using the same trained model as the [Model Explorer](/explorer/).

<ul class="case-list">
${cases.map(c => `<li><a href="/cases/${c.slug}/">${esc(c.title)}</a><p>${esc(c.question)}</p></li>`).join('\n')}
</ul>

## A name-selection circuit

[Trace how a model selects a name](/cases/story-circuit/) across 24 short stories. This experiment uses a second teaching model with a larger vocabulary. Compare head-output interventions with attention patterns and inspect where the explanation remains incomplete.

## Scope

The six experiments above use a 4,496-parameter transformer with a 25-token synthetic vocabulary. Results describe this model under the specified inputs and interventions. They do not establish how a production assistant reaches an answer. See [methods and limitations](/methods/).

Use the [reference code](/run-locally/) to inspect the computation locally, or [compare the architecture with larger models](/teardown/compare/).
`;
}
