---
title: "Floating point and quantization"
description: "Bits, scales and what low precision does to a model"
sidebar:
  label: "15. Floating point and quantization"
---

_Bits, scales and what low precision does to a model_

Chapter 15 of 21 · IV. Scaling the network · about 40 minutes. Builds on: [9. The full model and its training loop](/guide/full-model/).

:::tip[Skip this chapter if]
you can decode a floating-point number from its bits, compare FP16, BF16, FP8 and FP4 formats, explain block-scaled quantization (MXFP4), and say why outliers make low-bit quantization hard.
:::

## How computers store real numbers

A floating-point number has three fields: a sign $s$, an exponent e, and a mantissa $m$ with $M$ bits. For a normal number:

$$
\text{value}=(-1)^{s}\cdot2^{\,e-\text{bias}}\cdot\Bigl(1+\frac{m}{2^{M}}\Bigr),\qquad\text{bias}=2^{E-1}-1
$$

When $e = 0$ the number is **subnormal**: $\text{value}=(-1)^{s}\cdot2^{1-\text{bias}}\cdot\dfrac{m}{2^{M}}$, which fills the gap near zero. Some codes are reserved for infinity and not-a-number. The exponent bits set the _range_; the mantissa bits set the _precision_ (neighboring values differ by a relative $2^{-M}$). Fewer bits means coarser numbers.

| Format | Bits (sign-exp-mantissa) | Largest value | Relative step | Use |
| --- | --- | --- | --- | --- |
| FP32 | 1-8-23 | $3.4\times 10^{38}$ | ~$10^{-7}$ | master weights, accumulators |
| FP16 | 1-5-10 | 65,504 | ~$10^{-3}$ | needs loss scaling to avoid overflow/underflow |
| BF16 | 1-8-7 | $3.4\times 10^{38}$ | ~$8\times 10^{-3}$ | FP32's range, coarse precision; standard for training |
| FP8 E4M3 | 1-4-3 | 448 | ~0.125 | forward values; more precision <cite data-p="micikevicius2022" data-s></cite> |
| FP8 E5M2 | 1-5-2 | 57,344 | ~0.25 | gradients; more range |
| FP4 E2M1 | 1-2-1 | 6 | coarse | weights only 15 distinct values: 0, $\pm 0.5$, $\pm 1$, $\pm 1.5$, $\pm 2$, $\pm 3$, $\pm 4$, $\pm 6$ |

Type a number below and see what each format does to it:

<div class="widget not-content" data-w="fpformat" data-title="Store a number in a low-precision format"></div>

## Mixed-precision training

Training in pure low precision is unstable because small gradient updates vanish when added to larger weights. The standard recipe <cite data-p="micikevicius2017" data-s></cite> keeps a FP32 master copy of the weights, does the matrix multiplications in a lower precision (FP16, then BF16), accumulates in FP32, and for FP16 scales the loss up so tiny gradients survive. DeepSeek-V3 pushed this to FP8: most matrix multiplications use E4M3, with activations quantized in $1\times 128$ tiles and weights in $128\times 128$ blocks, partial sums promoted to FP32 every 128 elements, and embeddings, the output head, the MoE gate, normalization and attention kept in higher precision. Their ablations report relative loss error versus BF16 under 0.25% <cite data-p="deepseekv3" data-s></cite>.

## Quantization for inference

To **quantize** weights to $b$ bits, choose a scale $s$ and store integers: $q = \operatorname{round}(w / s)$, reconstructed as $\hat w=s\cdot q$. The rounding error per weight is at most $s / 2$. The scale is typically $\max\lvert w\rvert$ divided by the largest integer. What matters is how many weights share a scale:

-   **Per tensor:** one scale for the whole matrix. A single outlier forces a huge scale and wastes precision on everything else.
-   **Per channel / per block:** a separate scale for each row or each small block (for example 32 or 128 weights). Outliers damage only their own block.

Large language models make this harder because they develop a few **outlier features**, hidden dimensions with magnitudes far above the rest. LLM.int8() <cite data-p="dettmers2022" data-s></cite> handles these by splitting them out and computing them in higher precision. GPTQ <cite data-p="frantar2022" data-s></cite> quantizes layer by layer using second-order information to compensate for rounding error, and AWQ <cite data-p="lin2023" data-s></cite> protects the small fraction of weights that matter most (identified from activation magnitudes) by rescaling before quantizing.

## Microscaling formats and MXFP4

The Open Compute Project's **microscaling** (MX) formats <cite data-p="rouhani2023" data-s></cite> standardize block scaling: a block of 32 elements shares one 8-bit scale that is a power of two, and each element is stored in a tiny format. **MXFP4** uses FP4 E2M1 elements, so each value costs 4 bits plus $8 / 32 = 0.25$ bits of shared scale: **4.25 bits per parameter**. Compare schemes on weights with an outlier:

<div class="widget not-content" data-w="quant" data-title="Quantization error with and without block scales"></div>

gpt-oss quantizes its mixture-of-experts weights (over 90% of its parameters) to MXFP4. The model card gives 4.25 bits per parameter and checkpoints of 60.8 GiB (120b) and 12.8 GiB (20b), which is why the 120b model fits on a single 80 GB GPU <cite data-p="openai2025oss" data-s></cite>. Check: $116.8\text{B}\times4.25/8\approx62$ GB.

## Check yourself

<details>
<summary>Decode the FP8 E4M3 pattern 0 0011 101.</summary>

Bias 7; exponent field 3, so $2^{3-7}=1/16$; mantissa $101 = 5 / 8$, so $1 + 5 / 8 = 1.625$. Value = $1.625 / 16 = 0.1015625$.

</details>

<details>
<summary>Why is BF16 preferred to FP16 for training?</summary>

It has the same exponent range as FP32, so activations and gradients rarely overflow or underflow and no loss scaling is needed, at the cost of less precision, which training tolerates.

</details>

<details>
<summary>An int4 scheme uses one scale per tensor and the tensor contains one weight 40× larger than the others. What happens to the other weights?</summary>

The scale is set by the outlier, so the step size is huge compared to the typical weight and most weights round to 0 or $\pm 1$ step: the information in them is mostly lost.

</details>

:::caution[Security link]
A quantized model is a different model. Quantization changes outputs slightly everywhere, including at safety-relevant decision boundaries, so evaluations done on a full-precision checkpoint do not transfer automatically to the deployed 4-bit copy. It can also be exploited: <cite data-p="egashira2024" data-s></cite> show that a model can be trained to behave benignly at full precision yet maliciously once quantized, because the quantization step is predictable. Verify the exact artifact you deploy, by hash, and test that artifact.
:::

## Papers

-   <cite data-p="micikevicius2017"></cite> Mixed-precision training.
-   <cite data-p="micikevicius2022"></cite> FP8 formats.
-   <cite data-p="rouhani2023"></cite> Microscaling formats.
-   <cite data-p="dettmers2022"></cite>, <cite data-p="frantar2022"></cite>, <cite data-p="lin2023"></cite> Post-training quantization of LLMs.
-   <cite data-p="deepseekv3"></cite> Section 3.3 on FP8 training.
-   <cite data-p="egashira2024"></cite> A security attack specific to quantization.
