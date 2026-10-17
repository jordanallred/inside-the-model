---
title: "Functions, parameters and gradient descent"
description: "Models, loss, and the gradient that trains them"
sidebar:
  label: "1. Functions, parameters and gradient descent"
---

_Models, loss, and the gradient that trains them_

Chapter 1 of 21 · I. Foundations · about 30 minutes. Needs only calculus and linear algebra.

## A model is a function with adjustable numbers

A **model** is a function $f(x; \theta)$ that turns an input $x$ into an output. The semicolon separates what you feed in ($x$) from the **parameters** $\theta$, the numbers inside the function that you are free to change. The simplest example is a line:

$$
f(x;\,w,b)=w\,x+b\qquad \theta=(w,b)
$$

A modern language model is the same kind of object. It is a function from a sequence of tokens to a probability distribution over the next token, and $\theta$ is a list of billions of numbers (for example, 8 billion for Llama 3 8B). Everything in this guide is about how that function is built, how the numbers are found, and what can go wrong.

## Loss: a single number that says how wrong the model is

Suppose you have examples ($x_{1}$, $y_{1}$), …, ($x_{n}$, $y_{n}$) where $y$ is the answer you want. Choose a **loss** that measures the error of one prediction, and average it over the data. For regression the usual choice is squared error:

$$
L(\theta)=\frac1n\sum_{i=1}^{n}\bigl(f(x_i;\theta)-y_i\bigr)^2
$$

$L$ is a function of $\theta$ only, because the data are fixed. **Training** means finding $\theta$ that makes $L$ small. For a line this is ordinary least squares. For a language model the loss is different (cross-entropy, [Chapter 4](/guide/softmax-and-loss/)) but the idea is identical.

## The gradient points uphill

For a function of many variables, the **gradient** is the vector of partial derivatives:

$$
\nabla L(\theta)=\Bigl(\frac{\partial L}{\partial\theta_1},\frac{\partial L}{\partial\theta_2},\dots,\frac{\partial L}{\partial\theta_p}\Bigr)
$$

Take a small step $\delta$. A first-order Taylor expansion says

$$
L(\theta+\delta)\approx L(\theta)+\nabla L(\theta)\cdot\delta
$$

The change in $L$ is a dot product, so it is largest when $\delta$ points along $\nabla L$ (steepest ascent) and most negative when $\delta$ points against it. That gives the update rule of **gradient descent**:

$$
\theta\leftarrow\theta-\eta\,\nabla L(\theta)
$$

$\eta$ (eta) is the **learning rate**. Substituting $\delta = -\eta \nabla L$ into the expansion gives $L(\theta + \delta) \approx L(\theta) - \eta \lVert \nabla L\rVert ^{2}$, a decrease, as long as $\eta$ is small enough for the approximation to hold.

### Worked example: fitting a line

For $L(w, b) = (1 / n)\sum(w\cdot x_{i} + b - y_{i})^{2}$, the chain rule gives

$$
\begin{aligned}\frac{\partial L}{\partial w}&=\frac2n\sum_i\,(w x_i+b-y_i)\,x_i\\[4pt]\frac{\partial L}{\partial b}&=\frac2n\sum_i\,(w x_i+b-y_i)\end{aligned}
$$

Each partial derivative is an average of the errors, weighted by the input the parameter multiplies. Repeating $w \leftarrow w - \eta \cdot \partial L / \partial w$, $b \leftarrow b - \eta \cdot \partial L / \partial b$ moves the line toward the data.

## Try it: the learning rate decides everything

Below, a function with two valleys. Drag the starting point, set the learning rate, and press Play. Notice three behaviors: a small rate is slow but safe, a moderate rate lands in whichever valley is downhill from the start, and a large rate overshoots and diverges.

<div class="widget not-content" data-w="gd" data-title="Gradient descent on f(x) = x⁴/4 − x² + 0.3x"></div>

### Why too large a step diverges

Take the simplest bowl, $f(x) = \tfrac12 \cdot a\cdot x^{2}$, with $a > 0$. Its derivative is $a\cdot x$, so one step gives

$$
x\leftarrow x-\eta\,a\,x=(1-\eta a)\,x
$$

Each step multiplies $x$ by $(1 - \eta a)$. That shrinks $x$ toward 0 only if $\lvert1-\eta a\rvert<1$, which means $0 < \eta < 2 / a$. The number $a$ is the **curvature**. For many dimensions, the same argument applies along each direction of the loss surface, and the largest curvature (the largest eigenvalue of the Hessian matrix of second derivatives) sets the stability limit. A narrow valley, where curvature is large in one direction and small in another, forces a small $\eta$ that makes progress along the valley slow. [Chapter 3](/guide/backpropagation/) shows how momentum and Adam address this.

## Stochastic gradient descent

Computing $\nabla L$ over the whole dataset every step is wasteful when the dataset has trillions of tokens. Instead, take a random **minibatch** $B$ of examples and compute the gradient of the average loss over $B$ only. This estimate is unbiased (its expected value is the true gradient) and noisy. The noise is not just a cost: a very large batch gives a more accurate direction but few updates, while a small batch gives many noisy ones. Language models are trained with batches of millions of tokens.

## Training loss is not the goal

A model with enough parameters can memorize its training examples and still fail on new ones. We therefore keep some data aside, the **validation set**, and report the loss there. Training and validation loss that diverge indicate **overfitting**. This will matter again in security: a model that has memorized training text can be made to reveal it ([Chapter 20](/guide/security/)).

## Worked examples

<details>
<summary>For f(x) = ½·a·x² with a = 4, what range of learning rates converges?</summary>

$0 < \eta < 2 / a = 0.5$. At $\eta = 0.5$ the factor $(1 - \eta a) = -1$, so $x$ oscillates between $\pm x_{0}$ forever.

</details>

<details>
<summary>Why does −∇L give the direction of steepest descent?</summary>

To first order, the change in $L$ for a step $\delta$ is $\nabla L\cdot \delta$. For a fixed step length, a dot product is most negative when $\delta$ points exactly opposite to $\nabla L$.

</details>

<details>
<summary>Compute ∂L/∂b for L = (1/2)(b − 3)². What is the update with η = 0.1 from b = 0?</summary>

$\partial L / \partial b = b - 3 = -3$. Update: $b \leftarrow 0 - 0.1\cdot (-3) = 0.3$.

</details>

:::caution[Security link]
Gradients are not only taken with respect to parameters. If you take $\nabla$ with respect to the _input_ $x$ instead of $\theta$, you learn which small change to $x$ most increases the loss. That single idea is the basis of adversarial examples ([Chapter 20](/guide/security/)).
:::

## Papers and books

-   <cite data-p="goodfellow2016"></cite> Chapters 4 (numerical computation) and 5 (machine learning basics) cover this material carefully.
-   <cite data-p="prince2023"></cite> A modern textbook; chapters 2–4 and 6 are the companion to this chapter.
-   <cite data-p="zhang2023d2l"></cite> Free, with runnable code for every concept.
