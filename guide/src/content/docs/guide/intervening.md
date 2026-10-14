---
title: "Intervening: patching, steering, ablation and editing"
description: "Changing what the model computes, and what that proves"
sidebar:
  label: "24. Intervening: patching, steering, ablation and editing"
---

_Changing what the model computes, and what that proves_

Chapter 24 of 24 · VIII. Looking inside · about 50 minutes. Builds on: [17. Post-training: instruction tuning, preferences and reinforcement learning](/guide/post-training/), [18. Adapting models: LoRA, QLoRA and distillation](/guide/lora/), [20. Attacks on language models and their defenses](/guide/security/), [23. Features, superposition and circuits](/guide/features-and-circuits/).

:::note[Draft]
This chapter is an outline. Each section lists what it will cover and the papers it will cite.
:::

:::tip[Skip this chapter if]
you can design an activation-patching experiment and choose its metric, explain how a steering vector is built and why it works, say what directional ablation of refusal shows about post-training, and name the ways a rank-one fact edit fails.
:::

## From correlation to cause

- Lenses, probes and features ([Chapters 22](/guide/reading-the-residual-stream/) and [23](/guide/features-and-circuits/)) find information. Interventions test whether the model uses it.
- Causal mediation as the framing <cite data-p="vig2020" data-s></cite>.

## Activation patching

- Run a clean and a corrupted prompt, copy one component's activation from one run into the other, and measure how much of the behavior moves.
- Choices that change the answer: corruption method, metric (logit difference vs probability), denoising vs noising <cite data-p="zhang2023patch" data-s></cite>, <cite data-p="heimersheim2024" data-s></cite>.
- Widget idea: a layer-by-position patching heatmap on the toy model, with the metric as a toggle.

## Steering vectors

- Add a direction to the residual stream at inference time to shift behavior, with no weight change <cite data-p="turner2023" data-s></cite>.
- Building the direction from contrasting prompt pairs <cite data-p="panickssery2023" data-s></cite>, <cite data-p="zou2023repe" data-s></cite>.
- Trade-offs: strength vs fluency, and which layer to add at.
- Widget idea: a slider for steering strength on the toy model, showing the output distribution shift.

## Directional ablation and refusal

- In several open-weight chat models, refusal is largely mediated by one direction; projecting it out of every layer's output disables refusal, and adding it induces refusal on harmless prompts <cite data-p="arditi2024" data-s></cite>. Folding the projection into the weights is what "abliteration" refers to.
- What it shows: post-training safety behavior can be shallow and concentrated, a point that agrees with fine-tuning attacks in [Chapter 20](/guide/security/) <cite data-p="qi2023" data-s></cite>.
- Scope for this guide: demonstrate the mechanism on the toy model and discuss the implications for releasing open weights; no recipe for a specific production model.
- Related: erasing a concept from representations and its limits.

## Editing facts in weights

- Locate where a fact is recalled with causal tracing, then apply a rank-one update to one MLP <cite data-p="meng2022" data-s></cite>; batch thousands of edits <cite data-p="meng2022memit" data-s></cite>.
- Contrast with LoRA ([Chapter 18](/guide/lora/)): a broad, trained low-rank change versus a local, solved one.
- How edits fail: localization does not predict where editing works <cite data-p="hase2023" data-s></cite>, edits miss logical consequences <cite data-p="cohen2023" data-s></cite>, and many sequential edits degrade the model <cite data-p="gupta2024" data-s></cite>.

## What interventions do and do not prove

- A successful intervention shows sufficiency in one setting, not that the explanation is complete.
- Off-distribution activations, side effects, and how to evaluate an intervention with the methods from [Chapter 21](/guide/evaluation/).

## Check yourself

Planned questions:

- Patching one head recovers 80% of the logit difference. What else must you check before calling it the mechanism?
- Why does a steering vector built from 100 prompt pairs usually beat one from a single pair?
- Directional ablation removes refusal but leaves capabilities mostly intact. What does that suggest about how post-training changed the model?
- A ROME edit makes the model say the Eiffel Tower is in Rome. Give two questions it may still answer wrongly.

:::caution[Security link]
Directional ablation and weight editing are attacks as well as tools: anyone with the weights can remove a refusal direction or plant a false fact. See [Chapter 20](/guide/security/) for backdoors and fine-tuning attacks, which share the threat model.
:::

## Papers

- <cite data-p="vig2020"></cite>, <cite data-p="zhang2023patch"></cite>, <cite data-p="heimersheim2024"></cite> Activation patching done carefully.
- <cite data-p="turner2023"></cite>, <cite data-p="panickssery2023"></cite>, <cite data-p="zou2023repe"></cite> Steering.
- <cite data-p="arditi2024"></cite> Refusal as a single direction.
- <cite data-p="meng2022"></cite>, <cite data-p="meng2022memit"></cite> Editing facts.
- <cite data-p="hase2023"></cite>, <cite data-p="cohen2023"></cite>, <cite data-p="gupta2024"></cite> Where editing breaks.
