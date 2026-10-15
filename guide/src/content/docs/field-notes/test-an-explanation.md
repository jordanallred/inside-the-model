---
title: How do you test an attention-head explanation?
description: A heatmap suggests a hypothesis. Controlled interventions, counterexamples and explicit limits make the explanation testable.
---

An attention heatmap can suggest a story: this word attends to that word, so perhaps that connection explains the prediction. The story is a hypothesis. You still need a measurement that could show it is wrong.

## Define the behavior before interpreting the picture

In [The place detector](/cases/place-or-animal/), the behavior is probability assigned to a set of place words after a particular input. “The model seems to understand places” is too broad to be the measured outcome. Recording the exact input, head intervention and probability gives an explanation something specific to account for.

## Ask the explanations to disagree

Suppose the input ends in **sat on the**. A verb-based explanation and a preposition-based explanation both fit that example. Changing the verb and deleting the preposition together could change the prediction without distinguishing those explanations.

A better design changes one candidate cause at a time. [Choose the control](/cases/choose-the-control/) lets you compare these designs and see their actual measurements. Counterfactual prompts can leave the training grammar, so the conclusion must retain that limitation.

## Separate necessity from sufficiency

Zeroing a head's output and seeing the behavior collapse supports necessity under that intervention. It does not establish that the head independently implements the whole behavior. Try [Necessary—and sufficient?](/cases/necessary-and-sufficient/) to compare removal with retaining the candidate among attention heads while other model operations remain.

## Keep a claim small enough to challenge

A useful conclusion might say: “For these inputs and head-output interventions, this component's output is necessary for the measured place preference.” A useful next question asks where that statement fails.

Record the observation, alternative explanation and failure test in your [evidence notebook](/notebook/?case=controls). The [interventions chapter](/guide/intervening/) discusses the broader methods; [methods and evidence](/methods/) records the limits of this site's experiments. The aim is to produce an explanation another person can reproduce and contest.
