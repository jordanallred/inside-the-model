---
title: The newest open models
description: What is reported about the largest recent open-weight releases, and what could not be confirmed.
---

:::caution[Treat every number here as unconfirmed]
As of mid-October 2026, sources disagree about which open model is "the latest". The models below are described only in secondary sources (aggregator pages and summaries of vendor blogs). Their primary technical reports and configuration files were not available when this page was written. Read the model cards before quoting anything.
:::

| Model | Reported | Status |
| --- | --- | --- |
| Kimi K3 (Moonshot) | about 2.8T parameters, mixture of experts; "Kimi Delta Attention" mixed with gated MLA layers (one summary: 69 and 24 layers); "Attention Residuals"; "LatentMoE" routing (one summary: 16 of 896 experts); 1M-token context; native MXFP4 weights; a license that is not a standard permissive one | secondary sources, partly conflicting |
| Qwen 3.8 (Alibaba) | about 2.4T-parameter flagship; a distilled 27B variant under Apache 2.0 | secondary |
| GLM-5.x (Z.ai) | mixture of experts under the MIT license; one report gives 744B total and about 40B active | secondary, inconsistent |
| Mistral Large 4 | sparse mixture of experts, about 1.05T total; weights announced for the end of October | not yet released per sources |

For models whose reports have been read, see the [teardowns](/teardown/gpt-oss-120b/) of gpt-oss-120b and DeepSeek-V3. DeepSeek's later V3.2 release changes one thing in the architecture: it adds a learned sparse attention (a "lightning indexer" that selects the top-k earlier tokens per query), introduced through continued training <cite data-p="deepseekv32" data-s></cite>. Kimi's earlier public work on a hybrid of delta-rule linear attention and latent attention is described in <cite data-p="kimi2025linear" data-s></cite>.

## The idea you can learn now: linear attention layers

Full attention costs $O(n^2)$ in context length and its cache grows with $n$. A linear-attention or state-space layer replaces the cache with a fixed-size matrix state $S$ that is updated token by token, so cost is $O(n)$ and memory is constant. A "delta rule" version first corrects what the memory currently returns for the key, then writes the new value:

$$
S_t=S_{t-1}\bigl(I-\beta_t k_t k_t^{\top}\bigr)+\beta_t v_t k_t^{\top},\qquad o_t=S_t\,q_t
$$

The weakness of pure linear layers is lossy recall of exact details from far back, so recent models are hybrids: mostly linear layers for cheap long context, with an occasional full or latent-attention layer for exact retrieval. [Chapter 13](/guide/sparse-and-linear-attention/) derives this and lets you experiment with it. The Kimi names above appear to refer to this idea, but the exact K3 design could not be confirmed.

## What to do when you meet a model you have not read about

Start with its configuration: layers, width, query and key/value head counts, expert counts and top-k, vocabulary size, position scaling, precision, and which of the mechanisms in the guide it uses. The [teardown pages](/teardown/) show how far those numbers go: from them alone you can recompute a model's parameter count, active parameters, cache size and checkpoint size.
