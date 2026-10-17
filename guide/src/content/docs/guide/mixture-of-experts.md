---
title: "Mixture of experts"
description: "More parameters, same compute per token"
sidebar:
  label: "14. Mixture of experts"
---

_More parameters, same compute per token_

Chapter 14 of 21 · IV. Scaling the network · about 40 minutes. Builds on: [7. The transformer block](/guide/transformer-block/), [9. The full model and its training loop](/guide/full-model/).

## Conditional computation

In a dense model every token passes through every weight. A **mixture of experts** (MoE) replaces the MLP in each block with many smaller MLPs, the **experts**, plus a small **router** that picks a few experts per token. The idea predates transformers <cite data-p="shazeer2017" data-s></cite>: the parameter count (capacity to store knowledge) grows with the number of experts, while the compute per token grows only with the number selected.

## The computation

For token vector $x$, the router computes a score for each of $E$ experts, keeps the top $k$, and combines the chosen experts' outputs with normalized weights:

$$
\begin{aligned}
s&=W_r\,x\\
\mathcal S&=\operatorname{TopK}(s,k)\\
g_i&=\operatorname{normalize}(s)_i,\quad i\in\mathcal S\\
y&=\sum_{i\in\mathcal S}g_i\,\operatorname{Expert}_i(x)
\end{aligned}
$$

$W_r$ is $E\times d$ and gives one score per expert; $\mathcal S$ holds the indices of the $k$ highest scores; the weights $g_i$ are a softmax over the chosen scores, or renormalized sigmoids.

Each expert is a gated MLP ([Chapter 7](/guide/transformer-block/)). The router is tiny $(d \times E)$. Only the selected experts run, so FLOPs per token are those of $k$ experts, not $E$. Try the toy router and the parameter calculator:

<div class="widget not-content" data-w="router" data-title="Top-k routing (toy scores)"></div>

<div class="widget not-content" data-w="moecalc" data-title="Total vs active parameters"></div>

**Total** parameters determine memory (every expert must be resident somewhere); **active** parameters determine compute and, roughly, per-token latency. gpt-oss-120b has 116.8B total and 5.1B active <cite data-p="openai2025oss" data-s></cite>; DeepSeek-V3 has 671B total and 37B active <cite data-p="deepseekv3" data-s></cite>; Mixtral 8x7B has about 46.7B total and 12.9B active <cite data-p="jiang2024" data-s></cite>. The calculator reproduces these from the architecture alone.

## The load-balancing problem

Left to itself, a router collapses: a few experts get most tokens, they train faster and get chosen more, while the rest wither. Worse, in distributed training an overloaded expert's GPU becomes a straggler. Standard remedies:

### Auxiliary loss

Switch Transformers <cite data-p="fedus2021" data-s></cite> add a penalty that is smallest when tokens are spread evenly. With $N$ experts, let $f_{i}$ be the fraction of tokens sent to expert $i$ and $P_{i}$ the average router probability assigned to $i$:

$$
\mathcal L_{\text{balance}}=\alpha\,N\sum_{i=1}^{N}f_i\,P_i\qquad(\alpha=0.01\text{ in the paper})
$$

This is minimized when both $f$ and $P$ are uniform (each $1 / N$). Switch also uses $k = 1$ for simplicity, and an **expert capacity** = (tokens per batch / $N$) × capacity factor: tokens beyond an expert's capacity are dropped from that layer and pass through only the residual connection.

### Fine-grained and shared experts

DeepSeekMoE <cite data-p="dai2024" data-s></cite> argues for splitting experts into many smaller ones (so each token can combine a more specific mix) and for designating a few **shared experts** that every token always uses, to hold common knowledge so the routed experts can specialize. DeepSeek-V3 uses 256 routed experts of intermediate width 2,048 plus 1 shared expert, 8 routed experts per token, and ordinary dense MLPs in the first 3 layers <cite data-p="deepseekv3" data-s></cite>. For comparison Mixtral has 8 large experts per layer with top-2, and gpt-oss-120b has 128 experts with top-4.

### Auxiliary-loss-free balancing

An auxiliary loss pulls on the main objective and can hurt quality. DeepSeek-V3 follows <cite data-p="wang2024" data-s></cite>: keep a bias $b_{i}$ for each expert. Add it to the router affinity _only when choosing_ which experts to use (the gating weights still use the original affinity), and after each step lower $b_{i}$ by a small $\gamma$ for overloaded experts and raise it for underloaded ones. DeepSeek-V3 uses sigmoid affinities normalized among the selected experts, a tiny sequence-level balance loss $(\alpha = 10^{-4})$ as a safety net, and limits each token to experts on at most 4 nodes to bound communication; it drops no tokens during training or inference <cite data-p="deepseekv3" data-s></cite>.

## Systems consequences

-   **Expert parallelism:** experts are spread across GPUs. Each layer needs an all-to-all exchange: send each token to the GPUs holding its experts, compute, send results back. Network bandwidth becomes a first-order design constraint (hence node-limited routing).
-   **Memory vs compute:** an MoE model is cheap per token yet needs enough memory for all experts, so it favors serving at large batch sizes where each expert sees many tokens.
-   **Open frontier models are overwhelmingly MoE:** for example Kimi K2 <cite data-p="kimik2" data-s></cite> and Qwen3's large models <cite data-p="qwen3" data-s></cite> alongside the models above. Read each report for exact configurations.

## Worked examples

<details>
<summary>A layer has 64 experts and top-2 routing. What fraction of the expert parameters is active per token?</summary>

$2 / 64 = 3.1$% (plus any shared expert and the attention and router, which are always active).

</details>

<details>
<summary>Why is the balance loss N·Σ fᵢPᵢ and not just Σ fᵢ²?</summary>

$f$ is a count (not differentiable); $P$ is a smooth probability. Their product gives a gradient through $P$ while $f$ supplies information about actual load. The factor $N$ makes the minimum value 1 independent of $N$.

</details>

<details>
<summary>Why add the bias b_i only for selection and not to the gate value?</summary>

The bias is a load-balancing control signal; including it in the weights would change the model's output to satisfy balance, distorting the quality objective.

</details>

:::caution[Security link]
Routing makes computation depend on the input. In batched serving with finite expert capacity, tokens from different requests compete for slots; "Buffer Overflow in Mixture of Experts" <cite data-p="hayes2024" data-s></cite> shows an attacker can craft inputs that influence which tokens are dropped for other users in the same batch. That is cross-request interference in a shared resource, a classic isolation failure. Also, which experts fire can differ between benign and unusual inputs, so rare-input behavior is a place to look when red-teaming.
:::

## Papers

-   <cite data-p="shazeer2017"></cite> The sparsely-gated MoE layer.
-   <cite data-p="fedus2021"></cite> Switch Transformers: simple routing and the balancing loss (sections 2.1–2.2).
-   <cite data-p="jiang2024"></cite> Mixtral.
-   <cite data-p="dai2024"></cite> Fine-grained and shared experts.
-   <cite data-p="wang2024"></cite> Auxiliary-loss-free balancing.
-   <cite data-p="deepseekv3"></cite> A complete large-scale MoE recipe.
-   <cite data-p="hayes2024"></cite> An attack specific to MoE serving.
