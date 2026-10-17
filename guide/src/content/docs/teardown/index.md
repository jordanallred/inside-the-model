---
title: Model teardowns
description: Two published open-weight models taken apart layer by layer, using their published configurations.
---

The chapters teach each mechanism in isolation. These pages put the mechanisms back together by following one token through two real open-weight models, using the numbers in their configuration files and technical reports. Where a number can be recomputed from the architecture (parameter counts, cache sizes, checkpoint size), the page recomputes it and shows that it matches the published value.

- [gpt-oss-120b](/teardown/gpt-oss-120b/): OpenAI's mixture-of-experts model, with grouped-query attention, alternating local and global layers, and 4-bit expert weights.
- [DeepSeek-V3](/teardown/deepseek-v3/): multi-head latent attention, fine-grained and shared experts, multi-token prediction and FP8 training.

## Side by side

| | gpt-oss-120b | DeepSeek-V3 |
| --- | --- | --- |
| Layers | 36 | 61 (first 3 dense) |
| Model width | 2,880 | 7,168 |
| Attention | grouped-query, 64 query / 8 KV heads, alternating 128-token window and full | multi-head latent, 128 heads, 512-number latent plus 64-number rotary key |
| Experts per layer | 128, top-4 | 256 routed + 1 shared, top-8 |
| Router | softmax over the 4 chosen scores | sigmoid scores, normalized among the 8 chosen, bias-balanced |
| Position | RoPE base 150,000, YaRN ×32 to 131,072 | RoPE on a 64-dimensional part, YaRN ×40 |
| Vocabulary | 201,088 | 129,280 |
| Total / active parameters | 116.8B / 5.1B | 671B / 37B |
| Weight precision | MXFP4 experts, bf16 rest | FP8 |
| KV cache per token (16-bit) | 36.9 KB for the full-attention layers, windowed layers capped at 128 tokens | 70.3 KB |
| Cache for one 131,072-token sequence | 4.8 GB | 9.2 GB |

## How the modern recipe differs from the original transformer

| Piece | Original (2017) | Both models above |
| --- | --- | --- |
| Normalization | LayerNorm after the sublayer | RMSNorm before the sublayer |
| Feed-forward | two-layer MLP with ReLU | gated SwiGLU, split into many experts |
| Position | sinusoidal absolute encodings | rotary (RoPE) with long-context scaling (YaRN) |
| Attention | multi-head | grouped-query or latent; gpt-oss adds local layers and sinks |
| Numbers | fp32 | bf16 plus FP8 or 4-bit weights |
| Training | next-token loss | next-token loss, then supervised tuning, preference learning and reinforcement learning on reasoning |

Two details are worth noticing. The cache per token is not the whole story: gpt-oss has the smaller per-token figure but a hard cap on half its layers, while DeepSeek-V3 caches every layer's latent for every token. And although both are mixtures of experts, they route differently, which is a good reminder to read the exact formulas in each model's code rather than the name of the technique.

To see how these designs relate to the small model in the [Model Explorer](/explorer/), read [Compare with the toy model](/teardown/compare/).
