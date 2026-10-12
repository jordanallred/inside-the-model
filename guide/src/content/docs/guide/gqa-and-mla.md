---
title: "Grouped-query and latent attention"
description: "Cutting the cache without cutting quality"
sidebar:
  label: "11. Grouped-query and latent attention"
---

_Cutting the cache without cutting quality_

Chapter 11 of 21 · III. Fast attention and inference · about 35 minutes. Builds on: [8. Position and rotary embeddings](/guide/rope/), [10. Generating text: the KV cache and inference cost](/guide/kv-cache/).

:::tip[Skip this chapter if]
you can state the KV-cache sizes of multi-head, multi-query, grouped-query and latent attention, explain the "absorption" trick that lets latent attention avoid rebuilding keys, and say why latent attention needs a separate rotary key.
:::

## The cache is the bottleneck

[Chapter 10](/guide/kv-cache/) showed that the cache size is 2 × layers × KV heads × head size per token. Standard multi-head attention (MHA) has as many key/value heads as query heads. Reducing that number cuts memory and the bytes streamed each decode step.

## Multi-query and grouped-query attention

**Multi-query attention (MQA)** <cite data-p="shazeer2019" data-s></cite> keeps all query heads but shares a single key head and a single value head across them. The cache shrinks by the number of heads, with some quality loss. **Grouped-query attention (GQA)** <cite data-p="ainslie2023" data-s></cite> interpolates: partition the $h$ query heads into $g$ groups, and give each group one key/value head. $g = h$ is MHA, $g = 1$ is MQA. The paper also shows an existing MHA model can be converted by averaging the heads in each group and then training briefly.

<div class="widget not-content" data-w="gqa" data-title="Query heads sharing key/value heads"></div>

GQA is the default in current dense models: Llama 3 uses 8 key/value heads at all three sizes <cite data-p="grattafiori2024" data-s></cite>, and gpt-oss-120b has 64 query heads sharing 8 key/value heads <cite data-p="openai2025oss" data-s></cite>.

## Multi-head latent attention (MLA)

DeepSeek-V2 <cite data-p="deepseekv2" data-s></cite> took a different route: keep distinct keys and values for every head, but _compress_ them. Each token's hidden state $h$ is projected down to a small **latent vector** $c$, and keys and values are reconstructed from it by up-projection matrices:

$$
\begin{aligned}
c&=W_{DKV}\,h\\
k_C&=W_{UK}\,c,\qquad v_C=W_{UV}\,c\\
q_C&=W_{UQ}\,c_q,\qquad c_q=W_{DQ}\,h
\end{aligned}
$$

Here $c$ has $d_c$ numbers and is what gets cached; $k_C$ and $v_C$ are the content keys and values for all heads, computed from $c$; queries are compressed too.

In DeepSeek-V3, $h$ has 7,168 numbers, $c$ has $d_c = 512$, there are 128 heads with 128-dimensional content keys and values, and queries are compressed to 1,536 <cite data-p="deepseekv3" data-s></cite>. Per token and layer, MLA caches 512 + 64 numbers (the 64 are the rotary key below), against $128\times(192+128)=40{,}960$ for a plain multi-head design with the same head sizes. The DeepSeek-V2 paper tabulates cache elements per token and layer as: MHA $2n_hd_h$, GQA $2n_gd_h$, MQA $2d_h$, and MLA $d_c+d_h^{R}\approx4.5\,d_h$, and reports MLA performing better than MHA in its ablations.

### The absorption trick

Rebuilding every cached key from its latent at every step would waste the saving. But the content part of a score is

$$
q_C\cdot k_C=q_C\cdot\bigl(W_{UK}\,c\bigr)=\bigl(W_{UK}^{\top}q_C\bigr)\cdot c
$$

so $W_{UK}$ can be folded into the query: compute $q' = W_{UK}^{\top}q_C$ once for the new token, and take dot products directly against the cached latents. The same works on the value side: $\sum _{j}a_{j}\cdot (W_{UV}\cdot c_{j}) = W_{UV}\cdot (\sum _{j} a_{j}\cdot c_{j})$, and $W_{UV}$ can then be merged into the output matrix $W_O$. Full-size keys and values never have to be materialized. Verify numerically, then watch what happens when position information enters:

<div class="widget not-content" data-w="mla" data-title="Absorption trick and decoupled RoPE"></div>

### Why a separate rotary key

RoPE ([Chapter 8](/guide/rope/)) rotates the key by an angle that depends on its position $n$. If it is applied to the expanded key, the score becomes $q_C^{\top} \cdot R(n-m) \cdot W_{UK} \cdot c$. The position-dependent matrix $R$ now sits between $q_C$ and $W_{UK}$, so $W_{UK}$ can't be folded into a fixed query; each cached token would need its own folded query, and the savings disappear (the second table in the widget shows the different folded queries). DeepSeek's solution is **decoupled RoPE**: add a small extra query and key, $q_{R}$ = RoPE($W_{QR}c_{q}$) per head and $k_{R}$ = RoPE($W_{KR}h$) shared by all heads, of dimension 64 in V3. The final per-head query and key are the concatenations \[$q_{C}$; $q_{R}$\] and \[$k_{C}$; $k_{R}$\], so a score is the sum of a position-free content term (absorbable) and a position-aware term (cheap, small). Scores are scaled by $1 / \sqrt{128 + 64}$. Only $c$ and $k_{R}$ are cached.

## Comparison

| Design | Cache per token per layer | Used by |
| --- | --- | --- |
| Multi-head | 2 · heads · head dim | original transformer |
| Multi-query | 2 · head dim | fast-decoding models |
| Grouped-query | 2 · groups · head dim | Llama 3, gpt-oss |
| Latent (MLA) | $d_c+d_R$ (512 + 64 in V3) | DeepSeek-V2, V3, V3.2; Kimi Linear's full-attention layers |

For the numbers in context, open the KV-cache calculator in [Chapter 10](/guide/kv-cache/) and switch between the three presets: 128 KiB per token for Llama 3 8B, about 70 KB per token for DeepSeek-V3.

## Check yourself

<details>
<summary>For 32 query heads and 8 KV heads, by what factor does GQA shrink the cache versus MHA?</summary>

4×.

</details>

<details>
<summary>What would break if RoPE were applied directly to the expanded keys in MLA?</summary>

The rotation matrix, which depends on position, would sit between the query and $W_{UK}$, preventing $W_{UK}$ from being absorbed into a single fixed folded query; keys would have to be re-expanded for every cached token at every step.

</details>

<details>
<summary>Which matrices does the MLA absorption trick fold together?</summary>

$W_{UK}$ into the query side ($W_{UK}^{\top}q$) and $W_{UV}$ into the output projection $W_O$.

</details>

:::caution[Security link]
The attention variant changes memory layout and cost, not who is trusted. Its significance is operational: smaller caches allow longer contexts and more concurrent users per GPU, which changes both what attackers can stuff into a prompt and how much per-tenant state your serving stack has to isolate.
:::

## Papers

-   <cite data-p="shazeer2019"></cite> Multi-query attention.
-   <cite data-p="ainslie2023"></cite> Grouped-query attention.
-   <cite data-p="deepseekv2"></cite> MLA: section 2.1 and its appendix on absorption.
-   <cite data-p="deepseekv3"></cite> The V3 dimensions used above.
