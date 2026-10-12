---
title: "Backpropagation and optimizers"
description: "The chain rule at scale, and how weights get updated"
sidebar:
  label: "3. Backpropagation and optimizers"
---

_The chain rule at scale, and how weights get updated_

Chapter 3 of 21 · I. Foundations · about 40 minutes. Builds on: [2. Neural networks and the multilayer perceptron](/guide/neural-networks/).

:::tip[Skip this chapter if]
you can derive the gradient of a two-layer network by the chain rule, explain why residual connections help gradients flow, and write the Adam update including its bias correction. If you only know "autograd computes gradients", read the first section.
:::

## Backpropagation is the chain rule, organized

A network is a composition of simple functions. To train it you need $\partial L / \partial \theta$ for every parameter, and the chain rule says how derivatives of a composition multiply. Backpropagation computes all of them in one backward sweep, reusing intermediate results.

### A two-layer network, derived

Forward pass, with a ReLU or other activation $\varphi$ and squared-error loss on one example:

$$
\begin{aligned}z_1&=W_1x+b_1,&a_1&=\varphi(z_1)\\z_2&=W_2a_1+b_2,&L&=\tfrac12\lVert z_2-y\rVert^2\end{aligned}
$$

Work backward. Define $\delta _{k} = \partial L / \partial z_{k}$, the "error signal" at layer $k$.

$$
\begin{aligned}\delta_2&=\frac{\partial L}{\partial z_2}=z_2-y\\[9pt]\frac{\partial L}{\partial W_2}&=\delta_2\,a_1^{\top},\qquad\frac{\partial L}{\partial b_2}=\delta_2\\[9pt]\frac{\partial L}{\partial a_1}&=W_2^{\top}\delta_2\qquad\text{(send the error back through the weights)}\\[9pt]\delta_1&=\bigl(W_2^{\top}\delta_2\bigr)\odot\varphi'(z_1)\\[9pt]\frac{\partial L}{\partial W_1}&=\delta_1\,x^{\top},\qquad\frac{\partial L}{\partial b_1}=\delta_1\end{aligned}
$$

Each layer needs only the error from the layer above, its own stored input, and its local derivative. That is the pattern for any depth: **reverse-mode automatic differentiation**. Two practical consequences:

-   The backward pass costs about twice the forward pass (one matrix product for the gradient of the weights, one for the gradient of the input). Together with the forward pass this is the origin of the "6 FLOPs per parameter per token" rule in [Chapter 9](/guide/full-model/).
-   The forward activations must be stored (or recomputed) for the backward pass. Activation memory is often larger than the parameter memory, which is why frameworks offer _activation checkpointing_: store a few and recompute the rest.

## Gradients through many layers

The backward signal passes through a product of per-layer Jacobians. If those matrices tend to shrink vectors, the signal vanishes; if they tend to enlarge them, it explodes. Two standard remedies matter for transformers.

### Residual connections

Instead of $y = F(x)$, compute `y = x + F(x)` <cite data-p="he2015" data-s></cite>. Then $\partial y / \partial x = I + \partial F / \partial x$. The identity term gives gradients a direct path from the loss to early layers regardless of what $F$ does. A transformer is a stack of such residual updates to a single vector (the "residual stream", [Chapter 7](/guide/transformer-block/)).

### Initialization

Initial weights are random, and their scale is chosen so that activations and gradients keep roughly the same variance from layer to layer. For a layer with $n_{in}$ inputs, a standard choice draws weights with variance proportional to $1 / n_{in}$ (with a constant of 2 for ReLU). Too large and activations blow up with depth; too small and they vanish. Large models also scale down the output weights of residual branches so the sum of many layers stays bounded.

## Optimizers

Given the gradient $g = \nabla L(\theta)$ from a minibatch, an optimizer decides the step.

### SGD with momentum

Plain SGD is $\theta \leftarrow \theta - \eta \cdot g$. Momentum keeps a running velocity that smooths the noise and builds speed along consistent directions:

$$
v\leftarrow\mu\,v+g,\qquad\theta\leftarrow\theta-\eta\,v\qquad(\mu\approx0.9)
$$

### Adam

Adam <cite data-p="kingma2014" data-s></cite> keeps two running averages per parameter: the mean of the gradient ($m$) and the mean of its square ($v$), and divides one by the root of the other, so every parameter takes steps of roughly the same size no matter how big its gradients are:

