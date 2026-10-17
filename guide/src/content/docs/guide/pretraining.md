---
title: "Pretraining at scale"
description: "Data, scaling laws and training across thousands of GPUs"
sidebar:
  label: "16. Pretraining at scale"
---

_Data, scaling laws and training across thousands of GPUs_

Chapter 16 of 21 · V. Training · about 40 minutes. Builds on: [9. The full model and its training loop](/guide/full-model/), [14. Mixture of experts](/guide/mixture-of-experts/), [15. Floating point and quantization](/guide/low-precision/).

## Data

Pretraining data is text (and increasingly images, audio and code) at the scale of trillions of tokens: DeepSeek-V3 was trained on 14.8 trillion tokens <cite data-p="deepseekv3" data-s></cite>, and Llama 3 405B on about 15.6 trillion <cite data-p="grattafiori2024" data-s></cite>. A typical pipeline:

1.  **Collect:** web crawls, code repositories, books, scientific papers, forums, curated sources.
2.  **Extract and clean:** strip markup, detect language, remove boilerplate and personal information.
3.  **Filter for quality:** heuristics and trained classifiers that score text; drop low-quality and unsafe content.
4.  **Deduplicate:** exact and near-duplicate removal. Duplicated text is memorized far more readily ([Chapter 20](/guide/security/)) and wastes compute.
5.  **Mix:** choose proportions of each source (more code and math than their natural frequency, for instance) and the order in which they are seen.
6.  **Decontaminate:** remove text that overlaps evaluation benchmarks so scores are meaningful.

Most frontier labs do not release their data. Dolma <cite data-p="soldaini2024" data-s></cite> (3 trillion tokens) and the OLMo 2 models <cite data-p="olmo2" data-s></cite> are open examples where the data, code and training recipes are published along with the weights. That is the difference between _open weights_ and truly open models: with open weights alone you can run and fine-tune a model but cannot audit what it was trained on.

## Scaling laws

Training loss on held-out text falls as a smooth power law in model size $N$, dataset size $D$ and compute $C$, over many orders of magnitude <cite data-p="kaplan2020" data-s></cite>. This regularity let labs forecast the result of a run from small runs. The follow-up question: for a fixed compute budget $C \approx 6\cdot N\cdot D$, how should it be split? <cite data-p="hoffmann2022" data-s></cite> trained over 400 models and concluded that $N$ and $D$ should grow in equal proportion, roughly 20 tokens per parameter. Their 70B-parameter model trained on 1.4T tokens (Chinchilla) outperformed the 280B-parameter Gopher trained on 300B tokens at the same compute.

<div class="widget not-content" data-w="chinchilla" data-title="Compute-optimal sizing and loss prediction"></div>

Caveats worth knowing:

-   Compute-optimal is about _training_ cost. Models that will serve many users are deliberately trained on far more tokens than 20 per parameter (Llama 3 405B saw about 38; smaller models far more) because a smaller model is cheaper to run forever.
-   The parametric fit printed in the Chinchilla paper was later found inconsistent with the paper's other two methods <cite data-p="besiroglu2024" data-s></cite>; the ~20 tokens-per-parameter rule is the robust finding.
-   Scaling laws predict loss, not specific abilities or security properties, which can appear abruptly or not at all.
-   With mixture-of-experts, "$N$" in the compute formula is the active parameter count.

## Parallelism: fitting training onto thousands of GPUs

A single GPU cannot hold the 16 bytes per parameter of training state ([Chapter 9](/guide/full-model/)) nor deliver the compute. Training combines several kinds of parallelism:

| Kind | What is split | Communication |
| --- | --- | --- |
| Data parallel | The batch; each GPU holds a full model copy | all-reduce of gradients each step |
| ZeRO / sharded optimizers <cite data-p="rajbhandari2019" data-s></cite> | Optimizer state, gradients and then parameters are partitioned across data-parallel GPUs | gather weights when needed |
| Tensor parallel <cite data-p="shoeybi2019" data-s></cite> | Each weight matrix is split across GPUs (e.g. columns of the first MLP matrix, rows of the second) | all-reduce inside every layer; needs fast links |
| Pipeline parallel <cite data-p="huang2018" data-s></cite> | Consecutive layers on different GPUs; micro-batches flow through | activations between stages; "bubbles" of idle time |
| Expert parallel | Different experts on different GPUs | all-to-all of tokens ([Chapter 14](/guide/mixture-of-experts/)) |
| Sequence / context parallel | Long sequences split across GPUs | exchange keys and values |

Real runs combine these ("3D" or "4D" parallelism) so that the most communication-hungry splits sit inside a server with fast links and the least hungry across the network. Utilization is measured as the fraction of the hardware's peak FLOPs achieved (often 30–45%).

## Optimizers, schedules and stability

-   **AdamW** is the default optimizer; Muon-style matrix optimizers are increasingly used ([Chapter 3](/guide/backpropagation/)).
-   Learning rate: warmup, then cosine or linear decay to a small fraction of the peak. Batch sizes of millions of tokens, sometimes increased during training.
-   Large runs suffer **loss spikes** and hardware failures. Mitigations include gradient clipping, careful initialization, normalization tweaks, frequent checkpoints, and automatic restarts. DeepSeek-V3 reports no irrecoverable loss spikes or rollbacks <cite data-p="deepseekv3" data-s></cite>.
-   **Context extension:** train mostly on short sequences (cheap), then briefly continue on longer ones with a position-extension method ([Chapter 8](/guide/rope/)). DeepSeek-V3 pretrained at 4K and extended to 32K then 128K in two 1,000-step phases.
-   **Reported cost:** DeepSeek-V3's report gives 2.788 million H800 GPU-hours in total, 2.664 million of them for pretraining.

## Worked examples

<details>
<summary>You have 10²⁴ FLOPs. Using ~20 tokens per parameter and C = 6ND, what are N and D?</summary>

$C = 6\cdot N$·(20N) = $120\cdot N^{2}$, so $N = \sqrt{C / 120} \approx 9.1\times 10^{10}$ (91B) and $D = 20N \approx 1.8\times 10^{12}$ (1.8T) tokens.

</details>

<details>
<summary>Why do deployed models usually train beyond the compute-optimal token count?</summary>

Inference cost per query scales with model size; spending extra training compute to get a smaller model that matches the quality saves money over the model's lifetime.

</details>

<details>
<summary>Which parallelism needs the fastest interconnect, and why?</summary>

Tensor parallelism: it requires collective communication inside every layer, on the critical path, so it is kept within a server connected by the fastest links.

</details>

:::caution[Security link]
The scale of training data makes provenance hard. <cite data-p="carlini2023" data-s></cite> showed that attackers can poison web-scale datasets cheaply, for example by buying expired domains that datasets reference by URL (split-view poisoning) or by timing edits to sources just before they are snapshotted (frontrunning), both named in the NSA's 2025 AI data security guidance. Weights trained on a poisoned or unauditable corpus carry that risk; open weights without open data cannot settle it.
:::

## Papers

-   <cite data-p="kaplan2020"></cite> Power-law scaling.
-   <cite data-p="hoffmann2022"></cite> Compute-optimal training.
-   <cite data-p="besiroglu2024"></cite> A replication that corrects one of its fits.
-   <cite data-p="rajbhandari2019"></cite>, <cite data-p="shoeybi2019"></cite>, <cite data-p="huang2018"></cite> The parallelism toolkit.
-   <cite data-p="soldaini2024"></cite>, <cite data-p="olmo2"></cite> Open data and recipes.
-   <cite data-p="grattafiori2024"></cite>, <cite data-p="deepseekv3"></cite> Two detailed large-scale training reports.
