---
title: "Attacks on language models and their defenses"
description: "A lifecycle map of attacks, with the papers behind each"
sidebar:
  label: "20. Attacks on language models and their defenses"
---

_A lifecycle map of attacks, with the papers behind each_

Chapter 20 of 24 · VII. Security and evaluation · about 60 minutes. Builds on: [11. Grouped-query and latent attention](/guide/gqa-and-mla/), [19. Prompting, retrieval, tools, agents and MCP](/guide/applications/).

:::tip[Skip this chapter if]
you can derive FGSM, explain how PGD and GCG extend it, distinguish jailbreaks from prompt injection and describe a privilege-separated defense, and name the main training-time, privacy and serving-time attacks with a paper for each.
:::

## A map of the attack surface

Every chapter so far ended with a security note. This chapter collects them in one structure. Organize any assessment by **lifecycle stage** and **attacker capability**:

| Stage | Attacker can… | Attack families |
| --- | --- | --- |
| Inference | send inputs; maybe read outputs or log-probabilities | evasion (adversarial examples), jailbreaks, prompt injection, extraction, membership inference |
| Training and data | contribute data or fine-tuning examples | poisoning, backdoors, safety removal |
| Artifacts | publish or modify files, templates, adapters | malicious serialization, tampered weights, typosquatting |
| Serving | share infrastructure with victims | timing and packet-size side channels, batch interference |
| Application | plant text the model will read | indirect prompt injection, excessive agency |

## 1\. Evasion: adversarial examples

### FGSM, derived

This uses only [Chapter 1](/guide/gradient-descent/)'s calculus. A classifier has loss $L(x, y)$. We want a small input change $\delta$, limited to $\lVert \delta \rVert _{\infty} \le \epsilon$ (no coordinate moves more than $\epsilon$), that increases the loss as much as possible. First-order Taylor expansion in $x$:

$$
\begin{aligned}L(x+\delta,y)&\approx L(x,y)+\nabla_xL\cdot\delta\\\max_{\lVert\delta\rVert_\infty\le\epsilon}\nabla_xL\cdot\delta&\ \Longrightarrow\ \delta_i=\epsilon\,\operatorname{sign}\Bigl(\frac{\partial L}{\partial x_i}\Bigr)\\x_{\text{adv}}&=x+\epsilon\,\operatorname{sign}\bigl(\nabla_xL(x,y)\bigr)\end{aligned}
$$

That is the Fast Gradient Sign Method <cite data-p="goodfellow2014" data-s></cite>. Why does it work against networks that seem robust? In $d$ dimensions, a change of $\epsilon$ per coordinate along $\operatorname{sign}(w)$ shifts a linear score by $\epsilon \lVert w\rVert _{1}$, which grows with $d$ even though each coordinate barely changes. Explore it:

<div class="widget not-content" data-w="fgsm" data-title="Small changes in many dimensions add up"></div>

### PGD and robust training

Applying FGSM repeatedly in small steps, and projecting back into the $\epsilon$-ball after each, is **projected gradient descent (PGD)**, the standard strong attack. <cite data-p="madry2017" data-s></cite> frame defense as a min–max problem, min over weights of the worst-case loss over perturbations, and approximate the inner maximization with PGD during training ("adversarial training"). It is the most reliable known defense and costs several times normal training; always report accuracy under a stated $\epsilon$ and norm.

### Language models: discrete inputs

Tokens are discrete, so you cannot take a small step in input space. **GCG** <cite data-p="zou2023" data-s></cite> uses the gradient of the loss with respect to token one-hot vectors to propose candidate token swaps, tests them, and keeps the best, optimizing a suffix that makes an aligned model begin its answer with an affirmative response. The resulting suffixes transferred across models, including closed ones.

## 2\. Jailbreaks and prompt injection

-   **Jailbreak:** the user tricks the model into violating its own policy. <cite data-p="wei2023" data-s></cite> attribute success to two failure modes: _competing objectives_ (helpfulness pulls against refusal, so prompts that make refusing look unhelpful work) and _mismatched generalization_ (safety training did not cover inputs such as encodings or low-resource languages that the capable model still understands).
-   **Prompt injection:** a third party plants instructions in content the application feeds the model <cite data-p="greshake2023" data-s></cite>. The user is a victim, not the attacker. The deepest issue is architectural (Chapters [6](/guide/attention/) and [19](/guide/applications/)): there is no separate channel for instructions and data.

### Defenses that change the architecture

Filters, hardened system prompts and trained instruction hierarchies reduce success rates but are probabilistic and bypassable. Stronger designs limit what a hijacked model can do. **CaMeL** <cite data-p="debenedetti2025" data-s></cite> splits the system: a privileged model sees only the trusted user request and writes a program (plan) in a restricted language; a quarantined model processes untrusted data but has no tools; and an interpreter tracks data flow and capabilities, blocking, for instance, passing untrusted data into an action it should not control. The security argument is by design properties of the interpreter, not by the model behaving. Other principles: least privilege per action, human approval for consequential actions, isolating untrusted content, breaking the lethal trifecta ([Chapter 19](/guide/applications/)).

## 3\. Training-time attacks

