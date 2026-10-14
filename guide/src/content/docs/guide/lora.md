---
title: "Adapting models: LoRA, QLoRA and distillation"
description: "Training a few million parameters instead of billions"
sidebar:
  label: "18. Adapting models: LoRA, QLoRA and distillation"
---

_Training a few million parameters instead of billions_

Chapter 18 of 24 · V. Training · about 25 minutes. Builds on: [7. The transformer block](/guide/transformer-block/), [15. Floating point and quantization](/guide/low-precision/).

:::tip[Skip this chapter if]
you can write the LoRA update, state why it saves memory, describe QLoRA's ingredients, and explain distillation.
:::

## Fine-tuning is expensive in memory

Updating all $N$ weights needs gradients and optimizer state for all of them: with Adam and mixed precision that is about 16 bytes per parameter in all, weights included ([Chapter 9](/guide/full-model/)). For an 8-billion-parameter model that is about 128 GB before activations. Parameter-efficient methods train a small number of new parameters while freezing the original ones.

## LoRA: learn a low-rank change

Hypothesis from <cite data-p="hu2021" data-s></cite>: when adapting a pretrained model, the change to a weight matrix has low "intrinsic rank". So instead of learning a full update $\Delta W$ ($d_{out} \times d_{in}$), learn two thin matrices whose product is the update:

$$
W'=W+\frac{\alpha}{r}\,B\,A\qquad B\in\mathbb R^{d_{\text{out}}\times r},\ A\in\mathbb R^{r\times d_{\text{in}}},\ r\ll\min(d_{\text{out}},d_{\text{in}})
$$

-   $W$ is frozen. Only $A$ and $B$ receive gradients. $B$ starts at zero (and $A$ at small random values), so at step 0 the model is exactly the base model.
-   Parameters per matrix: $r(d_{in}+d_{out})$ instead of $d_{in}\cdot d_{out}$. For a $4096\times 4096$ matrix at rank 16 that is 131K instead of 16.8M, about 0.8%.
-   $\alpha / r$ is a fixed scale factor.
-   After training you can **merge**: compute $W+(\alpha/r)BA$ once and discard $A$ and $B$. The merged model has no extra inference cost, or keep adapters separate and swap them per request.

LoRA is usually applied to the attention matrices and increasingly to the MLP matrices too. Calculate for Llama 3 8B shapes:

<div class="widget not-content" data-w="lora" data-title="LoRA parameter and memory arithmetic"></div>

## QLoRA: LoRA on a 4-bit base

QLoRA <cite data-p="dettmers2023" data-s></cite> reduces memory further by storing the frozen base weights in 4 bits while training LoRA adapters in 16-bit on top. Its ingredients: the **NF4** data type, a 4-bit format whose levels are spaced to fit normally distributed weights; **double quantization**, which quantizes the quantization constants themselves; and **paged optimizers** that spill optimizer state to CPU memory during memory spikes. Gradients are backpropagated through the quantized weights into the adapters. The paper reports fine-tuning a 65-billion-parameter model on a single 48 GB GPU.

## Distillation

Train a small **student** to imitate a larger **teacher**, either by matching the teacher's output distribution (minimize KL between teacher and student token probabilities) or simply by training on text the teacher generated. It transfers capability into cheaper models. DeepSeek-R1's report describes distilling its reasoning traces into smaller dense models <cite data-p="deepseekr1" data-s></cite>, and several recent small open models are distilled from larger siblings.

## Check yourself

<details>
<summary>How many trainable parameters does LoRA with r = 8 add to a 4096 × 11008 matrix?</summary>

$r(d_{in}+d_{out})=8\times(4096+11008)=120{,}832$, versus 45,088,768 for a full update (0.27%).

</details>

<details>
<summary>Why initialize B to zero?</summary>

So that the product BA is zero at the start: the adapted model begins identical to the pretrained one, and training moves it away smoothly.

</details>

<details>
<summary>What is the memory saving mechanism of QLoRA beyond LoRA?</summary>

The large frozen weights are stored in ~4 bits instead of 16, cutting the dominant memory term roughly fourfold; only the small adapters and their optimizer state remain in higher precision.

</details>

:::caution[Security link]
Cheap adaptation cuts both ways. Anyone with an open-weight model and one GPU can fine-tune away its refusals or implant behavior: <cite data-p="qi2023" data-s></cite> show that safety alignment can be removed with small fine-tuning sets, sometimes unintentionally. Adapters are also artifacts that must be provenance-checked like any model file, and distillation from a model's API outputs is one route to extracting its capabilities ([Chapter 20](/guide/security/)).
:::

## Papers

-   <cite data-p="hu2021"></cite> LoRA.
-   <cite data-p="dettmers2023"></cite> QLoRA.
-   <cite data-p="deepseekr1"></cite> Distillation of reasoning models.
-   <cite data-p="qi2023"></cite> Why cheap fine-tuning is a security concern.
