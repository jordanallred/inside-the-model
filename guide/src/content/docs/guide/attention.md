---
title: "Attention"
description: "Queries, keys and values: a soft lookup across positions"
sidebar:
  label: "6. Attention"
---

_Queries, keys and values: a soft lookup across positions_

Chapter 6 of 21 · II. The transformer · about 45 minutes. Builds on: [2. Neural networks and the multilayer perceptron](/guide/neural-networks/), [4. Probability, softmax and next-token prediction](/guide/softmax-and-loss/), [5. Tokens and embeddings](/guide/tokens-and-embeddings/).

:::tip[Skip this chapter if]
you can write the formula $\operatorname{softmax}(QK^{\top} / \sqrt{d})V$ from memory, explain why the $\sqrt{d}$ is there, what a causal mask does, and what multiple heads buy you. Otherwise this is the most important chapter in the guide.
:::

:::note[Inspect the real attention weights]
See the actual scores, mask and softmax weights for the word “sat”, layer 0, head 0. [Open in the Model Explorer](/explorer/#step=7&t=3&l=0&h=0&v=visual).
:::

## The problem attention solves

After embedding, each token has its own vector, computed with no knowledge of its neighbors. But meaning depends on context: in "the bank of the river" and "the bank approved the loan" the first vector for "bank" is identical. We need a mechanism that lets every position gather information from other positions, in a way that is learned and can be computed efficiently.

## A soft dictionary lookup

Think of a dictionary: you present a **query**, it is compared to every stored **key**, and you get back the **value** of the matching entry. A hash table does a hard match. Attention does a _soft_ match: compare the query to all keys, convert the similarities into weights that sum to one, and return the weighted average of all values.

The first form of attention in neural networks was used for translation, letting a decoder look back at all encoder states with learned weights <cite data-p="bahdanau2014" data-s></cite>. The transformer <cite data-p="vaswani2017" data-s></cite> made attention the only mechanism for moving information between positions.

## The computation, step by step

Let $X$ be the matrix of token vectors, one row per token ($n$ tokens, width $d$). Three learned matrices project $X$ into queries, keys and values:

$$
Q=XW_Q,\qquad K=XW_K,\qquad V=XW_V\qquad(\text{each } n\times d_k)
$$

Row $i$ of $Q$ asks "what am I looking for?"; row $j$ of $K$ advertises "what do I contain?"; row $j$ of $V$ is "what I contribute if selected". Then:

$$
\begin{aligned}
S&=\frac{QK^{\top}}{\sqrt{d_k}}\\
A&=\operatorname{softmax}_{\text{row}}(S+\text{mask})\\
O&=AV
\end{aligned}
$$

Here $S_{ij}$ is how well token $j$ matches token $i$'s query, every row of $A$ is non-negative and sums to 1, and $O_i=\sum_j A_{ij}V_j$.

Every output row is a **convex combination** of value rows. The weights $A_{i,:}$ are the "attention pattern" of token $i$. Work through it with numbers you can verify by hand:

<div class="widget not-content" data-w="attnhand" data-title="Attention with every number visible"></div>

This example is small enough to check on paper. A complete model run, with real trained weights, is in the [Model Explorer](/explorer/#step=7&t=3&l=0&h=0&v=visual).

### Why divide by the square root of the key size

Suppose the components of a query $q$ and a key $k$ are independent with mean 0 and variance 1. Then $q\cdot k = \sum q_{m}k_{m}$ is a sum of $d_k$ independent terms, each with variance 1, so $q\cdot k$ has variance $d_k$. Without scaling, the typical score grows like $\sqrt{d_k}$, and when scores are large the softmax saturates: one weight is almost 1, the rest almost 0, and the gradient through softmax nearly vanishes. Dividing by $\sqrt{d_k}$ restores unit variance, so the softmax stays in a useful range <cite data-p="vaswani2017" data-s></cite>.

### The causal mask

When training a model to predict the next token, position $i$ must not see tokens after $i$; otherwise it could just copy the answer. The **causal mask** adds $-\infty$ to $S_{ij}$ for $j > i$, so those weights become exactly 0 after softmax. Because of the mask, one forward pass computes the loss for _every_ position of the sequence at the same time, which is what makes training efficient. Try the masks below; the hatched cells are blocked.

<div class="widget not-content" data-w="attnmask" data-title="What a mask does to real attention scores"></div>

## Multi-head attention

One attention pattern per layer is limiting: a token may need to attend to its subject for grammar, a previous mention for coreference, and a delimiter for structure. **Multi-head attention** runs $h$ independent attentions in parallel, each with its own $W_Q$, $W_K$, $W_V$ and a smaller width $d_k = d / h$, then concatenates the outputs and mixes them with a final matrix:

$$
\begin{aligned}\text{head}_m&=\operatorname{Attention}\bigl(XW_Q^{m},\,XW_K^{m},\,XW_V^{m}\bigr),\quad m=1\dots h\\\operatorname{MultiHead}(X)&=\bigl[\text{head}_1;\dots;\text{head}_h\bigr]\,W_O\end{aligned}
$$

The parameter count is unchanged: $4\cdot d^{2}$ ($W_Q$, $W_K$, $W_V$, $W_O$ each $d \times d$) whatever $h$ is. [Chapter 11](/guide/gqa-and-mla/) shows how modern models share keys and values across heads to shrink the inference cache.

Do heads really learn different jobs? Here are all four heads of the small model from the [Model Explorer](/explorer/), trained on a toy grammar. Pick a prompt and compare the patterns: some heads mostly read themselves or the previous token, some read the start-of-sequence token as a resting place. Switch to random weights to see how much of this structure comes from training.

<div class="widget not-content" data-w="attnreal" data-title="Real attention patterns, every head"></div>

Interpretability work has identified specific head behaviors. A well-studied one is the **induction head** <cite data-p="olsson2022" data-s></cite>: given a sequence "… A B … A", it attends from the second A to the token after the first A and copies B. This simple circuit appears around the time models start to show in-context learning ([Chapter 19](/guide/applications/)).

## Cost

The score matrix $S$ has $n^{2}$ entries. Computing it takes $O(n^{2}\cdot d_k)$ operations and storing it takes $O(n^{2})$ memory per head. For short sequences the MLP dominates; at tens of thousands of tokens attention dominates. Chapters [10](/guide/kv-cache/)–[13](/guide/sparse-and-linear-attention/) are about living with this cost.

## Check yourself

<details>
<summary>Token i's output is a "convex combination" of value rows. What does this say about what attention can do?</summary>

It can only produce vectors inside the convex hull of the (projected) value vectors it can see. It selects and blends; the linear maps $W_V$, $W_O$ and the surrounding MLPs create everything else.

</details>

<details>
<summary>If all scores in a row are equal, what is the output?</summary>

A uniform average of all visible value vectors.

</details>

<details>
<summary>Why does the causal mask allow the loss on all positions in one pass?</summary>

The mask makes the output at position $i$ independent of tokens after $i$, so using the true tokens as inputs at every position does not leak the targets. This is called teacher forcing.

</details>

<details>
<summary>For d = 4096 and h = 32, what is d_k, and how many parameters does the attention block have?</summary>

$d_k = 128$. Parameters $4\cdot 4096^{2} \approx 67.1$ million (with full multi-head attention).

</details>

:::caution[Security link]
Attention has no notion of which tokens are trustworthy. A token from the system prompt and a token from a web page the model just read are both keys and values in the same sequence, and queries attend to whichever match. Any "privilege" difference is something the model learned statistically. That is the architectural root of prompt injection (Chapters [19](/guide/applications/)–[20](/guide/security/)).
:::

## Papers

-   <cite data-p="bahdanau2014"></cite> The original attention mechanism, for translation.
-   <cite data-p="vaswani2017"></cite> The transformer. Read sections 3.1–3.2 first.
-   <cite data-p="olsson2022"></cite> What attention heads learn to do.
-   <cite data-p="prince2023"></cite> Chapter 12 explains transformers with the same notation used here.
