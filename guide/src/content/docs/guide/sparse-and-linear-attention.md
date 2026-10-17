---
title: "Local, sparse and linear attention; state-space models"
description: "Windows, sparsity, recurrence and hybrids"
sidebar:
  label: "13. Local, sparse and linear attention; state-space models"
---

_Windows, sparsity, recurrence and hybrids_

Chapter 13 of 21 · III. Fast attention and inference · about 45 minutes. Builds on: [6. Attention](/guide/attention/), [10. Generating text: the KV cache and inference cost](/guide/kv-cache/).

## Beyond full attention

Full attention costs $O(n^{2})$ in time and its cache grows with $n$. Several families of ideas relax that, covered in the six sections below.

## 1\. Local (sliding-window) attention

Let each token attend only to the previous $w$ tokens. Cost becomes $O(n\cdot w)$, and the cache for such a layer never needs to exceed $w$ entries. Information still travels far because stacking $L$ layers extends the reach to about $L\cdot w$ tokens. Longformer <cite data-p="beltagy2020" data-s></cite> combined local windows with a few global tokens; Mistral 7B <cite data-p="jiang2023" data-s></cite> used a 4,096-token window with a rolling buffer cache. gpt-oss alternates banded layers (128-token window) with fully dense layers <cite data-p="openai2025oss" data-s></cite>: the local layers are cheap, and every second layer can still move information across the whole context. Try a window in this toy:

<div class="widget not-content" data-w="attnheat" data-title="Sliding windows and causal masks"></div>

## 2\. Attention sinks

Softmax forces each row of weights to sum to 1, even when a token has nothing relevant to attend to. Models learn to dump that surplus on a few tokens, typically the first ones. <cite data-p="xiao2023" data-s></cite> showed that evicting these initial tokens from a sliding cache wrecks generation, while keeping just a handful of them plus the recent window lets a model stream indefinitely without retraining. The gpt-oss model card describes a related design in which each head has a learned bias added to the softmax denominator, which gives the head a place to put unused weight <cite data-p="openai2025oss" data-s></cite>.

## 3\. Sparse attention: attend to the right few tokens

Instead of a fixed window, choose which tokens each query attends to.

-   **Native Sparse Attention (NSA)** <cite data-p="yuan2025" data-s></cite> organizes keys and values into blocks and combines three branches per query, mixed by learned gates: attention over _compressed_ coarse-grained block summaries, attention over selected fine-grained blocks (chosen using the compressed scores), and a local sliding window. It is designed around contiguous block reads for GPU efficiency and is trained with sparsity from the start so the selection is learned, rather than being added after the fact.
-   **DeepSeek Sparse Attention (DSA)**, introduced in DeepSeek-V3.2 <cite data-p="deepseekv32" data-s></cite>: a lightweight "lightning indexer" scores every earlier token for each query using a small number of ReLU-activated dot-product heads, then full attention is computed over only the top-k selected tokens. Core attention drops from $O(n^{2})$ to $O(n\cdot k)$. The report states that, relative to the prior V3.1-Terminus model, DSA is the only architectural change and was added through continued training.

## 4\. Linear attention and recurrent state

Standard attention computes $\operatorname{softmax}(q\cdot k)$ which cannot be factored. Replace it with a product of feature maps, score($q$, $k$) = $\varphi (q)\cdot \varphi (k)$. Now regroup the sum for the output at position $t$:

$$
o_t=\sum_{j\le t}\bigl(\phi(q_t)\cdot\phi(k_j)\bigr)v_j=\Bigl(\sum_{j\le t}v_j\,\phi(k_j)^{\top}\Bigr)\phi(q_t)=S_t\,\phi(q_t)
$$

The matrix $S_{t}$ (value-dim × key-dim) can be updated incrementally: `Sₜ = Sₜ₋₁ + vₜ kₜᵀ` (writing $k$ for $\varphi (k)$). So the layer is a **recurrent network with a fixed-size matrix state**: constant memory, $O(n)$ time <cite data-p="katharopoulos2020" data-s></cite>. The same computation can be written in the parallel form (good for training) or the recurrent form (good for generation).

The price is capacity: everything the layer remembers must fit in $S$. Adding new associations on top of old ones causes interference, so plain linear attention cannot recall exactly. Two repairs are used:

