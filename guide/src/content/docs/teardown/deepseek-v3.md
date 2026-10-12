---
title: "Teardown: DeepSeek-V3"
description: "One token through DeepSeek-V3, layer by layer: latent attention, fine-grained experts, multi-token prediction and FP8 training."
sidebar:
  label: "DeepSeek-V3"
---

_A 671B-parameter mixture-of-experts model that activates 37B per token, and the source of ideas many later open models reuse._

This page follows one token through the network using the numbers in the model's `config.json` and the technical report <cite data-p="deepseekv3" data-s></cite>, with the attention mechanism from the DeepSeek-V2 paper <cite data-p="deepseekv2" data-s></cite>. Each step links to the chapter that explains the mechanism from first principles.

## At a glance

| Item | Value |
| --- | --- |
| Layers | 61 (the first 3 use a dense MLP, the other 58 use experts) |
| Model width $d$ | 7,168 |
| Attention | multi-head latent attention: 128 heads, content key/value size 128, rotary size 64, query latent 1,536, key/value latent 512 |
| Feed-forward | 1 shared expert and 256 routed experts per layer, 8 routed experts per token, expert hidden width 2,048 |
| Position | RoPE with YaRN factor 40 on a 4,096 pretraining window; 128K context in the report |
| Vocabulary | 129,280 tokens (byte-level BPE), input and output embeddings untied |
| Parameters | 671B total, 37B active per token |
| Training | 14.8T tokens, 2.788M H800 GPU-hours, mostly FP8 matrix multiplications |
| Extra objective | multi-token prediction, depth 1 |

## 1. Text becomes token ids

A byte-level BPE vocabulary of 129,280 entries, built on a corpus the report describes as 14.8T tokens with more math and code than DeepSeek-V2 ([chapter 5](/guide/tokens-and-embeddings/)). The report does not list the data sources or their proportions.

## 2. Each id becomes a vector

The embedding table has shape $[129{,}280,\ 7{,}168]$, which is 926.7M parameters, and the output matrix is a separate matrix of the same size.

## 3. One layer

Each layer is a pre-norm block with RMSNorm ([chapter 7](/guide/transformer-block/)). In the first three layers the second sublayer is an ordinary gated MLP with hidden width 18,432 (396.4M parameters); in the other 58 layers it is the mixture of experts.

## 4. Multi-head latent attention

Chapter 11 derives this in full; here are the real dimensions. Each token's hidden state $h$ (7,168 numbers) is compressed to a **latent** $c$ of 512 numbers, and the keys and values of all 128 heads are rebuilt from it:

$$
\begin{aligned}
c&=W_{DKV}\,h\\
k_C&=W_{UK}\,c,\qquad v_C=W_{UV}\,c\\
c_q&=W_{DQ}\,h,\qquad q_C=W_{UQ}\,c_q
\end{aligned}
$$

A separate rotary key $k_R=\operatorname{RoPE}(W_{KR}\,h)$ of size 64 carries position, shared by all heads, and each head's query and key are the concatenations $[q_C;q_R]$ and $[k_C;k_R]$ with scores scaled by $1/\sqrt{128+64}$. Only $c$ and $k_R$ are cached, which is $512+64=576$ numbers per token per layer.

| Matrix | Shape | Parameters |
| --- | --- | --- |
| $W_{DQ}$ | $7168\to1536$ | 11.0M |
| $W_{UQ}$ | $1536\to128\times(128+64)$ | 37.7M |
| $W_{DKV}$ and $W_{KR}$ | $7168\to512+64$ | 4.1M |
| $W_{UK}$ and $W_{UV}$ | $512\to128\times(128+128)$ | 16.8M |
| $W_O$ | $128\times128\to7168$ | 117.4M |
| Attention total per layer | | 187.1M |

At inference the key up-projection folds into the query, so full-size keys are never built; the separate rotary key exists so that this folding stays possible. Verify both claims numerically:

<div class="widget not-content" data-w="mla" data-title="Absorption trick and decoupled RoPE"></div>

## 5. Position

RoPE is applied only to the 64-dimensional rotary parts of the queries and keys (the content parts carry no position). Pretraining used 4,096-token sequences. The context was then extended in two phases of 1,000 steps each, with YaRN at factor 40, first to 32K and then to 128K <cite data-p="peng2023yarn" data-s></cite>. The configuration records $4096\times40=163{,}840$ positions ([chapter 8](/guide/rope/)).

## 6. Mixture of experts with fine-grained and shared experts

