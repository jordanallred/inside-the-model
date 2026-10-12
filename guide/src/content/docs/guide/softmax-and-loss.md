---
title: "Probability, softmax and next-token prediction"
description: "Turning scores into probabilities, and probabilities into text"
sidebar:
  label: "4. Probability, softmax and next-token prediction"
---

_Turning scores into probabilities, and probabilities into text_

Chapter 4 of 21 · I. Foundations · about 30 minutes. Builds on: [1. Functions, parameters and gradient descent](/guide/gradient-descent/).

:::tip[Skip this chapter if]
you can derive that the gradient of softmax cross-entropy with respect to the logits is $p - y$, define perplexity, and explain temperature and top-p sampling. These are the objects every later chapter uses to talk about a language model's output.
:::

:::note[Inspect a real next-token distribution]
See a real next-token distribution. Switch between trained and random weights to see what learning changes. [Open in the Model Explorer](/explorer/#step=25&t=9&v=visual).
:::

## Probability distributions over a finite set

A language model's output is a probability distribution over its vocabulary: a vector $p$ with $p_{i} \ge 0$ and $\sum p_{i} = 1$. The network itself produces unconstrained real numbers $z$ (called **logits**), one per vocabulary entry. The **softmax** function turns them into probabilities:

$$
p_i=\frac{e^{z_i}}{\sum_j e^{z_j}}
$$

Properties worth knowing:

-   Adding the same constant to every logit changes nothing, since the constant cancels. Implementations subtract $\max(z)$ before exponentiating to avoid overflow.
-   It is monotonic: the largest logit gets the largest probability.
-   Scaling the logits by $1 / T$ before softmax sharpens ($T$ < 1) or flattens (T > 1) the distribution. $T$ is called **temperature**.

## Cross-entropy: the training loss

If the true next token has index $t$, the **negative log-likelihood** (also called cross-entropy loss for a one-hot target) is

$$
L=-\log p_t=-z_t+\log\sum_j e^{z_j}
$$

It is 0 when the model gives the right token probability 1 and grows without bound as that probability approaches 0. Differentiate with respect to a logit $z_{i}$:

$$
\frac{\partial L}{\partial z_i}=p_i-\mathbb 1[i=t]
$$

That is the whole gradient: the predicted probability minus a one-hot vector for the target. Logits of wrong tokens are pushed down in proportion to how much probability they hold; the right token's logit is pushed up. Play with it:

<div class="widget not-content" data-w="softmax" data-title="Softmax, cross-entropy and its gradient"></div>

### Information-theoretic reading

The **entropy** of a distribution $q$ is $H(q) = -\sum q_{i}$ log $q_{i}$, the average surprise. The cross-entropy between the data distribution $q$ and the model $p$ is $H(q, p) = -\sum q_{i}$ log $p_{i}$. It decomposes as

$$
H(q,p)=H(q)+\mathrm{KL}(q\,\Vert\,p),\qquad\mathrm{KL}(q\Vert p)=\sum_i q_i\log\frac{q_i}{p_i}\ \ge 0
$$

so minimizing cross-entropy drives the model toward the data distribution, and the **KL divergence** measures the remaining gap. KL reappears in [Chapter 17](/guide/post-training/): preference-tuning methods use it to keep the tuned model close to a reference model.

## Language modeling is next-token prediction

Any sequence of tokens $x_{1}$, …, $x_{n}$ has a probability that factors exactly by the chain rule of probability:

$$
P(x_1,\dots,x_n)=\prod_{t=1}^{n}P\bigl(x_t\mid x_1,\dots,x_{t-1}\bigr)
$$

A **language model** is a function that, given the prefix, outputs $P(x_{t} | prefix)$ over the vocabulary. Training minimizes the average negative log-likelihood of the real next token at every position, over huge amounts of text. Next-token prediction is the main training signal in pretraining; a few models add small auxiliary objectives ([Chapter 9](/guide/full-model/)).

### Perplexity

If the average per-token loss is ℓ (in nats), the **perplexity** is $\exp(ℓ)$. A perplexity of 8 means the model is, on average, as uncertain as if it were choosing uniformly among 8 equally likely tokens. Lower is better, and it is only comparable between models using the same tokenizer and text. Bits per byte is a tokenizer-independent alternative.

## Turning a distribution into text: decoding

-   **Greedy:** always take the argmax. Deterministic but repetitive.
-   **Sampling with temperature:** sample from $\operatorname{softmax}(z / T)$.
-   **Top-k** <cite data-p="fan2018" data-s></cite>: keep only the $k$ most likely tokens, renormalize, sample.
-   **Top-p (nucleus)** <cite data-p="holtzman2019" data-s></cite>: keep the smallest set of tokens whose cumulative probability reaches $p$, renormalize, sample. The set size adapts to how confident the model is.

<div class="widget not-content" data-w="sampling" data-title="Temperature, top-p and top-k"></div>

Notice that the training loss uses $T = 1$ and the full distribution; sampling controls are applied only at generation time.

## Check yourself

<details>
<summary>Derive ∂L/∂z for softmax cross-entropy.</summary>

$L=-z_t+\log\sum_j e^{z_j}$. The first term differentiates to $-\mathbb 1[i=t]$; the second to $e^{z_i}/\sum_j e^{z_j}=p_i$. Sum: $p_i-\mathbb 1[i=t]$.

</details>

<details>
<summary>A model assigns probability 0.25 to the correct token at every position. What are the loss and the perplexity?</summary>

Loss = −ln $0.25 \approx 1.386$ nats; perplexity = $e^{1.386} = 4$.

</details>

<details>
<summary>If temperature is raised, does the model get "smarter" or "more random"?</summary>

More random: the distribution flattens toward uniform. The model's weights and its ranking of tokens are unchanged.

</details>

:::caution[Security link]
Because outputs are sampled, one response proves little. A prompt that is refused 19 times in 20 still yields a harmful completion on the 20th, and an attacker can simply retry. Evaluations must therefore report rates over many samples at the deployed temperature (see [Evaluating models and systems](/guide/evaluation/)). Also, APIs that return log-probabilities leak far more than text; several extraction attacks rely on them ([Chapter 20](/guide/security/)).
:::

## Papers

-   <cite data-p="holtzman2019"></cite> Why pure likelihood decoding degenerates and the case for nucleus sampling.
-   <cite data-p="fan2018"></cite> Top-k sampling.
-   <cite data-p="goodfellow2016"></cite> Chapter 3 (probability and information theory).
-   <cite data-p="prince2023"></cite> Chapter 5 (loss functions).
