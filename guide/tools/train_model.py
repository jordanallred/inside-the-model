"""Trains the itm-toy model on a small synthetic grammar, in pure NumPy with hand-written backprop.
Writes public/js/itm-weights.js (loaded by the browser engine) and public/trace/weights.json (loaded by the NumPy reference, public/code/itm_model.py).
Usage:  python -I tools/train_model.py            train and write weights
        python -I tools/train_model.py --check    gradient-check the backward pass only"""
import json, math, sys
import numpy as np

CFG = json.load(open('public/trace/model.json', encoding='utf8'))      # the architecture, shared with the reference and the browser engine
VOCAB, PROMPTS = CFG['vocab'], CFG['prompts']
V, D, H, DH, DM, NL, T, EPS, POS = len(VOCAB), CFG['dModel'], CFG['nHeads'], CFG['dHead'], CFG['dMlp'], CFG['nLayers'], CFG['maxCtx'], CFG['eps'], CFG['posScale']
SEED, STEPS, BATCH, LR = 20261012, 4000, 64, 6e-3
WORD = {w: i for i, w in enumerate(VOCAB)}

# ---------- training corpus: a tiny grammar ----------
def sentence(r):
    def np_(det_the=None):
        det = r.choice(['the', 'a']) if det_the is None else det_the
        adj = [r.choice(['big', 'small', 'red'])] if r.random() < 0.3 else []
        return [det] + adj + [r.choice(['cat', 'dog', 'bird'])]
    subj = np_()
    k = r.random()
    if k < 0.28: s = subj + ['sat', r.choice(['on', 'under']), 'the', r.choice(['mat', 'bed'])]
    elif k < 0.46: s = subj + ['ran'] + (['home'] if r.random() < 0.5 else ['to', 'the', r.choice(['mat', 'bed'])])
    elif k < 0.58: s = subj + ['slept']
    elif k < 0.80: s = subj + [r.choice(['chased', 'saw'])] + np_()
    else: s = subj + ['saw'] + np_() + ['and'] + np_()
    s = s + ['.']
    if r.random() < 0.35: s += ['then', 'it'] + ([r.choice(['sat', 'ran', 'slept'])] if r.random() < 0.7 else ['was', r.choice(['big', 'small', 'red'])]) + ['.']
    return s

def make_stream(r, n):
    out = []
    while len(out) < n: out += [WORD[w] for w in sentence(r)]
    return out

class Rand:
    def __init__(s, seed): s.r = np.random.RandomState(seed)
    def random(s): return s.r.random_sample()
    def choice(s, a): return a[s.r.randint(len(a))]

def batch(r):
    ids = np.zeros((BATCH, T), dtype=int)
    for b in range(BATCH):
        st = make_stream(r, T)[:T - 1]
        ids[b, 0] = 0; ids[b, 1:] = st
    return ids

# ---------- model ----------
def init(seed):
    r = np.random.RandomState(seed)
    P = {'E': r.randn(V, D) * 0.5}
    for l in range(NL):
        P[f'Wq{l}'] = r.randn(D, D) * 0.3; P[f'Wk{l}'] = r.randn(D, D) * 0.3; P[f'Wv{l}'] = r.randn(D, D) * 0.25
        P[f'Wo{l}'] = r.randn(D, D) * 0.2; P[f'W1{l}'] = r.randn(D, DM) * 0.25; P[f'W2{l}'] = r.randn(DM, D) * 0.18
    return P

