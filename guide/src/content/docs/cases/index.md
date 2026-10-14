---
title: Case files
description: Investigate how a trained language model really computes its answers. Switch parts of it off, change its input, and find the mechanism yourself.
---

A model this small is one you can do more than watch. You can take it apart and work out how it reaches its answers.

Each case starts with something the trained model reliably does, and asks how. You investigate with the same tools researchers use on large models: switch a component off and see what breaks, read what an attention head looks at, and change the input to test your idea. When you think you know the answer, the site checks it by running the experiment on the model. Nothing is scripted. Every number is computed live by the [Model Explorer](/explorer/)'s engine: Case 1 uses the Explorer's own model, and later cases use the case-file model, which has the same architecture but a larger world to learn.

This field is called **mechanistic interpretability**: working out the algorithm a trained model has learned, from its weights and activations. It is one of the main ways researchers try to understand what large models do and why.

## Open cases

1. [The place detector](/cases/place-or-animal/): after “the cat sat on the”, the model always expects a place, never an animal. Find the part of the model that knows. About 10 minutes.
2. [Who gets the ball?](/cases/story-circuit/): in “tom and ann went to the park . ann gave a ball to”, the model always answers tom. Find the two heads that make the choice, and how the model rules out the wrong person. About 20 minutes. Uses the case-file model, which has the same architecture as the Explorer's but a larger world.

You will get more out of the cases after the chapters on [attention](/guide/attention/) and [the transformer block](/guide/transformer-block/), but you do not need them to start.
