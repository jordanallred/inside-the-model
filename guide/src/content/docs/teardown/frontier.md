---
title: The newest open models
description: What is reported about the largest recent open-weight releases, and what could not be confirmed.
---

:::caution[Treat the Qwen, GLM and Mistral numbers as unconfirmed]
As of mid-October 2026, sources disagree about which open model is "the latest". The Kimi K3 row was checked against its technical report and model card. The other models are described here only from secondary sources (aggregator pages and summaries of vendor blogs); their technical reports and configuration files were not read for this page. Some of those primary sources exist (GLM-5 has published weights and a model card), and others do not yet (Mistral Large 4's weights are still announced, not released). Read the model cards before quoting anything.
:::

| Model | Reported | Status |
| --- | --- | --- |
| Kimi K3 (Moonshot) | 2.78T parameters, 104.2B active; 93 layers (1 dense); hybrid of Kimi Delta Attention and gated latent attention at 3:1 per block (69 KDA + 24 MLA layers); "Attention Residuals"; Stable LatentMoE with 896 routed experts, 16 active per token, plus 2 shared; 1M-token context; MoE expert weights in MXFP4 through quantization-aware training; released under a custom "Kimi K3 License" | primary: technical report and model card (the license terms were not read, and secondary sources disagree on how they compare with K2's) |
| Qwen 3.8 (Alibaba) | about 2.4T-parameter flagship; a distilled 27B variant under Apache 2.0 | secondary |
| GLM-5.x (Z.ai) | mixture of experts under the MIT license; one report gives 744B total and about 40B active | secondary, inconsistent |
| Mistral Large 4 | sparse mixture of experts, about 1.05T total; weights announced for the end of October | not yet released per sources |

For models whose reports have been read, see the [teardowns](/teardown/gpt-oss-120b/) of gpt-oss-120b and DeepSeek-V3. DeepSeek's later V3.2 release changes one thing in the architecture: it adds a learned sparse attention (a "lightning indexer" that selects the top-k earlier tokens per query), introduced through continued training <cite data-p="deepseekv32" data-s></cite>. Kimi's earlier public work on a hybrid of delta-rule linear attention and latent attention is described in <cite data-p="kimi2025linear" data-s></cite>.

## The idea you can learn now: linear attention layers

Full attention costs $O(n^2)$ in context length and its cache grows with $n$. A linear-attention or state-space layer replaces the cache with a fixed-size matrix state $S$ that is updated token by token, so cost is $O(n)$ and memory is constant. A "delta rule" version first corrects what the memory currently returns for the key, then writes the new value:

$$
S_t=S_{t-1}\bigl(I-\beta_t k_t k_t^{\top}\bigr)+\beta_t v_t k_t^{\top},\qquad o_t=S_t\,q_t
$$

The weakness of pure linear layers is lossy recall of exact details from far back, so recent models are hybrids: mostly linear layers for cheap long context, with an occasional full or latent-attention layer for exact retrieval. [Chapter 13](/guide/sparse-and-linear-attention/) derives this and lets you experiment with it. Kimi K3's technical report confirms this design: its Kimi Delta Attention is the delta rule with a per-channel forget gate, used in three layers out of every four, with a gated latent-attention layer closing each block and one more at the end of the backbone so the final layer attends globally.

## What to do when you meet a model you have not read about

Start with its configuration: layers, width, query and key/value head counts, expert counts and top-k, vocabulary size, position scaling, precision, and which of the mechanisms in the guide it uses. The [teardown pages](/teardown/) show how far those numbers go: from them alone you can recompute a model's parameter count, active parameters, cache size and checkpoint size.
