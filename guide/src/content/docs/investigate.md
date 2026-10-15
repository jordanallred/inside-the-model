---
title: Investigate a changed LLM response
description: "A practical workflow for developers: distinguish sampled text, next-token probabilities and model changes, then design a controlled comparison."
---

An answer changed. Was it the prompt, the sampling settings, a different model version, or something else? Start by choosing an observation you can actually compare. A plausible explanation becomes useful when it tells you what test to run next.

Inside the Model helps you practice that reasoning on an inspectable transformer, then reproduce a controlled comparison on pinned GPT-2 weights. The browser model is a small teaching instrument. It does not diagnose a hosted assistant's hidden implementation.

## Separate the observations

**Generated text** is the result of a sequence of token selections. Two different continuations do not, by themselves, establish that the weights or next-token probabilities changed.

**A next-token distribution** belongs to a specific token prefix, model and set of inference conditions. Comparing it requires keeping that prefix fixed. Once a sampled token differs, the later prefixes differ too.

**A weight update** changes the model's learned parameters. Adjusting positive temperature rescales the logits used for sampling; it does not perform a training update. A higher probability is not the same observation as greater factual accuracy.

Open [Confidence without learning](/cases/confidence-without-learning/), change the temperature and prompt, and compare the distributions. Then use the [sampling sandbox](/guide/softmax-and-loss/#turning-a-distribution-into-text-decoding) to explore token selection.

## Choose the next test

| What you observe | A comparison worth making | What that result would leave open |
| --- | --- | --- |
| The answer changed after a settings change | Hold the exact input and model version fixed. Compare the settings separately; repeat sampling when evaluating generated text. | One sample cannot establish a change in accuracy. A provider may not expose full logits or a stable backend. |
| Two prompt edits changed the behavior | Restore the baseline, then make each edit separately. Inspect tokenization and positions. [Build a prompt pair](/cases/choose-the-control/). | A word edit can change several token IDs or positions. A successful probe does not establish a universal linguistic rule. |
| An attention map appears to explain an answer | Compare a component intervention with the intact model, then repeat in another context. [Inspect a head](/cases/place-or-animal/). | Reading a position is not proof that its content causes the answer. Later-layer vectors already contain context. |
| Removing a component breaks the output | State the behavior threshold, then compare removal with retention under specified interventions. [Test necessity and sufficiency](/cases/necessary-and-sufficient/). | Retaining one head does not remove embeddings, MLPs, normalization or residual paths. |
| A fine-tune lowers the loss on an example | Compare the same targets and a fixed held-out set. [Inspect target-token loss](/cases/what-training-changes/), then [study evaluation](/guide/evaluation/). | Lower loss on one target does not establish better task success or broader quality. |
| Scores appear to use words that come later | Check the measured position and the exact visible token prefix. [Change a suffix](/cases/hidden-future/). | A newly generated answer can use a later instruction because that instruction is already in its prefix. |

For an application-level comparison, retain the actual model/version identifier, request input or template version, generation settings and returned observations. Use stable identifiers or seeds where available, while checking the provider's documented guarantees. If backend version or tokenization is hidden, make that uncertainty part of the conclusion.

## A worked control: content and position

After `the cat sat on the`, the teaching model strongly favors a place. Two candidate explanations concern `sat` and `on`.

In [Choose the control](/cases/choose-the-control/), compare these inputs:

1. Baseline: `the cat sat on the`.
2. Replace only `sat` with `saw`: `the cat saw on the`.
3. Restore the baseline, then replace only `on` with `and`: `the cat sat and the`.

Each prompt has the same number of tokens, and the unchanged words remain at the same positions. The workbench computes all probabilities from the published weights. The verb substitution sharply changes the place signal; the `on` substitution mostly preserves it.

That supports a narrow conclusion about these token substitutions in this trained model. It does not establish that the verb alone implements the algorithm, or that prepositions never matter. The `and` prompt also lies outside the training grammar. Deleting `on` would be a different experiment: it shifts the final token's position as well as removing a word.

Try your own pair in the workbench. Inspect both the input and the output, and ask what alternative explanation your comparison would distinguish.

## Reproduce a comparison on GPT-2

The [published causal-mask experiment](/replications/gpt2-causality/) includes pinned weights, measured positive controls, code and requirements. After the uv setup on that page, this command runs another comparison:

```sh
uv run --no-project python replicate_gpt2_causality.py --prefix "The dog ran" --suffix-a " to the park" --suffix-b " to the beach" --control-prefix "The cat ran" --output my-causal-check.json
```

The spaces at the start of the suffixes are intentional. The script tokenizes the complete texts, verifies that the prefix tokens and positions are unchanged, requires equal token counts, and rejects identical suffixes. The changed-prefix control must produce a detectable change, so an insensitive measurement cannot pass silently.

Edit the arguments to test a hypothesis of your own. The output records the actual token IDs, model revision, weights hash, environment and numerical differences. It tests causal information flow at the selected position; it does not explain every behavior of GPT-2 or a modern assistant.

## Follow the question further

[Download the local model project](/run-locally/) when you want to set a breakpoint or change the code. Use the [Model Explorer](/explorer/) when you want to trace the actual arithmetic, and [reproduce the forward pass](/labs/explorer-forward-pass/) when you want to implement it. [Methods and provenance](/methods/) describe what is checked and what remains unvalidated.

Other resources serve complementary needs: [Transformer Explainer](https://poloclub.github.io/transformer-explainer/) visualizes GPT-2's architecture; the [Hugging Face course](https://huggingface.co/learn/llm-course/chapter1/1) teaches its model and training ecosystem; [ARENA](https://www.arena.education/) provides a broader technical AI-safety curriculum. Here, the focus is the controlled comparison between a behavior and an explanation.
