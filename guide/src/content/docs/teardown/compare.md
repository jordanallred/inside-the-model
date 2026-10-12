---
title: Compare with the toy model
description: The Model Explorer's tiny transformer set beside Llama 3 8B, gpt-oss-120b and DeepSeek-V3, operation by operation.
head:
  - tag: style
    content: ":root { --sl-content-width: 76rem; }"
---

The [Model Explorer](/explorer/) runs a 2-layer transformer with a 16-number residual stream. Real models do the same job at a scale that is hard to picture. This page lines them up: first by size, then operation by operation, so each step you inspected in the Explorer has a counterpart you can recognize in a model with hundreds of billions of parameters.

<div class="widget not-content" data-w="compare" data-title="Toy model against real models"></div>

## What stays the same

Every model above turns text into token IDs, looks up vectors, repeatedly applies attention and a feed-forward block with residual connections and normalization, and ends by scoring the whole vocabulary. If you understand one layer of the toy model, you understand the skeleton of all of them.

## What changes, and why

- **Position moves into attention.** Fixed sinusoidal positions are added once at the input in the toy model. The real models rotate queries and keys (RoPE) inside every attention layer, which makes attention depend on relative distance and extends to long contexts. See [position and rotary embeddings](/guide/rope/).
- **Fewer key and value heads.** Grouped-query and latent attention shrink the cache of keys and values that generation must store. See [grouped-query and latent attention](/guide/gqa-and-mla/) and [the KV cache](/guide/kv-cache/).
- **Sparse feed-forward blocks.** The two mixture-of-experts models run only a few experts per token, which is why gpt-oss-120b uses 5.1B of its 116.8B parameters for each token. See [mixture of experts](/guide/mixture-of-experts/).
- **Everything is trained far longer.** The toy model took 4,000 small steps on a made-up grammar. The real models are trained on trillions of tokens, then post-trained. See [pretraining](/guide/pretraining/) and [post-training](/guide/post-training/).

For the full layer-by-layer walkthroughs, read the [gpt-oss-120b](/teardown/gpt-oss-120b/) and [DeepSeek-V3](/teardown/deepseek-v3/) teardowns.
