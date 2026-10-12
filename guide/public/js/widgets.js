/* Interactive widgets, part 1: toolkit, foundations, attention, position. Each widget is W.name = el => { ... }. */
(function () {
  const W = (window.W = window.W || {});
  const T = (window.T = {
    col: v => getComputedStyle(document.documentElement).getPropertyValue(v).trim(),
    slider(k, label, min, max, val, step) {
      step = step || 1; const dec = (String(step).split('.')[1] || '').length;
      return '<div class="ctl"><label>' + label + '</label><input type="range" data-k="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><output data-o="' + k + '">' + (+val).toFixed(dec) + '</output></div>';
    },
    select(k, label, opts, val) {
      return '<div class="ctl"><label>' + label + '</label><select data-k="' + k + '">' + opts.map(o => '<option value="' + o[0] + '"' + (o[0] === val ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select><span></span></div>';
    },
    g: (el, k) => +el.querySelector('[data-k="' + k + '"]').value,
    s: (el, k) => el.querySelector('[data-k="' + k + '"]').value,
    chk: (el, k) => el.querySelector('[data-k="' + k + '"]').checked,
    sync(el) {
      el.querySelectorAll('input[type=range][data-k]').forEach(r => {
        const dec = (String(r.step || 1).split('.')[1] || '').length;
        const o = el.querySelector('[data-o="' + r.dataset.k + '"]'); if (o) o.textContent = (+r.value).toFixed(dec);
      });
    },
    on(el, fn) {
      const upd = () => el.querySelectorAll('input[type=range][data-k]').forEach(r => {
        const dec = (String(r.step || 1).split('.')[1] || '').length;
        const o = el.querySelector('[data-o="' + r.dataset.k + '"]'); if (o) o.textContent = (+r.value).toFixed(dec);
      });
      el.addEventListener('input', e => { upd(); fn(e); });
      el.addEventListener('change', e => { if (e.target.type !== 'range') { upd(); fn(e); } });
      el.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) fn(e, b.dataset.a); });
    },
    cv(el, w, h) {
      w = w || 640; h = h || 260;
      const c = el.querySelector('canvas'); c.width = w * 2; c.height = h * 2;
      const x = c.getContext('2d'); x.scale(2, 2); x.font = '11px IBM Plex Mono, monospace';
      return { c, x, w, h };
    },
    softmax(a) { const m = Math.max(...a), e = a.map(v => Math.exp(v - m)), s = e.reduce((p, q) => p + q, 0); return e.map(v => v / s); },
    rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; },
    randn(r) { return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r()); },
    hash(a, b) { const x = Math.sin(a * 127.1 + b * 311.7 + 0.5) * 43758.5453; return x - Math.floor(x); },
    mm: (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0))),
    tr: A => A[0].map((_, j) => A.map(r => r[j])),
    fmt(n) { n = Math.abs(n) < 1e-300 ? 0 : n; const a = Math.abs(n); return a >= 1e12 ? (n / 1e12).toFixed(2) + 'T' : a >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(Math.round(n * 100) / 100); },
    bytes(b) { return b >= 1e12 ? (b / 1e12).toFixed(2) + ' TB' : b >= 1e9 ? (b / 1e9).toFixed(2) + ' GB' : b >= 1e6 ? (b / 1e6).toFixed(1) + ' MB' : b >= 1e3 ? (b / 1e3).toFixed(1) + ' KB' : Math.round(b) + ' B'; },
    dot: (a, b) => a.reduce((s, x, i) => s + x * b[i], 0),
    bar(label, frac, color, right) { return '<div class="brow"><span>' + label + '</span><div class="bar"><i style="width:' + Math.max(0, Math.min(100, frac * 100)) + '%;background:' + color + '"></i></div><span>' + right + '</span></div>'; },
  });
  const COL = ['--c1', '--c2', '--c3', '--c4'];

  /* ---- gradient descent in one dimension ---- */
  W.gd = el => {
    const f = x => 0.25 * x ** 4 - x * x + 0.3 * x, df = x => x ** 3 - 2 * x + 0.3;
    el.innerHTML = T.slider('x0', 'start x', -2.6, 2.6, -2.2, 0.1) + T.slider('lr', 'learning rate', 0.01, 1.3, 0.2, 0.01) +
      '<div class="row"><button class="btn" data-a="step">1 step</button><button class="btn" data-a="run">25 steps</button><button class="btn" data-a="reset">Reset</button></div><canvas></canvas><div class="shape" data-out></div>';
    const C = T.cv(el); let path;
    const reset = () => { path = [T.g(el, 'x0')]; };
    const draw = () => {
      const { x, w, h } = C, X = v => (v + 3) / 6 * w, Y = v => h - (v + 3.5) / 7.5 * h;
      x.clearRect(0, 0, w, h); x.strokeStyle = T.col('--line'); x.beginPath(); x.moveTo(0, Y(0)); x.lineTo(w, Y(0)); x.stroke();
      x.strokeStyle = T.col('--fg'); x.lineWidth = 2; x.beginPath();
      for (let i = 0; i <= 300; i++) { const v = -3 + i / 50, px = X(v), py = Y(f(v)); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
      x.lineWidth = 1.5; x.strokeStyle = T.col('--accent'); x.beginPath();
      path.forEach((v, i) => { const px = X(v), py = Y(f(v)); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke();
      path.forEach((v, i) => { x.fillStyle = i === path.length - 1 ? T.col('--accent') : T.col('--muted'); x.beginPath(); x.arc(X(v), Y(f(v)), i === path.length - 1 ? 5 : 3, 0, 7); x.fill(); });
      const v = path[path.length - 1], g = df(v);
      let msg = Math.abs(v) > 3 ? 'Left the plotted range (the steps are too large).' : Math.abs(g) < 1e-3 ? 'Gradient is about zero: stopped at a minimum.' : 'Moving downhill.';
      if (!isFinite(v) || Math.abs(v) > 1e6) msg = 'Diverged.';
      el.querySelector('[data-out]').textContent = 'steps ' + (path.length - 1) + '   x = ' + (isFinite(v) ? v.toFixed(4) : v) + '   f(x) = ' + (isFinite(f(v)) ? f(v).toFixed(4) : '∞') + '   f\'(x) = ' + (isFinite(g) ? g.toFixed(4) : '∞') + '\nupdate: x ← x − lr · f\'(x)\n' + msg;
    };
    const step = () => { const v = path[path.length - 1]; if (Math.abs(v) < 1e6) path.push(v - T.g(el, 'lr') * df(v)); };
    T.on(el, (e, a) => {
      if (a === 'step') step(); else if (a === 'run') for (let i = 0; i < 25; i++) step(); else if (a === 'reset' || (e.target && e.target.dataset.k === 'x0')) reset();
      draw();
    });
    reset(); draw();
  };

  /* ---- train a one-hidden-layer network on a curve ---- */
  W.mlp = el => {
    const acts = {
      relu: [v => Math.max(0, v), v => (v > 0 ? 1 : 0)],
      tanh: [Math.tanh, v => 1 - Math.tanh(v) ** 2],
      silu: [v => v / (1 + Math.exp(-v)), v => { const s = 1 / (1 + Math.exp(-v)); return s * (1 + v * (1 - s)); }],
    };
    const targets = { sine: v => Math.sin(3 * v), abs: v => 1.5 * Math.abs(v) - 0.5, step: v => (v < 0.1 ? -1 : 1), wiggle: v => 0.6 * Math.sin(6 * v) + 0.8 * v };
    el.innerHTML = T.slider('H', 'hidden units', 1, 24, 6, 1) + T.select('act', 'activation', [['relu', 'ReLU'], ['tanh', 'tanh'], ['silu', 'SiLU']], 'relu') +
      T.select('tg', 'target curve', [['sine', 'sine'], ['abs', 'absolute value'], ['step', 'step'], ['wiggle', 'wiggle']], 'sine') +
      '<div class="row"><button class="btn primary" data-a="train">Train 200 steps</button><button class="btn" data-a="reset">Re-initialize</button><label><input type="checkbox" data-k="units"> show each hidden unit\'s contribution</label></div><canvas></canvas><div class="shape" data-out></div>';
    const C = T.cv(el), N = 60, X = Array.from({ length: N }, (_, i) => -1 + 2 * i / (N - 1));
    let P, M, V, t, seed = 1, steps = 0;
    const init = () => {
      const H = T.g(el, 'H'), r = T.rng(seed * 7919); P = { w1: [], b1: [], w2: [], b2: 0 };
      for (let j = 0; j < H; j++) { P.w1.push(T.randn(r) * 2); P.b1.push(T.randn(r) * 0.5); P.w2.push(T.randn(r) / Math.sqrt(H)); }
      M = { w1: Array(H).fill(0), b1: Array(H).fill(0), w2: Array(H).fill(0), b2: 0 }; V = JSON.parse(JSON.stringify(M)); t = 0; steps = 0;
    };
    const fwd = v => { const [a] = acts[T.s(el, 'act')]; let y = P.b2; const hs = P.w1.map((w, j) => { const h = a(w * v + P.b1[j]); y += P.w2[j] * h; return h; }); return { y, hs }; };
    const train = n => {
      const [a, da] = acts[T.s(el, 'act')], tg = targets[T.s(el, 'tg')], H = P.w1.length;
      for (let s = 0; s < n; s++) {
        const g = { w1: Array(H).fill(0), b1: Array(H).fill(0), w2: Array(H).fill(0), b2: 0 };
        X.forEach(v => {
          let y = P.b2; const z = P.w1.map((w, j) => w * v + P.b1[j]), h = z.map(a); h.forEach((hj, j) => { y += P.w2[j] * hj; });
          const dy = 2 * (y - tg(v)) / N; g.b2 += dy;
          for (let j = 0; j < H; j++) { g.w2[j] += dy * h[j]; const dz = dy * P.w2[j] * da(z[j]); g.w1[j] += dz * v; g.b1[j] += dz; }
        });
        t++; const lr = 0.02, b1 = 0.9, b2 = 0.999;
        const upd = (p, m, vv, gr) => { m = b1 * m + (1 - b1) * gr; vv = b2 * vv + (1 - b2) * gr * gr; return [p - lr * (m / (1 - b1 ** t)) / (Math.sqrt(vv / (1 - b2 ** t)) + 1e-8), m, vv]; };
        ['w1', 'b1', 'w2'].forEach(k => P[k].forEach((p, j) => { [P[k][j], M[k][j], V[k][j]] = upd(p, M[k][j], V[k][j], g[k][j]); }));
        [P.b2, M.b2, V.b2] = upd(P.b2, M.b2, V.b2, g.b2); steps++;
      }
    };
    const draw = () => {
      const { x, w, h } = C, tg = targets[T.s(el, 'tg')], PX = v => (v + 1) / 2 * w, PY = v => h / 2 - v / 2.4 * (h / 2);
      x.clearRect(0, 0, w, h); x.strokeStyle = T.col('--line'); x.beginPath(); x.moveTo(0, PY(0)); x.lineTo(w, PY(0)); x.stroke();
      if (T.chk(el, 'units')) {
        P.w1.forEach((_, j) => { x.strokeStyle = T.col(COL[j % 4]); x.globalAlpha = 0.45; x.beginPath(); for (let i = 0; i <= 120; i++) { const v = -1 + i / 60, [a] = acts[T.s(el, 'act')], c = P.w2[j] * a(P.w1[j] * v + P.b1[j]); i ? x.lineTo(PX(v), PY(c)) : x.moveTo(PX(v), PY(c)); } x.stroke(); });
        x.globalAlpha = 1;
      }
      x.fillStyle = T.col('--muted'); X.forEach(v => { x.beginPath(); x.arc(PX(v), PY(tg(v)), 2.5, 0, 7); x.fill(); });
      x.strokeStyle = T.col('--accent'); x.lineWidth = 2.5; x.beginPath(); for (let i = 0; i <= 160; i++) { const v = -1 + i / 80, y = fwd(v).y; i ? x.lineTo(PX(v), PY(y)) : x.moveTo(PX(v), PY(y)); } x.stroke(); x.lineWidth = 1;
      const mse = X.reduce((s, v) => s + (fwd(v).y - tg(v)) ** 2, 0) / N, np = 3 * P.w1.length + 1;
      el.querySelector('[data-out]').textContent = 'training steps ' + steps + '   mean squared error ' + mse.toFixed(4) + '   parameters ' + np + '\nmodel: y = b₂ + Σⱼ w₂ⱼ · act(w₁ⱼ x + b₁ⱼ)   (each unit is one bend; the output is their weighted sum)';
    };
    T.on(el, (e, a) => {
      const k = e.target && e.target.dataset && e.target.dataset.k;
      if (a === 'train') train(200); else if (a === 'reset') { seed++; init(); } else if (k === 'H' || k === 'act') init();
      draw();
    });
    init(); train(200); draw();
  };

  /* ---- optimizers on an elongated valley ---- */
  W.opt = el => {
    el.innerHTML = T.slider('lr', 'SGD / momentum learning rate', 0.005, 0.07, 0.03, 0.005) + T.slider('alr', 'Adam learning rate', 0.05, 1, 0.3, 0.05) + T.slider('n', 'steps', 5, 80, 40, 1) +
      '<canvas></canvas><div class="shape" data-out></div><p class="src">Loss f(x, y) = ½(x² + 30 y²): a long narrow valley. Gradient descent must use a small step so it does not blow up across the valley, so it crawls along it. Momentum accumulates velocity along the valley. Adam rescales each coordinate by its recent gradient size.</p>';
    const C = T.cv(el), f = (a, b) => 0.5 * (a * a + 30 * b * b), gr = (a, b) => [a, 30 * b];
    const run = () => {
      const lr = T.g(el, 'lr'), alr = T.g(el, 'alr'), n = T.g(el, 'n'), s = [-4.5, 1];
      let p1 = s.slice(), p2 = s.slice(), v2 = [0, 0], p3 = s.slice(), m3 = [0, 0], q3 = [0, 0];
      const P = [[p1.slice()], [p2.slice()], [p3.slice()]];
      for (let t = 1; t <= n; t++) {
        let g = gr(...p1); p1 = [p1[0] - lr * g[0], p1[1] - lr * g[1]]; P[0].push(p1.slice());
        g = gr(...p2); v2 = [0.9 * v2[0] + g[0], 0.9 * v2[1] + g[1]]; p2 = [p2[0] - lr * v2[0], p2[1] - lr * v2[1]]; P[1].push(p2.slice());
        g = gr(...p3); for (let i = 0; i < 2; i++) { m3[i] = 0.9 * m3[i] + 0.1 * g[i]; q3[i] = 0.999 * q3[i] + 0.001 * g[i] * g[i]; p3[i] -= alr * (m3[i] / (1 - 0.9 ** t)) / (Math.sqrt(q3[i] / (1 - 0.999 ** t)) + 1e-8); } P[2].push(p3.slice());
      }
      return P;
    };
    const draw = () => {
      const { x, w, h } = C, X = v => (v + 5) / 10 * w, Y = v => h / 2 - v * 70; x.clearRect(0, 0, w, h);
      x.strokeStyle = T.col('--line'); [1, 3, 6, 10, 16].forEach(c => { x.beginPath(); x.ellipse(X(0), Y(0), Math.sqrt(2 * c) / 10 * w, Math.sqrt(2 * c / 30) * 70, 0, 0, 7); x.stroke(); });
      const P = run(), names = ['SGD', 'Momentum', 'Adam'], out = [];
      P.forEach((p, i) => {
        x.strokeStyle = T.col(COL[i]); x.fillStyle = T.col(COL[i]); x.lineWidth = 2; x.beginPath(); p.forEach((q, j) => { j ? x.lineTo(X(q[0]), Y(q[1])) : x.moveTo(X(q[0]), Y(q[1])); }); x.stroke();
        x.beginPath(); x.arc(X(p[p.length - 1][0]), Y(p[p.length - 1][1]), 4, 0, 7); x.fill(); x.fillText(names[i], 8 + i * 90, 14);
        const l = f(...p[p.length - 1]); out.push(names[i].padEnd(9) + ' final loss ' + (isFinite(l) ? l.toExponential(2) : 'diverged'));
      });
      x.lineWidth = 1; el.querySelector('[data-out]').textContent = out.join('\n');
    };
    T.on(el, draw); draw();
  };

  /* ---- softmax, cross-entropy and temperature ---- */
  W.softmax = el => {
    const toks = ['cat', 'dog', 'car', 'sky', 'the'], init = [2.0, 1.2, -0.5, 0.2, 0.8];
    el.innerHTML = toks.map((t, i) => T.slider('z' + i, 'logit: ' + t, -4, 4, init[i], 0.1)).join('') + T.slider('T', 'temperature (sampling only)', 0.2, 3, 1, 0.05) +
      T.select('y', 'true next token', toks.map(t => [t, t]), 'cat') + '<div data-out></div><div class="shape" data-sh></div>';
    const draw = () => {
      const z = toks.map((_, i) => T.g(el, 'z' + i)), Tm = T.g(el, 'T'), y = toks.indexOf(T.s(el, 'y'));
      const p = T.softmax(z), q = T.softmax(z.map(v => v / Tm));
      el.querySelector('[data-out]').innerHTML = '<div class="kicker">training distribution p = softmax(z)</div>' + toks.map((t, i) => T.bar(t, p[i], i === y ? 'var(--ok)' : 'var(--c1)', p[i].toFixed(3))).join('') +
        '<div class="kicker" style="margin-top:8px">sampling distribution softmax(z / T)</div>' + toks.map((t, i) => T.bar(t, q[i], 'var(--accent)', q[i].toFixed(3))).join('');
      el.querySelector('[data-sh]').textContent = 'cross-entropy loss = −log p[' + toks[y] + '] = ' + (-Math.log(p[y])).toFixed(4) + '\ngradient w.r.t. each logit = p − onehot:\n' + toks.map((t, i) => '  ' + t.padEnd(4) + ((p[i] - (i === y ? 1 : 0)) >= 0 ? '+' : '') + (p[i] - (i === y ? 1 : 0)).toFixed(3)).join('\n') + '\n(negative = raise this logit, positive = lower it)';
    };
    T.on(el, draw); draw();
  };

  /* ---- byte-pair encoding trainer ---- */
  W.bpe = el => {
    el.innerHTML = '<textarea data-k="txt" rows="3" aria-label="Training text">low low low low low lower lower newest newest newest newest newest newest widest widest widest</textarea>' + T.slider('n', 'number of merges', 0, 30, 8, 1) + '<div data-out></div>';
    const draw = () => {
      const words = el.querySelector('[data-k="txt"]').value.trim().toLowerCase().split(/\s+/).filter(Boolean), freq = {};
      words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
      let seqs = Object.entries(freq).map(([w, c]) => ({ s: [...w, '_'], c })), merges = [];
      const n = T.g(el, 'n');
      for (let m = 0; m < n; m++) {
        const cnt = {};
        seqs.forEach(q => { for (let i = 0; i < q.s.length - 1; i++) { const k = q.s[i] + '\u0001' + q.s[i + 1]; cnt[k] = (cnt[k] || 0) + q.c; } });
        let best = null, bc = 0; for (const k in cnt) if (cnt[k] > bc) { bc = cnt[k]; best = k; }
        if (!best || bc < 2) break;
        const [a, b] = best.split('\u0001'); merges.push([a, b, bc]);
        seqs.forEach(q => { const o = []; for (let i = 0; i < q.s.length; i++) { if (i < q.s.length - 1 && q.s[i] === a && q.s[i + 1] === b) { o.push(a + b); i++; } else o.push(q.s[i]); } q.s = o; });
      }
      const chars = words.reduce((s, w) => s + w.length + 1, 0), toks = seqs.reduce((s, q) => s + q.s.length * q.c, 0);
      el.querySelector('[data-out]').innerHTML = '<div class="kicker">merges learned (most frequent adjacent pair first; _ marks end of word)</div><div class="chips">' + merges.map((m, i) => '<span class="chip">' + (i + 1) + '. ' + m[0] + ' + ' + m[1] + '<small> ×' + m[2] + '</small></span>').join('') + '</div>' +
        '<div class="kicker" style="margin-top:10px">each distinct word as tokens</div>' + seqs.map(q => '<div style="margin:3px 0"><span class="chips" style="display:inline-flex">' + q.s.map(t => '<span class="chip">' + t + '</span>').join('') + '</span> <small class="src">×' + q.c + '</small></div>').join('') +
        '<div class="shape">corpus length ' + chars + ' symbols → ' + toks + ' tokens (' + (chars / toks).toFixed(2) + ' symbols per token)\nvocabulary = base symbols + ' + merges.length + ' merges</div>';
    };
    T.on(el, draw); draw();
  };

  /* ---- attention with every number visible ---- */
  W.attnhand = el => {
    el.innerHTML = '<p class="src">Three tokens, model width 4, head size 2. Edit the token vectors (one row each, four numbers). The projection matrices are fixed.</p><textarea data-k="x" rows="4" aria-label="Token vectors">1, 0, 1, 0\n0, 1, 0, 1\n1, 1, 0, 0</textarea><div data-out></div>';
    const Wq = [[1, 0], [0, 1], [1, 0], [0, 1]], Wk = [[0, 1], [1, 0], [0, 1], [1, 0]], Wv = [[1, 2], [0, 1], [2, 0], [1, 1]];
    const fm = A => A.map(r => r.map(v => v === -Infinity ? '  -inf' : v.toFixed(2).padStart(6)).join(' ')).join('\n');
    const draw = () => {
      const Xm = el.querySelector('[data-k="x"]').value.trim().split(/\n/).slice(0, 6).map(l => l.split(',').map(Number));
      const out = el.querySelector('[data-out]');
      if (!Xm.length || Xm.some(r => r.length !== 4 || r.some(isNaN))) { out.innerHTML = '<p class="src">Enter 1 to 6 rows of exactly four numbers separated by commas.</p>'; return; }
      const Q = T.mm(Xm, Wq), K = T.mm(Xm, Wk), Vv = T.mm(Xm, Wv), S = T.mm(Q, T.tr(K)).map(r => r.map(v => v / Math.SQRT2));
      const Sm = S.map((r, i) => r.map((v, j) => (j > i ? -Infinity : v))), A = Sm.map(T.softmax), O = T.mm(A, Vv);
      const blk = (t, m) => '<div class="kicker" style="margin-top:8px">' + t + '</div><div class="shape">' + fm(m) + '</div>';
      out.innerHTML = blk('Q = X · Wq', Q) + blk('K = X · Wk', K) + blk('V = X · Wv', Vv) + blk('scores = Q Kᵀ / √2', S) + blk('after causal mask', Sm) + blk('weights = softmax of each row', A) + blk('output = weights · V', O);
    };
    T.on(el, draw); draw();
  };

  /* ---- attention pattern heat map with masks ---- */
  W.attnheat = el => {
    el.innerHTML = '<p class="src">Toy scores (not a trained model) so you can see what masks do. Dark = more attention, hatched = not allowed.</p><input type="text" data-k="s" value="The agent read the email then sent the file" style="width:100%" aria-label="Sentence"><div class="row"><label><input type="checkbox" data-k="c" checked> causal mask</label></div>' +
      T.slider('w', 'sliding window (0 = off)', 0, 12, 0, 1) + '<div class="gscroll" data-out></div>';
    const draw = () => {
      const toks = T.s(el, 's').trim().split(/\s+/).slice(0, 12), n = toks.length; if (!n) return;
      const causal = T.chk(el, 'c'), w = T.g(el, 'w');
      let h = '<table class="grid"><tr><th></th>' + toks.map(t => '<th>' + t + '</th>').join('') + '</tr>';
      for (let i = 0; i < n; i++) {
        const raw = [], ok = [];
        for (let j = 0; j < n; j++) { const a = (!causal || j <= i) && (!w || Math.abs(i - j) < w); ok.push(a); raw.push(a ? T.hash(i + 1, j + 7) * 3 - 1.2 - 0.12 * Math.abs(i - j) + (j === 0 ? 1.2 : 0) : -1e9); }
        const p = T.softmax(raw); h += '<tr><th>' + toks[i] + '</th>' + p.map((v, j) => (ok[j] ? '<td><i style="opacity:' + Math.min(1, v * 1.6).toFixed(2) + '"></i></td>' : '<td class="m"></td>')).join('') + '</tr>';
      }
      el.querySelector('[data-out]').innerHTML = h + '</table>';
    };
    T.on(el, draw); draw();
  };

  /* ---- layer normalization vs RMS normalization ---- */
  W.rmsnorm = el => {
    el.innerHTML = '<input type="text" data-k="v" value="3, -1, 0.5, 8, -2, 1" style="width:100%" aria-label="Numbers"><div class="shape" data-out></div>';
    const draw = () => {
      const v = T.s(el, 'v').split(',').map(Number).filter(n => !isNaN(n)), out = el.querySelector('[data-out]');
      if (!v.length) { out.textContent = 'Enter numbers separated by commas.'; return; }
      const n = v.length, mean = v.reduce((a, b) => a + b, 0) / n, rms = Math.sqrt(v.reduce((a, b) => a + b * b, 0) / n + 1e-5), sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / n + 1e-5);
      out.textContent = 'x          ' + v.join('  ') + '\nrms(x)     ' + rms.toFixed(3) + '\nRMSNorm    ' + v.map(x => (x / rms).toFixed(2)).join('  ') + '   (divide by rms)\nmean(x)    ' + mean.toFixed(3) + '\nLayerNorm  ' + v.map(x => ((x - mean) / sd).toFixed(2)).join('  ') + '   (subtract mean, divide by std)';
    };
    T.on(el, draw); draw();
  };

  /* ---- parameter counting for dense transformers ---- */
  const DENSE = {
    l8: { n: 'Llama 3 8B', L: 32, d: 4096, ff: 14336, H: 32, KV: 8, V: 128256, gated: 1, tied: 0, pub: '8B' },
    l70: { n: 'Llama 3 70B', L: 80, d: 8192, ff: 28672, H: 64, KV: 8, V: 128256, gated: 1, tied: 0, pub: '70B' },
    l405: { n: 'Llama 3 405B', L: 126, d: 16384, ff: 53248, H: 128, KV: 8, V: 128256, gated: 1, tied: 0, pub: '405B' },
    g2: { n: 'GPT-2 small-style (classic MLP)', L: 12, d: 768, ff: 3072, H: 12, KV: 12, V: 50257, gated: 0, tied: 1, pub: '≈124M' },
  };
  W.dparams = el => {
    el.innerHTML = T.select('p', 'preset', Object.entries(DENSE).map(([k, v]) => [k, v.n]), 'l8') +
      T.slider('L', 'layers', 1, 140, 32, 1) + T.slider('d', 'model width d', 256, 16384, 4096, 64) + T.slider('ff', 'MLP hidden width', 256, 57344, 14336, 64) +
      T.slider('H', 'query heads', 1, 128, 32, 1) + T.slider('KV', 'key/value heads', 1, 128, 8, 1) + T.slider('V', 'vocabulary (thousands)', 8, 260, 128.256, 0.001) +
      '<div class="row"><label><input type="checkbox" data-k="gated" checked> gated MLP (SwiGLU: 3 matrices)</label><label><input type="checkbox" data-k="tied"> tie input/output embeddings</label></div><div data-out></div>';
    const setp = p => { const c = DENSE[p]; ['L', 'd', 'ff', 'H', 'KV'].forEach(k => { el.querySelector('[data-k="' + k + '"]').value = c[k]; }); el.querySelector('[data-k="V"]').value = c.V / 1000; el.querySelector('[data-k="gated"]').checked = !!c.gated; el.querySelector('[data-k="tied"]').checked = !!c.tied; };
    const draw = () => {
      const L = T.g(el, 'L'), d = T.g(el, 'd'), ff = T.g(el, 'ff'), H = T.g(el, 'H'), KV = Math.min(H, T.g(el, 'KV')), V = Math.round(T.g(el, 'V') * 1000), hd = d / H;
      const attn = d * H * hd + 2 * d * KV * hd + H * hd * d, mlp = (T.chk(el, 'gated') ? 3 : 2) * d * ff, emb = V * d * (T.chk(el, 'tied') ? 1 : 2), tot = L * (attn + mlp) + emb;
      const p = DENSE[T.s(el, 'p')];
      el.querySelector('[data-out]').innerHTML = T.bar('attention', L * attn / tot, 'var(--c1)', T.fmt(L * attn)) + T.bar('MLP', L * mlp / tot, 'var(--c2)', T.fmt(L * mlp)) + T.bar('embeddings', emb / tot, 'var(--muted)', T.fmt(emb)) +
        '<div class="shape">per layer: attention d·H·hd + 2·d·KV·hd + H·hd·d = ' + T.fmt(attn) + '\n           MLP ' + (T.chk(el, 'gated') ? '3' : '2') + '·d·ff = ' + T.fmt(mlp) + '\nhead size hd = d / H = ' + hd + '\nTOTAL ≈ ' + T.fmt(tot) + (el.querySelector('[data-k="L"]').value == p.L && el.querySelector('[data-k="d"]').value == p.d ? '    (published: ' + p.pub + ')' : '') + '\nNorm weights and biases add well under 1%.</div>';
    };
    T.on(el, (e) => { if (e.target.dataset && e.target.dataset.k === 'p') setp(T.s(el, 'p')); draw(); });
    setp('l8'); draw();
  };

  /* ---- rotary embeddings: relative position falls out of rotation ---- */
  W.rope = el => {
    el.innerHTML = T.slider('m', 'query position m', 0, 200, 40, 1) + T.slider('n', 'key position n', 0, 200, 35, 1) + T.slider('s', 'shift both by', 0, 100, 25, 1) + T.slider('b', 'base', 100, 1000000, 10000, 100) + '<div class="shape" data-out></div>';
    const q = [0.9, -0.4, 0.3, 0.8, -0.7, 0.2, 0.5, -0.1], k = [0.2, 0.7, -0.5, 0.4, 0.6, -0.3, -0.8, 0.9];
    const draw = () => {
      const base = T.g(el, 'b'), rot = (v, p) => { const o = []; for (let i = 0; i < 4; i++) { const a = p * Math.pow(base, -2 * i / 8), c = Math.cos(a), s = Math.sin(a); o.push(v[2 * i] * c - v[2 * i + 1] * s, v[2 * i] * s + v[2 * i + 1] * c); } return o; };
      const m = T.g(el, 'm'), n = T.g(el, 'n'), sh = T.g(el, 's'), d1 = T.dot(rot(q, m), rot(k, n)), d2 = T.dot(rot(q, m + sh), rot(k, n + sh));
      let t = ''; for (let i = 0; i < 4; i++) t += 'pair ' + i + ': frequency θ = ' + Math.pow(base, -2 * i / 8).toExponential(2) + '   query angle = ' + (m * Math.pow(base, -2 * i / 8)).toFixed(3) + ' rad\n';
      el.querySelector('[data-out]').textContent = t + '\nq(m) · k(n)          = ' + d1.toFixed(6) + '    offset m − n = ' + (m - n) + '\nq(m+s) · k(n+s)      = ' + d2.toFixed(6) + '    offset m − n = ' + (m - n) + '\nsame? ' + (Math.abs(d1 - d2) < 1e-9 ? 'yes: only the offset matters' : 'no');
    };
    T.on(el, draw); draw();
  };

  /* ---- context extension: position interpolation vs YaRN's per-frequency treatment ---- */
  W.ropeext = el => {
    el.innerHTML = T.slider('s', 'extension factor s = new length / original length', 1, 32, 8, 1) + T.slider('L', 'original context length', 1024, 16384, 4096, 1024) + T.slider('a', 'α (below this many rotations: interpolate)', 0.5, 4, 1, 0.5) + T.slider('bt', 'β (above this many rotations: leave alone)', 8, 64, 32, 1) +
      '<canvas></canvas><div class="shape" data-out></div><p class="src">Head size 64 (32 frequency pairs), base 10000. Multiplier 1 = frequency unchanged; 1/s = fully interpolated. The line labeled YaRN is the "NTK-by-parts" frequency rule from the YaRN paper; YaRN also scales attention logits by (0.1·ln s + 1)².</p>';
    const C = T.cv(el);
    const draw = () => {
      const s = T.g(el, 's'), L = T.g(el, 'L'), al = T.g(el, 'a'), be = T.g(el, 'bt'), D = 64, np = D / 2, { x, w, h } = C; x.clearRect(0, 0, w, h);
      const pts = [], rows = []; let none = 0;
      for (let i = 0; i < np; i++) {
        const th = Math.pow(10000, -2 * i / D), lam = 2 * Math.PI / th, r = L / lam, g = r < al ? 0 : r > be ? 1 : (r - al) / (be - al);
        pts.push((1 - g) / s + g); if (i % 6 === 0 || i === np - 1) rows.push('pair ' + String(i).padStart(2) + '   wavelength ' + lam.toFixed(1).padStart(10) + ' tokens   rotations in original context ' + r.toFixed(3).padStart(8) + '   γ ' + g.toFixed(2) + '   multiplier ' + ((1 - g) / s + g).toFixed(3));
      }
      const X = i => 40 + i / (np - 1) * (w - 60), Y = v => h - 24 - v * (h - 44);
      x.strokeStyle = T.col('--line'); x.beginPath(); x.moveTo(40, Y(0)); x.lineTo(w - 20, Y(0)); x.moveTo(40, Y(1)); x.lineTo(w - 20, Y(1)); x.stroke(); x.fillStyle = T.col('--muted');
      x.fillText('1', 26, Y(1) + 4); x.fillText('0', 26, Y(0) + 4); x.fillText('frequency pair → (fast rotation … slow rotation)', 40, h - 6);
      x.lineWidth = 2; x.strokeStyle = T.col('--muted'); x.beginPath(); x.moveTo(40, Y(1)); x.lineTo(w - 20, Y(1)); x.stroke();
      x.strokeStyle = T.col('--c1'); x.beginPath(); x.moveTo(40, Y(1 / s)); x.lineTo(w - 20, Y(1 / s)); x.stroke();
      x.strokeStyle = T.col('--accent'); x.beginPath(); pts.forEach((v, i) => { i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v)); }); x.stroke();
      x.fillStyle = T.col('--muted'); x.fillText('no change', w - 90, Y(1) - 6); x.fillStyle = T.col('--c1'); x.fillText('position interpolation (1/s)', w - 190, Y(1 / s) - 6); x.fillStyle = T.col('--accent'); x.fillText('YaRN', 60, Y(pts[0]) + 14);
      const f = 0.1 * Math.log(s) + 1; x.lineWidth = 1;
      el.querySelector('[data-out]').textContent = rows.join('\n') + '\n\nattention temperature: q and k each scaled by 0.1·ln(s)+1 = ' + f.toFixed(3) + ', so logits scale by ' + (f * f).toFixed(3);
    };
    T.on(el, draw); draw();
  };
})();
