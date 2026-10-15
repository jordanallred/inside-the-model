---
title: Does GPT-2 read the future?
description: A reproducible CPU experiment on pinned GPT-2 weights, with measured prefix invariance, positive controls and downloadable code.
---

The browser's [hidden-future investigation](/cases/hidden-future/) uses a tiny teaching model. Does the same information-flow restriction appear in a model trained on natural text? We ran two controlled comparisons on **GPT-2 (124,439,808 parameters)** and changed-prefix positive controls.

## Predict the result

Compare **The cat sat on the mat** with **The cat sat on the bed**, measuring at the earlier token **sat**. Does the next-token distribution at that position change? What if you change **cat** to **dog** instead?

The six-token sequences have an identical three-token prefix in the suffix comparison. The script checks token IDs rather than assuming that words and tokens align. The second comparison uses **Alice and Bob went** with two different suffixes.

<details><summary>Reveal the measured results</summary>

| Prefix being measured | Largest probability difference after suffix change | Largest future attention | Changed-prefix control difference |
| --- | --- | --- | --- |
| The cat sat | 0.000e+0 | 0.000e+0 | 1.900e-2 |
| Alice and Bob went | 0.000e+0 | 0.000e+0 | 2.284e-2 |

Both suffix changes preserve the selected earlier distribution within **0.000001**. Future attention is exactly zero in all layers and heads at the tested position. Both positive controls change the distribution beyond tolerance. This supports the causal information-flow restriction in these tests and confirms that the comparison can detect a change when information is allowed to reach the selected position.

</details>

## Reproduce it

Download the [Jupyter notebook](/code/gpt2-causality.ipynb), [standalone Python script](/code/replicate_gpt2_causality.py), [pinned requirements](/code/replication-requirements.txt), and [execution record](/trace/gpt2-causal-check.json). The notebook includes the full experiment and follow-up questions. Its output cells are intentionally empty so you can generate your own results; the separate execution record contains the run reported here.

We recommend [Astral’s Python tooling](/python-tools/). With [uv installed](https://docs.astral.sh/uv/getting-started/installation/), download the script and requirements into one folder and run:

```text
uv venv --python 3.12
uv pip install -r replication-requirements.txt
uv run --no-project python replicate_gpt2_causality.py --output my-gpt2-check.json
```

No environment activation is needed. Existing pip-based environments also work with the same requirements.

The first run downloads roughly 0.5 GB of weights. Allow several GB of available RAM. No account, GPU or remote inference is required. The website displays saved measurements; loading this page does not download or run GPT-2.

## Try your own comparison

The script accepts a prefix, two suffixes and a changed-prefix positive control. All four custom arguments must be supplied together. The command below can be adapted to another token-controlled comparison. It validates token IDs from the complete texts, equal sequence lengths and an actual suffix change before reporting a result.

```sh
uv run --no-project python replicate_gpt2_causality.py --prefix "The dog ran" --suffix-a " to the park" --suffix-b " to the beach" --control-prefix "The cat ran" --output my-causal-check.json
```

The leading spaces in the suffixes are intentional. The changed-prefix control must produce a detectable difference. The output records token IDs and numerical differences so the comparison can be inspected.

## Provenance and conditions

- Model: [openai-community/gpt2](https://huggingface.co/openai-community/gpt2/tree/607a30d783dfa663caf39e06633721c8d4cfcd7e), revision `607a30d783dfa663caf39e06633721c8d4cfcd7e`.
- Weight-file SHA-256: `248dfc3911869ec493c76e65bf2fcf7f615828b0254c12b473182f0f81d3a707`.
- Execution: `2026-10-15T22:03:11.703396+00:00` (UTC), Windows-11-10.0.26300-SP0, Python 3.12.14.
- Packages: PyTorch 2.14.1+cpu, Transformers 5.19.0, Hugging Face Hub 2.2.0.
- Device and numbers: cpu, torch.float32; eager attention; dropout disabled with eval().
- Measurement: all 2 suffix comparisons and their positive controls passed the assertions in the downloadable script.

The [GPT-2 model card](https://huggingface.co/openai-community/gpt2) describes the model and license. The [Transformers GPT-2 documentation](https://huggingface.co/docs/transformers/model_doc/gpt2) documents the implementation interface.

## What this does not establish

This is an executed replication of a causal-mask property, not a new interpretability discovery or an independent explanation of GPT-2's decisions. Two examples do not validate all inputs, architectures or numerical environments. Floating-point differences can depend on implementation and hardware; compare with the stated tolerance and retain positive controls.

Try a new token-controlled example before inspecting its result. For a smaller first project, [run the teaching model in your IDE](/run-locally/). See [methods and review status](/methods/) for how this result is checked and corrected.