-   **Forgetting gate:** $S_{t} = \alpha _{t}\cdot S_{t-1} + v_{t}k_{t}^{\top}$ with $0 < \alpha \le 1$ (the form used in Mamba-2) lets the state decay old information.
-   **Delta rule:** treat $S$ as a linear regressor from keys to values and do one gradient step on the error $\tfrac12 \lVert S\cdot k - v\rVert ^{2}$. The gradient is $(S\cdot k - v)\cdot k^{\top}$, giving `Sₜ = Sₜ₋₁ (I − βₜ kₜkₜᵀ) + βₜ vₜ kₜᵀ`. It first _erases_ what the state currently returns for key $k$, then _writes_ the new value, so an updated association replaces the old one instead of adding to it.
-   **Gated delta rule** <cite data-p="yang2024" data-s></cite> combines both: `Sₜ = Sₜ₋₁ · αₜ(I − βₜ kₜkₜᵀ) + βₜ vₜ kₜᵀ`, with the gate $\alpha$ for fast bulk forgetting and the delta term for targeted overwriting. Kimi Linear's "Kimi Delta Attention" extends this with finer-grained gating <cite data-p="kimi2025linear" data-s></cite>.

<div class="widget not-content" data-w="linattn" data-title="Memory states: add, forget, overwrite"></div>

## 5\. State-space models

A different lineage arrives at a similar place. A **state-space model** evolves a hidden state $h$ with a linear recurrence and reads it out: $h_{t}$ = Ā·$h_{t-1} + B$̄·$x_{t}$, $y_{t} = C\cdot h_{t}$ (the barred matrices come from discretizing a continuous system). Early versions had fixed A, $B$, $C$, so they treated all inputs the same. **Mamba** <cite data-p="gu2023" data-s></cite> makes the step size and the $B$ and $C$ matrices functions of the current input ("selective"), which lets the model choose what to remember or ignore, and it computes the recurrence with a hardware-aware parallel scan. Mamba-2 <cite data-p="dao2024" data-s></cite> shows that these SSMs and linear attention are two views of one family of structured computations.

## 6\. Hybrids

Pure recurrent layers are cheap but weak at exact lookup far back; full attention is exact but expensive. Recent designs mix them. Kimi Linear interleaves its delta-attention layers with latent-attention (MLA) layers and reports up to a 75% smaller KV cache and up to 6× faster decoding at a 1M-token context compared with full attention <cite data-p="kimi2025linear" data-s></cite>. These are the authors' reported figures; check the paper for the exact setup.

## Summary of trade-offs

| Approach | Time | Memory during generation | Weakness |
| --- | --- | --- | --- |
| Full attention | $O(n^{2})$ | grows with $n$ | cost |
| Sliding window | $O(n\cdot w)$ | bounded by $w$ | no direct long-range access in that layer |
| Learned sparse (NSA, DSA) | $O(n\cdot k)$ | full cache kept, reads limited | selector must be good |
| Linear / SSM | $O(n)$ | constant | lossy memory, weaker exact recall |

## Worked examples

<details>
<summary>Why can a sliding-window model still use information from beyond one window?</summary>

Each layer lets a token see $w$ tokens, but those tokens' vectors already contain information from their own windows in earlier layers, so after $L$ layers the effective reach is about $L\cdot w$.

</details>

<details>
<summary>In the delta rule with β = 1 and ‖k‖ = 1, what does S·k return after the update?</summary>

$S'k = S(I - kk^{\top})k + vk^{\top}k = S(k - k) + v = v$. The state returns exactly the newly written value.

</details>

<details>
<summary>Why is training a model with sparse attention from the start different from sparsifying a finished model?</summary>

When sparsity is present during training, the model (and the selector) learn to put important information where it will be found; imposing it afterwards removes information the model was relying on.

</details>

:::caution[Security link]
Some of this is hypothesis rather than established finding, so treat it as a test plan. A fixed-size recurrent state raises the question of what is forgotten: can an attacker craft content that overwrites earlier instructions in the state? A learned sparse selector raises the question of whether an attacker can craft tokens that are always selected (or that push legitimate ones out). Evaluate these architectures with the same injection and long-context tests, not on the assumption that results for full attention transfer.
:::

## Papers

-   <cite data-p="beltagy2020"></cite> and <cite data-p="jiang2023"></cite> Windowed attention.
-   <cite data-p="xiao2023"></cite> Attention sinks.
-   <cite data-p="yuan2025"></cite> Native Sparse Attention.
-   <cite data-p="deepseekv32"></cite> DeepSeek Sparse Attention (architecture section).
-   <cite data-p="katharopoulos2020"></cite> Linear attention as an RNN.
-   <cite data-p="gu2023"></cite> Mamba.
-   <cite data-p="dao2024"></cite> The duality between SSMs and attention.
-   <cite data-p="yang2024"></cite> Gated Delta Networks; section 3 has the update rule.
-   <cite data-p="kimi2025linear"></cite> A recent hybrid at scale.
