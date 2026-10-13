"""Inside the Model: the reference implementation of the Model Explorer's toy transformer.

Decoder-only, 2 layers, 2 attention heads, d_model = 16, pre-RMSNorm, sinusoidal positions,
GELU MLP, output weights tied to the embedding, no biases. Everything is float64 NumPy.

The Explorer in your browser runs a JavaScript port of this file; every build checks that the two
agree to within 1e-9. The "# step:" comments match the Explorer's 26 steps.

Run it:  python itm_model.py "the cat sat on the"
Needs numpy, plus model.json and weights.json from https://insidethemodel.app/trace/ in the same folder.
"""
import json
import math
import sys
from pathlib import Path

import numpy as np


def load(folder=None):
    """Read the architecture (model.json) and the trained weights (weights.json)."""
    here = Path(folder) if folder else Path(__file__).resolve().parent
    find = lambda name: next(p for p in (here / name, here.parent / 'trace' / name) if p.exists())
    cfg = json.loads(find('model.json').read_text(encoding='utf8'))
    raw = json.loads(find('weights.json').read_text(encoding='utf8'))['weights']
    W = {'E': np.array(raw['E']), 'layers': [{k: np.array(v) for k, v in L.items()} for L in raw['layers']]}
    return cfg, W


def rmsnorm(x, eps):
    """Rescale each row to root-mean-square 1. No learned scale in this model."""
    return x / np.sqrt((x * x).mean(axis=-1, keepdims=True) + eps)


def gelu(x):
    return 0.5 * x * (1 + np.tanh(math.sqrt(2 / math.pi) * (x + 0.044715 * x ** 3)))


def softmax(a):
    e = np.exp(a - a.max(axis=-1, keepdims=True))     # subtracting the max keeps exp() from overflowing
    return e / e.sum(axis=-1, keepdims=True)


def positions(T, d):
    """Fixed sinusoidal position pattern: sin on even dimensions, cos on odd ones."""
    pe = np.zeros((T, d))
    for p in range(T):
        for i in range(d):
            angle = p / 10000 ** (2 * (i // 2) / d)
            pe[p, i] = math.sin(angle) if i % 2 == 0 else math.cos(angle)
    return pe


def tokenize(text, cfg):
    # step: tokens
    words = text.lower().replace('.', ' . ').split()
    vocab = cfg['vocab']
    ids = [0] + [vocab.index(w) for w in words if w in vocab[1:]]   # 0 is <bos>; unknown words are skipped
    return ids[:cfg['maxCtx']]


def forward(ids, W, cfg):
    T, d, dh, eps = len(ids), cfg['dModel'], cfg['dHead'], cfg['eps']
    attention = []                                    # kept so the patterns can be inspected

    # step: embed
    e = W['E'][ids]                                   # [T, 16]: one row of E per token
    # step: pos
    x = e + cfg['posScale'] * positions(T, d)         # the residual stream

    for P in W['layers']:
        # step: ln1
        y = rmsnorm(x, eps)
        # step: qkv
        q, k, v = y @ P['Wq'], y @ P['Wk'], y @ P['Wv']
        heads, patterns = [], []
        for h in range(cfg['nHeads']):
            cols = slice(h * dh, (h + 1) * dh)        # head h owns 8 of the 16 columns
            # step: scores
            scores = q[:, cols] @ k[:, cols].T / math.sqrt(dh)
            # step: mask
            scores[np.triu_indices(T, k=1)] = -np.inf     # a token may not read later tokens
            # step: softmax
            weights = softmax(scores)                     # each row sums to 1
            # step: headout
            heads.append(weights @ v[:, cols])
            patterns.append(weights)
        attention.append(patterns)
        # step: oproj
        x = x + np.concatenate(heads, axis=-1) @ P['Wo']
        # step: ln2
        y = rmsnorm(x, eps)
        # step: mlp
        m = gelu(y @ P['W1']) @ P['W2']
        # step: resid2
        x = x + m

    # step: lnf
    y = rmsnorm(x, eps)
    # step: logits
    logits = y @ W['E'].T                             # tied: compare with every word's embedding
    # step: probs
    probs = softmax(logits)
    return {'x_final': x, 'logits': logits, 'probs': probs, 'attention': attention}


if __name__ == '__main__':
    cfg, W = load()
    text = ' '.join(sys.argv[1:]) or cfg['prompts'][0]
    ids = tokenize(text, cfg)
    p = forward(ids, W, cfg)['probs'][-1]
    print('prompt:', ' '.join(cfg['vocab'][i] for i in ids))
    for i in np.argsort(-p)[:5]:
        print(f"  {cfg['vocab'][i]:>8s}  {p[i]:.3f}")
