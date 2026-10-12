---
title: "Teardown: gpt-oss-120b"
description: "One token through OpenAI's open-weight mixture-of-experts model, layer by layer, with its real configuration."
sidebar:
  label: "gpt-oss-120b"
---

_OpenAI's open-weight mixture-of-experts model, released under Apache 2.0 and sized to fit on one 80 GB GPU._

This page follows one token through the network using the numbers in the model's `config.json` and the model card <cite data-p="openai2025oss" data-s></cite>. Each step links to the chapter that explains the mechanism from first principles.

## At a glance

| Item | Value |
| --- | --- |
| Layers | 36 |
| Model width $d$ | 2,880 |
| Attention | 64 query heads of size 64, 8 key/value heads (grouped-query) |
| Attention pattern | alternating 128-token sliding window and full attention |
| Feed-forward | 128 experts per layer, top-4 routing, expert hidden width 2,880 |
| Normalization | RMSNorm before each attention and expert block |
| Position | RoPE with base 150,000, YaRN factor 32 from a 4,096 window to 131,072 tokens |
| Vocabulary | 201,088 tokens (o200k_harmony), input and output embeddings untied |
| Parameters | 116.8B total, 5.1B active per token |
| Precision | mixture-of-experts weights in MXFP4 (about 4.25 bits), everything else bf16 |
| Checkpoint | 60.8 GiB |

## 1. Text becomes token ids

The tokenizer is a byte-level BPE with 201,088 entries, an extension of OpenAI's `o200k` tokenizer that adds the special tokens of the **harmony** chat format ([chapter 5](/guide/tokens-and-embeddings/)). Harmony defines roles (system, developer, user, assistant, tool) with a priority order, and three output channels: `analysis` for the model's reasoning, `commentary` for tool calls, and `final` for the answer shown to the user. The reasoning effort (low, medium or high) is set by a keyword in the system prompt <cite data-p="openai2025oss" data-s></cite>.

## 2. Each id becomes a vector

The embedding table has shape $[201{,}088,\ 2{,}880]$, which is 579.1M parameters. A second matrix of the same size maps back to the vocabulary at the end, so the vocabulary costs 1.16B parameters in total.

## 3. One layer

Each of the 36 layers is a pre-norm block ([chapter 7](/guide/transformer-block/)):

$$
\begin{aligned}
x&\leftarrow x+\operatorname{Attention}\bigl(\operatorname{RMSNorm}(x)\bigr)\\
x&\leftarrow x+\operatorname{MoE}\bigl(\operatorname{RMSNorm}(x)\bigr)
\end{aligned}
$$

## 4. Grouped-query attention with sinks

The query projection maps 2,880 numbers to $64\times64=4096$, while keys and values map to only $8\times64=512$ each ([chapter 11](/guide/gqa-and-mla/)). Per layer:

| Matrix | Shape | Parameters |
| --- | --- | --- |
| $W_Q$ | $2880\times4096$ | 11.8M |
| $W_K$, $W_V$ | $2880\times512$ each | 1.5M each |
| $W_O$ | $4096\times2880$ | 11.8M |
| Attention total per layer | | 26.5M |

Eight query heads share each key/value head, so the cache is 8 times smaller than full multi-head attention would need. The model card also describes a learned bias in each head's softmax denominator, which acts like an attention sink <cite data-p="xiao2023" data-s></cite>: with a learned per-head value $b$, the weights become

$$
a_j=\frac{e^{s_j}}{e^{b}+\sum_k e^{s_k}}
$$

so a head can send weight to the sink instead of forcing it onto real tokens ([chapter 13](/guide/sparse-and-linear-attention/)).

## 5. Alternating local and global layers

Layers alternate between a banded pattern, where each token sees only the previous 128 tokens, and full causal attention. Local layers are cheap and need only 128 positions of cache; the global layers let information travel across the whole context. Try a window on a toy sentence:

<div class="widget not-content" data-w="attnheat" data-title="Sliding windows and causal masks (toy scores)"></div>

## 6. Position

Queries and keys are rotated with RoPE, using base 150,000 rather than the original 10,000 ([chapter 8](/guide/rope/)). The model was trained at a 4,096-token window and extended with YaRN at factor 32, giving $4096\times32=131{,}072$ tokens <cite data-p="peng2023yarn" data-s></cite>.

## 7. Mixture of experts

