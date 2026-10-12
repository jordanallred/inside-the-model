---
title: Hands-on labs
description: Short exercises that make the guide's ideas concrete.
---

Each lab pairs with chapters of the guide, runs on a laptop CPU, and ends with exercises. Do the internals labs first; the security labs assume you have read the attack chapters. Use a disposable environment (a virtual machine or throwaway folder) for anything that handles untrusted files.

1. [Predict a model's size from its configuration](/labs/config-size/): about 30 minutes. Turn a config.json into a parameter count, a KV-cache size and a memory budget, then check it against the real model.
2. [Write attention from scratch](/labs/attention-from-scratch/): about 45 minutes. Grouped-query attention with rotary positions in about 40 lines of NumPy, verified by two properties.
3. [Tiled attention with online softmax](/labs/tiled-attention/): about 40 minutes. Reproduce the core idea of FlashAttention and show it equals ordinary attention.
4. [See tokens, chat templates and next-token probabilities](/labs/tokens-and-templates/): about 30 minutes. Make the first steps of the model visible with a small open model on CPU.
5. [Build and measure a prompt injection](/labs/injection-harness/): about 60 minutes. Build a vulnerable app, measure an attack with confidence intervals, add a defense, and re-measure.
6. [Adversarial examples with FGSM](/labs/fgsm/): about 30 minutes. One gradient step on the input flips a classifier.
7. [Why loading a pickled model can run code](/labs/pickle/): about 20 minutes. See the risk in a disposable environment, then compare with a data-only format.
8. [Membership inference with a loss threshold](/labs/membership-inference/): about 30 minutes. Measure how much a model leaks about its training set.
9. [Run an automated LLM vulnerability scanner](/labs/scanner/): about 45 minutes. Run an open-source scanner on a local model and learn to critique its output.
10. [Reproduce the Explorer's forward pass](/labs/explorer-forward-pass/): about 40 minutes. Rebuild the Model Explorer's trained transformer in NumPy from its published weights and match every number.
