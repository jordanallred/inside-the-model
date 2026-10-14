---
title: "Post-training: instruction tuning, preferences and reinforcement learning"
description: "From text continuer to assistant and reasoner"
sidebar:
  label: "17. Post-training: instruction tuning, preferences and reinforcement learning"
---

_From text continuer to assistant and reasoner_

Chapter 17 of 24 · V. Training · about 50 minutes. Builds on: [4. Probability, softmax and next-token prediction](/guide/softmax-and-loss/), [16. Pretraining at scale](/guide/pretraining/).

:::tip[Skip this chapter if]
you can describe SFT, the RLHF pipeline (reward model with Bradley–Terry loss, PPO with a KL penalty), derive the DPO loss, explain GRPO's group-relative advantage, and say how reasoning models are trained and why test-time compute helps.
:::

## Pretrained models are not assistants

A model that has only been pretrained ([Chapter 9](/guide/full-model/)) is a text continuer. Given "What is the capital of France?" it may continue with another quiz question. **Post-training** turns it into an assistant that follows instructions, refuses some requests, and reasons step by step. It uses far less compute than pretraining but determines most of the behavior users see, and most of the safety behavior.

## Stage 1: supervised fine-tuning (SFT)

Collect example conversations (a prompt and an ideal response, written by people or generated and filtered by models). Render each with the chat template and continue training with the usual next-token loss, **computed only on the response tokens** (the prompt is context, not target). A few thousand to a few million examples are enough to shift the style dramatically. Training on instructions across many tasks also improves zero-shot performance on unseen tasks <cite data-p="wei2021" data-s></cite>.

## Stage 2: learning from preferences (RLHF)

Writing perfect answers is hard; comparing two answers is easy. So collect pairs ($x$, $y_{w}$, $y_{l}$): a prompt, a response people preferred and one they did not. The pipeline of <cite data-p="christiano2017" data-s></cite>, applied to text by <cite data-p="stiennon2020" data-s></cite> and <cite data-p="ouyang2022" data-s></cite> has three steps.

### Reward model

Train a network $r(x, y)$ that outputs a scalar score. Model the probability that $y_{w}$ beats $y_{l}$ as a function of the score difference (the **Bradley–Terry** model), and minimize the negative log-likelihood:

$$
\begin{aligned}P(y_w\succ y_l\mid x)&=\sigma\bigl(r(x,y_w)-r(x,y_l)\bigr)\\\text{loss}&=-\log\sigma\bigl(r(x,y_w)-r(x,y_l)\bigr),\qquad\sigma(z)=\frac1{1+e^{-z}}\end{aligned}
$$

### Policy optimization

Treat the language model $\pi$ as a policy that generates a response one token at a time and receives the reward-model score at the end. Maximize the expected reward while staying close to the SFT model $\pi _{ref}$, so the policy cannot drift into text that merely fools the reward model:

$$
\max_{\pi}\ \ \mathbb E_{y\sim\pi(\cdot\mid x)}\bigl[r(x,y)\bigr]-\beta\,\mathrm{KL}\bigl(\pi(\cdot\mid x)\,\Vert\,\pi_{\text{ref}}(\cdot\mid x)\bigr)
$$

