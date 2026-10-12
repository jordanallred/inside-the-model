"""Independent NumPy reference for the itm-toy-1.0 model. Reads the architecture constants from public/js/itm-model.js
but re-implements weight generation and the forward pass on its own. Usage: python -I tools/reference_model.py > out.json"""
import json, math, re, sys
import numpy as np

src = open('public/js/itm-model.js', encoding='utf8').read()
VOCAB = json.loads(re.search(r"vocab: (\[.*?\])", src).group(1).replace("'", '"'))
PROMPTS = json.loads(re.sub(r",\s*\]", "]", re.search(r"prompts = (\[.*?\]);", src, re.S).group(1)).replace("'", '"'))
D, H, DH, DM, NL, EPS, POS = 16, 2, 8, 32, 2, 1e-5, 0.5
M = 0xFFFFFFFF

def weights():
    # Trained weights written by tools/train_model.py (plain JSON, read back in float64).
    w = json.load(open('public/trace/weights.json', encoding='utf8'))['weights']
    return dict(E=np.array(w['E']), L=[{k: np.array(v) for k, v in L.items()} for L in w['layers']])

def checksum(W):
    h = 0x811c9dc5
    mats = [W['E']] + [L[k] for L in W['L'] for k in ('Wq', 'Wk', 'Wv', 'Wo', 'W1', 'W2')]
    for A in mats:
        for x in A.flatten():
            for ch in f"{x:.10f},": h = ((h ^ ord(ch)) * 16777619) & M
    return f"{h:08x}"

def rms(X): return X / np.sqrt((X * X).mean(-1, keepdims=True) + EPS)
def gelu(x): return 0.5 * x * (1 + np.tanh(math.sqrt(2 / math.pi) * (x + 0.044715 * x ** 3)))
def sm(a): e = np.exp(a - a.max(-1, keepdims=True)); return e / e.sum(-1, keepdims=True)

def forward(W, ids):
    T = len(ids)
    pe = np.zeros((T, D))
    for p in range(T):
        for i in range(D): 
            f = p / 10000 ** (2 * (i // 2) / D); pe[p, i] = math.sin(f) if i % 2 == 0 else math.cos(f)
    x = W['E'][ids] + POS * pe
    heads = []
    for L in W['L']:
        n = rms(x); q, k, v = n @ L['Wq'], n @ L['Wk'], n @ L['Wv']
        o = []; hw = []
        for h in range(H):
            s = slice(h * DH, (h + 1) * DH)
            sc = q[:, s] @ k[:, s].T / math.sqrt(DH)
            sc = np.where(np.triu(np.ones((T, T)), 1) > 0, -np.inf, sc)
            w = sm(sc); hw.append(w.tolist()); o.append(w @ v[:, s])
        x = x + np.concatenate(o, -1) @ L['Wo']
        x = x + gelu(rms(x) @ L['W1']) @ L['W2']
        heads.append(hw)
    logits = rms(x) @ W['E'].T
    return dict(ids=ids, weights=heads, x_final=x.tolist(), logits=logits.tolist())

def tokenize(text):
    ids = [0]
    for w in text.lower().replace('.', ' . ').split():
        if w in VOCAB[1:]: ids.append(VOCAB.index(w))
    return ids[:16]

W = weights()
json.dump(dict(checksum=checksum(W), runs=[dict(prompt=p, **forward(W, tokenize(p))) for p in PROMPTS]), sys.stdout)
