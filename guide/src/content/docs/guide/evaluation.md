---
title: "Evaluating models and systems"
description: "Questions, test sets, statistics and the ways evaluations lie"
sidebar:
  label: "21. Evaluating models and systems"
---

_Questions, test sets, statistics and the ways evaluations lie_

Chapter 21 of 21 · VII. Security and evaluation · about 45 minutes. Builds on: [4. Probability, softmax and next-token prediction](/guide/softmax-and-loss/), [20. Attacks on language models and their defenses](/guide/security/).

:::tip[Skip this chapter if]
you can explain why one sampled run proves little, compute a confidence interval for a success rate, say what contamination and saturation do to a benchmark, and describe how to evaluate a defense against an adaptive attacker.
:::

## What an evaluation is for

An evaluation turns a vague question ("is this model good? safe?") into a claim a test can support or refute. A usable claim names the system version and settings, the input distribution, the success criterion, and the quantity reported, which is almost always a rate with its uncertainty. "Can an attacker who controls the text of an email make this agent send data to an outside address?" is testable. "Is it safe?" is not.

Different questions need different evaluations: capability (can it do the task?), robustness (does it still do it under perturbation?), refusals (does it decline what it should, and only that?), security (can an attacker make it misbehave?), privacy (does it leak training data?), calibration (does stated confidence match accuracy?), and cost and latency.

## Benchmarks and how they fail

Standard benchmarks include MMLU, a multiple-choice test across 57 subjects <cite data-p="hendrycks2020" data-s></cite>, HELM, which reports many metrics across many scenarios rather than one score <cite data-p="liang2022" data-s></cite>, and code benchmarks scored by running unit tests <cite data-p="chen2021" data-s></cite>. Each has known failure modes:

- **Saturation.** When top models approach the ceiling, remaining differences are mostly label errors and noise.
- **Contamination.** Pretraining corpora are scraped from the web, so public test items, or paraphrases of them, can end up in training data, and a model can score well by remembering. Mitigations: private held-out sets, freshly written or dynamically generated items, canary strings that reveal whether a test set was trained on, and checking whether performance drops on rephrased items.
- **Prompt sensitivity.** Changing spacing, separators or option labels can change scores substantially <cite data-p="sclar2023" data-s></cite>. Either fix and disclose the format, or report across several formats.
- **Averages hide structure.** Report per-category results; a model can improve on average while regressing on the cases you care about.
- **LLM-as-judge.** Using a model to grade answers scales, and <cite data-p="zheng2023" data-s></cite> report agreement with human raters comparable to agreement between humans in their setting. But judges show position bias, verbosity bias and self-preference. Validate any judge against human labels on your own task and report the agreement.

## Sampling, pass@k, and retries

Model outputs are sampled ([Chapter 4](/guide/softmax-and-loss/)), so the same prompt can succeed on one run and fail on the next. For tasks with a checkable outcome, draw $n$ samples per prompt and count $c$ successes. The probability that at least one of $k$ samples would succeed, **pass@$k$**, has an unbiased estimator <cite data-p="chen2021" data-s></cite>:

$$
\text{pass@}k \;=\; 1-\frac{\binom{n-c}{k}}{\binom{n}{k}}
$$

For safety the logic is inverted: an attacker who can retry gets $k$ attempts. If a single attempt succeeds with probability $p$, then $k$ independent attempts succeed at least once with probability

$$
1-(1-p)^k
$$

A 2% per-attempt success rate becomes 64% after 50 attempts. A defense that "usually works" is a weak defense against someone who can retry.

## Statistics you need

### A rate needs an interval

If $x$ of $n$ trials succeed, the point estimate is $x / n$, but with small $n$ it is very uncertain. The **Wilson interval** is a good default for a proportion. With $\hat p = x / n$ and $z = 1.96$ for 95% confidence:

$$
\frac{\hat p+\frac{z^2}{2n}}{1+\frac{z^2}{n}}\;\pm\;\frac{z}{1+\frac{z^2}{n}}\sqrt{\frac{\hat p(1-\hat p)}{n}+\frac{z^2}{4n^2}}
$$

Unlike the textbook normal approximation, it never leaves [0, 1] and stays accurate when $n$ is small or $\hat p$ is near 0 or 1. Try it:

<div class="widget not-content" data-w="ci" data-title="How wide is the uncertainty on a rate?"></div>

### How many trials?

Half-width $w$ for a rate $p$ needs roughly $n = z^{2}\cdot p(1-p) / w^{2}$ trials. The worst case $p = 0.5$ gives $n \approx 385$ for $\pm 5$ points and $n \approx 2,400$ for $\pm 2$ points. For rare failures, use the **rule of three**: if you observe zero failures in $n$ trials, the 95% upper bound on the failure rate is about $3 / n$, so showing a failure rate below 1% needs about 300 clean trials, and below 0.1% needs about 3,000.

### Comparing two systems

