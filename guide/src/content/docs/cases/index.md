---
title: Experiments
description: Explore attention, training, causal masking and sampling through editable computations on a small transformer.
---

Change an input or setting, compare the measured outputs, and inspect the explanation. Every experiment runs locally in your browser using the same trained model as the [Model Explorer](/explorer/).

<ul class="case-list">
<li><a href="/cases/place-or-animal/">Attention and head ablation</a><p>Which head outputs affect the place prediction?</p></li>
<li><a href="/cases/what-training-changes/">Trained and random weights</a><p>Same model. Different weights. Different answer?</p></li>
<li><a href="/cases/hidden-future/">Causal masking</a><p>Can an earlier token read words that come later?</p></li>
<li><a href="/cases/choose-the-control/">Controlled prompt comparisons</a><p>Which experiment could distinguish two explanations?</p></li>
<li><a href="/cases/necessary-and-sufficient/">Component removal and retention</a><p>What does removing a component actually establish?</p></li>
<li><a href="/cases/confidence-without-learning/">Temperature and probability</a><p>Can a prediction become more confident without learning?</p></li>
</ul>

## A name-selection circuit

[Trace how a model selects a name](/cases/story-circuit/) across 24 short stories. This experiment uses a second teaching model with a larger vocabulary. Compare head-output interventions with attention patterns and inspect where the explanation remains incomplete.

## Scope

The six experiments above use a 4,496-parameter transformer with a 25-token synthetic vocabulary. Results describe this model under the specified inputs and interventions. They do not establish how a production assistant reaches an answer. See [methods and limitations](/methods/).

Use the [reference code](/run-locally/) to inspect the computation locally, or [compare the architecture with larger models](/teardown/compare/).
