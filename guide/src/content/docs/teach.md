---
title: Teach with the investigations
description: A ready-to-run workshop for developers, with learning objectives, timing, discussion prompts and instructor notes.
---

Give learners a model they can interrogate and a question worth resolving. This workshop is designed for software developers familiar with using LLMs who have not studied their internals. Browser experiments need no installation, account or GPU.

## What learners should be able to do

By the end, ask learners to demonstrate four skills: make a falsifiable prediction, change one candidate cause at a time, report a numerical observation, and limit a conclusion to what the experiment supports. Completing a page is not evidence of all four skills; use the independent task below.

## A 60-minute workshop

| Time | Activity | Instructor's job |
| --- | --- | --- |
| 0–5 min | Ask how an LLM chooses a next token. Record starting explanations. | Collect predictions without correcting them yet. |
| 5–20 min | Pairs complete [The place detector](/cases/place-or-animal/). One person predicts; the other operates the controls. | Ask what each experiment changes and what stays fixed. |
| 20–32 min | Work through [Choose the control](/cases/choose-the-control/). Swap roles. | Ask why a confounded experiment can change an answer without resolving a hypothesis. |
| 32–44 min | Try [Necessary—and sufficient?](/cases/necessary-and-sufficient/). | Ask which other model operations remain active. |
| 44–54 min | Independently design and run a new comparison; keep notes if useful. | Observe without suggesting the next control. |
| 54–60 min | Compare conclusions and limitations. | Discuss a counterexample that would change each explanation. |

For 90 minutes, add [What training changes](/cases/what-training-changes/), [The hidden future](/cases/hidden-future/) or [Confidence without learning](/cases/confidence-without-learning/), based on the group's questions. Use [Who gets the ball?](/cases/story-circuit/) as a longer follow-up: it uses a second model and a more open investigation.

## An independent task

Ask each learner to propose an input comparison using only the teaching model's vocabulary that distinguishes a verb-based explanation from a preposition-based explanation. They must predict both outcomes before running either input, record both probabilities, and explain what a contrary result would mean.

Do not give the example pair while assessing transfer. Choose inputs the learner has not already seen. A repeat attempt after seeing a result is practice and should be described as such. The site offers three worked examples per case without grading. They are available to readers, so do not use them as unseen assessment items.

## A discussion rubric

| Dimension | Evidence to look for | Follow-up when missing |
| --- | --- | --- |
| Prediction | An expected numerical direction or named distribution change, recorded before reveal | “What would you expect if your explanation were wrong?” |
| Control | One candidate cause changes; other relevant variables stay fixed | “Could either of those two changes explain this result?” |
| Observation | Actual values, the input and the intervention are recorded | “Which measurement separates the hypotheses?” |
| Conclusion | The claim matches the tested context and acknowledges a limitation | “What have you not established?” |

Use this formative rubric to guide discussion. It has not been validated as a measure of ability.

## Instructor notes and expected observations

<details><summary>Reveal instructor notes after planning the session</summary>

- **Place detector:** removing layer 0, head 1 takes place probability below 10% on the starting prompt. The browser shows the current model's exact values. The informative input design replaces sat with saw, then separately replaces on with and. Both probes preserve token positions; the and probe is outside the training grammar.
- **Training:** compare the same target under two weight sets. A lower loss for one target does not establish overall superiority. Some transfer examples deliberately use an unusual target, so reasoning from the measurement matters.
- **Future:** suffix changes preserve the selected prefix distribution within tolerance. The [GPT-2 replication](/replications/gpt2-causality/) adds a changed-prefix positive control and a larger model.
- **Sufficiency:** retaining the candidate head among attention heads preserves the tested preference. Embeddings, MLPs and other operations remain. Do not shorten the conclusion to “this head is the model.”
- **Temperature:** probabilities change while the ranking and weight checksum remain fixed. Distinguish the distribution from an individual random sample.

</details>

## Materials and practical preparation

Open the cases before the session and check the live controls on the devices learners will use. Provide the [methods and limitations](/methods/), [local starter project](/run-locally/), and [downloadable GPT-2 notebook](/code/gpt2-causality.ipynb) for follow-up. The GPT-2 notebook needs a Python environment, network access for its first model download and substantially more memory than the browser model; it is not required for the workshop.

Learners can download Markdown notes or JSON backups. Sharing is optional and manual. Ask them to review free-text notes before sending them to you. A print or PDF of this page can serve as the instructor handout; the experiment links remain the working materials.
