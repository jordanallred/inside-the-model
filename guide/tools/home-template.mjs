const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const arrow = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg>';

export function renderHome({ CH, PARTS, labs, rows, params, cases }) {
  const curriculum = Object.entries(PARTS).map(([name, description]) => {
    const items = CH.map((chapter, index) => [chapter, index]).filter(([chapter]) => chapter[2] === name);
    return `<section class="home-curriculum-part"><header><div><h3>${esc(name.replace(/^[IVX]+\. /, ''))}</h3><p>${esc(description)}</p></div></header><ol>` + items.map(([chapter, index]) => `<li><span>${index + 1}</span><a href="/guide/${chapter[1]}/">${esc(chapter[3])}</a><small>${chapter[4]} min</small></li>`).join('') + '</ol></section>';
  }).join('\n');
  return `---
title: Understand language models by taking them apart
description: Guided investigations for developers who want to understand LLM internals. Predict, experiment on a working model, and test your explanation.
template: splash
head:
  - tag: style
    content: ":root { --sl-content-width: 78rem; }"
---

<div class="home-landing">
<header class="home-stage" data-home-hero>
  <div class="home-stage-inner">
    <div class="home-hero-copy">
      <h1>Understand language models by taking them apart.</h1>
      <p class="home-deck">You build with language models. Now investigate what happens inside one. Make a prediction, change a component, and test your explanation against the actual computation.</p>
      <div class="home-actions">
        <a class="home-action-primary" data-case-start href="/cases/place-or-animal/">Start: The place detector</a>
        <a class="home-action-secondary" href="/cases/">Explore the investigations ${arrow}</a>
      </div>
      <p class="home-reading-note">Your first investigation takes about 10 minutes. No installation, GPU, or prior maths required.</p>
    </div>
    <figure class="home-specimen">
      <div class="widget hv not-content" data-w="homehero"><p data-home-static>A small, trained transformer runs here in your browser. <a href="/cases/place-or-animal/">Investigate its place prediction.</a></p></div>
      <figcaption>A real computation from our two-layer teaching model. Small enough to inspect every value; trained on a 25-token synthetic language.</figcaption>
    </figure>
  </div>
  <div class="home-proof">
    <p>Working experiments. Reproducible code. Progress saved in your browser.</p>
    <a href="#home-inspection-title">Inspect the evidence behind the model ${arrow}</a>
  </div>
</header>

<section class="home-section home-routes" aria-labelledby="home-routes-title">
  <div class="home-section-heading">
    <h2 id="home-routes-title">Six questions.<br>Learn to investigate.</h2>
    <p>Start with the place detector. Build through learning and information flow, then design controls and challenge causal claims. Each guided case includes one of three rotating transfer examples.</p>
  </div>
  <nav class="home-route-list" aria-label="Investigations in learning order">
${cases.map((c, i) => `    <a class="home-route home-case" href="/cases/${c.slug}/"><span class="home-case-number">${String(i + 1).padStart(2, '0')}</span><span><b>${esc(c.title)}</b><span class="home-case-question">${esc(c.question)}</span><small>${esc(c.skill)} · about ${c.minutes} min</small><span class="home-case-status" data-case-status="${c.id}">Start investigation</span></span>${arrow}</a>`).join('\n')}
  </nav>
</section>

<section class="home-section home-method" aria-labelledby="home-method-title">
  <div class="home-section-heading"><h2 id="home-method-title">Build an explanation you can test.</h2><p>You do the investigating. The site gives you the instruments, the evidence, and help when you need it.</p></div>
  <ol class="home-method-list">
    <li><b>Observe &amp; predict</b><p>Start with a concrete behavior. Commit to what you think will happen before seeing the result.</p></li>
    <li><b>Intervene &amp; measure</b><p>Remove a head, swap weights, or change the input. Compare the actual probabilities and intermediate values.</p></li>
    <li><b>Explain &amp; test again</b><p>Use the evidence to choose an explanation, then make a prediction on a fresh example.</p></li>
  </ol>
</section>

<section class="home-section home-inspection" aria-labelledby="home-inspection-title">
  <div class="home-inspection-intro">
    <h2 id="home-inspection-title">Small by design.<br>Open to inspection.</h2>
    <p>Our ${params.toLocaleString('en-US')}-parameter transformer makes its calculations visible. Every case uses the same model, weights, and engine as the Model Explorer.</p>
    <p class="home-verification">The browser engine is checked against an independent NumPy implementation to within 1e-9. Hand-written backpropagation is checked against finite differences.</p>
    <p class="home-why-small">This model learns a tiny synthetic grammar. It does not have the capabilities of a production LLM. Each investigation explains what its evidence supports; architecture comparisons show where larger models differ.</p>
  </div>
  <div class="home-inspection-list">
    <a class="home-inspection-row" href="/explorer/"><span>Inspect</span><b>Trace a token through 26 operations</b><small>Move between calculated values, equations, and the reference code.</small></a>
    <a class="home-inspection-row" href="/labs/explorer-forward-pass/"><span>Reproduce</span><b>Match the model's numbers yourself</b><small>Download the weights and rebuild the forward pass in NumPy.</small></a>
    <a class="home-inspection-row" href="/teardown/compare/"><span>Connect</span><b>Bridge the teaching model and larger architectures</b><small>Understand which operations transfer and which design choices change.</small></a>
  </div>
</section>

<section class="home-resources" aria-labelledby="home-library-title">
  <div><h2 id="home-library-title">The reference behind the investigations.</h2><p>Go deeper when a question calls for it. The complete guide, labs, and model teardowns stay within reach.</p></div>
  <nav aria-label="Supporting library">
    <a href="#home-curriculum-title"><b>The complete guide</b><span>${CH.length} chapters, from gradients to evaluation</span></a>
    <a href="/labs/"><b>Hands-on labs</b><span>${labs.length} reproducible exercises</span></a>
    <a href="/teardown/"><b>Model teardowns</b><span>Published architectures, layer by layer</span></a>
    <a href="/reference/papers/"><b>Papers &amp; sources</b><span>${rows.length} linked references</span></a>
    <a href="/reference/security-guidance/"><b>Security guidance</b><span>Public guidance from security agencies</span></a>
    <a href="/notebook/"><b>Evidence notebook</b><span>Write up, save and export your findings</span></a>
    <a href="/teach/"><b>Teach a workshop</b><span>Session plan, discussion rubric and instructor notes</span></a>
    <a href="/methods/"><b>Methods &amp; evidence</b><span>Verification, provenance and review status</span></a>
    <a href="/replications/gpt2-causality/"><b>Reproduce a GPT-2 experiment</b><span>Pinned weights, measured controls and a runnable notebook</span></a>
    <a href="/field-notes/"><b>Field notes</b><span>Practical questions connected to testable explanations</span></a>
    <a href="/cases/story-circuit/"><b>Further investigation</b><span>Who gets the ball? Trace a decision in the larger case-file model.</span></a>
  </nav>
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
title: Investigate how language models work
description: Six guided investigations on a working transformer. Predict, change one variable, inspect the evidence, and test your understanding.
---

Understand language models by taking them apart. These investigations are for developers who build with LLMs and want to understand the computation behind their predictions.

Start with **The place detector**. Each investigation asks you to make a prediction, change one variable, and explain the measured result. A fresh example checks whether your explanation transfers. No installation or GPU needed; progress stays in this browser.

<ol class="case-list">
${cases.map((c, i) => `<li><a href="/cases/${c.slug}/">${i + 1}. ${esc(c.title)}</a><p>${esc(c.question)}</p><p>${esc(c.skill)}</p><small>About ${c.minutes} minutes <span data-case-status="${c.id}">Start investigation</span></small></li>`).join('\n')}
</ol>

## The model is small on purpose

The six guided cases run the same trained, two-layer transformer as the [Model Explorer](/explorer/). It has 4,496 parameters and a 25-token vocabulary learned from a synthetic grammar. Its small size makes experiments quick and every intermediate value inspectable.

The place-detector case introduces tools used in **mechanistic interpretability**: ablation, attention inspection, and controlled input changes. The other cases investigate learning, information flow, experimental controls, conditional sufficiency and sampling confidence. Each conclusion distinguishes what the experiment demonstrates from what it does not establish about larger models.

## Follow a question further

Open the [Model Explorer](/explorer/) to inspect the calculations, [read the guide](/guide/gradient-descent/) for a structured introduction, or [reproduce the forward pass in NumPy](/labs/explorer-forward-pass/). The [architecture comparison](/teardown/compare/) connects this teaching model to larger published designs.

## Keep investigating: Who gets the ball?

Ready for a more open investigation? [Who gets the ball?](/cases/story-circuit/) asks how a model chooses between two names in a story. It uses a second, larger-vocabulary teaching model and lets you investigate a decision across 24 stories. The published case and its experiments remain available alongside the six guided investigations above.
`;
}