Do not compare two models by checking whether their separate intervals overlap. Evaluate both on the same items and compute the confidence interval for the **paired difference**, which is much tighter because item difficulty cancels. If items come in clusters (many questions about the same passage), standard errors must account for the clustering. <cite data-p="miller2024" data-s></cite> lay out these corrections, along with power analysis, for language model evals. When you compute many metrics, a few will look significant by chance; correct for multiple comparisons or pre-register the one you care about.

## Building a benchmark

When no benchmark measures what you need, build one:

1. **Define the construct.** What exactly is being measured, and what would count as a failure?
2. **Write items** that cover the construct's range, including hard cases and benign controls (to measure false alarms and over-refusal).
3. **Write labeling guidelines** and have at least two people label a sample independently.
4. **Measure agreement.** Cohen's kappa corrects raw agreement $p_{o}$ for the agreement $p_{e}$ expected by chance:

$$
\kappa=\frac{p_o-p_e}{1-p_e}
$$

   Low kappa means the construct or the guidelines are ambiguous; fix that before measuring models.
5. **Split** into development items (use freely) and test items (touch rarely), freeze and **version** the test set, and keep it out of anything that could end up in training data.
6. **Document and refresh.** Record how items were made and what the benchmark does not cover, and replace items as models saturate it.

## Evaluating security properties

Security evaluation has all the issues above plus an adversary who responds to your defense.

- **Start from a threat model** ([Chapter 20](/guide/security/)): what the attacker can do, what counts as success, what is the worst realistic outcome. Define success so that it is automatically checkable: a canary string appears in the output, a particular tool call was made, a file changed.
- **Report attack success rate with an interval**, over many trials, at the settings you deploy. Include benign controls to measure false positives and utility cost, since a defense that blocks everything has perfect security and no use.
- **Evaluate against adaptive attackers.** A defense tested only against fixed, known attacks overstates its robustness. <cite data-p="carlini2019" data-s></cite> give a checklist for adversarial-robustness evaluations: attack the defense itself (not the undefended model), try gradient-free and adaptive attacks, state the attacker's budget, and treat a defense as broken until it withstands a serious attempt.
- **Combine automated and manual red teaming.** Language models can generate attack prompts at scale <cite data-p="perez2022" data-s></cite>, and standardized harnesses make attack success rates comparable across defenses and models <cite data-p="mazeika2024" data-s></cite>. Human creativity still finds attacks that automated search does not.
- **State what you did not test.** A finding is positive evidence. Failing to find an attack is not proof there is none; say what was covered, with what budget, against which versions.
- **Make it reproducible.** Pin the exact model artifact (by hash), the chat template, quantization, serving stack, temperature and seeds, and save transcripts. Changing any of these can change results (Chapters [12](/guide/flashattention/) and [15](/guide/low-precision/)).

## A checklist of common mistakes

| Mistake | Fix |
| --- | --- |
| One sample per prompt | Many samples; report rates |
| Point estimates only | Report confidence intervals |
| Tuning on the test set | Hold out a test set; touch it rarely |
| Judge model never validated | Compare with human labels; report agreement |
| Defense tested only against old attacks | Adaptive attacks; report the attack budget |
| Measuring attack success but not utility | Report both; include benign controls |
| Evaluating a different artifact than the one deployed | Same weights, template, precision, serving stack |
| Public benchmark assumed clean | Test for contamination; use private or fresh items |

## Check yourself

<details>
<summary>You observe 3 successes in 20 trials. Is "15%" a reliable estimate?</summary>

No. The 95% Wilson interval is roughly 5% to 36%. With 20 trials you cannot distinguish a rare failure from a common one.

</details>

<details>
<summary>A model passes a safety test 49 times out of 50 at the deployed temperature. Is it safe against a user who can retry freely?</summary>

Not necessarily. The per-attempt failure rate is about 2% (with a wide interval), so after 50 attempts there is about a 64% chance of at least one failure. The relevant quantity for a retrying attacker is $1 - (1 - p)^k$.

</details>

<details>
<summary>Why compare models on a paired difference rather than on separate intervals?</summary>

Both models face the same items, so item difficulty is shared noise. The paired difference removes it, giving a much narrower interval for the thing you care about: which model is better.

</details>

## Papers

- <cite data-p="miller2024"></cite> The statistics of language model evals, in one readable paper.
- <cite data-p="carlini2019"></cite> How to evaluate a defense without fooling yourself.
- <cite data-p="liang2022"></cite> Multi-metric evaluation.
- <cite data-p="chen2021"></cite> pass@$k$ and code evaluation.
- <cite data-p="zheng2023"></cite> Using models as judges, with their biases.
- <cite data-p="sclar2023"></cite> Prompt-format sensitivity.
- <cite data-p="perez2022"></cite>, <cite data-p="mazeika2024"></cite> Automated red teaming.
- <cite data-p="hendrycks2020"></cite> A widely used knowledge benchmark.
