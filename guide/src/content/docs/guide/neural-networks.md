---
title: "Neural networks and the multilayer perceptron"
description: "Layers, activations and what a hidden unit does"
sidebar:
  label: "2. Neural networks and the multilayer perceptron"
---

_Layers, activations and what a hidden unit does_

Chapter 2 of 21 · I. Foundations · about 35 minutes. Builds on: [1. Functions, parameters and gradient descent](/guide/gradient-descent/).

## From a line to a neuron

A line $w\cdot x + b$ has one input and two parameters. With several inputs $x=(x_1,\dots,x_m)$, a **neuron** computes a weighted sum plus a bias, then passes it through a fixed non-linear function $\varphi$ called an **activation**:

$$
z=w\cdot x+b\qquad a=\varphi(z)
$$

The weights $w$ say how much each input matters; the bias $b$ shifts the threshold; $\varphi$ bends the result so the neuron can respond differently to different ranges of $z$.

## Layers are matrix multiplications

Put $n$ neurons side by side and stack their weight vectors as the rows of a matrix $W$ (shape $n \times m$). The whole **layer** is then one matrix–vector product:

$$
h=\varphi(Wx+b)\qquad x\in\mathbb R^m,\; W\in\mathbb R^{n\times m},\; b\in\mathbb R^n,\; h\in\mathbb R^n
$$

$\varphi$ is applied to each element of the vector. A layer with $m$ inputs and $n$ outputs has $m\cdot n + n$ parameters and costs about $2\cdot m\cdot n$ arithmetic operations (one multiply and one add per weight). GPUs are built to do exactly these matrix products, which is the reason this architecture won.

A **multilayer perceptron** (MLP) feeds the output of one layer into the next:

$$
\begin{aligned}h_1&=\varphi(W_1x+b_1)\\h_2&=\varphi(W_2h_1+b_2)\\y&=W_3h_2+b_3\qquad\text{(no activation on the last layer)}\end{aligned}
$$

The intermediate vectors $h_{1}$, $h_{2}$ are called **hidden** layers. In practice you process a whole batch at once by making $x$ a matrix with one column per example; the same equations hold.

## Why the non-linearity is essential

If $\varphi$ were the identity, then $W_{2}(W_{1}x)$ = ($W_{2}W_{1}$)$x$, a single matrix. A hundred linear layers would be exactly as expressive as one. The non-linearity is what lets depth add power.

## Common activation functions

| Name | Formula | Notes |
| --- | --- | --- |
| ReLU | $\max(0, z)$ | Simple; zero for negative $z$, identity for positive $z$. |
| tanh | $(e^{z} - e^{-z}) / (e^{z} + e^{-z})$ | Smooth, output between $-1$ and 1; saturates for large $\lvert z\rvert$. |
| GELU | $z\,\Phi(z)$, $\Phi$ = Gaussian CDF | Smooth ReLU-like curve <cite data-p="hendrycks2016" data-s></cite>; used in many earlier transformers. |
| SiLU / Swish | $z\cdot \sigma (z)$, $\sigma (z) = 1 / (1 + e^{-z})$ | Smooth, slightly negative dip <cite data-p="ramachandran2017" data-s></cite>; the activation inside modern gated MLPs ([Chapter 7](/guide/transformer-block/)). |

## What does a one-hidden-layer network compute?

Take one input $x$, a hidden layer of $H$ ReLU units, and a single output:

$$
y=b_2+\sum_{j=1}^{H}w_{2j}\,\max\bigl(0,\;w_{1j}\,x+b_{1j}\bigr)
$$

Each hidden unit is a "ramp": zero until $x$ reaches $-b_{1j} / w_{1j}$, then rising with slope $w_{1j}$. The output is a weighted sum of ramps, so the function is piecewise linear with a bend wherever a ramp starts. With enough ramps you can approximate any continuous function on an interval to any accuracy. This is the content of the **universal approximation theorem**. It says expressiveness is available, not that gradient descent will find it or that it will generalize.

Try it. The network below starts with random ramps. Press Train and watch gradient descent ([Chapter 1](/guide/gradient-descent/)) bend them into the target. Turn on "show each hidden unit's contribution" to see the individual ramps whose sum is the orange curve. Then try one hidden unit, switch to tanh or SiLU, or drag across the chart to draw a target of your own.

<div class="widget not-content" data-w="mlp" data-title="Train a one-hidden-layer network to fit a curve"></div>

## Depth versus width

A wide shallow network can in principle approximate anything, but a deep network can often represent the same function with far fewer units, because each layer builds on the features produced by the previous one. Concretely, composing ReLU layers can create a number of linear pieces that grows exponentially with depth. In language models the depth is tens to over a hundred layers (36 in gpt-oss-120b, 61 in DeepSeek-V3, 126 in Llama 3 405B), and each layer contains an MLP like the one above.

## The MLP inside a transformer

In a transformer, the MLP is applied independently to each token's vector. The model width is called $d$. The classic version expands the vector to 4d, applies the activation, and projects back to $d$:

$$
\mathrm{MLP}(x)=W_{\text{down}}\,\varphi\bigl(W_{\text{up}}\,x\bigr)\qquad W_{\text{up}}\in\mathbb R^{4d\times d},\;W_{\text{down}}\in\mathbb R^{d\times 4d}
$$

That is $2\cdot4\cdot d^{2}=8d^{2}$ weights per layer (ignoring biases), roughly two thirds of all non-embedding parameters. [Chapter 7](/guide/transformer-block/) introduces the gated version used by current models and [Chapter 14](/guide/mixture-of-experts/) splits this block into many "experts".

## Worked examples

<details>
<summary>How many parameters does a layer mapping 4096 inputs to 14336 outputs have (no bias)?</summary>

$4096 \times 14336 = 58,720,256$, about 58.7 million. (Those are the dimensions of one MLP matrix in Llama 3 8B.)

</details>

<details>
<summary>Why does a network with only linear activations not benefit from depth?</summary>

A product of matrices is a matrix, so any stack of linear layers collapses to a single linear map.

</details>

<details>
<summary>Where do the bends of a ReLU network sit?</summary>

At each hidden unit's kink, $x = -b_{1j} / w_{1j}$, where $w_{1j}\cdot x + b_{1j}$ crosses zero.

</details>

:::caution[Security link]
A trained network is nothing but these arrays of numbers. The "model" you download is a file of weight matrices; whoever has the file has everything. This is why weights are treated as a crown-jewel asset and why a malicious file format that executes code when loaded is a real supply-chain risk.
:::

## Papers and books

-   <cite data-p="goodfellow2016"></cite> Chapter 6 (deep feedforward networks).
-   <cite data-p="prince2023"></cite> Chapters 3–4 give a very clear geometric picture of shallow and deep networks as piecewise-linear functions.
-   <cite data-p="hendrycks2016"></cite> Introduces GELU.
-   <cite data-p="ramachandran2017"></cite> Introduces Swish (SiLU).
