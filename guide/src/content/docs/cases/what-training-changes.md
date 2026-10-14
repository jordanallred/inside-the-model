---
title: "Case 2: What training changes"
description: Keep the model and prompt fixed, swap trained and untrained weights, and measure the difference in probability and loss.
---

The same architecture can produce very different predictions. What changes when a model learns?

In this investigation you will compare two sets of weights in the same two-layer transformer. Your target is **mat** after **the cat sat on the**. Predict which weights favor it, run the comparison, and use the evidence to predict a second example.

**About 8 minutes.** No installation, GPU, or prior maths required. Loss is explained beside the measurement.

<div class="widget not-content" data-w="casetraining" data-title="Investigate what training changes"></div>

## What this experiment can tell you

Both runs use the same 4,496-parameter architecture and vocabulary. The trained weights learned from a small synthetic grammar; the untrained weights come from a fixed random seed. The comparison measures probabilities directly, without sampling a word.

Lower loss on these examples shows that these trained weights better predict these targets. It does not show the path training took, nor that the model is better on every possible prompt. To follow actual gradient updates, open the training microscope in [the full-model chapter](/guide/full-model/).
