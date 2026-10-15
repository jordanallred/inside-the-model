---
title: Methods, evidence and limitations
description: How the model experiments are computed and checked, what the results establish, and how corrections and reviews are handled.
---

Inside the Model teaches investigation through working computations. Its claims should be inspectable, reproducible and limited to the evidence actually collected.

## Three kinds of evidence

| Surface | What produces the result | What it does not establish |
| --- | --- | --- |
| Six guided browser investigations | A trained 4,496-parameter, two-layer transformer, computed locally | General behavior or capabilities of production LLMs |
| Who gets the ball? | A second teaching model with a larger synthetic vocabulary and grammar | That a large model learns the same circuit |
| GPT-2 causal replication | A pinned 124-million-parameter checkpoint, executed on CPU; downloadable measurements | The complete mechanism behind GPT-2's behavior, or any particular modern assistant |

Architecture teardowns describe published configurations and reports. They do not expose those models' live activations. Charts used to explain an abstract mechanism should be distinguished from values computed by a trained model.

## Reproduce the browser model

The [NumPy reference](/code/itm_model.py), [trained weights](/trace/weights.json), [architecture](/trace/model.json), and [canonical traces](/trace/golden.json) are downloadable. [Reproduce the forward pass](/labs/explorer-forward-pass/) explains how to compare them. The browser calculations are checked against the independent reference to a tolerance of 1e-9; hand-written gradients are checked against finite differences.

The [release evidence manifest](/trace/evidence-manifest.json) records source hashes, measured experiment outcomes and transfer-bank results. It identifies what was run and the artifacts used; it is not a certificate of scientific correctness. The [public repository](https://github.com/jordanallred/inside-the-model) contains verification commands and their history.

## A bridge to a larger model

The [GPT-2 causal check](/replications/gpt2-causality/) reports two prefix/suffix comparisons, changed-prefix positive controls, a pinned model revision, a weights hash, environment versions and measured results. Download the script or notebook to rerun it. Browser visitors see saved results from that execution; GPT-2 does not run in this page.

## Interpret interventions carefully

- Removing a head's output can show necessity under that intervention. Downstream computations also change.
- Retaining one head while removing other head outputs tests sufficiency relative to those interventions. The rest of the model still matters.
- Attention weights alone do not identify a causal mechanism.
- A small set of successful probes cannot prove a universal rule. Counterfactual prompts can lie outside the training grammar.
- Token probability is not factual accuracy. Sampling settings can change confidence without learning.

## Authorship and review status

The site is maintained through [the public source repository](https://github.com/jordanallred/inside-the-model) and its [contribution history](https://github.com/jordanallred/inside-the-model/graphs/contributors). Content and software development are AI-assisted. Automated tests and independent code-review passes are release checks; they are not independent human scientific review.

No external expert endorsement or validated learning-efficacy study is claimed. When an external technical review is obtained, the public record should name the reviewer with permission, their relevant background, the exact pages or revision reviewed, the date, and the scope of their conclusions. Until such a record exists, treat that review as pending.

## Corrections and maintenance

Use the page-level report link for factual errors, confusing explanations, broken controls or reproduction failures. Include the source, exact input and intervention when relevant. Substantive corrections belong in [What's new](/changelog/) with the affected result and reason for the change. A change to a measured claim should include a reproducible check before publication.

Published results remain tied to their source/model versions. A new model revision requires rerunning the relevant experiment rather than retaining old numbers under a new label. Publication cadence follows verification and review capacity; there is no claim that every new paper will be covered.

## Local data and sharing

The six guided cases store progress and the optional notes stores free-form notes plus the latest 200 learning-activity events in local browser storage. Events identify the case and action, time, elapsed page time, and assessment attempt/outcome; they do not copy prompts or note text into the timeline. Notes contain whatever you write in the fields. The notebook's export includes activity only when selected.

There is no account, remote inference dependency or learning-analytics submission for these tools. Hosting providers may retain ordinary request logs; the website does not control their policies. External links and the optional model-download notebook contact their respective providers. Clearing browser data removes local records. Use notebook backups for portability, and review free text before sharing it manually.
