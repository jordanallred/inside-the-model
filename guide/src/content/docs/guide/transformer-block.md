---
title: "The transformer block"
description: "Residual stream, normalization and the gated MLP"
sidebar:
  label: "7. The transformer block"
---

_Residual stream, normalization and the gated MLP_

Chapter 7 of 21 · II. The transformer · about 40 minutes. Builds on: [2. Neural networks and the multilayer perceptron](/guide/neural-networks/), [6. Attention](/guide/attention/).

:::tip[Skip this chapter if]
you can write the pre-norm transformer block from memory, give the formula for RMSNorm and for a SwiGLU MLP, and estimate the parameter count of a dense model from its width, depth and vocabulary.
:::

:::note[Inspect a block's pieces]
See a block's pieces with real numbers, starting at the output projection and first residual add of layer 0. [Open in the Model Explorer](/explorer/#step=9&t=3&l=0&v=visual).
:::

## The block and the residual stream

A transformer is a stack of identical-shaped **blocks**. Each block does two things to the token vectors: first it lets tokens exchange information (attention, [Chapter 6](/guide/attention/)), then it processes each token individually (an MLP, [Chapter 2](/guide/neural-networks/)). Both are wrapped in residual connections and normalization:

$$
\begin{aligned}x&\leftarrow x+\operatorname{Attention}\bigl(\operatorname{Norm}(x)\bigr)\\x&\leftarrow x+\operatorname{MLP}\bigl(\operatorname{Norm}(x)\bigr)\end{aligned}
$$

Because every sublayer _adds_ its output to $x$, there is one vector per token that runs the full height of the network, the **residual stream**. Layers read from it (after normalization) and write back to it. Early layers write simple features, later layers write more abstract ones, and the last layer's stream is turned into logits. This "pre-norm" placement, with the norm inside the residual branch, trains stably at depth: <cite data-p="xiong2020" data-s></cite> show that with the norm placed after the residual (the original arrangement) gradients at initialization are large near the output and need careful warmup, while the pre-norm arrangement is well behaved.

## Normalization

Left alone, activations can drift in scale from layer to layer. **Layer normalization** <cite data-p="ba2016" data-s></cite> normalizes each token's vector across its $d$ components:

$$
\operatorname{LayerNorm}(x)=g\odot\frac{x-\operatorname{mean}(x)}{\sqrt{\operatorname{var}(x)+\varepsilon}}+b
$$

**RMSNorm** <cite data-p="zhang2019rms" data-s></cite> drops the mean subtraction and the bias, keeping only the rescaling:

$$
\operatorname{RMSNorm}(x)=g\odot\frac{x}{\sqrt{\operatorname{mean}(x^2)+\varepsilon}}
$$

It is cheaper and works as well, which is why Llama, DeepSeek and gpt-oss all use it. The gain $g$ has only $d$ parameters per norm, negligible next to the matrices.

<div class="widget not-content" data-w="rmsnorm" data-title="RMSNorm and LayerNorm side by side"></div>

## The MLP, and why it is "gated" now

[Chapter 2](/guide/neural-networks/)'s MLP was $W_{down}\cdot \varphi (W_{up}\cdot x)$ with a hidden width of 4d. Current models use a **gated** variant from <cite data-p="shazeer2020" data-s></cite>. With SiLU as the activation (called **SwiGLU**):

$$
\operatorname{MLP}(x)=W_{\text{down}}\Bigl(\operatorname{SiLU}\bigl(W_{\text{gate}}\,x\bigr)\odot\bigl(W_{\text{up}}\,x\bigr)\Bigr)
$$

There are two parallel up-projections. One passes through the activation and acts as a per-feature "gate" that multiplies the other. Three matrices instead of two means each hidden unit costs 1.5× as much, so the hidden width is reduced (about $8 / 3\cdot d$ instead of 4d) to keep parameter counts comparable: Llama 3 8B uses $d = 4096$ and hidden width 14,336 (3.5d).

What does the MLP do? <cite data-p="geva2020" data-s></cite> argue it acts as a key–value memory: each row of the first matrix is a "key" that fires on a certain pattern in the input, and each column of the second matrix is a "value" written into the residual stream when its key fires. Much of a model's stored factual knowledge appears to sit in these matrices. Mixture-of-experts models ([Chapter 14](/guide/mixture-of-experts/)) split the MLP rather than attention, since it holds most of the parameters and works on each token independently.

## Counting parameters

With model width $d$, $L$ layers, vocabulary $V$ and full multi-head attention:

$$
\begin{aligned}
\text{attention per layer}&\approx4d^2\\
\text{MLP per layer}&\approx3\,d\,d_{ff}\ \text{(gated), or } 2\,d\,d_{ff}\ \text{(classic)}\\
\text{embeddings}&\approx V\,d\\
\text{total}&\approx L\,(\text{attention}+\text{MLP})+\text{embeddings}
\end{aligned}
$$

Attention counts $W_Q, W_K, W_V, W_O$. The embedding term doubles if the output matrix is not tied to the input one.

Use the calculator. Choose a preset and check the result against the published size; then modify the settings.

<div class="widget not-content" data-w="dparams" data-title="Parameter counter for dense transformers"></div>

Two things to notice. First, the MLP holds most of the layer parameters: two thirds in the classic design and about 80% in Llama 3 8B. Second, grouped-query attention ([Chapter 11](/guide/gqa-and-mla/)) reduces the key/value matrices, so real models have fewer than $4d^{2}$ attention parameters per layer.

## Variations you will meet

-   **Clamping and tweaks.** The gpt-oss model card notes its SwiGLU implementation is unconventional (it clamps values and includes a residual connection) <cite data-p="openai2025oss" data-s></cite>. Reading the exact formula in model code, not just the name, matters when you reproduce or analyze a model.
-   **Normalization of queries and keys** and other stability tricks are common in recent models.
-   **Final norm.** After the last block, one more normalization is applied before the output matrix.

## Check yourself

<details>
<summary>What is the gradient path from the loss back to layer 1 in a pre-norm residual stack?</summary>

The identity path through all residual additions, plus paths through each sublayer. The identity path gives a gradient that does not shrink with depth.

</details>

<details>
<summary>Why does RMSNorm have no bias term, and what does it lose compared with LayerNorm?</summary>

It only rescales; it does not recenter. Empirically the recentering contributes little, and skipping it saves computation.

</details>

<details>
<summary>Estimate parameters: L = 32, d = 4096, d_ff = 14336 (gated), 8 KV heads of 128, 32 query heads, V = 128,256, untied.</summary>

Attention per layer: $4096\cdot4096$ ($Q$) $+\,2\cdot4096\cdot1024$ ($K$, $V$) $+\,4096\cdot4096$ ($O$) $=41.9$M. MLP: $3\cdot4096\cdot14336=176.2$M. Per layer $218.1\text{M}\times32=6.98$B. Embeddings $2\times525.3\text{M}=1.05$B. Total $\approx8.03$B.

</details>

:::caution[Security link]
Every token of every user flows through the same weights, and nothing in the block distinguishes trusted from untrusted input. Also, a few components of the residual stream can have extremely large values ("outlier features") that make low-precision quantization hard ([Chapter 15](/guide/low-precision/)); a quantized copy can therefore behave measurably differently from the full-precision model you evaluated.
:::

## Papers

-   <cite data-p="vaswani2017"></cite> Section 3 for the original block.
-   <cite data-p="ba2016"></cite> Layer normalization.
-   <cite data-p="zhang2019rms"></cite> RMSNorm.
-   <cite data-p="xiong2020"></cite> Why pre-norm trains more easily than post-norm.
-   <cite data-p="shazeer2020"></cite> Gated MLPs; a short paper that is worth reading in full.
-   <cite data-p="geva2020"></cite> MLPs as key–value memories.
-   <cite data-p="grattafiori2024"></cite> Table 3 lists the exact dimensions of Llama 3 8B, 70B and 405B used above.
