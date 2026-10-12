---
title: "Reproduce the Explorer's forward pass"
description: "Rebuild the Model Explorer's trained transformer in NumPy from its published weights and match every number"
sidebar:
  label: "Lab 10. Reproduce the Explorer's forward pass"
---

_Rebuild the Model Explorer's trained transformer in NumPy from its published weights and match every number_

Lab 10 of 10 · about 40 minutes · runs on a laptop. **Related chapters:** [6. Attention](/guide/attention/) · [7. The transformer block](/guide/transformer-block/) · [10. Generating text: the KV cache and inference cost](/guide/kv-cache/)

The [Model Explorer](/explorer/) shows a forward pass step by step. Here you write that forward pass yourself, from nothing but the published weights, and check it against the Explorer's own recorded numbers. If your code matches to rounding error, you have reproduced every operation the Explorer displays.

Download two files into one folder: the trained [weights](/trace/weights.json) and the [golden fixture](/trace/golden.json) (the Explorer's canonical traces: token IDs, final logits and every attention weight). You need only NumPy.

~~~python
import json, math
import numpy as np

W = json.load(open('weights.json'))['weights']          # the Explorer's trained weights
G = json.load(open('golden.json'))                      # the Explorer's canonical traces
vocab = G['manifest']['vocab']
E = np.array(W['E'])                                    # [25, 16]
layers = [{k: np.array(v) for k, v in l.items()} for l in W['layers']]
D, H, DH, EPS = 16, 2, 8, 1e-5

def rmsnorm(x):                                         # x / sqrt(mean(x^2) + eps), per row
    return x / np.sqrt((x * x).mean(-1, keepdims=True) + EPS)

def gelu(x):
    return 0.5 * x * (1 + np.tanh(math.sqrt(2 / math.pi) * (x + 0.044715 * x ** 3)))

def softmax(a):
    e = np.exp(a - a.max(-1, keepdims=True))
    return e / e.sum(-1, keepdims=True)

def positions(T):                                       # sin for even dimensions, cos for odd
    pe = np.zeros((T, D))
    for p in range(T):
        for i in range(D):
            f = p / 10000 ** (2 * (i // 2) / D)
            pe[p, i] = math.sin(f) if i % 2 == 0 else math.cos(f)
    return pe

def forward(ids, causal=True):
    T = len(ids)
    x = E[ids] + 0.5 * positions(T)                     # embedding lookup + position information
    attn = []
    for P in layers:
        n = rmsnorm(x)
        q, k, v = n @ P['Wq'], n @ P['Wk'], n @ P['Wv']
        heads, weights = [], []
        for h in range(H):
            s = slice(h * DH, (h + 1) * DH)
            scores = q[:, s] @ k[:, s].T / math.sqrt(DH)
            if causal:
                scores = np.where(np.triu(np.ones((T, T)), 1) > 0, -np.inf, scores)
            w = softmax(scores)
            weights.append(w)
            heads.append(w @ v[:, s])
        attn.append(weights)
        x = x + np.concatenate(heads, -1) @ P['Wo']     # attention output, added to the residual stream
        x = x + gelu(rmsnorm(x) @ P['W1']) @ P['W2']    # MLP output, added to the residual stream
    return rmsnorm(x) @ E.T, attn                       # tied output matrix

# 1. Reproduce the Explorer's first canonical prompt.
run = G['runs'][0]
logits, attn = forward(run['ids'])
print('prompt:', run['prompt'])
print('max |logits - Explorer|    =', np.abs(logits - np.array(run['logits'])).max())
print('max |attention - Explorer| =', max(np.abs(attn[l][h] - np.array(run['attention'][l][h])).max() for l in range(2) for h in range(2)))

# 2. Causality: the first 4 positions must not change when later tokens are removed.
short, _ = forward(run['ids'][:4])
print('causal check               =', np.abs(short - logits[:4]).max())

# 3. Greedy generation. A token is just the highest-scoring word at the last position.
ids = [0] + [vocab.index(w) for w in 'the cat sat on the'.split()]
for _ in range(4):
    ids.append(int(forward(ids)[0][-1].argmax()))
print('greedy:', ' '.join(vocab[i] for i in ids[1:]))

# 4. Break the mask and see what changes.
lo, _ = forward(run['ids'], causal=False)
print('without the mask, the last token\'s logits move by', np.abs(lo[-1] - logits[-1]).max())
print('but earlier positions now see the future: position 3 moves by', np.abs(lo[3] - logits[3]).max())
~~~

When run, the first three differences are around $10^{-15}$ (rounding error), the greedy generation reads `the cat sat on the mat . then it`, and removing the mask changes the earlier positions' outputs by a large amount, which is exactly why the mask exists.

## Exercises

1. **Find the head.** For the prompt `a big dog chased the small cat . then it`, print which token each head of each layer reads most strongly. Compare with the heat maps in the [attention chapter](/guide/attention/)'s widget.
2. **Add a KV cache.** Generate one token at a time, storing each layer's keys and values, and show the logits equal the full computation ([chapter 10](/guide/kv-cache/)). How many numbers does the cache hold per token for this model?
3. **Ablate a head.** Zero the output of layer 0, head 0 before it is mixed by $W_O$. How much does the next-token distribution after `the cat sat on the` change? Is the change larger for layer 0 or layer 1?
4. **Replace the positions.** Remove the sinusoidal positions. Which predictions break first? Can the model still tell `the cat chased the dog` from `the dog chased the cat`? Test it, and explain what the causal mask alone can and cannot reveal about word order.
5. **One gradient step.** Compute the loss on a sentence, then estimate the gradient of every entry of one weight matrix with finite differences. Compare its norm with the gradient size the [training widget](/guide/backpropagation/) reports for that matrix.
