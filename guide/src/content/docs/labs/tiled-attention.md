---
title: "Tiled attention with online softmax"
description: "Reproduce the core idea of FlashAttention and show it equals ordinary attention"
sidebar:
  label: "Lab 3. Tiled attention with online softmax"
---

_Reproduce the core idea of FlashAttention and show it equals ordinary attention_

Lab 3 of 10 · about 40 minutes · runs on a laptop. **Related chapters:** [12. FlashAttention](/guide/flashattention/)

Compute causal attention one block at a time, never forming the full score matrix, and show the result matches the standard computation. This is the algorithm at the heart of FlashAttention ([chapter 12](/guide/flashattention/)), minus the GPU kernel.

~~~python
import numpy as np
rng = np.random.default_rng(0)
n, d = 64, 16
Q, K, V = (rng.normal(size=(n, d)) for _ in range(3))

def reference(Q, K, V):
    S = Q @ K.T / np.sqrt(d)
    S = np.where(np.tri(n) > 0, S, -np.inf)
    P = np.exp(S - S.max(1, keepdims=True))
    P /= P.sum(1, keepdims=True)
    return P @ V

def tiled(Q, K, V, bs=16):
    out = np.zeros_like(Q)
    for i in range(0, n, bs):
        q = Q[i:i + bs]
        m = np.full(len(q), -np.inf)               # running max
        l = np.zeros(len(q))                        # running denominator
        o = np.zeros((len(q), d))                   # running numerator
        for j in range(0, i + bs, bs):              # only key blocks at or before this query block
            k, v = K[j:j + bs], V[j:j + bs]
            s = q @ k.T / np.sqrt(d)
            keep = np.arange(i, i + len(q))[:, None] >= np.arange(j, j + len(k))[None, :]
            s = np.where(keep, s, -np.inf)
            m_new = np.maximum(m, s.max(1))
            scale = np.exp(m - m_new)               # rescale what was accumulated so far
            p = np.exp(s - m_new[:, None])
            l = l * scale + p.sum(1)
            o = o * scale[:, None] + p @ v
            m = m_new
        out[i:i + bs] = o / l[:, None]
    return out

print("max difference:", np.abs(reference(Q, K, V) - tiled(Q, K, V)).max())   # about 1e-16
~~~

## Exercises

1. Change the block size to 1, 7 and 64. What breaks, and what stays the same? (For 7 you must fix the loop bounds: why?)
2. Count how many score entries each version holds in memory at once.
3. Add a counter for how many block pairs are visited. Compare to the full $n^2$ and explain the saving from causality.
4. Make the first block of keys "sink" tokens that every query always attends to, and add a sliding window ([chapter 13](/guide/sparse-and-linear-attention/)). Does the tiling still work?
5. Switch to float16 and compare the error of the two versions. Which is more accurate, and why?