$$
\begin{aligned}m&\leftarrow\beta_1m+(1-\beta_1)\,g\\v&\leftarrow\beta_2v+(1-\beta_2)\,g^2\\\hat m&=\frac{m}{1-\beta_1^{\,t}},\qquad\hat v=\frac{v}{1-\beta_2^{\,t}}\quad\text{(bias correction at step }t\text{)}\\\theta&\leftarrow\theta-\eta\,\frac{\hat m}{\sqrt{\hat v}+\varepsilon}\end{aligned}
$$

The bias correction exists because $m$ and $v$ start at zero, so early on they underestimate the true averages. Typical values are $\beta _{1} = 0.9$, $\beta _{2} = 0.95$ to 0.999, $\epsilon = 10^{-8}$.

### AdamW

Weight decay shrinks weights toward zero to regularize. Adding an L2 penalty to the loss is not equivalent to decay when the optimizer rescales gradients, so **AdamW** <cite data-p="loshchilov2017" data-s></cite> applies decay directly to the weights, separately from the adaptive step:

$$
\theta\leftarrow\theta-\eta\Bigl(\frac{\hat m}{\sqrt{\hat v}+\varepsilon}+\lambda\,\theta\Bigr)
$$

### Muon and matrix-aware optimizers

Adam treats each weight independently, but a weight matrix is a structured object. Muon accumulates momentum as usual, then replaces the momentum matrix by an approximately _orthogonalized_ version (all singular values pushed toward 1, computed with a few Newton–Schulz matrix iterations) before applying it. <cite data-p="liu2025muon" data-s></cite> report that, with modifications such as weight decay and per-matrix update scaling, it scales to large language model training and can be more compute-efficient than AdamW.

### Schedules and clipping

-   **Warmup:** ramp the learning rate from near zero over the first few thousand steps; early Adam statistics are unreliable.
-   **Decay:** reduce the rate (cosine or linear) toward the end of training.
-   **Gradient clipping:** rescale $g$ if $\lVert g\rVert$ exceeds a threshold, which prevents rare huge gradients from wrecking the weights.

## Try it: a narrow valley

The loss below is $f(x, y) = \tfrac12 (x^{2} + 30y^{2})$: curvature is thirty times larger across the valley than along it. [Chapter 1](/guide/gradient-descent/)'s stability condition limits SGD to $\eta < 2 / 30$, which makes progress along the valley slow. Compare the three optimizers and change the rates.

<div class="widget not-content" data-w="opt" data-title="Optimizer paths on an elongated valley"></div>

## Try it: train a real transformer

Everything above applies unchanged to a transformer: the loss is the average negative log-probability of each true next word, backpropagation produces a gradient for every weight matrix, and an optimizer moves the weights. The widget below does exactly that to a copy of the [Model Explorer](/explorer/)'s two-layer model, in your browser, using hand-written backpropagation that is checked against finite differences. Start from random weights, take a few steps on one sentence, and watch the probability of each true next word climb while the loss falls.

<div class="widget not-content" data-w="trainer" data-title="Take real gradient steps on a transformer"></div>

## Check yourself

<details>
<summary>In the two-layer derivation, why does δ₁ contain φ′(z₁)?</summary>

Because $a_{1} = \varphi (z_{1})$; by the chain rule, $\partial L / \partial z_{1} = \partial L / \partial a_{1} \cdot \partial a_{1} / \partial z_{1}$, and $\partial a_{1} / \partial z_{1} = \varphi'(z_{1})$ elementwise. For ReLU that factor is 1 where $z_{1} > 0$ and 0 elsewhere, so units that were "off" pass no gradient.

</details>

<details>
<summary>What does the residual connection do to the gradient?</summary>

It adds the identity to the Jacobian: $\partial (x + F(x)) / \partial x = I + \partial F / \partial x$. The identity path carries the gradient directly to earlier layers.

</details>

<details>
<summary>Why does Adam need bias correction?</summary>

$m$ and $v$ are initialized to 0 and are exponential averages, so at step $t$ they are biased toward 0 by a factor $(1 - \beta ^{t})$. Dividing by that factor removes the bias.

</details>

:::caution[Security link]
The backward pass is a general tool for asking "how does the output change if I change this number?" Apply it to the input tokens or pixels rather than the weights and you have a way to craft adversarial inputs. In distributed training, shared gradients can also leak information about the training examples that produced them.
:::

## Papers

-   <cite data-p="he2015"></cite> Introduces residual connections.
-   <cite data-p="kingma2014"></cite> Adam.
-   <cite data-p="loshchilov2017"></cite> AdamW; read for the argument about why L2 regularization and weight decay differ.
-   <cite data-p="liu2025muon"></cite> A recent matrix-aware optimizer shown to scale.
-   <cite data-p="goodfellow2016"></cite> Chapters 8 (optimization) and 6.5 (backpropagation).
