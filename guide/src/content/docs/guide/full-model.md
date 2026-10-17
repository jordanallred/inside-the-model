---
title: "The full model and its training loop"
description: "Shapes, loss and the cost of one training step"
sidebar:
  label: "9. The full model and its training loop"
---

_Shapes, loss and the cost of one training step_

Chapter 9 of 21 · II. The transformer · about 35 minutes. Builds on: [3. Backpropagation and optimizers](/guide/backpropagation/), [7. The transformer block](/guide/transformer-block/), [8. Position and rotary embeddings](/guide/rope/).

:::note[Run a whole forward pass]
Run a whole forward pass from prompt to next-token probabilities, one step at a time. [Open in the Model Explorer](/explorer/#step=0&t=3&v=visual).
:::

## Assembling the pieces

A decoder-only language model, the design used by essentially every current chat model, is the following pipeline. Let $B$ be the batch size, $T$ the sequence length, $d$ the width, $V$ the vocabulary and $L$ the number of blocks.

```text
token ids              [B, T]              integers in [0, V)
embedding lookup       [B, T, d]           row of E for each id
L × block              [B, T, d]           attention + MLP with residuals (Chapters 6–8)
final norm             [B, T, d]
unembedding (· Wout)   [B, T, V]           logits for every position
softmax + loss         scalar              cross-entropy against the next tokens
```

Training uses **teacher forcing**: the targets are simply the input sequence shifted left by one, so position $t$ is trained to predict token $t + 1$, and the causal mask guarantees it cannot peek. In pseudocode (PyTorch-style, illustrative rather than a tuned implementation):

```python
def forward(ids):                       # ids: [B, T]
    x = E[ids]                          # embedding, [B, T, d]
    for blk in blocks:                  # L pre-norm blocks
        x = x + attn(norm1(x), causal=True)
        x = x + mlp(norm2(x))
    return norm_f(x) @ W_out            # logits, [B, T, V]

for ids in data_loader:                 # ids: [B, T+1]
    logits = forward(ids[:, :-1])
    loss = cross_entropy(logits, ids[:, 1:])   # average over B*T positions
    loss.backward()
    clip_grad_norm_(params, 1.0)
    optimizer.step(); scheduler.step(); optimizer.zero_grad()
```

Documents are concatenated and cut into fixed-length sequences ("packing"), with end-of-text tokens between them; some pipelines also prevent attention from crossing document boundaries, while others (including the one described for DeepSeek-V3) do not <cite data-p="deepseekv3" data-s></cite>.

## How much compute does training take?

A matrix multiplication of a $1\times a$ vector by an $a\times b$ matrix costs $a\cdot b$ multiplies and about as many adds, so about $2\cdot a\cdot b$ FLOPs, which is 2 FLOPs per parameter. Summing over all weights, the forward pass costs about $2\cdot N$ FLOPs per token, where $N$ is the number of parameters that are multiplied per token. The backward pass computes two products of the same size per matrix (gradient w.r.t. the weights and w.r.t. the input), so it costs about $4\cdot N$. Total:

$$
\text{training FLOPs}\;\approx\;6\,N\,D
$$

This ignores the attention-score term, which grows with sequence length and is small at moderate $T$. Experiment:

<div class="widget not-content" data-w="flops" data-title="Training compute and GPU time"></div>

For example, 405 billion parameters on 15.6 trillion tokens is $6 \times 4.05\times 10^{11} \times 1.56\times 10^{13} \approx 3.8\times 10^{25}$ FLOPs, which matches the order of magnitude Llama 3 reports <cite data-p="grattafiori2024" data-s></cite>.

## How much memory does training take?

Per parameter, with Adam and mixed precision ([Chapter 15](/guide/low-precision/)): the working weights in 16-bit (2 bytes), gradients (2 bytes), and optimizer state in 32-bit: a master copy of the weights (4), first moment (4), second moment (4). That is about 16 bytes per parameter before any activations. A 70-billion-parameter model therefore needs over a terabyte just for these states, far beyond one GPU, which is why training uses sharding and parallelism ([Chapter 16](/guide/pretraining/)).

## Auxiliary objectives

The next-token loss can be supplemented. **Multi-token prediction** <cite data-p="gloeckle2024" data-s></cite> adds heads that predict tokens further ahead from the same hidden state, giving a denser training signal; DeepSeek-V3 uses a single extra predicted token (depth 1) and can reuse that module to speed up inference <cite data-p="deepseekv3" data-s></cite>.

## Measuring progress

Validation loss (or perplexity, [Chapter 4](/guide/softmax-and-loss/)) on held-out text is the cleanest pretraining signal because it is smooth and cheap. Downstream benchmarks measure what people care about but are noisier, can saturate, and can leak into training data. Neither tells you whether a model is _secure_; that requires targeted evaluation (Chapters [20](/guide/security/) and [21](/guide/evaluation/)).

## Worked examples

<details>
<summary>Why is the backward pass about twice the forward pass?</summary>

For each weight matrix, the forward pass does one product (activations × weights). The backward pass does two of the same size: one for the gradient of the weights and one to propagate the gradient to the layer's input.

</details>

<details>
<summary>A mixture-of-experts model has 671B total and 37B active parameters. Which one goes in 6ND?</summary>

The active count, since only those weights are multiplied per token: about $6 \times 37\times 10^{9} \times 14.8\times 10^{12} \approx 3.3\times 10^{24}$ FLOPs for 14.8T tokens.

</details>

<details>
<summary>Roughly how much GPU memory do the parameters, gradients and Adam state for an 8B model need?</summary>

About 16 bytes × $8\times 10^{9} \approx 128$ GB, before activations.

</details>

:::caution[Security link]
The training objective is to reproduce the data. Nothing in the loss distinguishes instructions from facts or knowledge from secrets. Whatever is in the corpus, including private data and attacker-planted text, can be learned, and sufficiently repeated text is memorized and can be extracted later ([Chapter 20](/guide/security/)).
:::

## Papers

-   <cite data-p="vaswani2017"></cite> The original architecture (with an encoder; modern chat models keep only the decoder).
-   <cite data-p="brown2020"></cite> GPT-3: shows what happens when this recipe is scaled.
-   <cite data-p="touvron2023"></cite> LLaMA: a clear description of a modern open dense recipe.
-   <cite data-p="grattafiori2024"></cite> Llama 3: architecture, data and infrastructure at scale.
-   <cite data-p="gloeckle2024"></cite> Multi-token prediction.
