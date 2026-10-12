---
title: "Write attention from scratch"
description: "Grouped-query attention with rotary positions in about 40 lines of NumPy, verified by two properties"
sidebar:
  label: "Lab 2. Write attention from scratch"
---

_Grouped-query attention with rotary positions in about 40 lines of NumPy, verified by two properties_

Lab 2 of 10 · about 45 minutes · runs on a laptop. **Related chapters:** [6. Attention](/guide/attention/) · [8. Position and rotary embeddings](/guide/rope/) · [11. Grouped-query and latent attention](/guide/gqa-and-mla/)

Implement the attention block of a modern model: projections, rotary embeddings, grouped-query sharing and a causal mask. You need only NumPy. Then verify it with two properties that must hold if you got it right.

~~~python
import numpy as np
rng = np.random.default_rng(0)
T, d, H, KV = 6, 32, 4, 2                 # tokens, width, query heads, key/value heads
hd = d // H
x  = rng.normal(size=(T, d))
Wq = rng.normal(size=(d, H * hd))  / np.sqrt(d)
Wk = rng.normal(size=(d, KV * hd)) / np.sqrt(d)
Wv = rng.normal(size=(d, KV * hd)) / np.sqrt(d)
Wo = rng.normal(size=(H * hd, d))  / np.sqrt(d)

def rope(t, pos0=0, base=10000.0):          # t: [heads, T, hd]
    n = t.shape[-2]
    pos = np.arange(pos0, pos0 + n)[:, None]
    i = np.arange(t.shape[-1] // 2)[None, :]
    ang = pos * base ** (-2 * i / t.shape[-1])
    c, s = np.cos(ang), np.sin(ang)
    out = np.empty_like(t)
    out[..., 0::2] = t[..., 0::2] * c - t[..., 1::2] * s
    out[..., 1::2] = t[..., 0::2] * s + t[..., 1::2] * c
    return out

def softmax(a):
    a = a - a.max(-1, keepdims=True)
    e = np.exp(a)
    return e / e.sum(-1, keepdims=True)

def attention(x, pos0=0):
    T = x.shape[0]
    q = (x @ Wq).reshape(T, H,  hd).transpose(1, 0, 2)    # [H,  T, hd]
    k = (x @ Wk).reshape(T, KV, hd).transpose(1, 0, 2)    # [KV, T, hd]
    v = (x @ Wv).reshape(T, KV, hd).transpose(1, 0, 2)
    q, k = rope(q, pos0), rope(k, pos0)
    k = np.repeat(k, H // KV, axis=0)                     # each KV head serves a group of query heads
    v = np.repeat(v, H // KV, axis=0)
    S = q @ k.transpose(0, 2, 1) / np.sqrt(hd)
    S = np.where(np.tri(T)[None] > 0, S, -np.inf)         # causal mask
    return (softmax(S) @ v).transpose(1, 0, 2).reshape(T, H * hd) @ Wo

out = attention(x)

# Property 1: changing a LATER token must not change EARLIER outputs (causality)
x2 = x.copy(); x2[-1] += 1.0
print("causal check   :", np.abs(attention(x2)[:-1] - out[:-1]).max())     # exactly 0.0

# Property 2: shifting every position by the same amount changes nothing (RoPE is relative)
print("relative check :", np.abs(attention(x, pos0=100) - out).max())      # about 1e-15
~~~

Both checks pass when run: the first prints exactly `0.0`, the second a value around $10^{-15}$.

## Exercises

1. **Break it on purpose.** Remove the causal mask and rerun property 1. Apply RoPE to the values too and rerun property 2. Explain each failure.
2. **Add a KV cache.** Process the tokens one at a time, storing keys and values, and show the outputs equal the full computation ([chapter 10](/guide/kv-cache/)).
3. **Sliding window.** Add a window of 3 tokens to the mask. Which tokens can still influence the last output after two layers? ([chapter 13](/guide/sparse-and-linear-attention/))
4. **Count the cache.** For this configuration, how many numbers does the cache hold per token per layer, and how many would plain multi-head attention hold?
5. **Latent attention.** Replace $W_K, W_V$ with a down-projection to 8 numbers and per-head up-projections, then fold the key up-projection into the query ([chapter 11](/guide/gqa-and-mla/)). Verify the scores are unchanged.
