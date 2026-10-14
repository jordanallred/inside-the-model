---
title: "Reading the residual stream: lenses, probes and attribution"
description: "What the model has worked out at each layer, and how to tell"
sidebar:
  label: "22. Reading the residual stream: lenses, probes and attribution"
---

_What the model has worked out at each layer, and how to tell_

Chapter 22 of 24 · VIII. Looking inside · about 40 minutes. Builds on: [7. The transformer block](/guide/transformer-block/), [9. The full model and its training loop](/guide/full-model/).

:::note[Draft]
This chapter is an outline. Each section lists what it will cover and the papers it will cite.
:::

:::tip[Skip this chapter if]
you can explain why the residual stream can be read with the unembedding at any layer, say what a linear probe's accuracy does and does not show, and decompose a logit into contributions from individual heads and MLPs.
:::

## The residual stream as a shared workspace

- Recap from [Chapter 7](/guide/transformer-block/): every block reads from and adds to one running vector per position, so the final logits are a sum of contributions <cite data-p="elhage2021" data-s></cite>.
- Consequence: anything written early is still there late unless something cancels it, which is what makes layer-by-layer reading possible.
- MLPs as key-value memories that write into the stream <cite data-p="geva2020" data-s></cite>.

## The logit lens and the tuned lens

- Apply the final norm and unembedding to an intermediate layer's residual and read off a next-token distribution <cite data-p="nostalgebraist2020" data-s></cite>.
- Where it works (the answer sharpens across layers) and where it fails (early layers live in a different basis).
- The tuned lens: a learned affine map per layer that fixes the basis mismatch <cite data-p="belrose2023" data-s></cite>.
- Widget idea: run the toy model from the [Model Explorer](/explorer/) and show the lens distribution at every layer for one prompt.

## Linear probes

- Train a linear classifier on activations to predict a property (part of speech, truth value, a place) <cite data-p="alain2016" data-s></cite>.
- What high accuracy shows: the information is linearly decodable. What it does not show: that the model uses it.
- Control tasks and selectivity <cite data-p="hewitt2019" data-s></cite>; the broader critique <cite data-p="belinkov2021" data-s></cite>.
- Linear structure for truth in real models <cite data-p="marks2023" data-s></cite>, and the linear representation hypothesis stated precisely <cite data-p="park2023" data-s></cite>.

## Direct logit attribution

- Because the stream is a sum, each head's and MLP's output can be projected onto the unembedding direction of a token to get its direct contribution to that logit.
- The caveat: direct effects miss indirect ones (a head that matters only because a later head reads it), which motivates the causal methods in [Chapter 24](/guide/intervening/).
- Widget idea: a stacked bar of per-component contributions to the top logit in the toy model.

## Check yourself

Planned questions:

- Why does the logit lens give nonsense at layer 0 of some models but not others?
- A probe for "is a country" reaches 98% accuracy at layer 4. What experiment would show whether the model uses that information?
- Write the logit for token $t$ as a sum over components, and name the term direct logit attribution ignores.

## Papers

- <cite data-p="elhage2021"></cite> The residual-stream view of a transformer.
- <cite data-p="nostalgebraist2020"></cite>, <cite data-p="belrose2023"></cite> Reading intermediate layers as predictions.
- <cite data-p="alain2016"></cite>, <cite data-p="hewitt2019"></cite>, <cite data-p="belinkov2021"></cite> Probes and their limits.
- <cite data-p="marks2023"></cite>, <cite data-p="park2023"></cite> Linear structure in representations.