def posenc(n):
    pe = np.zeros((n, D))
    for p in range(n):
        for i in range(D):
            f = p / 10000 ** (2 * (i // 2) / D); pe[p, i] = math.sin(f) if i % 2 == 0 else math.cos(f)
    return pe
PE = posenc(T)

def rms(x):
    r = np.sqrt((x * x).mean(-1, keepdims=True) + EPS); return x / r, r
def rms_back(dy, y, r): return (dy - y * (dy * y).mean(-1, keepdims=True)) / r
C = math.sqrt(2 / math.pi)
def gelu(x): return 0.5 * x * (1 + np.tanh(C * (x + 0.044715 * x ** 3)))
def gelu_d(x):
    t = np.tanh(C * (x + 0.044715 * x ** 3)); return 0.5 * (1 + t) + 0.5 * x * (1 - t * t) * C * (1 + 3 * 0.044715 * x * x)
def sm(a): e = np.exp(a - a.max(-1, keepdims=True)); return e / e.sum(-1, keepdims=True)
MASK = np.triu(np.ones((T, T), dtype=bool), 1)

def forward(P, ids):
    B = ids.shape[0]; x = P['E'][ids] + POS * PE; cache = []
    for l in range(NL):
        n1, r1 = rms(x)
        q, k, v = [(n1 @ P[f'{w}{l}']).reshape(B, T, H, DH).transpose(0, 2, 1, 3) for w in ('Wq', 'Wk', 'Wv')]
        s = q @ k.transpose(0, 1, 3, 2) / math.sqrt(DH); s = np.where(MASK, -np.inf, s); w = sm(s); o = w @ v
        cat = o.transpose(0, 2, 1, 3).reshape(B, T, D); res1 = x + cat @ P[f'Wo{l}']
        n2, r2 = rms(res1); h = n2 @ P[f'W1{l}']; g = gelu(h); res2 = res1 + g @ P[f'W2{l}']
        cache.append((x, n1, r1, q, k, v, w, cat, res1, n2, r2, h, g)); x = res2
    nf, rf = rms(x); logits = nf @ P['E'].T
    return logits, (cache, x, nf, rf)

def loss_grad(P, ids):
    B = ids.shape[0]; logits, (cache, xl, nf, rf) = forward(P, ids)
    lg = logits[:, :-1]; tgt = ids[:, 1:]; p = sm(lg); N = B * (T - 1)
    loss = -np.log(p[np.arange(B)[:, None], np.arange(T - 1)[None], tgt]).mean()
    dl = np.zeros_like(logits); d = p.copy(); d[np.arange(B)[:, None], np.arange(T - 1)[None], tgt] -= 1; dl[:, :-1] = d / N
    G = {k: np.zeros_like(v) for k, v in P.items()}
    G['E'] += dl.reshape(-1, V).T @ nf.reshape(-1, D)
    dx = rms_back(dl @ P['E'], nf, rf)
    for l in reversed(range(NL)):
        x, n1, r1, q, k, v, w, cat, res1, n2, r2, h, g = cache[l]
        dres1 = dx.copy(); dm = dx
        G[f'W2{l}'] += g.reshape(-1, DM).T @ dm.reshape(-1, D); dh = (dm @ P[f'W2{l}'].T) * gelu_d(h)
        G[f'W1{l}'] += n2.reshape(-1, D).T @ dh.reshape(-1, DM); dres1 += rms_back(dh @ P[f'W1{l}'].T, n2, r2)
        G[f'Wo{l}'] += cat.reshape(-1, D).T @ dres1.reshape(-1, D)
        do = (dres1 @ P[f'Wo{l}'].T).reshape(B, T, H, DH).transpose(0, 2, 1, 3)
        dw = do @ v.transpose(0, 1, 3, 2); dv = w.transpose(0, 1, 3, 2) @ do
        ds = w * (dw - (dw * w).sum(-1, keepdims=True)) / math.sqrt(DH)
        dq = ds @ k; dk = ds.transpose(0, 1, 3, 2) @ q
        flat = lambda a: a.transpose(0, 2, 1, 3).reshape(B, T, D)
        dq, dk, dv = flat(dq), flat(dk), flat(dv)
        for nm, dd in (('Wq', dq), ('Wk', dk), ('Wv', dv)): G[f'{nm}{l}'] += n1.reshape(-1, D).T @ dd.reshape(-1, D)
        dn1 = dq @ P[f'Wq{l}'].T + dk @ P[f'Wk{l}'].T + dv @ P[f'Wv{l}'].T
        dx = dres1 + rms_back(dn1, n1, r1)
    np.add.at(G['E'], ids, dx)
    return loss, G

def grad_check():
    P = init(1); ids = batch(Rand(3))[:4]; loss, G = loss_grad(P, ids); worst = 0
    rr = np.random.RandomState(0)
    for name in P:
        for _ in range(3):
            i = tuple(rr.randint(s) for s in P[name].shape); e = 1e-6; old = P[name][i]
            P[name][i] = old + e; lp, _ = loss_grad(P, ids); P[name][i] = old - e; lm, _ = loss_grad(P, ids); P[name][i] = old
            num = (lp - lm) / (2 * e); worst = max(worst, abs(num - G[name][i]) / max(1e-8, abs(num) + abs(G[name][i])))
    print(f'gradient check: worst relative error {worst:.2e}'); return worst < 1e-5

def greedy(P, text, n=6):
    ids = [0] + [WORD[w] for w in text.replace('.', ' . ').split()]
    for _ in range(n):
        a = np.array([ids + [0] * (T - len(ids))]); lg, _ = forward(P, a); ids.append(int(lg[0, len(ids) - 1].argmax()))
    return ' '.join(VOCAB[i] for i in ids[1:])

if '--check' in sys.argv:
    sys.exit(0 if grad_check() else 1)

if not grad_check(): sys.exit('backward pass failed its gradient check')
P = init(SEED); r = Rand(SEED + 1); m = {k: np.zeros_like(v) for k, v in P.items()}; vv = {k: np.zeros_like(v) for k, v in P.items()}
ema = None
for step in range(1, STEPS + 1):
    loss, G = loss_grad(P, batch(r)); lr = LR * min(1, step / 100) * (0.5 * (1 + math.cos(math.pi * step / STEPS)) * 0.95 + 0.05)
    gn = math.sqrt(sum((g * g).sum() for g in G.values())); sc = min(1, 1.0 / (gn + 1e-9))
    for k in P:
        g = G[k] * sc; m[k] = 0.9 * m[k] + 0.1 * g; vv[k] = 0.999 * vv[k] + 0.001 * g * g
        P[k] -= lr * (m[k] / (1 - 0.9 ** step)) / (np.sqrt(vv[k] / (1 - 0.999 ** step)) + 1e-8)
    ema = loss if ema is None else 0.98 * ema + 0.02 * loss
    if step % 500 == 0 or step == 1: print(f'step {step:5d}  loss {ema:.4f}')
# held-out loss on fresh sentences
ev = Rand(999); hl = np.mean([loss_grad(P, batch(ev))[0] for _ in range(10)])
print(f'held-out loss {hl:.4f}  (uniform guessing = {math.log(V):.3f})')
for p in PROMPTS: print(' ', greedy(P, p))

R = lambda a: np.round(a, 8)
W = {'E': R(P['E']).tolist(), 'layers': [{k: R(P[f'{k}{l}']).tolist() for k in ('Wq', 'Wk', 'Wv', 'Wo', 'W1', 'W2')} for l in range(NL)]}
meta = {'trained': True, 'steps': STEPS, 'batch': BATCH, 'optimizer': 'Adam, cosine learning-rate decay', 'initSeed': SEED, 'heldOutLoss': round(float(hl), 4), 'uniformLoss': round(math.log(V), 4),
        'corpus': 'synthetic grammar over the 25-entry vocabulary (subject, verb, object, place, and "then it ..." follow-ups)'}
out = {'meta': meta, 'weights': W}
import os; os.makedirs('public/trace', exist_ok=True)
json.dump(out, open('public/trace/weights.json', 'w'), separators=(',', ':'))
open('public/js/itm-weights.js', 'w', encoding='utf8').write('/* Generated by tools/train_model.py. Do not edit. */\n(typeof window !== "undefined" ? window : globalThis).ITM_WEIGHTS = ' + json.dumps(out, separators=(',', ':')) + ';\n')
print('wrote public/js/itm-weights.js and public/trace/weights.json')
