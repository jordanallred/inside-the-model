---
title: Model Explorer
description: Step through every operation of a small transformer's forward pass and inspect the actual numbers, equations and code.
template: splash
head:
  - tag: style
    content: ":root { --sl-content-width: 76rem; }"
---

A real, tiny decoder-only transformer, run in your browser. Pick a token, a layer and a head, then step through the forward pass from words to next-token probabilities. Every number on this page is computed by the [reference code](/js/itm-model.js), checked against an independent NumPy implementation, and available as a [golden fixture](/trace/golden.json). The trained [weights](/trace/weights.json) are downloadable too.

<div class="widget not-content" data-w="explorer" data-title="Model Explorer"></div>

## What you are looking at

The model has 2 layers, 2 attention heads, a 16-dimensional residual stream and a 25-word vocabulary. It was trained for 4,000 steps on a tiny synthetic grammar (subjects, verbs, objects, places and "then it ..." follow-ups) using the Adam optimizer, so its predictions are grammatical for that toy language, but it knows nothing else. The **Weights** switch runs the identical computation with random weights: the arithmetic is the same, the predictions are not. The training script (`tools/train_model.py`), weights and checksum are all in the project, and every value can be reproduced by hand.

| Choice | This model | A typical production LLM |
| --- | --- | --- |
| Tokenizer | 25 whole words plus `<bos>` | Subwords (BPE), 30k to 200k entries |
| Positions | Fixed sinusoidal, added once | Often rotary (RoPE), applied inside attention |
| Normalization | RMSNorm before each sub-block, no learned scale | Same pattern, with learned scales |
| MLP | GELU, no biases | Often gated (SwiGLU) |
| Output | Weights tied to the embedding | Tied or separate |

To see how this model relates to real ones, read [Compare with the toy model](/teardown/compare/). Read the chapters for the full story: [attention](/guide/attention/), [the transformer block](/guide/transformer-block/) and [tokens and embeddings](/guide/tokens-and-embeddings/).

## Try this

1. Step to **Layer 0: Causal mask** and select the token `sat`. Every key after it is −∞.
2. Move to **Softmax over keys** and switch to **Math**. Check that the weights sum to 1 and that the masked keys contribute exactly 0.
3. On **Scaled dot-product scores**, open the Math view and recompute one score yourself from the displayed q and k.
4. Compare head 0 and head 1 at the same token. Heads are free to attend to different places.
5. At the last step, compare **Trained** and **Random** weights on "the cat sat on the". Only the trained model predicts `mat` or `bed`.
6. Shorten the prompt and compare: earlier tokens' outputs do not change, because a token never reads the tokens after it.

## Test yourself

Predict first, then check. Each answer is computed from the model above.

<div class="widget not-content" data-w="challenges" data-title="Explorer challenges"></div>
