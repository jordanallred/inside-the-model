/* Inside the Model: loss and hand-written backpropagation for the itm-toy model (extends window.ITM / globalThis.ITM).
   lossGrad(W, ids) returns the mean next-token cross-entropy over the sequence and the gradient of every weight matrix.
   tools/verify-trace.mjs checks these gradients against finite differences. */
(function (root) {
  const ITM = root.ITM, { CFG } = ITM, { matmul, rmsOf, softmax } = ITM.math;
  const tp = A => A[0].map((_, j) => A.map(r => r[j]));
  const zeros = (n, m) => Array.from({ length: n }, () => new Array(m).fill(0));
  const addTo = (A, B) => { for (let i = 0; i < A.length; i++) for (let j = 0; j < A[i].length; j++) A[i][j] += B[i][j]; };
  const C = Math.sqrt(2 / Math.PI);
  const geluD = x => { const t = Math.tanh(C * (x + 0.044715 * x ** 3)); return 0.5 * (1 + t) + 0.5 * x * (1 - t * t) * C * (1 + 3 * 0.044715 * x * x); };
  /* backward of y = x / sqrt(mean(x^2) + eps), row by row */
  const rmsBack = (dy, y, x) => dy.map((row, t) => {
    const r = rmsOf(x[t]), m = row.reduce((s, v, i) => s + v * y[t][i], 0) / row.length;
    return row.map((v, i) => (v - y[t][i] * m) / r);
  });
  const cols = (A, a, b) => A.map(r => r.slice(a, b));

  function lossGrad(W, ids) {
    const tr = ITM.forward(W, ids), T = ids.length, N = T - 1, d = CFG.dModel, dh = CFG.dHead, V = CFG.vocab.length;
    let loss = 0; for (let t = 0; t < N; t++) loss -= Math.log(tr.probs[t][ids[t + 1]]); loss /= N;
    const G = { E: zeros(V, d), layers: W.layers.map(() => ({ Wq: null, Wk: null, Wv: null, Wo: null, W1: null, W2: null })) };
    const dl = tr.probs.map((p, t) => p.map((v, k) => (t < N ? (v - (k === ids[t + 1] ? 1 : 0)) / N : 0)));
    G.E = matmul(tp(dl), tr.lnf);
    let dx = rmsBack(matmul(dl, W.E), tr.lnf, tr.layers[CFG.nLayers - 1].resid2);
    for (let l = CFG.nLayers - 1; l >= 0; l--) {
      const L = tr.layers[l], P = W.layers[l], g = G.layers[l];
      const dm = dx; g.W2 = matmul(tp(L.act), dm);
      const dhid = matmul(dm, tp(P.W2)).map((r, t) => r.map((v, i) => v * geluD(L.hidden[t][i])));
      g.W1 = matmul(tp(L.ln2), dhid);
      const dres1 = dx.map(r => r.slice()); addTo(dres1, rmsBack(matmul(dhid, tp(P.W1)), L.ln2, L.resid1));
      g.Wo = matmul(tp(L.concat), dres1);
      const dcat = matmul(dres1, tp(P.Wo)), dQ = zeros(T, d), dK = zeros(T, d), dV = zeros(T, d);
      L.heads.forEach((H, h) => {
        const dO = cols(dcat, h * dh, (h + 1) * dh), o = h * dh;
        for (let i = 0; i < T; i++) {
          const dw = H.weights[i].map((_, j) => (j > i ? 0 : dO[i].reduce((s, v, n) => s + v * H.v[j][n], 0)));
          const dot = dw.reduce((s, v, j) => s + v * H.weights[i][j], 0);
          for (let j = 0; j <= i; j++) {
            const ds = H.weights[i][j] * (dw[j] - dot) / Math.sqrt(dh);
            for (let n = 0; n < dh; n++) { dQ[i][o + n] += ds * H.k[j][n]; dK[j][o + n] += ds * H.q[i][n]; dV[j][o + n] += H.weights[i][j] * dO[i][n]; }
          }
        }
      });
      g.Wq = matmul(tp(L.ln1), dQ); g.Wk = matmul(tp(L.ln1), dK); g.Wv = matmul(tp(L.ln1), dV);
      const dn1 = matmul(dQ, tp(P.Wq)); addTo(dn1, matmul(dK, tp(P.Wk))); addTo(dn1, matmul(dV, tp(P.Wv)));
      dx = dres1.map(r => r.slice()); addTo(dx, rmsBack(dn1, L.ln1, L.xIn));
    }
    dx.forEach((row, t) => row.forEach((v, j) => { G.E[ids[t]][j] += v; }));
    return { loss, G, tr };
  }

  const cloneW = W => ({ E: W.E.map(r => r.slice()), layers: W.layers.map(L => Object.fromEntries(Object.keys(L).map(k => [k, L[k].map(r => r.slice())]))) });
  /* every weight matrix as [name, matrix] for iteration */
  const mats = W => [['E', W.E]].concat(W.layers.flatMap((L, l) => ['Wq', 'Wk', 'Wv', 'Wo', 'W1', 'W2'].map(k => [k + '·L' + l, L[k]])));
  const gmats = G => [['E', G.E]].concat(G.layers.flatMap((L, l) => ['Wq', 'Wk', 'Wv', 'Wo', 'W1', 'W2'].map(k => [k + '·L' + l, L[k]])));
  const norm = A => Math.sqrt(A.reduce((s, r) => s + r.reduce((a, v) => a + v * v, 0), 0));

  /* One SGD step on a copy of the weights: w <- w - lr * grad. Returns the new weights and what happened. */
  function sgdStep(W, ids, lr) {
    const { loss, G } = lossGrad(W, ids), W2 = cloneW(W), gm = gmats(G), wm = mats(W2), info = [];
    wm.forEach(([name, M], k) => {
      const g = gm[k][1]; let dn = 0;
      for (let i = 0; i < M.length; i++) for (let j = 0; j < M[i].length; j++) { const u = lr * g[i][j]; M[i][j] -= u; dn += u * u; }
      info.push({ name, grad: norm(g), change: Math.sqrt(dn) });
    });
    return { W: W2, loss, info };
  }

  Object.assign(ITM, { lossGrad, sgdStep, cloneW, mats, gmats });
})(typeof window !== 'undefined' ? window : globalThis);
