---
title: "FlashAttention"
description: "Exact attention without the n×n matrix"
sidebar:
  label: "12. FlashAttention"
---

_Exact attention without the $n\times n$ matrix_

Chapter 12 of 21 · III. Fast attention and inference · about 30 minutes. Builds on: [6. Attention](/guide/attention/), [10. Generating text: the KV cache and inference cost](/guide/kv-cache/).

## Attention is bottlenecked by memory, not math

A GPU has a small amount of very fast on-chip memory (SRAM) and a large amount of slower memory (HBM, the "GPU memory" in the spec sheet). Moving data between them costs far more time than the arithmetic done on it. The textbook implementation of attention does this:

1.  Compute $S=QK^{\top}/\sqrt{d}$ ($n\times n$) and write it to HBM.
2.  Read $S$, compute softmax $P$ ($n\times n$), write $P$ to HBM.
3.  Read $P$ and $V$, compute $O=PV$, write $O$.

For $n = 32,000$ tokens, $S$ has a billion entries per head. Writing and reading these matrices dominates the runtime, and storing them dominates memory. FlashAttention <cite data-p="dao2022" data-s></cite> computes exactly the same result but never writes $S$ or $P$ to HBM.

## Tiling, and the softmax obstacle

Split $Q$ into row blocks and $K$, $V$ into column blocks small enough to fit in SRAM. For each $Q$ block, loop over the $K / V$ blocks, computing partial scores on chip and accumulating into the output. The obstacle: softmax normalizes over a whole row, but the loop only sees one block of the row at a time. The way around it is the **online softmax** <cite data-p="milakov2018" data-s></cite>.

### Online softmax, derived

For one query row, scores $s_1,\dots,s_n$ and values $v_1,\dots,v_n$, the exact output is $\sum_j e^{s_j}v_j\big/\sum_j e^{s_j}$. For numerical safety one subtracts the row maximum $m$. Process the row in blocks and maintain three running quantities for the blocks seen so far: the max $m$, the denominator $l=\sum_j e^{s_j-m}$, and the unnormalized output $o=\sum_j e^{s_j-m}v_j$. When a new block arrives with maximum $m_b$, set $m'=\max(m,m_b)$. The old terms were computed against the old max, so rescale them by $e^{m-m'}$:

$$
\begin{aligned}m'&=\max(m,\;m_b)\\l'&=e^{m-m'}\,l+\sum_{j\in\text{block}}e^{s_j-m'}\\o'&=e^{m-m'}\,o+\sum_{j\in\text{block}}e^{s_j-m'}\,v_j\\\text{output}&=o\,/\,l\end{aligned}
$$

Each update leaves ($l$, $o$) equal to what you would have computed with the new max over everything seen, so after the last block the result is exactly softmax-weighted attention. See it:

<div class="widget not-content" data-w="onlinesoftmax" data-title="Streaming softmax equals full softmax"></div>

## What FlashAttention gains

-   **Memory:** $O(n)$ instead of $O(n^{2})$, because the score matrix is never stored. That is what made 100K-token contexts practical to train.
-   **Speed:** far fewer HBM reads and writes. The arithmetic count is unchanged (still $O(n^{2}\cdot d)$), but time falls because memory traffic dominated.
-   **Backward pass:** instead of saving the $n\times n$ probabilities, store only each row's log-sum-exp (a vector of $n$ numbers) and recompute the scores block by block during backpropagation. This trades extra arithmetic, which is cheap on GPUs, for memory traffic, which is not.
-   **Exactness:** it is not an approximation. Outputs match standard attention up to floating-point rounding.

FlashAttention-2 <cite data-p="dao2023" data-s></cite> reorganized the loops and work partitioning across thread blocks and warps and reduced non-matrix-multiply work, giving roughly a further 2× speed-up on the same hardware.

## Why you should know this even if you never write a kernel

Attention kernels are the reason sequence length is a software choice rather than a hard wall, they appear in every training and inference framework, and their numerical behavior (the order in which sums are accumulated, low-precision accumulation) is one source of tiny output differences between hardware and software versions.

## Worked examples

<details>
<summary>Why can FlashAttention be faster even though it does the same number of FLOPs?</summary>

Runtime is dominated by reading and writing the $n\times n$ matrices to slow memory; keeping blocks in on-chip memory removes most of that traffic.

</details>

<details>
<summary>In the online update, what happens to m, l and o when a new block does not contain a larger score than the current max?</summary>

$m' = m$, so the rescale factor $e^{m-m'}=1$; the new block's terms are simply added to $l$ and $o$.

</details>

<details>
<summary>Why store a log-sum-exp per row rather than the probability matrix for the backward pass?</summary>

With log-sum-exp the probabilities can be recomputed from the scores, which are themselves recomputed from $Q$ and $K$ blocks; storing only $n$ numbers per head avoids $n^{2}$ memory.

</details>

:::caution[Security link]
Little directly, but two practical points: results differ slightly between kernels and hardware, so reproducing a red-team finding can require the same serving stack; and efficient kernels are what let an attacker's very long prompt be processed at all.
:::

## Papers

-   <cite data-p="milakov2018"></cite> The online softmax normalizer; short and readable.
-   <cite data-p="dao2022"></cite> FlashAttention.
-   <cite data-p="dao2023"></cite> FlashAttention-2.
