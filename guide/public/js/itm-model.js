/* Inside the Model: reference toy transformer (itm-toy-1.0).
   Pure, deterministic, float64, no dependencies. Works in the browser (window.ITM) and in Node (globalThis.ITM).
   Architecture: decoder-only, pre-RMSNorm, 2 layers, 2 heads, sinusoidal positions, GELU(tanh) MLP, tied unembedding, no biases.
   Weights are trained offline on a tiny synthetic grammar (tools/train_model.py) and loaded from itm-weights.js. If that file is
   absent the engine falls back to seeded random weights, which still demonstrate the computation but predict nothing meaningful. */
(function (root) {
  const CFG = {
    version: 'itm-toy-2.0', seed: 20261012,
    vocab: ['<bos>', 'the', 'a', 'cat', 'dog', 'bird', 'sat', 'ran', 'slept', 'on', 'under', 'mat', 'bed', 'and', 'chased', 'saw', '.', 'big', 'small', 'red', 'then', 'to', 'home', 'it', 'was'],
    dModel: 16, nHeads: 2, dHead: 8, dMlp: 32, nLayers: 2, maxCtx: 16, eps: 1e-5, posScale: 0.5,
    std: { E: 0.5, Wq: 0.5, Wk: 0.5, Wv: 0.25, Wo: 0.25, W1: 0.25, W2: 0.18 },
  };
  CFG.prompts = [
    'the cat sat on the mat . the dog',
    'a big dog chased the small cat . then it',
    'the bird saw a red cat and the dog',
    'the cat sat on the',
  ];

  /* mulberry32 PRNG, Box-Muller normals. The Python reference (tools/reference_model.py) implements the same generator. */
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const gauss = r => { const u1 = r(), u2 = r(); return Math.sqrt(-2 * Math.log(Math.max(u1, 1e-12))) * Math.cos(2 * Math.PI * u2); };
  const mat = (r, n, m, s) => Array.from({ length: n }, () => Array.from({ length: m }, () => gauss(r) * s));

  function makeWeights() {
    const r = rng(CFG.seed), d = CFG.dModel, S = CFG.std;
    const W = { E: mat(r, CFG.vocab.length, d, S.E), layers: [] };
    for (let l = 0; l < CFG.nLayers; l++) {
      const Wq = mat(r, d, d, S.Wq), Wk = mat(r, d, d, S.Wk), Wv = mat(r, d, d, S.Wv), Wo = mat(r, d, d, S.Wo);
      const W1 = mat(r, d, CFG.dMlp, S.W1), W2 = mat(r, CFG.dMlp, d, S.W2);
      W.layers.push({ Wq, Wk, Wv, Wo, W1, W2 });
    }
    return W;
  }

  /* FNV-1a over every weight written to 10 decimals, in generation order. */
  function checksum(W) {
    let h = 0x811c9dc5;
    const feed = A => A.forEach(row => row.forEach(x => { const s = x.toFixed(10) + ','; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } }));
    feed(W.E); W.layers.forEach(L => ['Wq', 'Wk', 'Wv', 'Wo', 'W1', 'W2'].forEach(k => feed(L[k])));
    return ('00000000' + (h >>> 0).toString(16)).slice(-8);
  }

  const matmul = (A, B) => A.map(row => B[0].map((_, j) => { let s = 0; for (let k = 0; k < row.length; k++) s += row[k] * B[k][j]; return s; }));
  const rmsOf = x => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length + CFG.eps);
  const rmsnorm = X => X.map(x => { const r = rmsOf(x); return x.map(v => v / r); });
  const gelu = x => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)));
  const softmax = a => { const m = Math.max(...a), e = a.map(v => Math.exp(v - m)), s = e.reduce((p, q) => p + q, 0); return e.map(v => v / s); };
  const add = (A, B) => A.map((r, i) => r.map((v, j) => v + B[i][j]));
  const cols = (A, a, b) => A.map(r => r.slice(a, b));
  function posEnc(T) {
    return Array.from({ length: T }, (_, p) => Array.from({ length: CFG.dModel }, (_, i) => {
      const f = p / Math.pow(10000, 2 * Math.floor(i / 2) / CFG.dModel);
      return i % 2 === 0 ? Math.sin(f) : Math.cos(f);
    }));
  }

  /* Every intermediate tensor is kept. Shapes: T = number of tokens, d = 16, V = 25. */
  function forward(W, ids) {
    const T = ids.length, d = CFG.dModel, dh = CFG.dHead, tr = { ids, T, layers: [] };
    tr.tokEmb = ids.map(i => W.E[i].slice());
    tr.pe = posEnc(T);
    let x = tr.tokEmb.map((e, i) => e.map((v, j) => v + CFG.posScale * tr.pe[i][j]));
    tr.x0 = x;
    for (let l = 0; l < CFG.nLayers; l++) {
      const P = W.layers[l], L = { xIn: x };
      L.ln1 = rmsnorm(x);
      L.q = matmul(L.ln1, P.Wq); L.k = matmul(L.ln1, P.Wk); L.v = matmul(L.ln1, P.Wv);
      L.heads = [];
      for (let h = 0; h < CFG.nHeads; h++) {
        const q = cols(L.q, h * dh, (h + 1) * dh), k = cols(L.k, h * dh, (h + 1) * dh), v = cols(L.v, h * dh, (h + 1) * dh);
        const dots = q.map(qi => k.map(kj => qi.reduce((s, a, n) => s + a * kj[n], 0)));
        const scaled = dots.map(r => r.map(s => s / Math.sqrt(dh)));
        const masked = scaled.map((r, i) => r.map((s, j) => (j > i ? -Infinity : s)));
        const weights = masked.map(softmax);
        const out = weights.map(w => Array.from({ length: dh }, (_, n) => w.reduce((s, wj, j) => s + wj * v[j][n], 0)));
        L.heads.push({ q, k, v, dots, scaled, masked, weights, out });
      }
      L.concat = L.heads[0].out.map((_, i) => [].concat(...L.heads.map(H => H.out[i])));
      L.attnOut = matmul(L.concat, P.Wo);
      L.resid1 = add(x, L.attnOut);
      L.ln2 = rmsnorm(L.resid1);
      L.hidden = matmul(L.ln2, P.W1);
      L.act = L.hidden.map(r => r.map(gelu));
      L.mlpOut = matmul(L.act, P.W2);
      L.resid2 = add(L.resid1, L.mlpOut);
      x = L.resid2;
      tr.layers.push(L);
    }
    tr.lnf = rmsnorm(x);
    tr.logits = matmul(tr.lnf, transpose(W.E));
    tr.probs = tr.logits.map(softmax);
    return tr;
  }
  const transpose = A => A[0].map((_, j) => A.map(r => r[j]));

  /* Prompt text -> ids. <bos> is always prepended. Unknown words are reported, not guessed. */
  function tokenize(text) {
    const words = text.toLowerCase().replace(/\./g, ' . ').split(/\s+/).filter(Boolean), ids = [0], unknown = [];
    for (const w of words) { const i = CFG.vocab.indexOf(w); if (i > 0) ids.push(i); else unknown.push(w); }
    let truncated = false;
    if (ids.length > CFG.maxCtx) { ids.length = CFG.maxCtx; truncated = true; }
    return { ids, unknown, truncated };
  }

  let cache = null;
  function weights() {
    if (!cache) {
      const T = root.ITM_WEIGHTS, W = T ? T.weights : makeWeights();
      cache = { W, sum: checksum(W), meta: T ? T.meta : { trained: false, note: 'seeded random weights' } };
    }
    return cache;
  }
  let seededCache = null;
  function seeded() { if (!seededCache) { const W = makeWeights(); seededCache = { W, sum: checksum(W), meta: { trained: false, note: 'seeded random weights' } }; } return seededCache; }
  const manifest = () => ({ ...CFG, prompts: undefined, checksum: weights().sum, training: weights().meta, params: weights().W.E.length * CFG.dModel + CFG.nLayers * (4 * 256 + 2 * 512) });

  root.ITM = { CFG, weights, seeded, forward, tokenize, manifest, math: { matmul, rmsnorm, rmsOf, gelu, softmax, posEnc } };
})(typeof window !== 'undefined' ? window : globalThis);
