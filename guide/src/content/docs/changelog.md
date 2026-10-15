---
title: What's new
description: New chapters, tools, corrections and fixes to Inside the Model, newest first.
---

New chapters, teardowns, tools and corrections, newest first. Follow along with the [RSS feed](/rss.xml) in any feed reader.

Found a mistake? Every page ends with a link to report it, and corrections are listed here.

## 2026-10-15: Browser first, with a local project when you need it

Removed the Notes editor, its navigation links and local activity recording. Experiments still run in the browser and retain their input settings. Previously saved notes are left untouched in browser storage.

[Run the model in your IDE](/run-locally/) offers one ZIP with the reference model, weights, configuration, an editable experiment and locked Python dependencies. Extract it, open the folder and run two uv commands. The browser remains the starting point; local development is optional.

## 2026-10-15: Open workbenches for practical model reasoning

The six investigations now expose editable prompts and measured results immediately. Explanations and worked comparisons are freely available; the Explorer and story-circuit case also use open explanations instead of scored quizzes or unlocks. Settings and exploration history stay local, and older saved progress remains readable.

[Investigate a changed LLM response](/investigate/) connects the experiments to development questions: separate sampling changes from weight changes, preserve token positions, compare interventions, and state the limits of a conclusion. The [GPT-2 replication](/replications/gpt2-causality/) now accepts your own validated prefix, suffixes and positive control in both Python and its notebook.

**Scientific correction:** the control-design example now substitutes `on` with `and` rather than deleting `on`. Deletion also shifted later token positions and could not isolate the intended comparison. The replacement preserves positions but remains outside the training grammar; that limitation is explicit. The random-weight comparison now explicitly identifies its reference as a separate initialization rather than the model’s original training checkpoint.

## 2026-10-15: Explore freely, keep simple notes, and develop with Astral

Investigations now offer a direct route into the experiment without recording a prediction. Feedback focuses on measured results rather than scores. Notes (retired) is an optional, autosaved scratchpad; older structured notes and JSON backups still open. Backup and restore controls stay out of the writing area.

Fixed a stale-tab bug that could erase completed progress and exposure history. Invalid prompts now stay editable and clearly identify the last valid result. Glossary definitions have native keyboard-operable buttons, and long reference navigation stays collapsed until needed.

The new [Python tools guide](/python-tools/) recommends Astral’s uv, Ruff and ty, with isolated NumPy setup and project commands. The [GPT-2 replication](/replications/gpt2-causality/) now gives uv setup commands. Code files download as attachments.

## 2026-10-14: Design experiments, keep evidence, and reproduce GPT-2

Three new guided cases teach [experimental controls](/cases/choose-the-control/), [conditional sufficiency](/cases/necessary-and-sufficient/), and [temperature without learning](/cases/confidence-without-learning/). The first case now requires choosing a discriminating experiment. Three verified transfer variants rotate before reuse; repeated examples are marked as practice.

The evidence notebook (retired) keeps local observations and offers Markdown/JSON backups, with optional learning-activity export for [beta sessions](/beta/). A [workshop pack](/teach/) and [methods record](/methods/) support teaching and review. The [GPT-2 replication](/replications/gpt2-causality/) includes executed CPU results, positive controls, pinned weights, a Python script and a runnable notebook.

## 2026-10-14: Investigate a working model

The site now starts with [guided investigations](/cases/): **The place detector**, **What training changes**, and **The hidden future**. Make a prediction, run an experiment on the teaching transformer, inspect the evidence, and test your explanation on a fresh example. Progress saves locally, with a next case and focused links into the Explorer, chapters, and labs. The place detector now requires an experiment and a fresh-example prediction to complete; earlier progress is recognized without skipping the new assessment.

## 2026-10-13: Report a problem from any page

Every page now ends with a **Report a problem with this page** link that opens a prefilled report on GitHub, where anyone can see it and follow the fix. The guide is free for noncommercial use: the text is licensed CC BY-NC-SA 4.0 and the code PolyForm Noncommercial 1.0.0. This page and its RSS feed are new too.

## 2026-10-13: Fixes from an audit of every widget

**Start over** now resets the training microscope, the comparison page and the Explorer quiz. The confidence-interval slider reaches exactly 5 and 2000 trials, and the mixture-of-experts top-k slider stops at the model's expert count. The tokenizer widget no longer shows NaN for empty text, and the sliding-window widget no longer freezes on an empty sentence. The decode-speed scenarios now match what the model can show, with a new "No cache: compute binds" scenario.

## 2026-10-12: A new Model Explorer and homepage

The [Model Explorer](/explorer/) now leads with the model's prediction. Click any word to follow it, and use the step map to move through the input, each layer's attention and MLP, and the output. Every step is drawn: vectors that visibly add up, attention arcs, the GELU curve with the token's hidden units on it, and ranked next-word bars. Existing links to a step keep working. The homepage now opens with a live trace from the same model.

## 2026-10-12: Every chapter widget rebuilt

Each widget now uses the interaction that makes its idea visible. Drag the start point and play gradient descent, draw your own target for the MLP, race optimizers, step through BPE merges, hover any attention number for its arithmetic, flip floating-point bits, drag a quantization outlier, or repeat an experiment 40 times to see what a confidence level means. Every widget works with a keyboard and at phone width.

## 2026-10-12: First release

The first public version of the guide: 21 chapters from gradient descent to evaluation, the Model Explorer with a 26-operation forward pass checked against an independent NumPy implementation to within 1e-9, 10 hands-on labs, layer-by-layer teardowns of gpt-oss-120b and DeepSeek-V3, public AI security guidance from NSA, CISA and allied agencies, and an index of 118 cited papers.
