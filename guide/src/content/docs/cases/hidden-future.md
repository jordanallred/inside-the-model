---
title: "Case 3: The hidden future"
description: Change a later word and test whether an earlier token can use it. Inspect the measured probabilities and masked attention.
---

The complete sentence is available to the computer. Does that mean every token in the model can read all of it?

Compare **the cat sat on the mat** with **the cat sat on the bed**. You will measure the next-token prediction at the earlier word **sat**, rather than at the end of either sentence.

**About 8 minutes.** Change one part of the input, predict the effect, and inspect where information can flow.

<div class="widget not-content" data-w="casefuture" data-title="Investigate the hidden future"><p data-widget-fallback>The interactive experiment uses JavaScript. If it does not appear, enable JavaScript or reload. You can also <a href="/guide/attention/">read how attention works</a>.</p></div>

## What this experiment can tell you

The model computes a next-token distribution at every input position. A causal mask prevents each position from attending to later positions in every layer. Here you test that restriction using two inputs with identical prefixes and positions, and different suffixes.

This restriction applies during the forward pass. It does not mean later words were absent from training data, or that changing an earlier word cannot affect predictions later in the sentence. Read [the attention chapter](/guide/attention/) for the equations, or [write masked attention yourself](/labs/attention-from-scratch/).
