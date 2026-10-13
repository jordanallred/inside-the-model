/* Interactive widgets, part 1: toolkit, foundations, attention, position. Each widget is W.name = el => { ... }.
   Shared UI pieces (state binding, charts, handles, transport) live in kit.js as window.K. */
(function () {
  const W = (window.W = window.W || {});
  const T = (window.T = {
    col: v => getComputedStyle(document.documentElement).getPropertyValue(v).trim(),
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
  const K = window.K, esc = K.esc, COL = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)'];
  const pick = (el, k) => el.querySelector('[data-x="' + k + '"]');
  const fig = (k, label, cap) => '<figure class="wk-fig"><svg data-x="' + k + '" role="img" aria-label="' + esc(label) + '"></svg>' + (cap ? '<figcaption>' + cap + '</figcaption>' : '') + '</figure>';
  const n3 = v => (isFinite(v) ? v.toFixed(3) : String(v));

  /* ---- gradient descent in one dimension: drag the start, then step or play ---- */
  W.gd = el => {
    const f = x => 0.25 * x ** 4 - x * x + 0.3 * x, df = x => x ** 3 - 2 * x + 0.3;
    const S = { x0: -2.2, lr: 0.2 };
    let path = [S.x0];
    const last = () => path[path.length - 1];
    const dead = v => !isFinite(v) || Math.abs(v) > 1e6;
    const done = () => dead(last()) || Math.abs(df(last())) < 1e-4 || path.length > 200;
    const step = () => { const v = last(); if (!dead(v)) path.push(v - S.lr * df(v)); };
    const P = K.player(() => { step(); render(); return !done(); }, 360, () => render());
    el.innerHTML = '<p class="wk-cap">Drag the ball (or click the curve) to choose a start, set the learning rate, then step.</p>' + fig('c', 'Loss curve with the gradient descent path') +
      K.slider('lr', 'learning rate η', 0.01, 1.3, 0.01) + '<div class="wk-bar" data-x="tr"></div><div data-x="out" aria-live="polite"></div>' + fig('l', 'f(x) after each step', 'f(x) after each step: descent means this line only goes down.');
    const ui = K.bind(el, S, render, {
      players: [P],
      change: k => { if (k === 'x0' || k === 'lr') { path = [S.x0]; P.stop(); } },
      act: a => { if (a === 'step') step(); else if (a === 'run') for (let i = 0; i < 25; i++) step(); else if (a === 'play') { if (done()) path = [S.x0]; P.toggle(); } else if (a === 'reset') { P.stop(); path = [S.x0]; } },
      reset: () => { path = [S.x0]; },
    });
    const svg = pick(el, 'c');
    let X, Y;
    K.drag(svg, {
      bg: () => 'x0',
      move: (n, p) => ui.update('x0', +K.clamp(X.inv(p[0]), -2.6, 2.6).toFixed(2)),
      key: (n, d, big) => ui.update('x0', +K.clamp(S.x0 + d * (big ? 0.5 : 0.1), -2.6, 2.6).toFixed(2)),
    });
    function render() {
      const { w, h } = K.box(svg, w => K.clamp(w * 0.42, 220, 300));
      X = K.lin(-3, 3, 40, w - 12); Y = K.lin(-2, 4, h - 34, 10);
      const v = last(), g = df(v), on = x => [X(x), Y(f(x))];
      let s = '<defs><clipPath id="gdc"><rect x="40" y="0" width="' + (w - 52) + '" height="' + (h - 34) + '"/></clipPath><marker id="gda" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" style="fill:var(--c2)"/></marker></defs>';
      s += K.axes(X, Y, { xl: 'x', fy: v => v, nx: 6 });
      s += '<g clip-path="url(#gdc)"><path class="wk-ln" style="stroke:var(--fg)" d="' + K.path(Array.from({ length: 241 }, (_, i) => on(-3 + i / 40))) + '"/>';
      const vis = path.filter(x => !dead(x));
      for (let i = 1; i < vis.length; i++) { const a = on(vis[i - 1]), b = on(vis[i]), mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - 18 - Math.abs(a[0] - b[0]) * 0.15; s += '<path d="M' + a[0] + ' ' + a[1] + 'Q' + mx + ' ' + my + ' ' + b[0] + ' ' + b[1] + '" class="wk-dash" style="stroke:var(--c2)" marker-end="url(#gda)" opacity="' + (0.35 + 0.65 * i / vis.length).toFixed(2) + '"/>'; }
      vis.slice(0, -1).forEach(x => { const p = on(x); s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" style="fill:var(--c2)"/>'; });
      if (!dead(v) && Math.abs(v) <= 3) { const tx = [v - 0.6, v + 0.6].map(x => [X(x), Y(f(v) + g * (x - v))]); s += '<path class="wk-dash" style="stroke:var(--c4)" d="' + K.path(tx) + '"/>'; }
      s += '</g>';
      if (dead(v) || Math.abs(v) > 3) s += K.text(v > 0 ? w - 16 : 46, 24, (v > 0 ? 'off chart → ' : '← off chart ') + (dead(v) ? '(diverged)' : 'x = ' + v.toFixed(2)), 'wk-lab', v > 0 ? 'end' : 'start');
      else { const p = on(v); s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6" style="fill:var(--c2)"/>'; }
      const p0 = on(S.x0); s += K.handle('x0', p0[0], p0[1], 'Start position x', 'x = ' + S.x0.toFixed(2), 'is-c1') + K.text(p0[0], p0[1] - 14, 'start', 'wk-tick', 'middle');
      svg.innerHTML = s;
      const L = pick(el, 'l'), bw = K.box(L, 110), fx = path.map(x => (dead(x) ? NaN : f(x))), ok = fx.filter(isFinite), lo = Math.min(...ok, -1.2), hi = Math.max(...ok.slice(0, 1), 0.5);
      const LX = K.lin(0, Math.max(10, path.length - 1), 40, bw.w - 10), LY = K.lin(lo, Math.max(hi, lo + 0.5), bw.h - 22, 8);
      L.innerHTML = K.axes(LX, LY, { ny: 2, nx: 5, fy: v => v.toFixed(1) }) + '<path class="wk-ln" style="stroke:var(--c2)" d="' + K.path(fx.map((y, i) => [LX(i), LY(K.clamp(y, lo, hi + 5))])) + '"/>' + fx.map((y, i) => (isFinite(y) ? '<circle r="2.5" cx="' + LX(i).toFixed(1) + '" cy="' + LY(K.clamp(y, lo, hi + 5)).toFixed(1) + '" style="fill:var(--c2)"/>' : '')).join('');
      pick(el, 'tr').innerHTML = K.btn('step', 'Step') + K.playBtn(P) + K.btn('run', '+25 steps') + K.btn('reset', 'Reset') + '<span class="wk-spacer"></span><span class="wk-count">step ' + (path.length - 1) + '</span>';
      const prev = path[path.length - 2];
      let say;
      if (path.length === 1) say = K.say('info', 'At the start the slope is f\'(x) = ' + n3(g) + ', so the first step moves x by −η·f\'(x) = ' + n3(-S.lr * g) + '.');
      else if (dead(v)) say = K.say('warn', '<b>Diverged.</b> Each step overshoots further than the last: the learning rate is too large for this curve.');
      else if (Math.abs(v) > 3) say = K.say('warn', '<b>Jumped off the chart.</b> The step η·f\'(x) was bigger than the valley.');
      else if (f(v) > f(prev) + 1e-12) say = K.say('warn', '<b>Overshoot:</b> this step went <i>uphill</i> (f rose from ' + n3(f(prev)) + ' to ' + n3(f(v)) + '). The gradient pointed the right way, but the step was too long.');
      else if (Math.abs(g) < 1e-3) say = K.say('ok', '<b>Converged</b> at x = ' + v.toFixed(3) + ', where the slope is zero: ' + (v < 0 ? 'the deeper left valley (the global minimum).' : 'the shallower right valley, a local minimum. Gradient descent only sees the local slope.'));
      else say = K.say('info', 'Moving downhill. The slope shrinks near the bottom, so the steps shrink too.');
      pick(el, 'out').innerHTML = K.stats([{ l: 'x', v: n3(v) }, { l: 'f(x)', v: n3(f(v)) }, { l: 'slope f\'(x)', v: n3(g) }, { l: 'learning rate η', v: S.lr.toFixed(2) }]) + say +
        (path.length > 1 && !dead(prev) ? '<div class="wk-eq">last update: x ← x − η·f\'(x) = ' + prev.toFixed(3) + ' − ' + S.lr.toFixed(2) + ' × (' + n3(df(prev)) + ') = <b>' + n3(v) + '</b></div>' : '');
    }
    render();
  };

  /* ---- train a one-hidden-layer network on a curve you can redraw ---- */
  W.mlp = el => {
    const acts = {
      relu: [v => Math.max(0, v), v => (v > 0 ? 1 : 0)],
      tanh: [Math.tanh, v => 1 - Math.tanh(v) ** 2],
      silu: [v => v / (1 + Math.exp(-v)), v => { const s = 1 / (1 + Math.exp(-v)); return s * (1 + v * (1 - s)); }],
    };
    const targets = { sine: v => Math.sin(3 * v), abs: v => 1.5 * Math.abs(v) - 0.5, step: v => (v < 0.1 ? -1 : 1), wiggle: v => 0.6 * Math.sin(6 * v) + 0.8 * v };
    const N = 60, X = Array.from({ length: N }, (_, i) => -1 + 2 * i / (N - 1));
    const S = { H: 6, act: 'relu', tg: 'sine', units: false };
    let P, M, V, t, seed = 1, steps = 0, hist = [], custom = X.map(targets.sine), paintAt = null;
    const tgt = i => (S.tg === 'draw' ? custom[i] : targets[S.tg](X[i]));
    const init = () => {
      const H = S.H, r = T.rng(seed * 7919); P = { w1: [], b1: [], w2: [], b2: 0 };
      for (let j = 0; j < H; j++) { P.w1.push(T.randn(r) * 2); P.b1.push(T.randn(r) * 0.5); P.w2.push(T.randn(r) / Math.sqrt(H)); }
      M = { w1: Array(H).fill(0), b1: Array(H).fill(0), w2: Array(H).fill(0), b2: 0 }; V = JSON.parse(JSON.stringify(M)); t = 0; steps = 0; hist = [[0, mse()]];
    };
    const fwd = v => { const [a] = acts[S.act]; let y = P.b2; P.w1.forEach((w, j) => { y += P.w2[j] * a(w * v + P.b1[j]); }); return y; };
    const mse = () => X.reduce((s, v, i) => s + (fwd(v) - tgt(i)) ** 2, 0) / N;
    const train = n => {
      const [a, da] = acts[S.act], H = P.w1.length;
      for (let s = 0; s < n; s++) {
        const g = { w1: Array(H).fill(0), b1: Array(H).fill(0), w2: Array(H).fill(0), b2: 0 };
        X.forEach((v, i) => {
          let y = P.b2; const z = P.w1.map((w, j) => w * v + P.b1[j]), h = z.map(a); h.forEach((hj, j) => { y += P.w2[j] * hj; });
          const dy = 2 * (y - tgt(i)) / N; g.b2 += dy;
          for (let j = 0; j < H; j++) { g.w2[j] += dy * h[j]; const dz = dy * P.w2[j] * da(z[j]); g.w1[j] += dz * v; g.b1[j] += dz; }
        });
        t++; const lr = 0.02, b1 = 0.9, b2 = 0.999;
        const upd = (p, m, vv, gr) => { m = b1 * m + (1 - b1) * gr; vv = b2 * vv + (1 - b2) * gr * gr; return [p - lr * (m / (1 - b1 ** t)) / (Math.sqrt(vv / (1 - b2 ** t)) + 1e-8), m, vv]; };
        ['w1', 'b1', 'w2'].forEach(k => P[k].forEach((p, j) => { [P[k][j], M[k][j], V[k][j]] = upd(p, M[k][j], V[k][j], g[k][j]); }));
        [P.b2, M.b2, V.b2] = upd(P.b2, M.b2, V.b2, g.b2); steps++;
      }
      hist.push([steps, mse()]); if (hist.length > 400) hist = hist.filter((_, i) => i % 2 === 0 || i === hist.length - 1);
    };
    const PL = K.player(() => { train(12); render(); return steps < 6000 && mse() > 2e-5; }, 40, () => render());
    el.innerHTML = K.seg('act', 'activation', [['relu', 'ReLU'], ['tanh', 'tanh'], ['silu', 'SiLU']]) + K.seg('tg', 'target', [['sine', 'sine'], ['abs', '|x|'], ['step', 'step'], ['wiggle', 'wiggle'], ['draw', 'your drawing']]) +
      K.slider('H', 'hidden units', 1, 24, 1) + '<div class="wk-bar" data-x="tr"></div>' + K.toggle('units', 'show each hidden unit’s contribution') +
      fig('c', 'Target points and the network output', 'Grey dots: target. Orange: the network. Drag across the chart to draw your own target.') + '<div data-x="out" aria-live="polite"></div>' + fig('l', 'Training loss', 'mean squared error during training (log scale)');
    const ui = K.bind(el, S, render, {
      players: [PL],
      change: k => { if (k === 'H' || k === 'act') init(); else if (k === 'tg') hist = [[steps, mse()]]; },
      act: a => { if (a === 'play') PL.toggle(); else if (a === 'train') train(200); else if (a === 'reinit') { PL.stop(); seed++; init(); } },
      reset: () => { seed = 1; custom = X.map(targets.sine); init(); },
    });
    const svg = pick(el, 'c'); let PX, PY;
    K.drag(svg, {
      bg: () => { if (S.tg !== 'draw') { custom = X.map((_, i) => tgt(i)); S.tg = 'draw'; ui.sync(); } return 'paint'; },
      move: (n, p) => {
        const x = K.clamp(PX.inv(p[0]), -1, 1), y = K.clamp(PY.inv(p[1]), -2.2, 2.2), i = Math.round((x + 1) / 2 * (N - 1));
        const from = paintAt || [i, y], a = Math.min(from[0], i), b = Math.max(from[0], i);
        for (let j = a; j <= b; j++) custom[j] = b === a ? y : from[1] + (y - from[1]) * (j - from[0]) / (i - from[0]);
        paintAt = [i, y]; render();
      },
      end: () => { paintAt = null; hist.push([steps, mse()]); render(); },
    });
    function render() {
      const { w, h } = K.box(svg, w => K.clamp(w * 0.45, 220, 300)), [a] = acts[S.act];
      PX = K.lin(-1, 1, 36, w - 10); PY = K.lin(-2.4, 2.4, h - 22, 8);
      let s = K.axes(PX, PY, { ny: 4, nx: 4, fy: v => v.toFixed(0) });
      if (S.units) P.w1.forEach((_, j) => { s += '<path class="wk-ln" style="stroke:' + COL[j % 4] + ';stroke-width:1.5" opacity="0.55" d="' + K.path(Array.from({ length: 121 }, (_, i) => { const v = -1 + i / 60; return [PX(v), PY(K.clamp(P.w2[j] * a(P.w1[j] * v + P.b1[j]), -2.4, 2.4))]; })) + '"/>'; });
      if (S.act === 'relu') P.w1.forEach((w1, j) => { const k = -P.b1[j] / w1; if (k > -1 && k < 1) s += '<path d="M' + PX(k).toFixed(1) + ' ' + (h - 22) + 'l-4 7h8z" style="fill:' + COL[j % 4] + '"><title>unit ' + (j + 1) + ' bends at x = ' + k.toFixed(2) + '</title></path>'; });
      X.forEach((v, i) => { s += '<circle cx="' + PX(v).toFixed(1) + '" cy="' + PY(tgt(i)).toFixed(1) + '" r="2.8" style="fill:var(--muted)"/>'; });
      s += '<path class="wk-ln" style="stroke:var(--c2);stroke-width:3" d="' + K.path(Array.from({ length: 161 }, (_, i) => { const v = -1 + i / 80; return [PX(v), PY(K.clamp(fwd(v), -2.6, 2.6))]; })) + '"/>';
      svg.innerHTML = s;
      const L = pick(el, 'l'), lb = K.box(L, 110), mx = Math.max(10, steps), LX = K.lin(0, mx, 46, lb.w - 10), LY = K.log(1e-4, 10, lb.h - 22, 8);
      L.innerHTML = K.axes(LX, LY, { ny: 3, nx: 4, fy: v => '10' + K.sup(Math.round(Math.log10(v))), fx: v => Math.round(v) }) + '<path class="wk-ln" style="stroke:var(--c2)" d="' + K.path(hist.map(([x, y]) => [LX(x), LY(K.clamp(y, 1e-4, 10))])) + '"/>';
      pick(el, 'tr').innerHTML = K.playBtn(PL, 'play', 'Train') + K.btn('train', '+200 steps') + K.btn('reinit', 'New random weights') + '<span class="wk-spacer"></span><span class="wk-count">step ' + steps + '</span>';
      const e = mse();
      pick(el, 'out').innerHTML = K.stats([{ l: 'training steps', v: steps }, { l: 'mean squared error', v: e.toFixed(4), tone: e < 0.01 ? 'ok' : '' }, { l: 'parameters', v: 3 * S.H + 1, s: S.H + ' units × (w₁, b₁, w₂) + b₂' }]) +
        K.say(e < 0.01 ? 'ok' : S.H <= 2 ? 'warn' : 'info', e < 0.01 ? 'Fitted. The orange curve is ' + S.H + ' scaled ' + (S.act === 'relu' ? 'ramps' : S.act + ' curves') + ' added together.' : S.H <= 2 ? 'With ' + S.H + ' unit' + (S.H > 1 ? 's' : '') + ' the network can make only ' + S.H + ' bend' + (S.H > 1 ? 's' : '') + '. More training cannot add capacity that is not there.' : steps === 0 ? 'Random weights: the ramps point anywhere. Press Train and watch gradient descent bend them into the target.' : 'Still fitting: each step nudges every unit\'s slope, offset and weight to reduce the error.');
    }
    init(); render();
  };

  /* ---- optimizers on an elongated valley: drag the start, scrub or play the race ---- */
  W.opt = el => {
    const f = (a, b) => 0.5 * (a * a + 30 * b * b), gr = (a, b) => [a, 30 * b];
    const S = { lr: 0.03, alr: 0.3, n: 40, sx: -4.5, sy: 1, sgd: true, mom: true, adam: true };
    const NM = [['sgd', 'SGD', 'var(--c1)'], ['mom', 'Momentum', 'var(--c3)'], ['adam', 'Adam', 'var(--c2)']];
    const PL = K.player(() => { S.n = S.n >= 80 ? 0 : S.n + 1; ui.sync(); render(); return S.n < 80; }, 70, () => render());
    el.innerHTML = '<p class="wk-cap">Drag the start point. Scrub the step count or press Play to race the three optimizers down the same valley.</p>' + fig('c', 'Optimizer paths on the loss contours') +
      K.slider('n', 'steps', 0, 80, 1) + '<div class="wk-bar" data-x="tr"></div>' + K.slider('lr', 'SGD / momentum η', 0.005, 0.07, 0.005) + K.slider('alr', 'Adam η', 0.05, 1, 0.05) + '<div data-x="out" aria-live="polite"></div>' +
      K.details('About this valley', '<p class="src">Loss f(x, y) = ½(x² + 30y²): a long narrow valley. Plain gradient descent must keep η below 2/30 so it does not blow up across the valley, so it crawls along it. Momentum accumulates velocity along the valley. Adam rescales each coordinate by its recent gradient size.</p>');
    const run = () => {
      const s = [S.sx, S.sy]; let p1 = s.slice(), p2 = s.slice(), v2 = [0, 0], p3 = s.slice(), m3 = [0, 0], q3 = [0, 0];
      const Pt = [[p1.slice()], [p2.slice()], [p3.slice()]];
      for (let t = 1; t <= S.n; t++) {
        let g = gr(...p1); p1 = [p1[0] - S.lr * g[0], p1[1] - S.lr * g[1]]; Pt[0].push(p1.slice());
        g = gr(...p2); v2 = [0.9 * v2[0] + g[0], 0.9 * v2[1] + g[1]]; p2 = [p2[0] - S.lr * v2[0], p2[1] - S.lr * v2[1]]; Pt[1].push(p2.slice());
        g = gr(...p3); for (let i = 0; i < 2; i++) { m3[i] = 0.9 * m3[i] + 0.1 * g[i]; q3[i] = 0.999 * q3[i] + 0.001 * g[i] * g[i]; p3[i] -= S.alr * (m3[i] / (1 - 0.9 ** t)) / (Math.sqrt(q3[i] / (1 - 0.999 ** t)) + 1e-8); } Pt[2].push(p3.slice());
      }
      return Pt;
    };
    const ui = K.bind(el, S, render, { players: [PL], act: a => { if (a === 'play') { if (S.n >= 80) S.n = 0; PL.toggle(); } else if (NM.some(x => x[0] === a)) S[a] = !S[a]; } });
    const svg = pick(el, 'c'); let X, Y;
    K.drag(svg, {
      bg: () => 'start',
      move: (n, p) => ui.set({ sx: +K.clamp(X.inv(p[0]), -4.9, 4.9).toFixed(2), sy: +K.clamp(Y.inv(p[1]), -1.7, 1.7).toFixed(2) }),
      key: (n, d, big, key) => ui.set(/Left|Right/.test(key) ? { sx: +K.clamp(S.sx + d * (big ? 1 : 0.2), -4.9, 4.9).toFixed(2) } : { sy: +K.clamp(S.sy + d * (big ? 0.5 : 0.1), -1.7, 1.7).toFixed(2) }),
    });
    function render() {
      const { w, h } = K.box(svg, w => K.clamp(w * 0.42, 200, 300));
      X = K.lin(-5, 5, 8, w - 8); Y = K.lin(-1.8, 1.8, h - 8, 8);
      let s = '<defs><clipPath id="optc"><rect x="0" y="0" width="' + w + '" height="' + h + '"/></clipPath></defs><g clip-path="url(#optc)">';
      [40, 16, 8, 4, 2, 0.5].forEach(c => { s += '<ellipse cx="' + X(0) + '" cy="' + Y(0) + '" rx="' + (X(Math.sqrt(2 * c)) - X(0)).toFixed(1) + '" ry="' + (Y(0) - Y(Math.sqrt(2 * c / 30))).toFixed(1) + '" style="fill:var(--c4);fill-opacity:0.07;stroke:var(--line)"/>'; });
      s += '<circle cx="' + X(0) + '" cy="' + Y(0) + '" r="3" style="fill:var(--muted)"/>' + K.text(X(0) + 6, Y(0) - 6, 'minimum', 'wk-tick');
      const Pt = run();
      Pt.forEach((p, i) => {
        if (!S[NM[i][0]]) return; const c = NM[i][2], pts = p.map(q => [X(K.clamp(q[0], -50, 50)), Y(K.clamp(q[1], -50, 50))]);
        s += '<path class="wk-ln" style="stroke:' + c + ';stroke-width:2" d="' + K.path(pts) + '"/>' + pts.slice(1).map(q => '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="2" style="fill:' + c + '"/>').join('');
        const e = pts[pts.length - 1]; s += '<circle cx="' + e[0].toFixed(1) + '" cy="' + e[1].toFixed(1) + '" r="5" style="fill:' + c + '"/>';
      });
      s += '</g>' + K.handle('start', X(S.sx), Y(S.sy), 'Start point', '(' + S.sx + ', ' + S.sy + ')');
      svg.innerHTML = s;
      pick(el, 'tr').innerHTML = K.playBtn(PL, 'play', 'Race') + NM.map(([k, n, c]) => '<button type="button" class="chipbtn" data-a="' + k + '" aria-pressed="' + S[k] + '" style="border-left:5px solid ' + c + '">' + n + '</button>').join('');
      const LX = v => (Math.log10(K.clamp(v, 1e-6, 1e3)) + 6) / 9;
      const rows = Pt.map((p, i) => { const q = p[p.length - 1], l = f(...q); return '<div class="brow"><span>' + NM[i][1] + '</span><div class="bar"><i style="width:' + (isFinite(l) ? LX(l) * 100 : 100).toFixed(1) + '%;background:' + NM[i][2] + '"></i></div><span>' + (isFinite(l) && l < 1e6 ? l.toExponential(1) : 'diverged') + '</span></div>'; }).join('');
      const across = Math.abs(1 - 30 * S.lr);
      pick(el, 'out').innerHTML = '<div class="kicker">loss after ' + S.n + ' steps (log scale; shorter is better)</div>' + rows +
        (S.lr > 2 / 30 ? K.say('warn', 'η = ' + S.lr.toFixed(3) + ' is above 2/30 ≈ 0.067: each SGD step multiplies the across-valley distance by ' + (1 - 30 * S.lr).toFixed(2) + ', so it grows and SGD diverges.') :
          K.say('info', 'Each SGD step shrinks the across-valley distance by ×' + across.toFixed(2) + ' but the along-valley distance only by ×' + (1 - S.lr).toFixed(3) + '. That is the crawl. Momentum and Adam fix it in different ways.'));
    }
    render();
  };

  /* ---- softmax, cross-entropy and temperature: drag the logits ---- */
  W.softmax = el => {
    const toks = ['cat', 'dog', 'car', 'sky', 'the'];
    const S = { z0: 2.0, z1: 1.2, z2: -0.5, z3: 0.2, z4: 0.8, T: 1, y: 'cat' };
    el.innerHTML = '<p class="wk-cap">Drag a logit up or down. Click a word to make it the true next token (teal). Arrows show which way one training step pushes each logit.</p>' +
      '<div class="wk-two">' + fig('a', 'Logits with gradient arrows', 'logits z (drag)') + fig('b', 'Probabilities', 'p = softmax(z); dashed outline = sampling at temperature T') + '</div>' +
      K.slider('T', 'temperature T <small>(sampling only)</small>', 0.2, 3, 0.05) + '<div class="wk-bar">' + K.btn('shift', 'Add +1 to every logit') + K.btn('sharpen', 'Double every logit') + '</div><div data-x="out" aria-live="polite"></div>';
    let note = '';
    const z = () => toks.map((_, i) => S['z' + i]);
    const ui = K.bind(el, S, render, {
      act: a => {
        const before = T.softmax(z());
        if (a === 'shift') toks.forEach((_, i) => { S['z' + i] = Math.min(4, +(S['z' + i] + 1).toFixed(2)); });
        if (a === 'sharpen') toks.forEach((_, i) => { S['z' + i] = K.clamp(+(S['z' + i] * 2).toFixed(2), -4, 4); });
        const after = T.softmax(z()), d = Math.max(...after.map((p, i) => Math.abs(p - before[i])));
        note = a === 'shift' ? (d < 1e-9 ? 'Probabilities unchanged: softmax depends only on the <i>gaps</i> between logits, and adding the same number keeps every gap.' : 'Some logits hit the +4 limit of this figure, so the gaps changed. Lower them and try again.') : 'Doubling every logit doubles every gap, so the distribution sharpens, the same effect as sampling at T = 0.5.';
      },
      change: () => { note = ''; },
      reset: () => { note = ''; },
    });
    const A = pick(el, 'a'), B = pick(el, 'b'); let AX, AY;
    K.drag(A, {
      move: (n, p) => ui.update(n, +K.clamp(AY.inv(p[1]), -4, 4).toFixed(1)),
      key: (n, d, big) => ui.update(n, +K.clamp(S[n] + d * (big ? 1 : 0.1), -4, 4).toFixed(1)),
    });
    [A, B].forEach(svg => svg.addEventListener('click', e => { const t = e.target.closest('[data-tok]'); if (t) ui.update('y', t.dataset.tok); }));
    function render() {
      const zz = z(), y = toks.indexOf(S.y), p = T.softmax(zz), q = T.softmax(zz.map(v => v / S.T)), g = p.map((v, i) => v - (i === y ? 1 : 0));
      let { w, h } = K.box(A, 250), bw = (w - 30) / toks.length;
      AX = i => 30 + bw * (i + 0.5); AY = K.lin(-4, 4, h - 34, 12);
      let s = [-4, -2, 0, 2, 4].map(v => '<line class="' + (v ? 'wk-grid' : 'wk-axis') + '" x1="30" x2="' + w + '" y1="' + AY(v) + '" y2="' + AY(v) + '"/>' + K.text(24, AY(v) + 4, v, 'wk-tick', 'end')).join('');
      toks.forEach((t, i) => {
        const x = AX(i), top = AY(zz[i]), c = i === y ? 'var(--c3)' : 'var(--c1)', bx = bw * 0.32;
        s += '<rect x="' + (x - bx / 2 - 8).toFixed(1) + '" width="' + bx.toFixed(1) + '" y="' + Math.min(top, AY(0)).toFixed(1) + '" height="' + Math.abs(top - AY(0)).toFixed(1) + '" rx="2" style="fill:' + c + '"/>';
        const len = -g[i] * 70, ax = x + bx / 2 + 2, a0 = top;
        if (Math.abs(len) > 2) s += '<path d="M' + ax + ' ' + a0 + 'v' + (-len).toFixed(1) + '" style="stroke:var(--c2);stroke-width:2.5"/><path d="M' + (ax - 5) + ' ' + (a0 - len + (len > 0 ? 6 : -6)).toFixed(1) + 'l5 ' + (len > 0 ? -7 : 7) + 'l5 ' + (len > 0 ? 7 : -7) + 'z" style="fill:var(--c2)"/>';
        s += K.handle('z' + i, x - 8, top, 'logit for ' + t, zz[i].toFixed(1), i === y ? 'is-c3' : 'is-c1');
        s += '<text x="' + x + '" y="' + (h - 16) + '" text-anchor="middle" class="wk-lab wk-click" data-tok="' + t + '">' + t + (i === y ? ' (true)' : '') + '</text>' + K.text(x, h - 3, zz[i].toFixed(1), 'wk-tick', 'middle');
      });
      A.innerHTML = s;
      ({ w, h } = K.box(B, 250)); bw = (w - 10) / toks.length;
      const BY = K.lin(0, 1, h - 34, 12);
      s = '<line class="wk-axis" x1="0" x2="' + w + '" y1="' + BY(0) + '" y2="' + BY(0) + '"/>';
      toks.forEach((t, i) => {
        const x = 5 + bw * (i + 0.5), b = bw * 0.55;
        s += '<rect x="' + (x - b / 2).toFixed(1) + '" width="' + b.toFixed(1) + '" y="' + BY(p[i]).toFixed(1) + '" height="' + (BY(0) - BY(p[i])).toFixed(1) + '" rx="2" style="fill:' + (i === y ? 'var(--c3)' : 'var(--c1)') + '"/>';
        if (Math.abs(S.T - 1) > 0.01) s += '<rect x="' + (x - b / 2 - 3).toFixed(1) + '" width="' + (b + 6).toFixed(1) + '" y="' + BY(q[i]).toFixed(1) + '" height="' + (BY(0) - BY(q[i])).toFixed(1) + '" class="wk-dash" style="stroke:var(--c4)"/>';
        s += K.text(x, BY(Math.max(p[i], Math.abs(S.T - 1) > 0.01 ? q[i] : 0)) - 5, (p[i] * 100).toFixed(0) + '%', 'wk-tick', 'middle') + '<text x="' + x + '" y="' + (h - 16) + '" text-anchor="middle" class="wk-lab wk-click" data-tok="' + t + '">' + t + (i === y ? ' (true)' : '') + '</text>';
      });
      B.innerHTML = s;
      const loss = -Math.log(p[y]), rank = p.filter(v => v > p[y]).length;
      pick(el, 'out').innerHTML = K.stats([{ l: 'p(' + S.y + ')', v: p[y].toFixed(3), tone: 'ok' }, { l: 'loss = −log p(' + S.y + ')', v: loss.toFixed(3), tone: loss > 2 ? 'warn' : '' }, { l: 'push on ' + S.y + '\'s logit', v: '+' + (1 - p[y]).toFixed(3), s: '= 1 − p' }, { l: 'sum of all pushes', v: Math.abs(g.reduce((a, b) => a + b, 0)).toFixed(3), s: 'always 0' }]) +
        (note ? K.say('info', note) : K.say(rank === toks.length - 1 ? 'warn' : 'info', rank === 0 ? 'The true token is already the favorite, yet the loss is not zero until p reaches 1, so the update keeps widening the gap, more and more gently.' : rank === toks.length - 1 ? 'The true token is the least likely, so the loss is large and the upward push on its logit is nearly 1.' : 'Every wrong token is pushed down in proportion to the probability it holds; the true token is pushed up by 1 − p.')) +
        K.details('Show the arithmetic', '<div class="wk-eq">gradient of the loss with respect to each logit = p − onehot(' + S.y + ')\n' + toks.map((t, i) => '  ' + t.padEnd(4) + (g[i] >= 0 ? '+' : '') + g[i].toFixed(3) + (g[i] < 0 ? '   ← negative: training raises this logit' : '')).join('\n') + '</div>');
    }
    render();
  };

  /* ---- byte-pair encoding: step through the merges ---- */
  W.bpe = el => {
    const S = { txt: 'low low low low low lower lower newest newest newest newest newest newest widest widest widest', n: 0, probe: 'lowest' };
    let snaps, merges, base;
    const learn = () => {
      const words = S.txt.trim().toLowerCase().split(/\s+/).filter(Boolean), freq = {};
      words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
      let seqs = Object.entries(freq).map(([w, c]) => ({ s: [...w, '_'], c, born: [...w, '_'].map(() => -1) }));
      base = new Set(seqs.flatMap(q => q.s)).size; merges = []; snaps = [JSON.parse(JSON.stringify(seqs))];
      for (let m = 0; m < 30; m++) {
        const cnt = {};
        seqs.forEach(q => { for (let i = 0; i < q.s.length - 1; i++) { const k = q.s[i] + '\u0001' + q.s[i + 1]; cnt[k] = (cnt[k] || 0) + q.c; } });
        let best = null, bc = 0; for (const k in cnt) if (cnt[k] > bc) { bc = cnt[k]; best = k; }
        if (!best || bc < 2) break;
        const [a, b] = best.split('\u0001'); merges.push([a, b, bc]);
        seqs.forEach(q => { const o = [], ob = []; for (let i = 0; i < q.s.length; i++) { if (i < q.s.length - 1 && q.s[i] === a && q.s[i + 1] === b) { o.push(a + b); ob.push(m); i++; } else { o.push(q.s[i]); ob.push(q.born[i]); } } q.s = o; q.born = ob; });
        snaps.push(JSON.parse(JSON.stringify(seqs)));
      }
      S.n = Math.min(S.n, merges.length);
    };
    const encode = w => { let s = [...w.toLowerCase(), '_']; merges.slice(0, S.n).forEach(([a, b]) => { const o = []; for (let i = 0; i < s.length; i++) { if (i < s.length - 1 && s[i] === a && s[i + 1] === b) { o.push(a + b); i++; } else o.push(s[i]); } s = o; }); return s; };
    const PL = K.player(() => { if (S.n >= merges.length) return false; S.n++; ui.sync(); render(); return S.n < merges.length; }, 700, () => render());
    el.innerHTML = K.details('Edit the training text', '<textarea data-k="txt" rows="3" aria-label="Training text"></textarea>') +
      '<div class="wk-bar" data-x="tr"></div>' + K.slider('n', 'merges learned', 0, 30, 1) + '<div data-x="now" aria-live="polite"></div><div data-x="words"></div><div data-x="out"></div>' +
      '<div class="ctl"><label for="bpe-probe">encode a new word</label><input id="bpe-probe" type="text" data-k="probe" aria-label="Word to encode"><span></span></div><div data-x="probe"></div>';
    const ui = K.bind(el, S, render, {
      players: [PL],
      change: k => { if (k === 'txt') learn(); if (k === 'n') S.n = Math.min(S.n, merges.length); },
      act: a => { if (a === 'next' && S.n < merges.length) S.n++; else if (a === 'prev' && S.n > 0) S.n--; else if (a === 'play') { if (S.n >= merges.length) S.n = 0; PL.toggle(); } else if (a === 'zero') { PL.stop(); S.n = 0; } },
      reset: learn,
    });
    function render() {
      pick(el, 'tr').innerHTML = K.btn('prev', 'Undo') + '<button type="button" class="btn primary" data-a="next"' + (S.n >= merges.length ? ' disabled' : '') + '>Next merge</button>' + K.playBtn(PL, 'play', 'Play all') + K.btn('zero', 'Back to characters') + '<span class="wk-spacer"></span><span class="wk-count">' + S.n + ' of ' + merges.length + ' merges</span>';
      el.querySelector('input[data-k="n"]').max = merges.length;
      const seqs = snaps[S.n], m = merges[S.n - 1];
      pick(el, 'now').innerHTML = S.n === 0 ? K.say('info', 'Every word starts as single characters (<code>_</code> marks the end of a word). Each merge finds the most frequent adjacent pair in the whole corpus and fuses it into one new token.') :
        K.say('ok', '<b>Merge ' + S.n + ':</b> <span class="wk-tok">' + esc(m[0]) + '</span> + <span class="wk-tok">' + esc(m[1]) + '</span> → <span class="wk-tok is-new">' + esc(m[0] + m[1]) + '</span>, the most frequent pair (' + m[2] + ' times).');
      pick(el, 'words').innerHTML = '<div class="kicker">each distinct word, as tokens (×count)</div>' + seqs.map(q => '<div class="wk-toks">' + q.s.map((t, i) => '<span class="wk-tok' + (q.born[i] === S.n - 1 && S.n ? ' is-new' : '') + '">' + esc(t) + '</span>').join('') + '<small class="src">×' + q.c + '</small></div>').join('');
      const chars = seqs.reduce((s, q) => s + q.s.join('').length * q.c, 0), toks = seqs.reduce((s, q) => s + q.s.length * q.c, 0), toks0 = snaps[0].reduce((s, q) => s + q.s.length * q.c, 0);
      pick(el, 'out').innerHTML = K.stats([{ l: 'tokens in corpus', v: toks, s: 'from ' + toks0 + ' characters' }, { l: 'symbols per token', v: (chars / toks).toFixed(2), tone: 'accent' }, { l: 'vocabulary', v: base + S.n, s: base + ' characters + ' + S.n + ' merges' }]) +
        (S.n ? '<div class="kicker">merge rules, in order</div><div class="wk-toks">' + merges.slice(0, S.n).map((x, i) => '<span class="wk-tok' + (i === S.n - 1 ? ' is-new' : '') + '"><small>' + (i + 1) + '.</small> ' + esc(x[0]) + ' + ' + esc(x[1]) + '</span>').join('') + '</div>' : '');
      const pw = (S.probe || '').trim().split(/\s+/)[0] || '', enc = pw ? encode(pw) : [];
      pick(el, 'probe').innerHTML = pw ? '<div class="wk-toks">' + enc.map(t => '<span class="wk-tok">' + esc(t) + '</span>').join('') + '<small class="src">' + enc.length + ' tokens, by applying the ' + S.n + ' merges in order' + (S.txt.toLowerCase().split(/\s+/).includes(pw.toLowerCase()) ? '' : '. This word never appeared in training, but it is built from learned pieces') + '</small></div>' : '';
    }
    learn(); ui.sync(); render();
  };

  /* ---- attention with every number visible: edit the inputs, hover any result to see its arithmetic ---- */
  W.attnhand = el => {
    const Wq = [[1, 0], [0, 1], [1, 0], [0, 1]], Wk = [[0, 1], [1, 0], [0, 1], [1, 0]], Wv = [[1, 2], [0, 1], [2, 0], [1, 1]];
    const S = { X: [[1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]] };
    let hl = { m: 'O', i: 2, j: 0 };
    el.innerHTML = '<p class="wk-cap">Each token is a row of four numbers. Edit them; hover or tap any number below to see exactly how it was computed. Model width 4, head size 2, fixed projections.</p>' +
      '<div class="wk-mats"><div class="wk-mat" data-x="in"></div><div class="wk-bar" style="flex-direction:column;align-items:stretch">' + K.btn('add', '+ token') + K.btn('del', '− token') + '</div></div>' +
      '<div data-x="pipe"></div><div class="wk-eq" data-x="eq" aria-live="polite"></div>' +
      K.details('The fixed projection matrices', '<div class="wk-mats">' + [['Wq', Wq], ['Wk', Wk], ['Wv', Wv]].map(([n, M]) => '<div class="wk-mat"><div>' + n + ' (4×2)</div><table>' + M.map(r => '<tr>' + r.map(v => '<td>' + v + '</td>').join('') + '</tr>').join('') + '</table></div>').join('') + '</div>');
    const buildIn = () => {
      pick(el, 'in').innerHTML = '<div>X: one row per token</div><table>' + S.X.map((r, i) => '<tr><th>t' + (i + 1) + '</th>' + r.map((v, j) => '<td style="padding:0"><input type="number" step="0.5" value="' + v + '" data-cell="' + i + ',' + j + '" aria-label="token ' + (i + 1) + ' feature ' + (j + 1) + '"></td>').join('') + '</tr>').join('') + '</table>';
    };
    const ui = K.bind(el, S, render, {
      act: a => { if (a === 'add' && S.X.length < 5) S.X.push([0.5, 0.5, 0.5, 0.5]); if (a === 'del' && S.X.length > 1) S.X.pop(); hl = { m: 'O', i: S.X.length - 1, j: 0 }; buildIn(); },
      reset: () => { hl = { m: 'O', i: 2, j: 0 }; buildIn(); },
    });
    el.addEventListener('input', e => { const c = e.target.dataset.cell; if (!c) return; const [i, j] = c.split(',').map(Number), v = parseFloat(e.target.value); if (isFinite(v)) { S.X[i][j] = v; render(); } });
    const hover = e => { const c = e.target.closest('td[data-m]'); if (!c) return; const n = { m: c.dataset.m, i: +c.dataset.i, j: +c.dataset.j }; if (n.m !== hl.m || n.i !== hl.i || n.j !== hl.j) { hl = n; render(); } };
    el.addEventListener('mouseover', hover); el.addEventListener('click', hover);
    const f2 = v => (v === -Infinity ? '−∞' : v.toFixed(2));
    function render() {
      const Xm = S.X, n = Xm.length, Q = T.mm(Xm, Wq), Kk = T.mm(Xm, Wk), V = T.mm(Xm, Wv), Sc = T.mm(Q, T.tr(Kk)).map(r => r.map(v => v / Math.SQRT2));
      const Sm = Sc.map((r, i) => r.map((v, j) => (j > i ? -Infinity : v))), A = Sm.map(T.softmax), O = T.mm(A, V);
      const on = new Set(), add = (m, i, j) => on.add(m + i + ',' + j);
      const { m, i, j } = hl;
      if (m === 'O') { for (let k = 0; k <= i; k++) { add('A', i, k); add('V', k, j); } }
      if (m === 'A' || m === 'S' || m === 'M') { [0, 1].forEach(c => { add('Q', i, c); add('K', j, c); }); add('S', i, j); add('M', i, j); add('A', i, j); }
      if (m === 'Q' || m === 'K' || m === 'V') [0, 1, 2, 3].forEach(c => add('X', i, c));
      const mat = (name, cap, M, max, opts) => '<div class="wk-mat"><div>' + cap + '</div><table>' + M.map((r, a) => '<tr><th>t' + (a + 1) + '</th>' + r.map((v, b) => '<td data-m="' + name + '" data-i="' + a + '" data-j="' + b + '" class="' + (v === -Infinity ? 'is-off' : '') + (on.has(name + a + ',' + b) || (name === m && a === i && b === j) ? ' is-hl' : '') + '" style="' + (v === -Infinity ? '' : K.heat(v, max, opts && opts.pos)) + '">' + f2(v) + '</td>').join('') + '</tr>').join('') + '</table></div>';
      const mx = M => Math.max(...M.flat().filter(isFinite).map(Math.abs), 1e-9);
      pick(el, 'pipe').innerHTML = '<div class="kicker">1. project each token into a query, a key and a value</div><div class="wk-mats">' + mat('Q', 'Q = X·Wq', Q, mx(Q)) + mat('K', 'K = X·Wk', Kk, mx(Kk)) + mat('V', 'V = X·Wv', V, mx(V)) + '</div>' +
        '<div class="kicker">2. score every pair, block the future, normalize each row</div><div class="wk-mats">' + mat('S', 'scores Q·Kᵀ / √2', Sc, mx(Sc)) + '<span class="wk-op">→</span>' + mat('M', 'causal mask', Sm, mx(Sc)) + '<span class="wk-op">→</span>' + mat('A', 'weights = softmax(row)', A, 1, { pos: 'var(--c4)' }) + '</div>' +
        '<div class="kicker">3. each output row is a weighted average of value rows</div><div class="wk-mats">' + mat('O', 'output = weights · V', O, mx(O), { pos: 'var(--c3)' }) + '</div>';
      el.querySelectorAll('[data-cell]').forEach(c => { const [a, b] = c.dataset.cell.split(',').map(Number); c.closest('td').className = on.has('X' + a + ',' + b) ? 'is-hl' : ''; });
      let eq = '';
      const t = k => 't' + (k + 1);
      if (m === 'O') eq = 'output[' + t(i) + '][' + j + '] = Σ weight × value = ' + A[i].slice(0, i + 1).map((a, k) => a.toFixed(2) + '×' + V[k][j].toFixed(2)).join(' + ') + ' = <b>' + O[i][j].toFixed(3) + '</b>\n' + t(i) + ' can only read tokens 1…' + (i + 1) + ', so its output is a blend of their values.';
      else if (m === 'A' || m === 'S' || m === 'M') eq = j > i ? 'score[' + t(i) + '][' + t(j) + '] is masked: ' + t(j) + ' comes after ' + t(i) + ', so the score becomes −∞ and its weight exactly 0.' :
        'score = q_' + t(i) + ' · k_' + t(j) + ' / √2 = (' + Q[i].map(v => v.toFixed(2)).join(', ') + ')·(' + Kk[j].map(v => v.toFixed(2)).join(', ') + ') / 1.414 = <b>' + Sc[i][j].toFixed(3) + '</b>\nweight = e^' + Sc[i][j].toFixed(2) + ' / (' + Sm[i].slice(0, i + 1).map(v => 'e^' + v.toFixed(2)).join(' + ') + ') = <b>' + A[i][j].toFixed(3) + '</b>   (row ' + t(i) + ' sums to ' + A[i].reduce((a, b) => a + b, 0).toFixed(3) + ')';
      else if (m === 'Q' || m === 'K' || m === 'V') { const Wm = { Q: Wq, K: Wk, V: Wv }[m], M = { Q, K: Kk, V }[m]; eq = m + '[' + t(i) + '][' + j + '] = x_' + t(i) + ' · column ' + j + ' of W' + m.toLowerCase() + ' = ' + Xm[i].map((x, c) => x + '×' + Wm[c][j]).join(' + ') + ' = <b>' + M[i][j].toFixed(2) + '</b>'; }
      pick(el, 'eq').innerHTML = eq;
    }
    buildIn(); render();
  };

  /* ---- attention pattern with masks: pick a token, see what it can read, and how far information travels ---- */
  W.attnheat = el => {
    const S = { s: 'The agent read the email then sent the file', c: true, w: 0, L: 1, q: 7 };
    el.innerHTML = '<p class="wk-cap">Toy scores (not a trained model) so you can see what masks do. Click a word or a row to choose which token is reading.</p>' +
      '<input type="text" data-k="s" style="width:100%" aria-label="Sentence">' + '<div class="wk-bar">' + K.toggle('c', 'causal mask') + '</div>' +
      K.seg('w', 'sliding window', [['0', 'off'], ['2', '2'], ['3', '3'], ['4', '4'], ['6', '6']]) + K.seg('L', 'layers stacked', [['1', '1'], ['2', '2'], ['3', '3']]) +
      fig('arc', 'What the selected token reads') + '<div class="wk-toks" data-x="row" role="group" aria-label="Choose the reading token"></div><div data-x="out" aria-live="polite"></div><div class="gscroll" data-x="grid"></div>';
    const ui = K.bind(el, S, render);
    el.addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) ui.update('q', +b.dataset.q); });
    function render() {
      const toks = S.s.trim().split(/\s+/).filter(Boolean).slice(0, 12), n = toks.length; if (!n) return;
      const q = Math.min(S.q, n - 1), allow = (i, j) => (!S.c || j <= i) && (!S.w || Math.abs(i - j) < S.w);
      const P = toks.map((_, i) => { const raw = toks.map((_, j) => (allow(i, j) ? T.hash(i + 1, j + 7) * 3 - 1.2 - 0.12 * Math.abs(i - j) + (j === 0 ? 1.2 : 0) : -1e9)); return T.softmax(raw).map((v, j) => (allow(i, j) ? v : 0)); });
      let reach = new Set([q]);
      for (let l = 0; l < S.L; l++) { const nx = new Set(reach); reach.forEach(i => toks.forEach((_, j) => { if (allow(i, j)) nx.add(j); })); reach = nx; }
      const svg = pick(el, 'arc'), { w, h } = K.box(svg, 80), cx = i => (i + 0.5) / n * w;
      let s = '';
      toks.forEach((_, j) => {
        if (!allow(q, j)) return; const a = Math.min(1, P[q][j] * 1.6), sw = (1 + 8 * a).toFixed(1);
        if (j === q) { s += '<circle cx="' + cx(q) + '" cy="' + (h - 12) + '" r="' + (5 + 10 * a).toFixed(1) + '" fill="none" style="stroke:var(--c4)" stroke-width="' + sw + '" opacity="' + (0.3 + 0.7 * a).toFixed(2) + '"/>'; return; }
        const x1 = cx(j), x2 = cx(q), up = 24 + Math.abs(x2 - x1) * 0.2;
        s += '<path d="M' + x1 + ' ' + (h - 2) + 'Q' + ((x1 + x2) / 2) + ' ' + (h - 2 - up * 2) + ' ' + x2 + ' ' + (h - 2) + '" fill="none" style="stroke:var(--c4)" stroke-width="' + sw + '" stroke-linecap="round" opacity="' + (0.2 + 0.8 * a).toFixed(2) + '"/>';
      });
      svg.innerHTML = s;
      pick(el, 'row').style.cssText = 'display:grid;grid-template-columns:repeat(' + n + ',minmax(0,1fr))';
      pick(el, 'row').innerHTML = toks.map((t, j) => '<button type="button" class="wk-tok' + (allow(q, j) || reach.has(j) || j === q ? '' : ' is-far') + '" data-q="' + j + '" aria-pressed="' + (j === q) + '" style="' + (j !== q && reach.has(j) ? 'box-shadow:0 0 0 2px var(--c3);' : '') + 'overflow:hidden;text-overflow:ellipsis">' + esc(t) + '<br><small>' + (allow(q, j) ? (P[q][j] * 100).toFixed(0) + '%' : '–') + '</small></button>').join('');
      let blocked = 0, g = '<table class="grid"><tr><th></th>' + toks.map(t => '<th>' + esc(t) + '</th>').join('') + '</tr>';
      for (let i = 0; i < n; i++) g += '<tr' + (i === q ? ' style="outline:2px solid var(--accent)"' : '') + '><th class="wk-click" data-q="' + i + '">' + esc(toks[i]) + '</th>' + P[i].map((v, j) => { if (!allow(i, j)) { blocked++; return '<td class="m" data-q="' + i + '"></td>'; } return '<td data-q="' + i + '" title="' + esc(toks[i] + ' reads ' + toks[j] + ': ' + v.toFixed(2)) + '"><i style="opacity:' + Math.min(1, v * 1.6).toFixed(2) + '"></i></td>'; }).join('') + '</tr>';
      pick(el, 'grid').innerHTML = g + '</table>';
      const direct = toks.filter((_, j) => allow(q, j)).length;
      pick(el, 'out').innerHTML = K.stats([{ l: '“' + esc(toks[q]) + '” reads directly', v: direct + ' token' + (direct > 1 ? 's' : '') }, { l: 'reachable after ' + S.L + ' layer' + (S.L > 1 ? 's' : ''), v: reach.size + ' token' + (reach.size > 1 ? 's' : ''), tone: 'ok', s: 'teal ring' }, { l: 'blocked cells', v: blocked + ' of ' + n * n }]) +
        K.say('info', S.w && S.c ? 'A window of ' + S.w + ' lets each token read only itself and the ' + (S.w - 1) + ' before it. Stack layers and information hops further: about L·(w − 1) positions back after L layers.' : S.c ? 'The causal mask lets each token read itself and everything before it, never after. Blocked scores become −∞ before softmax, so their weight is exactly 0.' : 'With no mask every token reads every other, including the future: fine for an encoder, but a next-token predictor could simply copy the answer.');
    }
    render();
  };

  /* ---- layer normalization vs RMS normalization: drag the values, then shift or scale them ---- */
  W.rmsnorm = el => {
    const S = { v: [3, -1, 0.5, 8, -2, 1] };
    let note = '';
    const stats = v => { const n = v.length, mean = v.reduce((a, b) => a + b, 0) / n, rms = Math.sqrt(v.reduce((a, b) => a + b * b, 0) / n + 1e-5), sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / n + 1e-5); return { mean, rms, sd, r: v.map(x => x / rms), l: v.map(x => (x - mean) / sd) }; };
    el.innerHTML = '<p class="wk-cap">Drag the six input values. Then shift or scale all of them at once and compare which output changes.</p>' + fig('c', 'Input vector and its two normalizations') +
      '<div class="wk-bar">' + K.btn('shift', 'Add +2 to every value') + K.btn('scale', 'Multiply every value by 3') + K.btn('rand', 'Random values') + '</div><div data-x="out" aria-live="polite"></div>' +
      K.details('Type exact values', '<input type="text" data-x="txt" style="width:100%" aria-label="Values separated by commas">');
    const ui = K.bind(el, S, render, {
      act: a => {
        const b = stats(S.v);
        if (a === 'shift') S.v = S.v.map(x => +(x + 2).toFixed(2)); if (a === 'scale') S.v = S.v.map(x => +(x * 3).toFixed(2));
        if (a === 'rand') { const r = Math.random; S.v = S.v.map(() => +((r() - 0.4) * 10).toFixed(1)); note = ''; return; }
        const n = stats(S.v), dr = Math.max(...n.r.map((x, i) => Math.abs(x - b.r[i]))), dl = Math.max(...n.l.map((x, i) => Math.abs(x - b.l[i])));
        const said = (name, d) => name + ' output ' + (d < 1e-3 ? '<b>unchanged</b>' : '<b>changed</b> (by up to ' + d.toFixed(2) + ')');
        note = said('RMSNorm', dr) + '; ' + said('LayerNorm', dl) + '. ' + (a === 'shift' ? 'LayerNorm subtracts the mean, so a shared shift cancels. RMSNorm does not center, so the shift survives.' : 'Both divide by a quantity that scales with the input, so a shared scale cancels in both.');
      },
      reset: () => { note = ''; },
    });
    const txt = pick(el, 'txt');
    txt.addEventListener('input', () => { const v = txt.value.split(',').map(Number).filter(x => !isNaN(x)).slice(0, 12); if (v.length) { S.v = v; note = ''; render(); } });
    const svg = pick(el, 'c'); let IY, curLim, dragLim = null;
    K.drag(svg, {
      move: (n, p) => { if (dragLim === null) dragLim = curLim; const i = +n.slice(1); S.v[i] = +K.clamp(IY.inv(p[1]), -dragLim, dragLim).toFixed(1); note = ''; render(); },
      key: (n, d, big) => { const i = +n.slice(1); S.v[i] = +(S.v[i] + d * (big ? 1 : 0.1)).toFixed(1); note = ''; render(); },
      end: () => { dragLim = null; render(); },
    });
    function render() {
      const v = S.v, st = stats(v), { w, h } = K.box(svg, w => (w >= 520 ? 210 : 560)), wide = w >= 520, n = v.length;
      const lim = (curLim = dragLim || Math.max(2, Math.max(...v.map(Math.abs)) * 1.25));
      const panels = [['input x', v, lim, 'var(--c1)'], ['RMSNorm: x / rms(x)', st.r, 2.6, 'var(--c3)'], ['LayerNorm: (x − mean) / std', st.l, 2.6, 'var(--c4)']];
      let s = '';
      panels.forEach(([name, vals, L, c], pi) => {
        const x0 = wide ? pi * w / 3 + 8 : 8, x1 = wide ? (pi + 1) * w / 3 - 8 : w - 8, y0 = wide ? 20 : pi * h / 3 + 20, y1 = wide ? h - 6 : (pi + 1) * h / 3 - 10, Y = K.lin(-L, L, y1, y0), bw = (x1 - x0) / n;
        if (pi === 0) IY = Y;
        s += K.text(x0, y0 - 8, name, 'wk-lab') + '<line class="wk-axis" x1="' + x0 + '" x2="' + x1 + '" y1="' + Y(0) + '" y2="' + Y(0) + '"/>';
        if (pi === 0) { s += '<line class="wk-dash" style="stroke:var(--c4)" x1="' + x0 + '" x2="' + x1 + '" y1="' + Y(st.mean) + '" y2="' + Y(st.mean) + '"/>' + K.text(x0, Y(st.mean) - 3, 'mean', 'wk-tick'); s += '<line class="wk-dash" style="stroke:var(--c3)" x1="' + x0 + '" x2="' + x1 + '" y1="' + Y(st.rms) + '" y2="' + Y(st.rms) + '"/>' + K.text(x1, Y(st.rms) - 3, 'rms', 'wk-tick', 'end'); }
        vals.forEach((x, i) => { const cx = x0 + bw * (i + 0.5), top = Y(K.clamp(x, -L, L)); s += '<rect x="' + (cx - bw * 0.3).toFixed(1) + '" width="' + (bw * 0.6).toFixed(1) + '" y="' + Math.min(top, Y(0)).toFixed(1) + '" height="' + Math.abs(top - Y(0)).toFixed(1) + '" rx="2" style="fill:' + c + '"/>'; if (pi > 0) s += K.text(cx, x >= 0 ? top - 4 : top + 12, x.toFixed(2), 'wk-tick', 'middle'); else s += K.handle('v' + i, cx, top, 'input value ' + (i + 1), x.toFixed(1), 'is-c1'); });
      });
      svg.innerHTML = s; if (document.activeElement !== txt) txt.value = v.join(', ');
      const r2 = Math.sqrt(st.r.reduce((a, b) => a + b * b, 0) / n), rm = st.r.reduce((a, b) => a + b, 0) / n, lm = st.l.reduce((a, b) => a + b, 0) / n;
      pick(el, 'out').innerHTML = K.stats([{ l: 'input mean', v: st.mean.toFixed(2) }, { l: 'input rms', v: st.rms.toFixed(2) }, { l: 'RMSNorm output', v: 'rms ' + r2.toFixed(2), s: 'mean ' + rm.toFixed(2) + ' (not centered)', tone: 'ok' }, { l: 'LayerNorm output', v: 'mean ' + Math.abs(lm).toFixed(2), s: 'std 1.00', tone: 'ok' }]) +
        (note ? K.say('info', note) : K.say('info', 'Both bring the vector to a standard size. Only LayerNorm also moves its average to zero. A learned gain g (not shown) then rescales each coordinate.'));
    }
    render();
  };

  /* ---- parameter counting for dense transformers: see where the weights live ---- */
  const DENSE = {
    l8: { n: 'Llama 3 8B', L: 32, d: 4096, ff: 14336, H: 32, KV: 8, V: 128256, gated: 1, tied: 0, pub: '8B' },
    l70: { n: 'Llama 3 70B', L: 80, d: 8192, ff: 28672, H: 64, KV: 8, V: 128256, gated: 1, tied: 0, pub: '70B' },
    l405: { n: 'Llama 3 405B', L: 126, d: 16384, ff: 53248, H: 128, KV: 8, V: 128256, gated: 1, tied: 0, pub: '405B' },
    g2: { n: 'GPT-2 small', L: 12, d: 768, ff: 3072, H: 12, KV: 12, V: 50257, gated: 0, tied: 1, pub: '≈124M' },
  };
  W.dparams = el => {
    const S = { p: 'l8', L: 32, d: 4096, ff: 14336, H: 32, KV: 8, V: 128.256, gated: true, tied: false };
    el.innerHTML = K.seg('p', 'preset', Object.entries(DENSE).map(([k, v]) => [k, v.n])) + fig('m', 'The weight matrices of one layer, drawn to scale') + '<div data-x="tot"></div><div data-x="out" aria-live="polite"></div>' +
      K.details('Change the shape', K.slider('L', 'layers', 1, 140, 1) + K.slider('d', 'model width d', 256, 16384, 64) + K.slider('ff', 'MLP hidden width', 256, 57344, 64) + K.slider('H', 'query heads', 1, 128, 1) + K.slider('KV', 'key/value heads', 1, 128, 1) + K.slider('V', 'vocabulary (thousands)', 8, 260, 0.001) +
        '<div class="wk-bar">' + K.toggle('gated', 'gated MLP (SwiGLU, 3 matrices)') + K.toggle('tied', 'tie input and output embeddings') + '</div>');
    el.querySelector('details').open = true;
    K.bind(el, S, render, { change: k => { if (k === 'p') { const c = DENSE[S.p]; Object.assign(S, { L: c.L, d: c.d, ff: c.ff, H: c.H, KV: c.KV, V: c.V / 1000, gated: !!c.gated, tied: !!c.tied }); } } });
    function render() {
      const L = S.L, d = S.d, ff = S.ff, H = S.H, KV = Math.min(H, S.KV), V = Math.round(S.V * 1000), hd = d / H, g = S.gated;
      const q = d * H * hd, kv = d * KV * hd, o = H * hd * d, mlp1 = d * ff, attn = q + 2 * kv + o, mlp = (g ? 3 : 2) * mlp1, emb = V * d * (S.tied ? 1 : 2), tot = L * (attn + mlp) + emb;
      const mats = [['Wq', H * hd, 'var(--c1)'], ['Wk', KV * hd, 'var(--c1)'], ['Wv', KV * hd, 'var(--c1)'], ['Wo', H * hd, 'var(--c1)']].concat((g ? [['W_gate', ff], ['W_up', ff], ['W_down', ff]] : [['W_up', ff], ['W_down', ff]]).map(m => m.concat('var(--c2)')));
      const svg = pick(el, 'm'), { w } = K.box(svg, 92), gap = 5, sum = mats.reduce((a, m) => a + m[1], 0), sc = (w - gap * (mats.length - 1)) / sum;
      let x = 0, s = '';
      mats.forEach(([n, wd, c], i) => { const ww = Math.max(1.5, wd * sc); s += '<rect x="' + x.toFixed(1) + '" y="16" width="' + ww.toFixed(1) + '" height="46" rx="2" style="fill:' + c + '" opacity="' + K.fit(c, i < 4 ? 0.85 : 0.9).toFixed(2) + '"><title>' + n + ': ' + d + ' × ' + wd + ' = ' + T.fmt(d * wd) + '</title></rect>' + (ww > 38 ? '<text x="' + (x + ww / 2).toFixed(1) + '" y="44" text-anchor="middle" class="wk-lab wk-in" style="fill:' + K.ink(c, K.fit(c, i < 4 ? 0.85 : 0.9)) + '">' + n + '</text>' : ''); x += ww + gap; });
      const aw = (2 * H * hd + 2 * KV * hd) * sc + gap * 3;
      s += K.text(0, 10, 'attention ' + T.fmt(attn), 'wk-tick') + K.text(w, 10, 'MLP ' + T.fmt(mlp), 'wk-tick', 'end') + K.text(0, 80, w > 460 ? 'every matrix is d = ' + d + ' tall; width = its other dimension' : 'all ' + d + ' tall', 'wk-tick');
      svg.innerHTML = s;
      const seg = (n, v, c) => '<i title="' + n + ' ' + T.fmt(v) + '" style="width:' + (v / tot * 100).toFixed(2) + '%;background:' + c + '"></i>';
      pick(el, 'tot').innerHTML = '<div class="kicker">whole model: ' + L + ' layers + embeddings</div><div class="bar" style="display:flex;height:1.4rem">' + seg('attention', L * attn, 'var(--c1)') + seg('MLP', L * mlp, 'var(--c2)') + seg('embeddings', emb, 'var(--muted)') + '</div>' +
        '<div class="wk-cap"><i class="wk-sw" style="background:var(--c1)"></i>attention ' + (L * attn / tot * 100).toFixed(0) + '% · <i class="wk-sw" style="background:var(--c2)"></i>MLP ' + (L * mlp / tot * 100).toFixed(0) + '% · <i class="wk-sw" style="background:var(--muted)"></i>embeddings ' + (emb / tot * 100).toFixed(0) + '%</div>';
      const c = DENSE[S.p], match = ['L', 'd', 'ff', 'H', 'KV'].every(k => S[k] === c[k]) && V === c.V && S.gated === !!c.gated && S.tied === !!c.tied;
      pick(el, 'out').innerHTML = K.stats([{ l: 'total parameters', v: T.fmt(tot), s: match ? 'published: ' + c.pub : 'modified from ' + c.n, tone: match ? 'ok' : 'accent' }, { l: 'per layer', v: T.fmt(attn + mlp), s: 'attention ' + T.fmt(attn) + ' + MLP ' + T.fmt(mlp) }, { l: 'MLP share of a layer', v: (mlp / (attn + mlp) * 100).toFixed(0) + '%' }, { l: 'head size d / H', v: Number.isInteger(hd) ? hd : hd.toFixed(2), tone: Number.isInteger(hd) ? '' : 'warn', s: Number.isInteger(hd) ? '' : 'real models divide evenly' }]) +
        K.details('Show the arithmetic', '<div class="wk-eq">attention per layer = d·H·hd + 2·d·KV·hd + H·hd·d = ' + T.fmt(attn) + '\nMLP per layer = ' + (g ? 3 : 2) + '·d·ff = ' + T.fmt(mlp) + '\nembeddings = V·d' + (S.tied ? '' : ' × 2 (input and output)') + ' = ' + T.fmt(emb) + '\nTOTAL ≈ L·(attention + MLP) + embeddings = ' + T.fmt(tot) + '\nNorm weights and biases add well under 1%.</div>');
    }
    render();
  };

  /* ---- rotary embeddings: four clocks, and a score that ignores where the pair sits ---- */
  W.rope = el => {
    const S = { m: 40, n: 35, s: 25, b: 10000 };
    const q = [0.9, -0.4, 0.3, 0.8, -0.7, 0.2, 0.5, -0.1], k = [0.2, 0.7, -0.5, 0.4, 0.6, -0.3, -0.8, 0.9];
    const th = i => Math.pow(S.b, -2 * i / 8);
    const rot = (v, p) => { const o = []; for (let i = 0; i < 4; i++) { const a = p * th(i), c = Math.cos(a), s = Math.sin(a); o.push(v[2 * i] * c - v[2 * i + 1] * s, v[2 * i] * s + v[2 * i + 1] * c); } return o; };
    const score = (a, b) => T.dot(rot(q, a), rot(k, b));
    const PL = K.player(() => { S.s = S.s >= 100 ? 0 : S.s + 1; ui.sync(); render(); return true; }, 60, () => render());
    el.innerHTML = '<p class="wk-cap">Each dial is one frequency pair. The blue hand is the query, the orange hand the key; the wedge is the angle between them. Drag the two positions, then slide both together.</p>' +
      fig('d', 'Rotation of the query and key in each frequency pair') + fig('t', 'Query and key positions') + K.slider('s', 'shift both by', 0, 100, 1) + '<div class="wk-bar" data-x="tr"></div>' +
      K.seg('b', 'base', [['100', '100'], ['10000', '10,000'], ['500000', '500,000 (Llama 3)']]) + fig('g', 'Score as the pair is shifted', 'score q·k as both move together (solid) and if only the query moved (dashed)') + '<div data-x="out" aria-live="polite"></div>';
    const ui = K.bind(el, S, render, { players: [PL], act: a => { if (a === 'play') PL.toggle(); } });
    const tr = pick(el, 't'); let TX;
    K.drag(tr, {
      bg: p => (Math.abs(p[0] - TX(S.m + S.s)) < Math.abs(p[0] - TX(S.n + S.s)) ? 'm' : 'n'),
      move: (h, p) => ui.update(h, K.clamp(Math.round(TX.inv(p[0])) - S.s, 0, 200)),
      key: (h, d, big) => ui.update(h, K.clamp(S[h] + d * (big ? 10 : 1), 0, 200)),
    });
    function render() {
      const m = S.m + S.s, n = S.n + S.s, svg = pick(el, 'd'), { w } = K.box(svg, w => (w >= 480 ? 150 : 300)), cols = w >= 480 ? 4 : 2, cw = w / cols, R = Math.min(cw / 2 - 12, 52);
      let s = '';
      for (let i = 0; i < 4; i++) {
        const cx = cw * (i % cols) + cw / 2, cy = (i < cols ? 0 : 150) + 62, aq = m * th(i), ak = n * th(i), P = a => [cx + R * Math.cos(-a), cy + R * Math.sin(-a)];
        const d = ((aq - ak) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI, large = Math.abs(d) > Math.PI ? 1 : 0, r2 = R * 0.45, pk = [cx + r2 * Math.cos(-ak), cy + r2 * Math.sin(-ak)], pq = [cx + r2 * Math.cos(-(ak + d)), cy + r2 * Math.sin(-(ak + d))];
        s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" style="fill:var(--bg);stroke:var(--line)"/>' + '<path d="M' + cx + ' ' + cy + 'L' + pk[0].toFixed(1) + ' ' + pk[1].toFixed(1) + 'A' + r2 + ' ' + r2 + ' 0 ' + large + ' ' + (d > 0 ? 0 : 1) + ' ' + pq[0].toFixed(1) + ' ' + pq[1].toFixed(1) + 'z" style="fill:var(--c4);fill-opacity:.35"/>';
        [[ak, 'var(--c2)'], [aq, 'var(--c1)']].forEach(([a, c]) => { const p = P(a); s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" style="stroke:' + c + ';stroke-width:3;stroke-linecap:round"/>'; });
        s += K.text(cx, cy + R + 16, 'pair ' + i + ' · λ ' + K.short(2 * Math.PI / th(i)), 'wk-tick', 'middle');
      }
      svg.innerHTML = s;
      const tb = K.box(tr, 58); TX = K.lin(0, 300, 14, tb.w - 14);
      tr.innerHTML = '<line class="wk-axis" x1="14" x2="' + (tb.w - 14) + '" y1="30" y2="30"/>' + [0, 100, 200, 300].map(v => K.text(TX(v), 52, v, 'wk-tick', 'middle')).join('') +
        '<line x1="' + TX(Math.min(m, n)) + '" x2="' + TX(Math.max(m, n)) + '" y1="30" y2="30" style="stroke:var(--c4);stroke-width:6;stroke-opacity:.5"/>' + K.text((TX(m) + TX(n)) / 2, 18, 'm − n = ' + (S.m - S.n), 'wk-tick', 'middle') +
        K.handle('m', TX(m), 30, 'query position', String(m), 'is-c1') + K.handle('n', TX(n), 30, 'key position', String(n), 'is-c2');
      pick(el, 'tr').innerHTML = K.playBtn(PL, 'play', 'Slide both') + '<span class="wk-count">query at ' + m + ', key at ' + n + '</span>';
      const g = pick(el, 'g'), gb = K.box(g, 130), both = Array.from({ length: 101 }, (_, i) => score(S.m + i, S.n + i)), qo = Array.from({ length: 101 }, (_, i) => score(S.m + i, S.n)), lo = Math.min(...both, ...qo), hi = Math.max(...both, ...qo);
      const GX = K.lin(0, 100, 40, gb.w - 10), GY = K.lin(lo - 0.05, hi + 0.05, gb.h - 22, 8);
      g.innerHTML = K.axes(GX, GY, { ny: 3, nx: 5, fy: v => v.toFixed(1) }) + '<path class="wk-dash" style="stroke:var(--muted)" d="' + K.path(qo.map((v, i) => [GX(i), GY(v)])) + '"/><path class="wk-ln" style="stroke:var(--c4)" d="' + K.path(both.map((v, i) => [GX(i), GY(v)])) + '"/><circle cx="' + GX(S.s) + '" cy="' + GY(both[S.s]) + '" r="5" style="fill:var(--c4)"/>';
      const d1 = score(S.m, S.n), d2 = score(m, n);
      pick(el, 'out').innerHTML = K.stats([{ l: 'score q(m)·k(n) now', v: d2.toFixed(6) }, { l: 'score before shifting', v: d1.toFixed(6) }, { l: 'offset m − n', v: S.m - S.n, tone: 'accent' }]) +
        K.say(Math.abs(d1 - d2) < 1e-9 ? 'ok' : 'warn', Math.abs(d1 - d2) < 1e-9 ? 'Identical: shifting both rotates both hands by the same angle, so the wedge, and the score, depend only on m − n.' : 'Different, which should not happen.');
    }
    render();
  };

  /* ---- context extension: which frequencies get stretched (drag α and β) ---- */
  W.ropeext = el => {
    const S = { s: 8, L: 4096, a: 1, bt: 32 };
    el.innerHTML = '<p class="wk-cap">Each dot is one of 32 frequency pairs (head size 64, base 10,000), placed by how many full turns it makes inside the original context. Drag the α and β lines to move the boundaries of the ramp.</p>' +
      K.slider('s', 'extension factor s', 1, 40, 1, 'new length / original') + K.slider('L', 'original context', 1024, 16384, 1024) + fig('c', 'Frequency multiplier per pair') + '<div data-x="out" aria-live="polite"></div>' +
      K.details('About the YaRN rule', '<p class="src">Multiplier 1 = frequency unchanged; 1/s = fully interpolated. The YaRN line is the "NTK-by-parts" frequency rule from the YaRN paper: pairs that turn fewer than α times in the original context are interpolated, pairs that turn more than β times are left alone, with a linear ramp between. YaRN also scales attention logits by (0.1·ln s + 1)².</p>' + K.slider('a', 'α', 0.5, 4, 0.5) + K.slider('bt', 'β', 8, 64, 1));
    const ui = K.bind(el, S, render, { fmt: { L: v => v.toLocaleString('en-US') } });
    const svg = pick(el, 'c'); let X;
    K.drag(svg, {
      move: (h, p) => { const r = X.inv(p[0]); if (h === 'a') ui.update('a', K.clamp(Math.round(r * 2) / 2, 0.5, Math.min(4, S.bt - 1))); else ui.update('bt', K.clamp(Math.round(r), Math.max(8, S.a + 1), 64)); },
      key: (h, d) => (h === 'a' ? ui.update('a', K.clamp(S.a + d * 0.5, 0.5, 4)) : ui.update('bt', K.clamp(S.bt + d, 8, 64))),
    });
    function render() {
      const { s, L, a: al, bt: be } = S, D = 64, np = D / 2, { w, h } = K.box(svg, w => K.clamp(w * 0.5, 230, 320));
      X = K.log(0.05, 1000, 44, w - 12); const Y = K.lin(0, 1.08, h - 40, 14);
      const mult = r => { const g = r < al ? 0 : r > be ? 1 : (r - al) / (be - al); return (1 - g) / s + g; };
      let sx = '<rect x="' + X(0.05) + '" width="' + (X(al) - X(0.05)) + '" y="14" height="' + (h - 54) + '" style="fill:var(--c1)" class="wk-band"/><rect x="' + X(be) + '" width="' + (X(1000) - X(be)) + '" y="14" height="' + (h - 54) + '" style="fill:var(--c3)" class="wk-band"/>';
      sx += K.axes(X, Y, { ny: 4, nx: 6, fx: v => (v < 1 ? v : K.short(v)), fy: v => v.toFixed(2), yl: 'frequency multiplier', xl: w > 460 ? 'full turns within the original ' + L.toLocaleString('en-US') + '-token context' : 'full turns in the original context' });
      sx += K.text(X(0.05) + 4, 26, 'interpolate', 'wk-lab') + K.text(X(1000) - 4, 26, 'keep', 'wk-lab', 'end');
      sx += '<path class="wk-dash" style="stroke:var(--c1)" d="M' + X(0.05) + ' ' + Y(1 / s) + 'H' + X(1000) + '"/>' + K.text(w - 14, Y(1 / s) - 5, 'position interpolation: 1/s', 'wk-tick', 'end');
      sx += '<path class="wk-ln" style="stroke:var(--c2)" d="' + K.path(Array.from({ length: 200 }, (_, i) => { const r = Math.pow(10, -1.3 + 4.3 * i / 199); return [X(r), Y(mult(r))]; })) + '"/>';
      let cnt = [0, 0, 0];
      for (let i = 0; i < np; i++) { const th = Math.pow(10000, -2 * i / D), lam = 2 * Math.PI / th, r = L / lam; cnt[r < al ? 0 : r > be ? 2 : 1]++; sx += '<circle cx="' + X(K.clamp(r, 0.05, 1000)).toFixed(1) + '" cy="' + Y(mult(r)).toFixed(1) + '" r="4" style="fill:var(--c2);stroke:var(--bg)"><title>pair ' + i + ': wavelength ' + lam.toFixed(0) + ' tokens, ' + r.toFixed(2) + ' turns, multiplier ' + mult(r).toFixed(3) + '</title></circle>'; }
      [['a', al, 'α'], ['bt', be, 'β']].forEach(([k, v, n]) => { sx += '<line x1="' + X(v) + '" x2="' + X(v) + '" y1="14" y2="' + (h - 40) + '" style="stroke:var(--fg);stroke-dasharray:3 3"/>' + K.text(X(v), 40, n + ' = ' + v, 'wk-lab', 'middle') + K.handle(k, X(v), 14, n + ' boundary', String(v)); });
      svg.innerHTML = sx;
      const f = 0.1 * Math.log(s) + 1;
      pick(el, 'out').innerHTML = K.stats([{ l: 'new context', v: (s * L).toLocaleString('en-US') + ' tokens' }, { l: 'pairs interpolated', v: cnt[0], s: 'slow clocks, stretched by 1/s', tone: 'accent' }, { l: 'pairs on the ramp', v: cnt[1] }, { l: 'pairs untouched', v: cnt[2], s: 'fast clocks keep local detail', tone: 'ok' }, { l: 'attention logit scale', v: '×' + (f * f).toFixed(3), s: '(0.1·ln s + 1)²' }]);
    }
    render();
  };
})();
