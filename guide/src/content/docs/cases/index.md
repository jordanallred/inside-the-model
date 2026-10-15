---
title: Investigate how language models work
description: Six guided investigations on a working transformer. Predict, change one variable, inspect the evidence, and test your understanding.
---

Understand language models by taking them apart. These investigations are for developers who build with LLMs and want to understand the computation behind their predictions.

Start with **The place detector**. Each investigation asks you to make a prediction, change one variable, and explain the measured result. A fresh example checks whether your explanation transfers. No installation or GPU needed; progress stays in this browser.

<ol class="case-list">
<li><a href="/cases/place-or-animal/">1. The place detector</a><p>Which part knows a place comes next?</p><p>Find a component by removing it</p><small>About 10 minutes <span data-case-status="place">Start investigation</span></small></li>
<li><a href="/cases/what-training-changes/">2. What training changes</a><p>Same model. Different weights. Different answer?</p><p>Compare predictions and measure loss</p><small>About 8 minutes <span data-case-status="training">Start investigation</span></small></li>
<li><a href="/cases/hidden-future/">3. The hidden future</a><p>Can an earlier token read words that come later?</p><p>Test information flow with a controlled change</p><small>About 8 minutes <span data-case-status="future">Start investigation</span></small></li>
<li><a href="/cases/choose-the-control/">4. Choose the control</a><p>Which experiment could distinguish two explanations?</p><p>Design a discriminating experiment</p><small>About 12 minutes <span data-case-status="controls">Start investigation</span></small></li>
<li><a href="/cases/necessary-and-sufficient/">5. Necessary—and sufficient?</a><p>What does removing a component actually establish?</p><p>Separate necessity from conditional sufficiency</p><small>About 12 minutes <span data-case-status="sufficiency">Start investigation</span></small></li>
<li><a href="/cases/confidence-without-learning/">6. Confidence without learning</a><p>Can a prediction become more confident without learning?</p><p>Separate sampling settings from model knowledge</p><small>About 10 minutes <span data-case-status="confidence">Start investigation</span></small></li>
</ol>

## The model is small on purpose

The six guided cases run the same trained, two-layer transformer as the [Model Explorer](/explorer/). It has 4,496 parameters and a 25-token vocabulary learned from a synthetic grammar. Its small size makes experiments quick and every intermediate value inspectable.

The place-detector case introduces tools used in **mechanistic interpretability**: ablation, attention inspection, and controlled input changes. The other cases investigate learning, information flow, experimental controls, conditional sufficiency and sampling confidence. Each conclusion distinguishes what the experiment demonstrates from what it does not establish about larger models.

## Follow a question further

Open the [Model Explorer](/explorer/) to inspect the calculations, [read the guide](/guide/gradient-descent/) for a structured introduction, or [reproduce the forward pass in NumPy](/labs/explorer-forward-pass/). The [architecture comparison](/teardown/compare/) connects this teaching model to larger published designs.

## Keep investigating: Who gets the ball?

Ready for a more open investigation? [Who gets the ball?](/cases/story-circuit/) asks how a model chooses between two names in a story. It uses a second, larger-vocabulary teaching model and lets you investigate a decision across 24 stories. The published case and its experiments remain available alongside the six guided investigations above.
