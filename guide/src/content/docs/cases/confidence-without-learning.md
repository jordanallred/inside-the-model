---
title: "Case 6: Confidence without learning"
description: Change a model's probabilities without updating a single weight. Separate positive temperature, ranking and sampled output from learning.
---

The same model can look more or less confident without learning anything. Change temperature and compare the probabilities before sampling.

You will keep the input, model weights and logits fixed. The only change is the positive number that divides the logits before softmax.

**About 10 minutes.** Connects model internals to a setting developers use in generation APIs.

<div class="widget not-content" data-w="caseconfidence" data-title="Change confidence without training"></div>

## Probabilities, ranking and samples are different observations

Dividing logits by the same positive number preserves their order. Softmax changes how concentrated their probability distribution is. A sampled token may still differ from one run to another. None of these sampling operations updates a weight.

Read [probability and softmax](/guide/softmax-and-loss/), or use your [evidence notebook](/notebook/?case=confidence) to explain why a sharper distribution does not establish greater correctness.
