---
title: "Case 5: Necessary—and sufficient?"
description: Compare removing a head with retaining only that head among the attention heads. Learn to state exactly what an intervention establishes.
---

Removing a component can break a behavior. Does that mean the component can produce the behavior by itself?

Test both directions on **the cat sat on the**. Remove the candidate head, then retain it while removing the other three head outputs. The embeddings, MLPs, normalization, residual paths and output layer remain in both tests.

**Self-paced.** This investigation follows [The place detector](/cases/place-or-animal/) and makes the limits of a causal claim explicit.

<div class="widget not-content" data-w="casesufficiency" data-title="Test necessity and conditional sufficiency"><p data-widget-fallback>The interactive experiment uses JavaScript. If it does not appear, enable JavaScript or reload. You can also <a href="/guide/attention/">read how attention works</a>.</p></div>

## State the intervention, context and threshold

“Sufficient” needs a precise context. Here the question is whether a place preference stays above 50% with the other attention-head outputs set to zero for a particular input. It does not mean the head is an independent language model. Compare [causal interventions](/guide/intervening/) and record the limits in your [notebook](/notebook/?case=sufficiency).
