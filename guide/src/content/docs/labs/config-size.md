---
title: "Predict a model's size from its configuration"
description: "Turn a config.json into a parameter count, a KV-cache size and a memory budget, then check it against the real model"
sidebar:
  label: "Lab 1. Predict a model's size from its configuration"
---

_Turn a config.json into a parameter count, a KV-cache size and a memory budget, then check it against the real model_

Lab 1 of 10 · about 30 minutes · runs on a laptop. **Related chapters:** [7. The transformer block](/guide/transformer-block/) · [10. Generating text: the KV cache and inference cost](/guide/kv-cache/) · [11. Grouped-query and latent attention](/guide/gqa-and-mla/) · [14. Mixture of experts](/guide/mixture-of-experts/)

Every number in a model's architecture is in its configuration file. This lab checks that you can go from the config to the model's size without loading any weights.

## Step 1: the formula

For a dense decoder with grouped-query attention and a gated MLP ([chapter 7](/guide/transformer-block/)), per layer:

$$
\underbrace{d\,(H h)}_{W_Q}+\underbrace{2\,d\,(K h)}_{W_K,W_V}+\underbrace{(H h)\,d}_{W_O}\;+\;\underbrace{3\,d\,d_{ff}}_{\text{gated MLP}}
$$

where $d$ is the hidden size, $H$ the number of query heads, $K$ the number of key/value heads and $h = d/H$ the head size. Add the embedding matrix $V d$ (and a second one if input and output embeddings are not tied).

~~~python
def predict(d, layers, heads, kv_heads, d_ff, vocab, tied):
    h = d // heads
    attn = d * heads * h + 2 * d * kv_heads * h + heads * h * d
    mlp = 3 * d * d_ff
    emb = vocab * d * (1 if tied else 2)
    return layers * (attn + mlp) + emb

# Qwen2.5-0.5B: read these from its config.json
print(predict(d=896, layers=24, heads=14, kv_heads=2, d_ff=4864, vocab=151936, tied=True) / 1e9)
# about 0.494 billion (the model also has small bias vectors; the published size is ~0.49B)
~~~

## Step 2: compare with the real model without downloading weights

With the Hugging Face libraries installed (`pip install transformers torch`), build the model on the "meta" device, which creates the structure with no memory and no download of weights:

~~~python
import torch
from transformers import AutoConfig, AutoModelForCausalLM

cfg = AutoConfig.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct")
with torch.device("meta"):
    model = AutoModelForCausalLM.from_config(cfg)
actual = sum(p.numel() for p in model.parameters())
print(actual / 1e9, predict(cfg.hidden_size, cfg.num_hidden_layers, cfg.num_attention_heads,
                            cfg.num_key_value_heads, cfg.intermediate_size, cfg.vocab_size,
                            cfg.tie_word_embeddings) / 1e9)
~~~

The gap should be under 1%: biases and norm weights. Find where it comes from by printing `model.state_dict()` names and shapes.

## Step 3: the KV cache and memory

Using the cache formula from [chapter 10](/guide/kv-cache/), for this model at 32,000 tokens in 16-bit: $2 \times \text{layers} \times K \times h \times 2$ bytes per token. Compare with the weights in 16-bit ($2 \times$ parameters). At what context length does the cache of one sequence equal the weights?

## Extensions

- Try a larger model's config (a Llama 3 config needs an accepted license; Qwen and many others do not). Predict first, then check.
- Write the mixture-of-experts version: total vs active parameters from the number of experts and the top-k ([chapter 14](/guide/mixture-of-experts/)).
- Add the quantization effect: weights in 4-bit ($\approx 0.53$ bytes per parameter with scales) and recompute the memory budget ([chapter 15](/guide/low-precision/)).
