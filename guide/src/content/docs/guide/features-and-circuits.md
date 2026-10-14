---
title: "Features, superposition and circuits"
description: "More concepts than dimensions, and the subgraphs that use them"
sidebar:
  label: "23. Features, superposition and circuits"
---

_More concepts than dimensions, and the subgraphs that use them_

Chapter 23 of 24 · VIII. Looking inside · about 50 minutes. Builds on: [6. Attention](/guide/attention/), [22. Reading the residual stream: lenses, probes and attribution](/guide/reading-the-residual-stream/).

:::note[Draft]
This chapter is an outline. Each section lists what it will cover and the papers it will cite.
:::

:::tip[Skip this chapter if]
you can explain why individual neurons are usually polysemantic, describe what a sparse autoencoder is trained to do and how its features are judged, and trace a small circuit such as an induction head through its components.
:::

## Neurons are the wrong unit

- Single neurons often respond to unrelated things; "knowledge neurons" were an early attempt to localize facts to neurons <cite data-p="dai2021" data-s></cite>.
- The working hypothesis instead: concepts are directions in activation space, not individual coordinates <cite data-p="park2023" data-s></cite>.

## Superposition

- A layer with $d$ dimensions can store many more than $d$ sparse features as nearly orthogonal directions, at the cost of interference <cite data-p="elhage2022" data-s></cite>.
- Why sparsity makes this cheap, and why it makes neurons polysemantic.
- Widget idea: the toy-models setup in two dimensions, with a sparsity slider that shows features packing into a pentagon.

## Sparse autoencoders

- Train an overcomplete, sparse dictionary to reconstruct activations; each dictionary direction is a candidate feature <cite data-p="bricken2023" data-s></cite>, <cite data-p="cunningham2023" data-s></cite>.
- Scaling to production models <cite data-p="templeton2024" data-s></cite>, <cite data-p="gao2024" data-s></cite>, and open SAEs for study <cite data-p="lieberum2024" data-s></cite>.
- How features are judged: reconstruction loss, downstream loss when substituted, interpretability of top activations. What none of these guarantees.

## Circuits

- A circuit is a subgraph of heads, MLPs and features that implements a behavior.
- Induction heads as the worked example, tying back to [Chapter 6](/guide/attention/) <cite data-p="olsson2022" data-s></cite>.
- Indirect object identification in GPT-2 small: a circuit found by hand <cite data-p="wang2022" data-s></cite>; automating the search <cite data-p="conmy2023" data-s></cite>.

## Transcoders and attribution graphs

- Transcoders replace an MLP with a sparse, interpretable approximation so features compose across layers <cite data-p="dunefsky2024" data-s></cite>.
- Attribution graphs: tracing a single prompt's computation through features <cite data-p="ameisen2025" data-s></cite>, and what that revealed about planning and multi-step reasoning <cite data-p="lindsey2025" data-s></cite>.
- Pair with the hands-on [investigations](/cases/), which apply these methods to the toy model.

## What is still unsolved

- Reconstruction error ("dark matter"), feature splitting, and whether a dictionary's features are the model's or the method's <cite data-p="sharkey2025" data-s></cite>.

## Check yourself

Planned questions:

- In the toy-models setup, why does lowering feature sparsity reduce how many features fit?
- An SAE feature fires on Golden Gate Bridge text. What test would show the model uses it, rather than it merely correlating?
- Name the two attention heads an induction head depends on, and what each does.

## Papers

- <cite data-p="elhage2022"></cite> Superposition, from first principles.
- <cite data-p="bricken2023"></cite>, <cite data-p="cunningham2023"></cite>, <cite data-p="templeton2024"></cite>, <cite data-p="gao2024"></cite> Sparse autoencoders, small to large.
- <cite data-p="olsson2022"></cite>, <cite data-p="wang2022"></cite>, <cite data-p="conmy2023"></cite> Circuits.
- <cite data-p="dunefsky2024"></cite>, <cite data-p="ameisen2025"></cite>, <cite data-p="lindsey2025"></cite> Transcoders and attribution graphs.
- <cite data-p="sharkey2025"></cite> Open problems.