-   **Backdoors.** <cite data-p="gu2017" data-s></cite> showed a network trained on data containing a trigger pattern behaves normally except when the trigger appears. For language models, <cite data-p="hubinger2024" data-s></cite> trained models with hidden trigger-conditioned behavior and found it persisted through standard safety training (SFT, RL, adversarial training), in some cases making it better at hiding.
-   **Practical dataset poisoning.** <cite data-p="carlini2023" data-s></cite> demonstrated attacks on web-scale datasets: _split-view poisoning_ (datasets that are lists of URLs can be changed by whoever controls the domain later) and _frontrunning poisoning_ (editing a source just before it is snapshotted). The cost to poison meaningful fractions was low. NSA's 2025 AI data security guidance names both.
-   **Fine-tuning attacks.** <cite data-p="qi2023" data-s></cite>: a handful of adversarial examples, or even benign fine-tuning data, can degrade safety behavior.

## 4\. Privacy and confidentiality

-   **Training-data extraction.** <cite data-p="carlini2020" data-s></cite> recovered verbatim training sequences from GPT-2 by generating many samples and ranking them by likelihood. <cite data-p="nasr2023" data-s></cite> scaled this to production models, including an attack that makes an aligned chat model "diverge" from its task into emitting memorized text. Memorization rises with model size, data duplication and repetition.
-   **Membership inference.** Decide whether a record was in the training set. Because average accuracy hides the dangerous cases, <cite data-p="carlini2021" data-s></cite> argue for reporting the true-positive rate at very low false-positive rates, and give a likelihood-ratio attack (LiRA) using shadow models.
-   **Differential privacy.** DP-SGD <cite data-p="abadi2016" data-s></cite> clips each example's gradient to a maximum norm and adds Gaussian noise, with a privacy budget $\epsilon$ quantifying the maximum influence of any single record. It gives provable guarantees at a cost in accuracy.
-   **Model stealing.** <cite data-p="tramer2016" data-s></cite> reconstructed models from prediction APIs. <cite data-p="carlini2024" data-s></cite> showed that API access to a production language model's output probabilities can reveal part of its structure (the final projection layer and the hidden dimension) at modest cost. Weights exfiltration, the direct route, is a classic security problem (access control, key management, egress monitoring).

## 5\. Serving-time attacks

-   **KV-cache and prefix-cache timing channels** <cite data-p="song2024" data-s></cite>.
-   **Token-length leakage** from the sizes of streamed packets, enough to reconstruct parts of encrypted assistant replies <cite data-p="weiss2024" data-s></cite>.
-   **Cross-request interference in mixture-of-experts batches** <cite data-p="hayes2024" data-s></cite>.
-   **Quantization-conditioned behavior** <cite data-p="egashira2024" data-s></cite>: a model that is benign at full precision and malicious when quantized.

## 6\. From attacks to practice

A defender's job is to turn the above into evidence about a specific system:

1.  Write a threat model (assets, attacker capabilities, worst realistic outcome).
2.  Map each stage of the system to the table at the top of this chapter.
3.  Design tests whose success is automatically checkable, run them many times at the deployed settings, and report rates with confidence intervals (see [Evaluating models and systems](/guide/evaluation/)).
4.  Compare against baselines and evaluate defenses against adaptive attackers who know the defense.
5.  Prefer architectural limits over trained behavior wherever the cost of failure is high.
6.  Write findings with reproduction steps, evidence and recommendations.

Public guidance from NSA, CISA and allied agencies applies this at organizational scale (see the [security guidance reference](/reference/security-guidance/)): secure deployment environments, protected weights, verified data and artifacts, and incremental, contained adoption of agentic systems.

## Check yourself

<details>
<summary>Derive the FGSM perturbation.</summary>

To first order $\Delta L=\nabla_xL\cdot\delta$. Under $\lvert\delta_i\rvert\le\epsilon$ the dot product is maximized by choosing each $\delta_i=\epsilon\,\operatorname{sign}(\partial L/\partial x_i)$.

</details>

<details>
<summary>Why is a high-dimensional input easy to attack even with a tiny ε?</summary>

The effect on a linear score is $\epsilon \lVert w\rVert _{1}$, which grows roughly linearly with the number of coordinates, so thousands of imperceptible changes add up to a large change in the logit.

</details>

<details>
<summary>How does CaMeL avoid trusting the model to resist injection?</summary>

Untrusted data is only ever processed by a quarantined model with no tools, and the plan that decides actions comes from the trusted request alone; an interpreter enforces data-flow policies, so even a fully hijacked quarantined model cannot cause disallowed actions.

</details>

<details>
<summary>Why report TPR at low FPR for membership inference?</summary>

Averaged metrics can look weak even when an attacker confidently identifies a few individuals; privacy harm concentrates in those confident cases.

</details>

## Papers

-   <cite data-p="goodfellow2014"></cite>, <cite data-p="madry2017"></cite> Adversarial examples and robust training.
-   <cite data-p="zou2023"></cite>, <cite data-p="wei2023"></cite> Attacking and explaining language-model alignment.
-   <cite data-p="greshake2023"></cite>, <cite data-p="debenedetti2025"></cite> Prompt injection and a design-level defense.
-   <cite data-p="gu2017"></cite>, <cite data-p="carlini2023"></cite>, <cite data-p="hubinger2024"></cite>, <cite data-p="qi2023"></cite> Backdoors, poisoning and fine-tuning attacks.
-   <cite data-p="carlini2020"></cite>, <cite data-p="nasr2023"></cite>, <cite data-p="carlini2021"></cite>, <cite data-p="abadi2016"></cite> Extraction, membership inference and differential privacy.
-   <cite data-p="tramer2016"></cite>, <cite data-p="carlini2024"></cite> Model stealing.
-   <cite data-p="song2024"></cite>, <cite data-p="weiss2024"></cite>, <cite data-p="hayes2024"></cite>, <cite data-p="egashira2024"></cite> Serving and quantization attacks.