The optimizer used is PPO <cite data-p="schulman2017" data-s></cite>. Its key device is a clipped objective that limits how far one update can move the policy. With the probability ratio $\rho _{t} = \pi _{new}(a_{t}|s_{t}) / \pi _{old}(a_{t}|s_{t})$ and advantage $A_{t}$ (how much better than average this token's outcome was):

$$
L_{\text{PPO}}=\mathbb E\Bigl[\min\bigl(\rho_t A_t,\ \operatorname{clip}(\rho_t,\,1-\epsilon,\,1+\epsilon)\,A_t\bigr)\Bigr]
$$

When the advantage is positive, there is no incentive to raise $\rho$ beyond $1 + \epsilon$; when negative, none to lower it below $1-\epsilon$. In standard PPO a separate value network estimates the baseline used to compute advantages. InstructGPT found labelers preferred outputs of a 1.3B RLHF-tuned model over the 175B GPT-3 base model, evidence that alignment tuning matters as much as scale for perceived quality <cite data-p="ouyang2022" data-s></cite>.

## Direct preference optimization (DPO)

RLHF needs a reward model and a reinforcement-learning loop. <cite data-p="rafailov2023" data-s></cite> noticed the KL-regularized objective above has a closed-form optimal policy:

$$
\begin{aligned}
\pi^{*}(y\mid x)&=\frac{\pi_{\text{ref}}(y\mid x)\,e^{\,r(x,y)/\beta}}{Z(x)}\\
\Longrightarrow\quad r(x,y)&=\beta\log\frac{\pi^{*}(y\mid x)}{\pi_{\text{ref}}(y\mid x)}+\beta\log Z(x)
\end{aligned}
$$

Substitute this expression for $r$ into the Bradley–Terry loss. The $Z(x)$ terms cancel because both responses share the prompt, leaving a loss that depends only on the policy and the reference:

$$
L_{\text{DPO}}=-\log\sigma\Bigl(\beta\Bigl[\log\frac{\pi(y_w\mid x)}{\pi_{\text{ref}}(y_w\mid x)}-\log\frac{\pi(y_l\mid x)}{\pi_{\text{ref}}(y_l\mid x)}\Bigr]\Bigr)
$$

It is plain supervised training on preference pairs: no reward model, no sampling loop. Both losses in one widget:

<div class="widget not-content" data-w="dpo" data-title="Reward-model loss and DPO loss"></div>

## Reinforcement learning with verifiable rewards, and GRPO

For problems with checkable answers (math, code that passes tests, formats) no learned reward model is needed: reward 1 if the final answer is correct, else 0. **Group Relative Policy Optimization (GRPO)**, introduced in DeepSeekMath <cite data-p="shao2024" data-s></cite>, removes PPO's value network. For each prompt, sample a group of $G$ responses from the old policy, score each ($r_{1}$ … $r_{G}$), and use the group itself as the baseline:

$$
\hat A_i=\frac{r_i-\operatorname{mean}(r_1,\dots,r_G)}{\operatorname{std}(r_1,\dots,r_G)}
$$

Every token of response $i$ shares this advantage. The objective is

$$
\begin{aligned}
J&=\mathbb E\Bigl[\frac1G\sum_{i=1}^{G}\frac1{|o_i|}\sum_{t}\ell_{it}-\beta\,D_{\text{KL}}(\pi\Vert\pi_{\text{ref}})\Bigr]\\
\ell_{it}&=\min\bigl(\rho_{it}\hat A_i,\ \operatorname{clip}(\rho_{it},1-\epsilon,1+\epsilon)\hat A_i\bigr)
\end{aligned}
$$

where $\ell$ is PPO's clipped term ($\rho$ is the probability ratio between the new and old policy) and the KL term uses a per-token estimator that is always non-negative:

$$
D_{\text{KL}}\approx\frac{\pi_{\text{ref}}}{\pi}-\log\frac{\pi_{\text{ref}}}{\pi}-1
$$

The KL term is added to the loss directly rather than folded into the reward. Notice what the normalization does: a response is pushed up only if it beat its siblings. If every sample is right (or every one wrong), all advantages are zero and the prompt teaches nothing.

<div class="widget not-content" data-w="grpo" data-title="Group-relative advantages and the PPO clip"></div>

## Reasoning models and test-time compute

Chain-of-thought prompting ([Chapter 19](/guide/applications/)) showed that writing out intermediate steps improves answers. Reasoning models are trained to do this by themselves using reinforcement learning against verifiable rewards. DeepSeek-R1 <cite data-p="deepseekr1" data-s></cite> reports that applying RL directly to a base model (R1-Zero) made long reasoning, self-checking and revision emerge, and that a multi-stage recipe with some SFT data produced the final model; it also reports distilling the reasoning into smaller models ([Chapter 18](/guide/lora/)).

This opens a second axis of scaling. <cite data-p="snell2024" data-s></cite> show that, for some problems, giving a smaller model more computation at inference (sampling many solutions and verifying them, or reasoning longer) can beat a much larger model. Process reward models that score each step, trained on step-level human labels, outperformed outcome-only reward models for selecting correct math solutions <cite data-p="lightman2023" data-s></cite>. The gpt-oss models use chain-of-thought RL in post-training and expose low, medium and high reasoning effort settings <cite data-p="openai2025oss" data-s></cite>.

## Safety training and the instruction hierarchy

-   **Constitutional AI** <cite data-p="bai2022" data-s></cite>: the model critiques and revises its own outputs against written principles, and AI-generated preference labels (RLAIF) replace some human labels.
-   **Instruction hierarchy.** gpt-oss is trained to rank instruction sources: system, then developer, then user, then assistant, then tool output. The model card reports its instruction-hierarchy scores trail OpenAI's o4-mini; for example system-prompt extraction resistance scored 0.832 (120b) versus 0.993 for o4-mini <cite data-p="openai2025oss" data-s></cite>. The hierarchy is a trained behavior, not a mechanism, and its robustness is measured, not guaranteed.
-   **Chain of thought.** The gpt-oss card says no direct optimization pressure was applied to the reasoning text, so that it stays an honest signal for monitoring, and advises developers not to show raw reasoning to users without filtering <cite data-p="openai2025oss" data-s></cite>.

## Check yourself

<details>
<summary>Why is the SFT loss computed on response tokens only?</summary>

The goal is to model what the assistant should say given the prompt. Training to predict the prompt's own tokens would waste capacity and teach the model to write user messages.

</details>

<details>
<summary>In DPO, what does the reference model do?</summary>

It anchors the implicit reward: the policy is rewarded for raising the chosen answer's probability relative to the reference, so it cannot reduce loss simply by assigning arbitrary probabilities; it acts like the KL penalty in RLHF.

</details>

<details>
<summary>Four of six sampled answers are correct (reward 1). What are the GRPO advantages?</summary>

mean $=2/3$, std $=\sqrt{(2/3)(1/3)}\approx0.471$. Correct answers: $(1-0.667)/0.471\approx+0.71$; wrong answers: $(0-0.667)/0.471\approx-1.41$.

</details>

:::caution[Security link]
Everything that makes a model refuse or follow rules is a learned behavior laid over a capable base: <cite data-p="wei2023" data-s></cite> analyze jailbreaks as consequences of competing objectives and mismatched generalization; <cite data-p="qi2023" data-s></cite> show a few fine-tuning examples can erode safety training even when users do not intend to; <cite data-p="hubinger2024" data-s></cite> show a backdoored behavior can persist through standard safety training. Reward models can also be exploited ("reward hacking"): a policy optimized hard against an imperfect reward finds text that scores well without being good. [Chapter 20](/guide/security/) develops these.
:::

## Papers

-   <cite data-p="christiano2017"></cite>, <cite data-p="stiennon2020"></cite>, <cite data-p="ouyang2022"></cite> The RLHF lineage; start with InstructGPT.
-   <cite data-p="schulman2017"></cite> PPO.
-   <cite data-p="rafailov2023"></cite> DPO; the derivation in section 4 is short.
-   <cite data-p="shao2024"></cite> GRPO (section 4.1).
-   <cite data-p="deepseekr1"></cite> Reasoning via RL.
-   <cite data-p="snell2024"></cite>, <cite data-p="lightman2023"></cite> Test-time compute and process supervision.
-   <cite data-p="bai2022"></cite> Constitutional AI.
-   <cite data-p="openai2025oss"></cite> A model card with unusually concrete safety and instruction-hierarchy evaluations.