In the 58 expert layers, a router maps 7,168 numbers to 256 scores. Unlike gpt-oss, scores go through a sigmoid and the top 8 are normalized among themselves ([chapter 14](/guide/mixture-of-experts/)). One **shared expert** always runs, holding common knowledge so the 256 routed experts can specialize <cite data-p="dai2024" data-s></cite>.

Load balancing uses no auxiliary loss on the main objective. A bias $b_i$ is added to each expert's score only when choosing which experts to use, and after each step it is lowered for overloaded experts and raised for underloaded ones <cite data-p="wang2024" data-s></cite>. A very small sequence-level balance loss ($\alpha=10^{-4}$) is kept as a safety net, each token may use experts on at most 4 nodes to bound communication, and the report states no tokens are dropped in training or inference.

Each expert is a gated MLP:

$$
\text{expert}(x)=W_{\text{down}}\Bigl(\operatorname{SiLU}(W_{\text{gate}}\,x)\odot(W_{\text{up}}\,x)\Bigr)
$$

Each expert has $3\times7168\times2048=44.0$M parameters.

With 257 experts per layer (256 routed plus 1 shared) that is 11.3B parameters per layer, 656.5B in total across 58 layers. Per token only 8 routed experts plus the shared one run, which is 23.0B parameters of expert compute.

<div class="widget not-content" data-w="router" data-title="Top-k routing (toy scores)"></div>

## 7. Multi-token prediction

Training adds one extra module that predicts the token after the next one, sharing the embedding and output matrices with the main model and combining the previous hidden state with the embedding of the future token. Its loss is weighted 0.3 for the first 10T tokens and 0.1 afterwards. The module can be dropped at inference or reused as a draft for speculative decoding ([chapters 9 and 10](/guide/kv-cache/)) <cite data-p="gloeckle2024" data-s></cite>.

## 8. Counting the parameters

<div class="widget not-content" data-w="moecalc" data-preset="ds" data-title="Total and active parameters"></div>

The architecture alone reproduces the published sizes: 671.03B total against the reported 671B, and 36.62B active against 37B. Of the total, 656.5B (98%) sit in experts and 11.4B in attention. The active total is 11.4B for attention, 23.0B for experts, 1.2B for the dense layers, plus the router and output matrix.

## 9. Memory while generating

<div class="widget not-content" data-w="kvcalc" data-preset="ds" data-title="KV cache size at different context lengths"></div>

At 70.3 KB per token, one 131,072-token sequence needs 9.2 GB of cache, against 655 GB if the same 128 heads cached full keys and values, a 71× saving ([chapter 10](/guide/kv-cache/)).

## 10. FP8 training

Most matrix multiplications run in FP8 (E4M3) with activations scaled in $1\times128$ tiles and weights in $128\times128$ blocks, partial sums promoted to FP32 every 128 elements, and master weights and optimizer state kept in higher precision. Embeddings, the output head, the router, normalization and attention stay in higher precision. The report's ablations show relative loss error versus bf16 below 0.25% ([chapter 15](/guide/low-precision/)).

## 11. What the report does and does not disclose

| Disclosed | Not disclosed |
| --- | --- |
| Architecture and every dimension; the training recipe (optimizer settings, FP8 scheme, balancing, context extension); token count; GPU-hours | Data sources, domain and language proportions, filtering and deduplication methods, post-training data |

The weights can be inspected and run, but without the data the model can be studied for what it does, not for what it was taught from ([chapter 16](/guide/pretraining/)).

## 12. Where to look when testing it

- **Routing:** expert choice depends on the input; rare or unusual inputs may reach less-trained experts ([chapter 14](/guide/mixture-of-experts/)).
- **Serving:** the latent cache still encodes every prompt; isolate it per tenant ([chapter 10](/guide/kv-cache/)).
- **Precision:** FP8 weights are the released artifact; verify by hash and test that artifact ([chapter 15](/guide/low-precision/)).
- **Supply chain:** weights, tokenizer and the custom model code that open models ship with are all executable or influential artifacts ([chapter 20](/guide/security/)).

## Sources

- [DeepSeek-V3 technical report](https://arxiv.org/abs/2412.19437) (architecture, MoE, MTP, FP8, training).
- [DeepSeek-V2 paper](https://arxiv.org/abs/2405.04434) (multi-head latent attention).
- The model's `config.json` on Hugging Face (`deepseek-ai/DeepSeek-V3`) for layers, widths, heads, experts, latent sizes and YaRN settings.
