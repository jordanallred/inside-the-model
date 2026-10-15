---
title: Does lower temperature mean more knowledge?
description: A lower temperature can sharpen next-token probabilities without a training update. Test confidence, ranking and sampling separately.
---

Temperature changes how a model's logits become a sampling distribution. It does not perform a learning update.

For a positive temperature T, divide every logit by T before applying softmax. A smaller T sharpens the distribution; a larger T flattens it. Dividing by the same positive number preserves the ordering of logits, so the top-ranked token remains the same. An individual random sample can still differ.

## Measure the right thing

In [Confidence without learning](/cases/confidence-without-learning/), the input, logits and weights stay fixed. You compare probabilities at two temperatures and check that the weight checksum is unchanged. That experiment isolates an output-distribution change from learning.

A higher probability assigned to a token is not evidence that the token is factually correct. A model can concentrate probability on an incorrect continuation. Whether a sampling setting improves a particular application's measured success rate is a separate empirical question involving its task, test set and sampling procedure.

## Contrast it with a weight change

[What training changes](/cases/what-training-changes/) compares two actual weight sets under the same architecture and target. That can change logits and their ordering. Even then, a lower loss for one specified target does not establish better performance across every task.

Try both cases and write down what changed in each: weights, logits, normalized probabilities, or sampled output. Use [softmax and loss](/guide/softmax-and-loss/) for the calculation and [the local project](/run-locally/) to inspect the same calculation in code.
