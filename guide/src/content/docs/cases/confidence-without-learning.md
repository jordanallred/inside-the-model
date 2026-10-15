---
title: "Temperature and probability"
description: Change a model's probabilities without updating a single weight. Separate positive temperature, ranking and sampled output from learning.
---

The same model can look more or less confident without learning anything. Change temperature and compare the probabilities before sampling.

You will keep the input, model weights and logits fixed. The only change is the positive number that divides the logits before softmax.

<div class="widget not-content" data-w="caseconfidence" data-title="Change confidence without training"><p data-widget-fallback>The interactive experiment uses JavaScript. If it does not appear, enable JavaScript or reload. You can also <a href="/guide/attention/">read how attention works</a>.</p></div>

## Probabilities, ranking and samples are different observations

Dividing logits by the same positive number preserves their order. Softmax changes how concentrated their probability distribution is. A sampled token may still differ from one run to another. None of these sampling operations updates a weight.

Read [probability and softmax](/guide/softmax-and-loss/), or [run the comparison locally](/run-locally/) to inspect why a sharper distribution does not establish greater correctness.
