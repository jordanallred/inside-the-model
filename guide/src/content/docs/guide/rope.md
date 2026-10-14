---
title: "Position and rotary embeddings"
description: "Rotating vectors so attention knows who is near whom"
sidebar:
  label: "8. Position and rotary embeddings"
---

_Rotating vectors so attention knows who is near whom_

Chapter 8 of 24 · II. The transformer · about 40 minutes. Builds on: [6. Attention](/guide/attention/).

:::tip[Skip this chapter if]
you can derive why rotating queries and keys by position-dependent angles makes attention scores depend only on relative position, state RoPE's frequency formula, and explain how position interpolation and YaRN extend the context window.
:::

:::note[Inspect how position is added]
See how position is added to a token vector. This toy model uses fixed sinusoidal positions, not RoPE, so compare the two ideas. [Open in the Model Explorer](/explorer/#step=2&t=3&v=math).
:::

## Attention cannot see order

Look back at the formula $O = \operatorname{softmax}(QK^{\top} / \sqrt{d})V$. If you shuffle the rows of $X$, the rows of $Q$, $K$, $V$ shuffle the same way, and the output rows shuffle identically. Attention is **permutation-equivariant**: "dog bites man" and "man bites dog" would produce the same bag of vectors. Position must be injected deliberately.

Approaches, in historical order:

-   **Absolute encodings added to the embedding:** fixed sinusoids at many frequencies <cite data-p="vaswani2017" data-s></cite>, or a learned vector per position. Simple, but the model must learn relations between positions indirectly and does not extend to longer sequences than it saw.
-   **Attention biases:** ALiBi <cite data-p="press2021" data-s></cite> subtracts a penalty proportional to the distance |$i - j$| from each score, with a different slope per head. No extra parameters, and extrapolates better than absolute encodings.
-   **Rotary embeddings (RoPE)** <cite data-p="su2021" data-s></cite>: rotate queries and keys by a position-dependent angle. This is used by Llama, DeepSeek, gpt-oss and most current open models.

## Prerequisite: rotations in the plane

A rotation of the plane by angle $\varphi$ is the matrix

$$
R(\varphi)=\begin{pmatrix}\cos\varphi&-\sin\varphi\\\sin\varphi&\cos\varphi\end{pmatrix}
$$

Facts used below: $R(a)R(b)=R(a+b)$; $R(a)^{\top}=R(-a)$ (the transpose is the inverse); and rotations preserve lengths and dot products, so $\langle Ru,Rv\rangle=\langle u,v\rangle$.

## The RoPE idea

We want a score between a query at position $m$ and a key at position $n$ that depends on the two vectors and on the offset $m - n$, and on nothing else. Split the $d$ components of $q$ and $k$ into $d / 2$ pairs, and treat each pair as a point in the plane. Rotate the pair at position $m$ by angle $m\cdot \theta$:

$$
\tilde q=R(m\theta)\,q,\qquad\tilde k=R(n\theta)\,k
$$

Then the score for that pair is

$$
\begin{aligned}
\bigl\langle R(m\theta)q,\;R(n\theta)k\bigr\rangle&=q^{\top}R(m\theta)^{\top}R(n\theta)\,k\\
&=q^{\top}R(-m\theta)\,R(n\theta)\,k\\
&=q^{\top}R\bigl((n-m)\theta\bigr)\,k
\end{aligned}
$$

It depends only on $n - m$. Nothing about absolute position survives; the model sees relative offset for free. The full score is the sum over all pairs, each pair using its own rotation speed:

$$
\theta_i=\text{base}^{-2i/d},\qquad i=0,1,\dots,\tfrac d2-1
$$

The original paper uses base = 10,000.

Think of $d / 2$ clocks. Pair 0 spins fastest ($\theta = 1$ radian per token) and can tell neighbors apart; the last pair spins very slowly and distinguishes tokens only thousands of positions apart. The **wavelength** of pair $i$ is $\lambda _{i} = 2$π/$\theta _{i}$ tokens per full turn. Position is applied to queries and keys only, never to values, and it is applied afresh in every layer. Check the identity numerically:

<div class="widget not-content" data-w="rope" data-title="Relative position falls out of rotation"></div>

Implementation is cheap: rotating each pair is two multiply-adds with precomputed cosines and sines, so no matrices are materialized.

## Extending the context window

A model trained on sequences up to length $L$ has only ever seen rotation angles up to $L\cdot \theta$. At position beyond $L$ the slow clocks show angles never seen in training, and quality collapses. Several methods adapt a trained RoPE model to a longer window $L' = s\cdot L$ ($s$ = the extension factor).

### Position interpolation

<cite data-p="chen2023pi" data-s></cite> squeeze the new positions into the old range by using $m / s$ in place of $m$. Every angle stays within the trained range, but all clocks are slowed by the same factor, so the fast clocks lose their ability to tell neighbors apart, and a short fine-tune is needed to recover.

### NTK-aware and YaRN

YaRN <cite data-p="peng2023yarn" data-s></cite> treats each frequency according to how many full turns it makes inside the original window, $r = L / \lambda$:

-   Slow clocks ($r < \alpha$, they never completed one turn in training): interpolate fully, divide the frequency by $s$.
-   Fast clocks ($r > \beta$, they turned many times): leave unchanged; they encode local order and were seen at all phases.
-   Between: blend linearly with a ramp $\gamma (r) = (r - \alpha) / (\beta - \alpha)$; the new frequency is $(1 - \gamma)\cdot \theta / s + \gamma \cdot \theta$. The paper finds $\alpha = 1$ and $\beta = 32$ work well for the Llama family.

YaRN also multiplies attention logits by a temperature correction: both $q$ and $k$ are scaled by $\sqrt{1 / t} = 0.1$·ln($s$) + 1, so logits scale by $1 / t$. It is applied inside the rotary tables, so it adds no inference cost. Explore the frequency treatment:

<div class="widget not-content" data-w="ropeext" data-title="Per-frequency treatment: interpolation vs YaRN"></div>

Real examples from published configurations: gpt-oss-120b was extended from a 4,096 window by YaRN with factor 32 to 131,072 tokens <cite data-p="openai2025oss" data-s></cite>, and DeepSeek-V3 used YaRN with factor 40 across two 1,000-step fine-tuning phases to reach 128K <cite data-p="deepseekv3" data-s></cite>. Both multiply to exactly the window the config reports ($4,096 \times 32 = 131,072$; $4,096 \times 40 = 163,840$).

## Long context is not uniformly used

Having a long window is not the same as using it well. <cite data-p="liu2023lost" data-s></cite> found that models retrieve information best from the start and end of a long prompt and worse from the middle.

## Check yourself

<details>
<summary>Prove the identity ⟨R(mθ)q, R(nθ)k⟩ = ⟨q, R((n−m)θ)k⟩.</summary>

$\langle R(m\theta)q,R(n\theta)k\rangle=q^{\top}R(m\theta)^{\top}R(n\theta)k=q^{\top}R(-m\theta)R(n\theta)k=q^{\top}R((n-m)\theta)k$.

</details>

<details>
<summary>With base 10,000 and d = 64, what is the longest wavelength?</summary>

$\theta$ for the last pair ($i=31$) is $10{,}000^{-62/64}\approx1.3\times10^{-4}$, so $\lambda=2\pi/\theta\approx47{,}000$ tokens.

</details>

<details>
<summary>Why does YaRN leave the fastest frequencies unchanged?</summary>

They complete many turns in the original window, so the model has seen every phase of them; compressing them would destroy the fine resolution needed to tell adjacent tokens apart.

</details>

:::caution[Security link]
Safety training and instruction-following are mostly tested at moderate lengths. Stretching the window with interpolation methods yields models whose behavior at 100K+ tokens is less characterized, and long contexts let attackers bury instructions, or fill context with many fake examples ("many-shot" attacks). Treat long-context behavior as a separate test target.
:::

## Papers

-   <cite data-p="su2021"></cite> RoPE.
-   <cite data-p="press2021"></cite> ALiBi, a different route to length extrapolation.
-   <cite data-p="chen2023pi"></cite> Position interpolation.
-   <cite data-p="peng2023yarn"></cite> YaRN: sections 3.1–3.4 contain the formulas.
-   <cite data-p="liu2023lost"></cite> How models actually use long contexts.
