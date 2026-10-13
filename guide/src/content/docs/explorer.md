---
title: Model Explorer
description: Step through every operation of a small transformer's forward pass and inspect the actual numbers, equations and code.
template: splash
head:
  - tag: style
    content: ":root { --sl-content-width: 76rem; }"
---

A real, tiny decoder-only transformer, run in your browser. Type a prompt and see which word it predicts next, then follow any word through the 26 steps of the forward pass that produced that prediction. Every number on this page is computed by the [reference code](/js/itm-model.js). Its attention weights, final hidden states and logits are checked against an independent NumPy implementation to within 1e-9, and the canonical traces are available as a [golden fixture](/trace/golden.json). The trained [weights](/trace/weights.json) are downloadable too.

<div class="widget not-content" data-w="explorer" data-title="Model Explorer"></div>

## What you are looking at

The model has 2 layers, 2 attention heads, a 16-dimensional residual stream and a 25-entry vocabulary (23 words, a period and a start token). It was trained for 4,000 steps on a tiny synthetic grammar (subjects, verbs, objects, places and "then it ..." follow-ups) using the Adam optimizer, so its predictions are grammatical for that toy language, but it knows nothing else. The **Weights** switch (Trained or Untrained) runs the identical computation with random weights: the arithmetic is the same, the predictions are not. The training script (`tools/train_model.py`), weights and checksum are all in the project, and every value can be reproduced independently, by hand or in code with [Lab 10](/labs/explorer-forward-pass/).

| Choice | This model | A typical production LLM |
| --- | --- | --- |
| Tokenizer | 25 entries: 23 whole words, a period and `<bos>` | Subwords (BPE), 30k to 200k entries |
| Positions | Fixed sinusoidal, added once | Often rotary (RoPE), applied inside attention |
| Normalization | RMSNorm before each sub-block, no learned scale | Same pre-norm pattern |
| MLP | GELU, no biases | Often gated (SwiGLU) |
| Output | Weights tied to the embedding | Tied or separate |

To see how this model relates to real ones, read [Compare with the toy model](/teardown/compare/). Read the chapters for the full story: [attention](/guide/attention/), [the transformer block](/guide/transformer-block/) and [tokens and embeddings](/guide/tokens-and-embeddings/).

## Try this

1. Follow `sat` and open step 7, **Hide the future**. Every token after it is blocked.
2. Move to step 8, **Turn scores into attention**, and switch to **Numbers**. Check that the weights sum to 1 and that the blocked tokens get exactly 0.
3. On step 6, **Score every pair**, open **Numbers** and recompute one score yourself from the displayed q and k.
4. Switch between head 0 and head 1 at the same step. Heads are free to attend to different places.
5. Try the example "the cat sat on the" and flip **Weights** between **Trained** and **Untrained**. Only the trained model puts almost all of its probability on `mat` and `bed`.
6. Follow an earlier word to the last step. The model makes a prediction at every position; the Notice tells you whether it guessed the word that actually comes next.
7. Shorten the prompt and compare: earlier tokens' outputs do not change, because a token never reads the tokens after it.

## Test yourself

Predict first, then check. Each answer is computed from the model above.

<div class="widget not-content" data-w="challenges" data-title="Explorer challenges"></div>