After attention, the router, a linear layer from 2,880 to 128, scores every expert. The top 4 are chosen and their scores go through a softmax over just those four, giving the mixing weights ([chapter 14](/guide/mixture-of-experts/)).

<div class="widget not-content" data-w="router" data-title="Top-k routing (toy scores)"></div>

Each expert is a gated MLP ([chapter 7](/guide/transformer-block/)), with the card's variant that clamps values and adds a residual connection:

$$
\text{expert}(x)=W_{\text{down}}\Bigl(\operatorname{SiLU}(W_{\text{gate}}\,x)\odot(W_{\text{up}}\,x)\Bigr)
$$

Each expert has $3\times2880\times2880=24.9$M parameters.

There are 128 experts per layer, so 3.19B parameters per layer and 114.66B across all 36 layers, which is 98.2% of the model. Only 4 of 128 run per token.

## 8. Back to words

After the last layer a final RMSNorm and the unembedding matrix produce one logit per vocabulary token, which sampling turns into the next token ([chapter 4](/guide/softmax-and-loss/)).

## 9. Counting the parameters

The architecture alone reproduces the published sizes. Pick another model in the calculator to compare:

<div class="widget not-content" data-w="moecalc" data-preset="oss" data-title="Total and active parameters"></div>

The 5.13B active parameters are 36 layers of attention (0.96B) and 4 experts per layer (3.58B), plus the router and the output matrix. Memory scales with the total, compute per token with the active part.

## 10. MXFP4 and the checkpoint size

The expert weights are stored in MXFP4: 4-bit floats in blocks of 32 sharing an 8-bit scale, 4.25 bits per value ([chapter 15](/guide/low-precision/)). Check the card's checkpoint size from first principles: $114.66\text{B}\times4.25/8\approx60.9$ GB for the experts, plus about $2.1\text{B}\times2$ bytes $\approx4.3$ GB for everything else in bf16, for $65.2$ GB, which is $60.7$ GiB. The card reports 60.8 GiB, and that is why the model fits on one 80 GB GPU <cite data-p="openai2025oss" data-s></cite>.

## 11. Memory while generating

<div class="widget not-content" data-w="kvcalc" data-preset="oss" data-title="KV cache size at different context lengths"></div>

With 18 full-attention layers each storing $2\times8\times64\times2=2{,}048$ bytes per token, the cache grows by 36.9 KB per token (plus 18 windowed layers that stop growing at 128 tokens). At 131,072 tokens one sequence needs about 4.8 GB, versus 77 GB for plain multi-head attention, a 16× saving.

## 12. What the model card says about training and safety

| Item | From the model card |
| --- | --- |
| Pretraining | trillions of text tokens, focused on STEM, coding and general knowledge; knowledge cutoff June 2024; 2.1M H100-hours for the 120b model |
| Post-training | chain-of-thought reinforcement learning, similar to OpenAI's o3 |
| Safety training | deliberative alignment and an instruction hierarchy (system, developer, user, assistant, tool) |
| Instruction hierarchy | trails o4-mini in the reported tests; for system-prompt extraction resistance, 0.832 versus 0.993 |
| Reasoning traces | no direct optimization pressure on the chain of thought; developers are advised not to show raw reasoning to users without filtering |
| Adversarial fine-tuning | internal worst-case fine-tuned variants for biology and cyber were evaluated and did not reach the "High" capability threshold |

## 13. Where to look when testing it

- **Artifacts:** the weights, tokenizer and the harmony template are all part of the deployed model; verify them by hash ([chapters 5 and 20](/guide/security/)).
- **Quantization:** evaluate the MXFP4 checkpoint you actually deploy, not a different precision ([chapter 15](/guide/low-precision/)).
- **Roles and channels:** the instruction hierarchy is a trained behavior; test whether text in tool output or user turns can pass for higher-priority instructions ([chapter 19](/guide/applications/)).
- **Reasoning channel:** treat raw `analysis` text as sensitive until filtered.
- **Open weights:** safety behavior can be fine-tuned away by anyone with the weights ([chapter 18](/guide/lora/)).

## Sources

- [gpt-oss-120b and gpt-oss-20b model card](https://arxiv.org/abs/2508.10925) (architecture, tokenizer, harmony format, training, safety evaluations).
- The model's `config.json` on Hugging Face (`openai/gpt-oss-120b`) for layer counts, widths, heads, experts, vocabulary and RoPE settings.
- gpt-oss-20b, for comparison, has 24 layers, 32 experts, 20.9B total and 3.6B active parameters, per the same card.
