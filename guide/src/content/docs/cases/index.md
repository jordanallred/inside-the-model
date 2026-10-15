---
title: Investigate how language models work
description: Six open investigations on a working transformer. Change the inputs, inspect the evidence and build a better explanation.
---

Understand language models by taking them apart. These investigations are for developers who build with LLMs and want to understand the computation behind their predictions.

Start with a question you care about, or use **The place detector** to practice a component intervention. Change the inputs or settings, compare measured outputs, and open the explanation whenever it is useful. The [practical investigation guide](/investigate/) connects these comparisons to LLM development. No installation or GPU needed; input settings stay in this browser.

<ol class="case-list">
<li><a href="/cases/place-or-animal/">1. The place detector</a><p>Which head outputs affect the place prediction?</p><p>Compare output interventions with attention patterns</p><small>Self-paced · <span data-case-status="place">Start investigation</span></small></li>
<li><a href="/cases/what-training-changes/">2. What training changes</a><p>Same model. Different weights. Different answer?</p><p>Compare predictions and measure loss</p><small>Self-paced · <span data-case-status="training">Start investigation</span></small></li>
<li><a href="/cases/hidden-future/">3. The hidden future</a><p>Can an earlier token read words that come later?</p><p>Test information flow with a controlled change</p><small>Self-paced · <span data-case-status="future">Start investigation</span></small></li>
<li><a href="/cases/choose-the-control/">4. Choose the control</a><p>Which experiment could distinguish two explanations?</p><p>Construct and compare your own prompt pair</p><small>Self-paced · <span data-case-status="controls">Start investigation</span></small></li>
<li><a href="/cases/necessary-and-sufficient/">5. Necessary—and sufficient?</a><p>What does removing a component actually establish?</p><p>Separate necessity from conditional sufficiency</p><small>Self-paced · <span data-case-status="sufficiency">Start investigation</span></small></li>
<li><a href="/cases/confidence-without-learning/">6. Confidence without learning</a><p>Can a prediction become more confident without learning?</p><p>Separate sampling settings from model knowledge</p><small>Self-paced · <span data-case-status="confidence">Start investigation</span></small></li>
</ol>

## The model is small on purpose

The six guided cases run the same trained, two-layer transformer as the [Model Explorer](/explorer/). It has 4,496 parameters and a 25-token vocabulary learned from a synthetic grammar. Its small size makes experiments quick and every intermediate value inspectable.

The place-detector case introduces tools used in **mechanistic interpretability**: ablation, attention inspection, and controlled input changes. The other cases investigate learning, information flow, experimental controls, conditional sufficiency and sampling confidence. Each conclusion distinguishes what the experiment demonstrates from what it does not establish about larger models.

## Follow a question further

Open the [Model Explorer](/explorer/) to inspect the calculations, [read the guide](/guide/gradient-descent/) for a structured introduction, or [reproduce the forward pass in NumPy](/labs/explorer-forward-pass/). The [architecture comparison](/teardown/compare/) connects this teaching model to larger published designs.

## Keep investigating: Who gets the ball?

Ready for a more open investigation? [Who gets the ball?](/cases/story-circuit/) asks how a model chooses between two names in a story. It uses a second, larger-vocabulary teaching model and lets you investigate a decision across 24 stories. Its head switches, story builder and explanations are available from the start.
