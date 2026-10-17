---
title: "Generating text: the KV cache and inference cost"
description: "Why decoding is memory-bound and what the cache costs"
sidebar:
  label: "10. Generating text: the KV cache and inference cost"
---

_Why decoding is memory-bound and what the cache costs_

Chapter 10 of 21 · III. Fast attention and inference · about 35 minutes. Builds on: [9. The full model and its training loop](/guide/full-model/).

:::note[Inspect the causal mask]
See the causal mask that makes caching keys and values safe: earlier tokens never depend on later ones. [Open in the Model Explorer](/explorer/#step=6&t=3&l=0&h=0&v=visual).
:::

## Generation is a loop

To produce text, the model runs repeatedly: feed the tokens so far, take the distribution at the last position, sample a token ([Chapter 4](/guide/softmax-and-loss/)), append it, and repeat. A naive implementation reruns the whole network over the entire sequence for every new token, so generating $n$ tokens costs $O(n^{2})$ forward work.

## The KV cache

Look at what attention needs for the newest token $t$: its query $q_{t}$ and the keys and values of every earlier token. Earlier tokens' keys and values do not change when new tokens arrive (the causal mask means they never see the future). So compute $K$ and $V$ for each token once, store them, and at each step compute only the new token's $q$, $k$, $v$:

$$
\begin{aligned}
&\text{compute } q_t,\,k_t,\,v_t \text{ from the new token only}\\
&\text{append } k_t,\,v_t \text{ to the cache}\\
&o_t=\operatorname{softmax}\!\Bigl(\frac{q_t\,K_{\text{cache}}^{\top}}{\sqrt d}\Bigr)\,V_{\text{cache}}
\end{aligned}
$$

This is the **KV cache**. It makes each step cost $O(t)$ instead of $O(t^{2})$, and it turns generation into two phases:

-   **Prefill:** process the whole prompt in one parallel pass (like training, but forward only) and fill the cache. This is compute-bound: large matrix–matrix products keep the hardware busy.
-   **Decode:** one token per step. Each step multiplies a single vector by every weight matrix. The hardware must read all the weights from memory to do very little arithmetic on them, so decoding is **memory-bandwidth-bound**.

## How big is the cache?

Per token, per layer, the cache holds one key vector and one value vector for each key/value head:

$$
\text{bytes per token}=2\cdot L\cdot n_{kv}\cdot d_{\text{head}}\cdot b
$$

Here the 2 is for keys and values, $L$ is the number of layers, $n_{kv}$ the number of key/value heads, $d_{\text{head}}$ the head size and $b$ the bytes per number.

~~~text
Llama 3 8B:  2 × 32 × 8 × 128 × 2 bytes = 131,072 bytes = 128 KiB per token
at 128,000 tokens ≈ 16.8 GB for one sequence (more than the 16 GB of weights)
~~~

The cache grows linearly with context and with the number of concurrent users, and it often decides how many requests a GPU can serve. Explore the sizes for three different attention designs (Chapters [11](/guide/gqa-and-mla/) and [13](/guide/sparse-and-linear-attention/) explain how they save memory):

<div class="widget not-content" data-w="kvcalc" data-title="KV cache size by model and context length"></div>

## Why decoding is slow: a simple speed model

At every decoding step the GPU must stream all the active weights and every sequence's cache from memory. If memory bandwidth is BW, a step cannot be faster than (weight bytes + cache bytes) / BW. Arithmetic is small by comparison (2 FLOPs per parameter per sequence). Two consequences:

-   **Batching is nearly free until compute binds.** Weights are read once per step no matter how many sequences share the step, so serving 64 users at once multiplies throughput by close to 64 while each user's speed barely changes, as long as the per-sequence caches stay small next to the weights.
-   **Smaller numbers are faster.** Quantizing weights from 16 to 4 bits ([Chapter 15](/guide/low-precision/)) cuts the bytes streamed, and so raises decode speed, almost proportionally.

<div class="widget not-content" data-w="roofline" data-title="Decode speed: memory-bound or compute-bound?"></div>

## Serving systems

-   **Continuous batching:** requests join and leave the running batch at every step instead of waiting for a whole batch to finish.
-   **PagedAttention** <cite data-p="kwon2023" data-s></cite>: reserving one contiguous region per sequence wastes memory because final length is unknown. vLLM stores the cache in fixed-size blocks, like pages in virtual memory, mapped through a table. This cuts waste and lets sequences with a common prefix (for example the same system prompt) share blocks.

## Speculative decoding

If decoding is memory-bound, checking several tokens costs about the same as generating one. <cite data-p="leviathan2022" data-s></cite> exploit this: a small, fast _draft_ model proposes $\gamma$ tokens; the large _target_ model scores all $\gamma$ positions in a single forward pass; and tokens are accepted left to right with a probability test. With draft probability $q(x)$ and target probability $p(x)$ for the proposed token $x$, accept with probability $\min(1, p(x) / q(x))$. At the first rejection, resample from the normalized residual distribution $\max(0, p - q)$. The accept/reject rule is constructed so the final tokens are distributed **exactly** as if sampled from the target alone. The speed-up depends on how often the draft agrees. Multi-token-prediction heads ([Chapter 9](/guide/full-model/)) can serve as a built-in draft.

## Worked examples

<details>
<summary>Compute the KV cache per token for a model with 61 layers using a 576-number latent per layer (16-bit).</summary>

$61\times576\times2$ bytes $=70{,}272$ bytes $\approx70$ KB per token. (This is DeepSeek-V3's latent attention; [Chapter 11](/guide/gqa-and-mla/).)

</details>

<details>
<summary>Why does batching raise throughput but not per-user speed?</summary>

In the memory-bound regime the step time is set by streaming weights, which is shared across the batch, so more sequences per step means more tokens per second overall with nearly the same step time.

</details>

<details>
<summary>If the draft model always agrees with the target, how many target passes does it take to produce γ+1 tokens?</summary>

One: the verification pass scores all $\gamma$ proposals and yields one extra token.

</details>

:::caution[Security link]
The cache is stored state derived from every user's prompt, living next to the weights. Published work shows that serving optimizations create side channels: response-time differences caused by shared caches can reveal information about other users' prompts <cite data-p="song2024" data-s></cite>, and the sizes of streamed network packets can leak token lengths and hence, with some accuracy, the content of an encrypted response <cite data-p="weiss2024" data-s></cite>. Treat the serving stack, not just the model, as the thing under test.
:::

## Papers

-   <cite data-p="kwon2023"></cite> Paged memory for the KV cache.
-   <cite data-p="leviathan2022"></cite> Speculative decoding; section 2.3 states the sampling rule and Appendix A.1 proves that it matches the target distribution.
-   <cite data-p="shazeer2019"></cite> The paper that identified decoding's memory-bandwidth problem and proposed sharing keys and values.
-   <cite data-p="song2024"></cite> and <cite data-p="weiss2024"></cite> Side channels in serving systems.
