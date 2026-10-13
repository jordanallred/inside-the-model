/* Model Explorer: steps through the full forward pass of the itm-toy model (see itm-model.js).
   Every number shown comes from ITM.forward(); nothing here invents values. Views: Picture, Numbers, Code.
   State (prompt, step, token, head, view, weights) lives in the URL hash so an example can be shared.
   Step indices are part of that URL contract: chapters link to e.g. #step=7, so STEPS must keep its order. */
(function () {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MINUS = '−';

  /* ---- the sequence of operations, in the order the reference model executes them ---- */
  const STEPS = [{ k: 'tokens' }, { k: 'embed' }, { k: 'pos' }];
  for (let l = 0; l < 2; l++) ['ln1', 'qkv', 'scores', 'mask', 'softmax', 'headout', 'oproj', 'ln2', 'mlp', 'resid2'].forEach(k => STEPS.push({ k, l }));
  STEPS.push({ k: 'lnf' }, { k: 'logits' }, { k: 'probs' });
  const HEADD = { qkv: 1, scores: 1, mask: 1, softmax: 1, headout: 1 };
  const ATTN = ['ln1', 'qkv', 'scores', 'mask', 'softmax', 'headout', 'oproj'];

  /* m: label in the step map; t: stage title; tech: the standard name; why: what the operation is for */
  const INFO = {
    tokens: { m: 'Words to IDs', t: 'Words become numbers', tech: 'tokenization', why: 'The model cannot read letters. Each word is replaced by its fixed position in a 25-entry vocabulary, and a start marker &lt;bos&gt; goes in front. Real models split text into subword pieces from vocabularies of 30k to 200k entries.' },
    embed: { m: 'Look up vectors', t: 'Each ID picks a vector', tech: 'embedding lookup', why: 'Each ID selects one row of the embedding matrix E: 16 learned numbers that stand for that word. This is a table lookup, not a calculation.' },
    pos: { m: 'Add positions', t: 'Add word order', tech: 'sinusoidal positions', why: 'Attention has no built-in sense of order, so a fixed wave pattern that depends on the position is added to each vector. The result is the <b>residual stream</b>: the running vector each token carries through the whole model.' },
    ln1: { m: 'Normalize', t: 'Normalize before attention', tech: 'RMSNorm', why: 'Each token’s vector is rescaled so its typical size (root mean square) is 1. Its direction is kept; only its length changes. Attention reads this normalized copy, and the stream itself is left untouched.' },
    qkv: { m: 'Queries, keys, values', t: 'Make queries, keys and values', tech: 'Q, K, V projections', why: 'Three learned matrices turn each token’s vector into a <b>query</b> (what it is looking for), a <b>key</b> (what it offers) and a <b>value</b> (what it passes on if chosen). Each of the 2 heads gets its own 8 numbers of each.' },
    scores: { m: 'Score every pair', t: 'Score every pair of tokens', tech: 'scaled dot product', why: 'The query is compared with every key by a dot product, then divided by √8 so scores do not grow with head size. A high score means “this key matches what I am looking for”.' },
    mask: { m: 'Hide the future', t: 'Hide the future', tech: 'causal mask', why: 'A token may only read itself and the tokens before it. Scores for later tokens become −∞, so they will get exactly zero weight. This is what makes the model predict the next word instead of copying it.' },
    softmax: { m: 'Attention weights', t: 'Turn scores into attention', tech: 'softmax', why: 'The row of scores becomes weights that are positive and add up to 1: how much this token draws from each token it can see.' },
    headout: { m: 'Blend the values', t: 'Blend the values', tech: 'weighted sum of values', why: 'The head’s output is the average of the value vectors, weighted by attention. This is the moment information actually moves from other tokens into this one.' },
    oproj: { m: 'Add to the stream', t: 'Add attention to the stream', tech: 'output projection + residual', why: 'Both heads’ outputs are joined and mixed by the matrix W<sub>o</sub>, then <i>added</i> to the residual stream. Adding instead of replacing lets every layer make a small edit.' },
    ln2: { m: 'Normalize', t: 'Normalize before the MLP', tech: 'RMSNorm', why: 'The same rescaling again, this time for the feed-forward network to read.' },
    mlp: { m: 'Feed-forward network', t: 'Process each token on its own', tech: 'MLP with GELU', why: 'A small two-layer network runs on each token separately: widen 16 numbers to 32, bend them with GELU, project back to 16. Nothing moves between tokens here; that was attention’s job.' },
    resid2: { m: 'Add to the stream', t: 'Add the MLP to the stream', tech: 'residual add', why: 'The MLP’s output is added to the stream. The sum is this layer’s output.' },
    lnf: { m: 'Normalize', t: 'Final normalize', tech: 'final RMSNorm', why: 'One last rescaling before the model reads out its prediction.' },
    logits: { m: 'Score every word', t: 'Score every word in the vocabulary', tech: 'tied unembedding', why: 'The final vector is compared, by dot product, with every word’s embedding row (the same matrix E as step 2). Words whose embedding points the same way get a high score, called a <b>logit</b>.' },
    probs: { m: 'Probabilities', t: 'Choose the next word', tech: 'softmax over the vocabulary', why: 'Softmax turns the 25 logits into probabilities that add up to 1. This distribution is the model’s answer.' },
  };

  /* ---- step map groups; colors match the rest of the guide (input sky, attention violet, MLP teal, output peach) ---- */
  const GROUPS = [{ n: 'Input', c: 'var(--c1)', s: [0, 1, 2] }];
  for (let l = 0; l < 2; l++) GROUPS.push({ n: 'Layer ' + l, l, subs: [{ n: 'Attention', c: 'var(--c4)', s: [3, 4, 5, 6, 7, 8, 9].map(i => i + l * 10) }, { n: 'MLP', c: 'var(--c3)', s: [10, 11, 12].map(i => i + l * 10) }] });
  GROUPS.push({ n: 'Output', c: 'var(--c2)', s: [23, 24, 25] });
  const colorOf = s => { const S = STEPS[s]; return S.l === undefined ? (s < 3 ? 'var(--c1)' : 'var(--c2)') : ATTN.includes(S.k) ? 'var(--c4)' : 'var(--c3)'; };

  /* ---- reference source shown in the Code view; the active operation is highlighted ---- */
  const CODE = {
    tokens: 'const ids = [0, ...words.map(w => vocab.indexOf(w))];            // 0 = <bos>',
    embed: 'const tokEmb = ids.map(i => E[i]);                               // [T, 16]',
    pos: 'x = tokEmb[t][j] + 0.5 * posEnc(t, j);                             // sin for even j, cos for odd j',
    ln1: 'ln1 = rmsnorm(x);   // x / sqrt(mean(x*x) + 1e-5), per token',
    qkv: 'q = ln1 @ Wq;  k = ln1 @ Wk;  v = ln1 @ Wv;                         // head h uses columns [8h, 8h+8)',
    scores: 'scaled[i][j] = dot(q[i], k[j]) / Math.sqrt(8);',
    mask: 'masked[i][j] = j > i ? -Infinity : scaled[i][j];',
    softmax: 'weights[i] = softmax(masked[i]);                                 // exp(s - max) / sum',
    headout: 'out[i][n] = sum_j weights[i][j] * v[j][n];',
    oproj: 'attnOut = concat(head0.out, head1.out) @ Wo;  resid1 = x + attnOut;',
    ln2: 'ln2 = rmsnorm(resid1);',
    mlp: 'hidden = ln2 @ W1;  act = gelu(hidden);  mlpOut = act @ W2;',
    resid2: 'resid2 = resid1 + mlpOut;                                        // input to the next layer',
    lnf: 'lnf = rmsnorm(resid2_of_last_layer);',
    logits: 'logits = lnf @ transpose(E);                                     // [T, 25]',
    probs: 'probs = logits.map(softmax);',
  };

  /* ---- small helpers ---- */
  const fmt = (x, p) => (x === -Infinity ? MINUS + '∞' : (x < 0 ? MINUS : '') + Math.abs(x).toFixed(p));
  const pct = x => (x >= 0.995 ? (x * 100).toFixed(0) : x >= 0.1 ? (x * 100).toFixed(0) : (x * 100).toFixed(1)) + '%';
  const norm = v => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  const argmax = a => a.reduce((b, x, i) => (x > a[b] ? i : b), 0);
  const absMax = arrs => { let m = 0; arrs.forEach(a => a.forEach(v => { if (isFinite(v)) m = Math.max(m, Math.abs(v)); })); return m || 1; };
  const tint = (x, mx) => '--a:' + Math.min(1, Math.abs(x) / mx).toFixed(3) + ';--s:' + (x < 0 ? 'var(--c2)' : 'var(--c1)');

  /* One vector as a row of colored cells: blue positive, orange negative, stronger = larger. Hover gives the value. */
  function strip(v, mx, name) {
    return '<div class="mx-vec" style="--n:' + v.length + '" role="img" aria-label="' + esc(name + ', ' + v.length + ' numbers') + '">' +
      v.map((x, i) => '<span title="' + esc(name) + ' [' + i + '] = ' + fmt(x, 3) + '" style="' + tint(x, mx) + '"></span>').join('') + '</div>';
  }
  /* A vertical sum or transform: rows of { op, l (label HTML), sub, v } drawn on one shared color scale. */
  function eqn(rows, mx) {
    mx = mx || absMax(rows.filter(r => r.v).map(r => r.v));
    return '<div class="mx-eqn">' + rows.map(r => '<div class="mx-op" aria-hidden="true">' + (r.op || '') + '</div><div class="mx-lbl">' + r.l + (r.sub ? '<small>' + r.sub + '</small>' : '') + '</div><div class="mx-cell">' + (r.html || strip(r.v, mx, r.name || r.l.replace(/<[^>]+>/g, ''))) + '</div>').join('') + '</div>';
  }
  /* A whole matrix as small colored cells, one row per token. */
  function mini(rows, o) {
    o = o || {}; const mx = o.mx || absMax(rows);
    return '<div class="mx-scroll"><table class="mx-mini' + (o.wide ? ' wide' : '') + '"><caption class="sr-only">' + esc(o.name || '') + '</caption>' +
      (o.cl ? '<thead><tr><th></th>' + o.cl.map((c, j) => '<th scope="col"' + (j === o.selCol ? ' class="on"' : '') + '><span>' + esc(c) + '</span></th>').join('') + '</tr></thead>' : '') + '<tbody>' +
      rows.map((r, i) => '<tr class="' + (i === o.sel ? 'sel' : o.hl && o.hl.includes(i) ? 'hl' : '') + '"><th scope="row">' + esc(o.rl ? o.rl[i] : i) + '</th>' +
        r.map((v, j) => (o.causal && j > i ? '<td class="m" title="blocked"></td>' : '<td title="' + esc((o.rl ? o.rl[i] : i) + (o.cl ? ' / ' + o.cl[j] : ' [' + j + ']') + ' = ' + fmt(v, 3)) + '"><i style="' + (o.pos ? '--a:' + Math.min(1, v).toFixed(3) + ';--s:var(--c4)' : tint(v, mx)) + '"></i></td>')).join('') + '</tr>').join('') +
      '</tbody></table></div>';
  }
  /* Horizontal bars, one per item: { l, v, on }. */
  function hbars(items, o) {
    const mx = o.signed ? absMax([items.map(x => x.v)]) : Math.max(...items.map(x => x.v), 1e-9);
    return '<div class="mx-hb' + (o.signed ? ' signed' : '') + '">' + items.map(x => {
      const w = Math.abs(x.v) / mx * (o.signed ? 50 : 100);
      return '<div class="mx-hbr' + (x.on ? ' on' : '') + '"><span class="mx-hbl">' + esc(x.l) + '</span><span class="mx-hbt"><i style="width:' + w.toFixed(2) + '%;' + (o.signed ? (x.v < 0 ? 'right:50%;' : 'left:50%;') : 'left:0;') + 'background:' + (o.signed && x.v < 0 ? 'var(--c2)' : o.c) + '"></i></span><span class="mx-hbv">' + (o.pct ? pct(x.v) : fmt(x.v, 2)) + '</span></div>';
    }).join('') + '</div>';
  }
  const LEGEND = '<p class="mx-legend"><span class="sw pos"></span>positive <span class="sw neg"></span>negative. Stronger color means a larger number; hover or tap a cell for its value.</p>';

  window.W = window.W || {};
  window.W.explorer = el => {
    const { ITM } = window; if (!ITM) { el.insertAdjacentHTML('beforeend', '<p class="src">The model engine failed to load.</p>'); return; }
    const { CFG } = ITM, V = CFG.vocab;
    const st = { prompt: CFG.prompts[0], step: 0, t: 99, h: 0, view: 'visual', p: 3, w: 'trained', more: false, map: false };
    function readHash() {
      try {
        const q = new URLSearchParams(location.hash.slice(1));
        if (q.get('p')) st.prompt = q.get('p');
        ['step', 't', 'h'].forEach(k => { if (q.get(k) !== null && !isNaN(+q.get(k))) st[k] = +q.get(k); });
        if (['visual', 'math', 'code'].includes(q.get('v'))) st.view = q.get('v');
        st.w = q.get('w') === 'random' ? 'random' : 'trained';
      } catch (e) {}
    }
    readHash();
    let tk, tr, wd;
    const ws = w => ((w || st.w) === 'random' ? ITM.seeded() : ITM.weights());
    const compute = () => {
      tk = ITM.tokenize(st.prompt); tr = ITM.forward(ws().W, tk.ids); wd = tk.ids.map(i => V[i]);
      st.t = Math.max(0, Math.min(tr.T - 1, Math.round(st.t))); st.step = Math.max(0, Math.min(STEPS.length - 1, Math.round(st.step))); st.h = st.h === 1 ? 1 : 0;
    };
    const q = w => '“' + esc(w) + '”';
    /* the last few words up to position end, starting after the most recent period: “…the dog” */
    const phrase = end => { const w = wd.slice(1, end + 1); let c = w.slice(-4); const d = c.lastIndexOf('.'); if (d >= 0 && d < c.length - 1) c = c.slice(d + 1); return w.length ? q((c.length < w.length ? '…' : '') + c.join(' ')) : 'the start token'; };

    el.innerHTML = '<div class="mx" tabindex="-1">' +
      '<div class="mx-bar">' +
        '<div class="mx-row"><label class="mx-k" for="mx-in">Prompt</label><input id="mx-in" class="mx-in" type="text" data-x="text" spellcheck="false" autocomplete="off" maxlength="120"></div>' +
        '<div class="mx-row mx-ex"><span class="mx-k">Examples</span>' + CFG.prompts.map((p, i) => '<button type="button" class="mx-chip" data-ex="' + i + '">' + esc(p) + '</button>').join('') +
          '<details class="mx-vocab"><summary>Words it knows</summary><div class="mx-vocabw">' + V.slice(1).map(w => '<button type="button" class="mx-chip" data-add="' + esc(w) + '">' + esc(w) + '</button>').join('') + '<p class="src">Click a word to add it to the prompt. Anything else is skipped: this model only knows these ' + (V.length - 1) + '.</p></div></details></div>' +
        '<p class="mx-warn" data-x="warn" role="status"></p>' +
        '<div class="mx-row mx-tokrow"><span class="mx-k" id="mx-follow">Follow</span><div class="mx-toks" data-x="toks" role="group" aria-labelledby="mx-follow"></div></div>' +
        '<div class="mx-pred" data-x="pred"></div>' +
      '</div>' +
      '<div class="mx-body"><nav class="mx-map" data-x="map" aria-label="Steps of the forward pass"></nav><section class="mx-stage" data-x="stage" aria-label="Current step"></section></div>' +
      '<div class="sr-only" role="status" data-x="announce"></div></div>';
    const root = el.querySelector('.mx'), $ = k => el.querySelector('[data-x="' + k + '"]');

    /* ---- per-step facts for the details panel and the Numbers view ---- */
    function describe(s) {
      const S = STEPS[s], k = S.k, L = tr.layers[S.l === undefined ? 0 : S.l], H = L.heads[st.h], T = tr.T, rl = wd.map((w, i) => i + ' ' + w);
      const lay = () => (S.l === 0 ? 'x⁰' : 'resid2 of layer 0');
      switch (k) {
        case 'tokens': return { shape: '[' + T + ']', inputs: 'prompt text', eq: 'ids_t = vocab.indexOf(word_t)' };
        case 'embed': return { shape: '[' + T + ', 16]', inputs: 'ids, E [25, 16]', eq: 'e_t = E[ids_t]', vec: [{ l: 'e_t = E[' + tk.ids[st.t] + ']', v: tr.tokEmb[st.t] }] };
        case 'pos': return { shape: '[' + T + ', 16]', inputs: 'e, PE', eq: 'x⁰_t = e_t + 0.5 · PE(t)', vec: [{ l: 'e_t', v: tr.tokEmb[st.t] }, { l: '0.5·PE(' + st.t + ')', v: tr.pe[st.t].map(x => 0.5 * x) }, { l: 'x⁰_t', v: tr.x0[st.t] }] };
        case 'ln1': case 'ln2': case 'lnf': {
          const src = k === 'ln1' ? L.xIn : k === 'ln2' ? L.resid1 : tr.layers[1].resid2, out = k === 'ln1' ? L.ln1 : k === 'ln2' ? L.ln2 : tr.lnf, rms = ITM.math.rmsOf(src[st.t]);
          return { shape: '[' + T + ', 16]', inputs: (k === 'ln1' ? lay() : k === 'ln2' ? 'resid1' : 'resid2 of layer 1') + ', no learned scale', eq: 'y = x / √(mean(x²) + 10⁻⁵)', src, out, rms,
            vec: [{ l: 'x_t', v: src[st.t] }, { l: 'y_t', v: out[st.t] }], extra: 'RMS term for token ' + st.t + ': √(mean(x²) + 10⁻⁵) = ' + fmt(rms, st.p) };
        }
        case 'qkv': return { shape: '3 × [' + T + ', 8] per head', inputs: 'ln1, W_q, W_k, W_v columns ' + st.h * 8 + '–' + (st.h * 8 + 7), eq: 'q = y·W_q,  k = y·W_k,  v = y·W_v', vec: [{ l: 'q_' + st.t, v: H.q[st.t] }, { l: 'k_' + st.t, v: H.k[st.t] }, { l: 'v_' + st.t, v: H.v[st.t] }] };
        case 'scores': return { shape: '[' + T + ', ' + T + ']', inputs: 'q, k', eq: 's_ij = q_i · k_j / √8' };
        case 'mask': return { shape: '[' + T + ', ' + T + ']', inputs: 'scaled scores', eq: 's_ij = ' + MINUS + '∞  when j > i' };
        case 'softmax': return { shape: '[' + T + ', ' + T + ']', inputs: 'masked scores', eq: 'w_ij = exp(s_ij − max_j s_ij) / Σ_j exp(s_ij − max_j s_ij)' };
        case 'headout': return { shape: '[' + T + ', 8]', inputs: 'weights, v', eq: 'o_i = Σ_j w_ij · v_j' };
        case 'oproj': return { shape: '[' + T + ', 16]', inputs: 'concat(heads), W_o, ' + lay(), eq: 'resid1 = x + concat(o⁰, o¹)·W_o', vec: [{ l: 'concat_t', v: L.concat[st.t] }, { l: 'attnOut_t', v: L.attnOut[st.t] }, { l: 'x_t', v: L.xIn[st.t] }, { l: 'resid1_t', v: L.resid1[st.t] }] };
        case 'mlp': return { shape: '[' + T + ', 32] → [' + T + ', 16]', inputs: 'ln2, W_1 [16, 32], W_2 [32, 16]', eq: 'm = GELU(y·W_1)·W_2', vec: [{ l: 'hidden_t', v: L.hidden[st.t] }, { l: 'GELU(hidden_t)', v: L.act[st.t] }], vec2: [{ l: 'mlpOut_t', v: L.mlpOut[st.t] }] };
        case 'resid2': return { shape: '[' + T + ', 16]', inputs: 'resid1, MLP output', eq: 'resid2 = resid1 + m', vec: [{ l: 'resid1_t', v: L.resid1[st.t] }, { l: 'm_t', v: L.mlpOut[st.t] }, { l: 'resid2_t', v: L.resid2[st.t] }] };
        case 'logits': return { shape: '[' + T + ', 25]', inputs: 'final norm, E', eq: 'logits_t = y_t · Eᵀ' };
        case 'probs': return { shape: '[' + T + ', 25]', inputs: 'logits', eq: 'p_t = softmax(logits_t)' };
      }
    }

    /* ---- Picture view: one drawing per operation, centered on the followed token ---- */
    function cols(vals, o) {
      const t = st.t, mx = o.signed ? absMax([vals.filter((v, j) => isFinite(v) && (o.all || j <= t))]) : 1;
      return '<div class="mx-scroll"><div class="mx-cols' + (o.signed ? ' signed' : '') + '" role="img" aria-label="' + esc(o.name) + '">' + vals.map((v, j) => {
        const fut = j > t, blocked = fut && o.block;
        let bar = '';
        if (blocked) bar = '<b class="blk"></b>';
        else if (o.signed) bar = '<b style="height:' + (Math.abs(v) / mx * 50).toFixed(2) + '%;' + (v >= 0 ? 'bottom:50%' : 'top:50%') + ';background:' + (v >= 0 ? 'var(--c1)' : 'var(--c2)') + '"></b>';
        else bar = '<b style="height:' + (v * 100).toFixed(2) + '%;bottom:0;background:var(--c4)"></b>';
        const vt = blocked ? (o.signed ? MINUS + '∞' : '0%') : o.signed ? fmt(v, 2) : pct(v);
        return '<div class="mx-col' + (j === t ? ' me' : '') + (fut ? ' fut' : '') + '"><div class="mx-plot">' + bar + '</div><div class="mx-cv">' + vt + '</div><div class="mx-cw">' + esc(wd[j]) + '</div></div>';
      }).join('') + '</div></div>';
    }
    function arcs(w) {
      const t = st.t, T = w.length, dx = 68, base = 108, W = T * dx;
      let s = '';
      w.forEach((x, j) => {
        if (j > t || x < 0.004) return;
        const x1 = t * dx + dx / 2, x2 = j * dx + dx / 2, sw = (1 + x * 9).toFixed(2), op = (0.2 + 0.8 * Math.min(1, x * 1.6)).toFixed(2);
        if (j === t) s += '<path d="M' + (x1 - 9) + ' ' + (base - 18) + ' C' + (x1 - 34) + ' ' + (base - 74) + ' ' + (x1 + 34) + ' ' + (base - 74) + ' ' + (x1 + 9) + ' ' + (base - 18) + '" stroke-width="' + sw + '" opacity="' + op + '"/>';
        else { const h = Math.min(92, 26 + (t - j) * 11); s += '<path d="M' + x1 + ' ' + (base - 18) + ' C' + x1 + ' ' + (base - 18 - h) + ' ' + x2 + ' ' + (base - 18 - h) + ' ' + x2 + ' ' + (base - 18) + '" stroke-width="' + sw + '" opacity="' + op + '"/>'; }
      });
      const words = wd.map((x, j) => '<text x="' + (j * dx + dx / 2) + '" y="' + base + '" class="' + (j === t ? 'me' : j > t ? 'fut' : '') + '">' + esc(x) + '</text>' +
        (j <= t ? '<text x="' + (j * dx + dx / 2) + '" y="' + (base + 18) + '" class="pc">' + pct(w[j]) + '</text>' : '')).join('');
      return '<div class="mx-scroll"><svg class="mx-arcs" viewBox="0 0 ' + W + ' ' + (base + 26) + '" style="max-width:' + W + 'px" role="img" aria-label="' + esc('Attention from ' + wd[t] + ' to each earlier token; thicker means more weight') + '"><g class="arcs">' + s + '</g>' + words + '</svg></div>';
    }
    function geluPlot(hidden) {
      const W = 300, H = 170, r = Math.max(3, Math.ceil(absMax([hidden]))), X = v => 14 + (v + r) / (2 * r) * (W - 28), Y = v => H - 22 - (v + 0.4) / (r + 0.4) * (H - 36);
      const g = ITM.math.gelu, pts = Array.from({ length: 81 }, (_, i) => { const v = -r + 2 * r * i / 80; return X(v).toFixed(1) + ',' + Y(g(v)).toFixed(1); }).join(' ');
      return '<svg class="mx-gelu" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="The GELU curve with this token’s 32 hidden values plotted on it">' +
        '<line x1="14" x2="' + (W - 14) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" class="ax"/><line x1="' + X(0) + '" x2="' + X(0) + '" y1="10" y2="' + (H - 18) + '" class="ax"/>' +
        '<polyline points="' + pts + '" class="cv"/>' + hidden.map(v => '<circle cx="' + X(v).toFixed(1) + '" cy="' + Y(g(v)).toFixed(1) + '" r="4" fill="' + (v < 0 ? 'var(--c2)' : 'var(--c1)') + '"><title>' + fmt(v, 3) + ' → ' + fmt(g(v), 3) + '</title></circle>').join('') +
        '<text x="' + (W - 14) + '" y="' + (Y(0) + 14) + '" text-anchor="end">input</text><text x="' + (X(0) + 6) + '" y="20">GELU(input)</text></svg>';
    }

    function picture() {
      const S = STEPS[st.step], k = S.k, t = st.t, L = tr.layers[S.l === undefined ? 0 : S.l], H = L.heads[st.h], D = describe(st.step), me = q(wd[t]);
      const rl = wd.map((w, i) => i + ' ' + w);
      switch (k) {
        case 'tokens':
          return '<div class="mx-scroll"><div class="mx-ids">' + wd.map((w, i) => '<div class="mx-id' + (i === t ? ' me' : '') + '"><span class="w">' + esc(w) + '</span><span class="ar" aria-hidden="true">↓</span><span class="n">' + tk.ids[i] + '</span><small>position ' + i + '</small></div>').join('') + '</div></div>' +
            '<h3>The whole vocabulary</h3><div class="mx-vtab">' + V.map((w, i) => '<span class="' + (i === tk.ids[t] ? 'me' : tk.ids.includes(i) ? 'in' : '') + '"><b>' + i + '</b>' + esc(w) + '</span>').join('') + '</div>';
        case 'embed':
          return '<h3>The embedding matrix E <small>25 words × 16 numbers</small></h3>' + mini(ws().W.E, { rl: V.map((w, i) => i + ' ' + w), sel: tk.ids[t], hl: tk.ids, name: 'Embedding matrix', wide: true }) +
            '<p class="src">Highlighted rows are the words in your prompt; the outlined row is ' + me + '.</p><h3>Row ' + tk.ids[t] + ' becomes ' + me + '’s vector</h3>' + eqn([{ l: 'e', sub: me, v: tr.tokEmb[t] }]) + LEGEND;
        case 'pos': {
          const pe = tr.pe.map(r => r.map(x => 0.5 * x));
          return eqn([{ l: 'e', sub: 'meaning of ' + me, v: tr.tokEmb[t] }, { op: '+', l: 'position', sub: 'wave pattern for position ' + t, v: pe[t] }, { op: '=', l: 'x⁰', sub: 'start of the stream', v: tr.x0[t] }]) + LEGEND +
            '<h3>The position pattern for every position</h3>' + mini(pe, { rl: wd.map((w, i) => 'position ' + i), sel: t, name: 'Position pattern' }) + '<p class="src">Left columns change quickly from row to row, right columns slowly: together they give every position a unique fingerprint.</p>';
        }
        case 'ln1': case 'ln2': case 'lnf': {
          const rms = D.src.map(x => ITM.math.rmsOf(x)), mx = absMax([D.src[t], D.out[t]]);
          return eqn([{ l: 'x', sub: 'stream for ' + me, v: D.src[t] }, { op: '÷', l: fmt(D.rms, 2), sub: 'its RMS size', html: '<div class="mx-note">every number is divided by the same amount</div>' }, { op: '=', l: 'y', sub: 'normalized', v: D.out[t] }], mx) + LEGEND +
            '<h3>Size of every token’s vector, before and after</h3>' + hbars(rms.map((r, i) => ({ l: i + ' ' + wd[i], v: r, on: i === t })), { c: 'var(--muted)' }).replace('mx-hb"', 'mx-hb rms"') + '<p class="src">After normalization every one of these is 1.00.</p>';
        }
        case 'qkv': {
          const mx = absMax([H.q[t], H.k[t], H.v[t]]);
          return eqn([{ l: 'y', sub: 'normalized ' + me, v: L.ln1[t] }]) +
            eqn([{ op: '→', l: 'query', sub: 'what ' + me + ' looks for', v: H.q[t] }, { op: '→', l: 'key', sub: 'what ' + me + ' offers', v: H.k[t] }, { op: '→', l: 'value', sub: 'what ' + me + ' passes on', v: H.v[t] }], mx) + LEGEND +
            '<h3>Every token’s queries, keys and values <small>head ' + st.h + '</small></h3><div class="mx-trio">' + [['Queries', H.q], ['Keys', H.k], ['Values', H.v]].map(m => '<div><b>' + m[0] + '</b>' + mini(m[1], { rl, sel: t, name: m[0] }) + '</div>').join('') + '</div>';
        }
        case 'scores':
          return '<h3>' + me + '’s query against every key</h3>' + cols(H.scaled[t], { signed: true, all: true, name: 'Scores' }) +
            (t < tr.T - 1 ? '<p class="src">Faded columns are later tokens. Their scores exist, but the next step hides them.</p>' : '') +
            '<h3>Every token at once <small>rows look, columns are looked at</small></h3>' + mini(H.scaled, { rl, cl: wd, sel: t, name: 'Score matrix' });
        case 'mask':
          return '<h3>' + me + '’s scores after masking</h3>' + cols(H.masked[t], { signed: true, block: true, name: 'Masked scores' }) +
            '<h3>Every token at once</h3>' + mini(H.masked, { rl, cl: wd, sel: t, causal: true, name: 'Masked score matrix' }) + '<p class="src">Hatched cells are blocked: the triangle above the diagonal is the future.</p>';
        case 'softmax':
          return '<h3>Where ' + me + ' looks</h3>' + arcs(H.weights[t]) + cols(H.weights[t], { block: true, name: 'Attention weights' }) +
            '<h3>Every token at once</h3>' + mini(H.weights, { rl, cl: wd, sel: t, causal: true, pos: true, name: 'Attention weights' }) + '<p class="src">Each row adds up to 1. Stronger color means more attention.</p>';
        case 'headout': {
          const w = H.weights[t], keep = w.map((x, j) => j).filter(j => j <= t && w[j] >= 0.02).sort((a, b) => w[b] - w[a]), rest = w.reduce((s, x, j) => s + (j <= t && !keep.includes(j) ? x : 0), 0);
          const rows = keep.map((j, n) => ({ op: n ? '+' : '', l: w[j].toFixed(2) + ' × value', sub: 'of ' + q(wd[j]) + ', position ' + j, v: H.v[j].map(a => a * w[j]) }));
          if (rest > 0) rows.push({ op: '+', l: 'the rest', sub: 'weights under 0.02, ' + rest.toFixed(3) + ' in total', v: H.out[t].map((o, n) => o - keep.reduce((s, j) => s + w[j] * H.v[j][n], 0)) });
          rows.push({ op: '=', l: 'output', sub: 'head ' + st.h + ' for ' + me, v: H.out[t] });
          return '<h3>Each value, scaled by its attention weight, then summed</h3>' + arcs(w) + eqn(rows) + LEGEND;
        }
        case 'oproj': return eqn([{ l: 'stream', sub: me + ' before attention', v: L.xIn[t] }, { op: '+', l: 'attention', sub: 'both heads, mixed by W<sub>o</sub>', v: L.attnOut[t] }, { op: '=', l: 'stream', sub: 'after attention', v: L.resid1[t] }]) + LEGEND +
          '<h3>What attention added to every token</h3>' + mini(L.attnOut, { rl, sel: t, name: 'Attention output' });
        case 'mlp': {
          const mx = absMax([L.hidden[t], L.act[t]]);
          return eqn([{ l: 'y', sub: 'normalized ' + me + ', 16', v: L.ln2[t] }]) + eqn([{ op: '→', l: 'widen', sub: '32 hidden units', v: L.hidden[t] }, { op: '→', l: 'GELU', sub: 'negatives squashed', v: L.act[t] }], mx) +
            eqn([{ op: '→', l: 'project back', sub: '16 numbers', v: L.mlpOut[t] }]) + LEGEND +
            '<div class="mx-split"><div><h3>What GELU does to the 32 hidden units</h3>' + geluPlot(L.hidden[t]) + '</div><p class="src">Each dot is one hidden unit of ' + me + '. Positive inputs (blue) pass through almost unchanged; negative inputs (orange) are pulled close to zero. That bend is what lets the network compute more than a single matrix could.</p></div>';
        }
        case 'resid2': return eqn([{ l: 'stream', sub: 'after attention', v: L.resid1[t] }, { op: '+', l: 'MLP', sub: 'its output for ' + me, v: L.mlpOut[t] }, { op: '=', l: 'stream', sub: 'layer ' + S.l + ' output', v: L.resid2[t] }]) + LEGEND +
          '<h3>The stream for every token, after layer ' + S.l + '</h3>' + mini(L.resid2, { rl, sel: t, name: 'Layer output' });
        case 'logits': {
          const lg = tr.logits[t], ord = lg.map((x, i) => i).sort((a, b) => lg[b] - lg[a]);
          return eqn([{ l: 'y', sub: 'final vector for ' + me, v: tr.lnf[t] }]) + LEGEND + '<h3>Its dot product with every word’s embedding, highest first</h3>' + hbars(ord.map(i => ({ l: V[i], v: lg[i], on: i === ord[0] })), { signed: true, c: 'var(--c1)' });
        }
        case 'probs': {
          const pr = tr.probs[t], ord = pr.map((x, i) => i).sort((a, b) => pr[b] - pr[a]), nx = t < tr.T - 1 ? tk.ids[t + 1] : -1;
          return '<div class="mx-answer"><span>After ' + phrase(t) + ' the model predicts</span><b>' + esc(V[ord[0]]) + '</b><span>' + pct(pr[ord[0]]) + '</span></div>' +
            '<h3>The ten most likely next words</h3>' + hbars(ord.slice(0, 10).map(i => ({ l: V[i] + (i === nx ? '  (actual next word)' : ''), v: pr[i], on: i === ord[0] || i === nx })), { pct: true, c: 'var(--c3)' }) +
            '<p class="src">The other ' + (V.length - 10) + ' words share ' + pct(ord.slice(10).reduce((s, i) => s + pr[i], 0)) + '.</p>';
        }
      }
    }

    /* ---- one computed observation per step: what the numbers in front of you actually say ---- */
    function notice() {
      const S = STEPS[st.step], k = S.k, t = st.t, L = tr.layers[S.l === undefined ? 0 : S.l], H = L.heads[st.h], me = q(wd[t]), T = tr.T;
      const rep = (() => { const seen = {}; for (let i = 1; i < T; i++) (seen[wd[i]] = seen[wd[i]] || []).push(i); return Object.entries(seen).find(([, v]) => v.length > 1); })();
      const who = (j, tt) => j === tt ? ' (itself)' : j === 0 ? ' (the start token, a common resting place when nothing else is useful)' : j === tt - 1 ? ' (the previous word)' : '';
      switch (k) {
        case 'tokens': return 'Your prompt is ' + T + ' tokens, counting &lt;bos&gt;.' + (rep ? ' ' + q(rep[0]) + ' appears ' + rep[1].length + ' times and is ID ' + V.indexOf(rep[0]) + ' every time: the ID says which word, never where it is.' : '');
        case 'embed': {
          const pos = wd.map((w, i) => i).filter(i => i > 0 && wd[i] === wd[t]);
          return (pos.length > 1 ? me + ' appears at positions ' + pos.join(' and ') + ' and gets exactly the same vector each time. Only the next step will tell them apart.' : 'Every occurrence of a word gets the same row, wherever it is in the sentence.') +
            (st.w === 'random' ? ' With untrained weights these rows are random noise.' : ' Training shaped these rows; words used in similar ways ended up with similar vectors.');
        }
        case 'pos': {
          if (!rep) return 'The pattern is different at every position, so the same word in two places ends up with two different vectors.';
          const [a, b] = rep[1], d = norm(tr.x0[a].map((x, n) => x - tr.x0[b][n]));
          return 'Before this step, ' + q(rep[0]) + ' at positions ' + a + ' and ' + b + ' had identical vectors. Now they are ' + d.toFixed(2) + ' apart, so the model can tell them apart.';
        }
        case 'ln1': case 'ln2': case 'lnf': {
          const D = describe(st.step), r = D.src.map(x => ITM.math.rmsOf(x));
          return me + '’s vector had an RMS size of ' + D.rms.toFixed(2) + '; afterwards it is 1.00. Across the prompt, sizes ranged from ' + Math.min(...r).toFixed(2) + ' to ' + Math.max(...r).toFixed(2) + ' before and are all 1.00 after.';
        }
        case 'qkv': { const j = argmax(H.scaled[t].slice(0, t + 1)); return 'Looking ahead: of the tokens ' + me + ' may read, the key that best matches its query belongs to ' + q(wd[j]) + who(j, t) + '. The next step shows the scores.'; }
        case 'scores': {
          const j = argmax(H.scaled[t].slice(0, t + 1)), n = T - 1 - t;
          return 'Highest score among the tokens ' + me + ' may read: ' + q(wd[j]) + who(j, t) + ', at ' + fmt(H.scaled[t][j], 2) + '.' + (n ? ' The ' + n + ' later token' + (n > 1 ? 's are' : ' is') + ' scored too, but not for long.' : ' ' + me + ' is the last token, so nothing will be hidden from it.');
        }
        case 'mask': { const n = T - 1 - t; return me + ' can read ' + (t + 1) + ' token' + (t ? 's' : '') + ': itself and everything before it. ' + (n ? n + ' later token' + (n > 1 ? 's are' : ' is') + ' blocked.' : 'Nothing is blocked, because it is the last token.'); }
        case 'softmax': {
          const w = H.weights[t], j = argmax(w), o = L.heads[1 - st.h].weights[t], j2 = argmax(o);
          return me + ' puts ' + pct(w[j]) + ' of its attention on ' + q(wd[j]) + who(j, t) + '. The other head in this layer mostly reads ' + q(wd[j2]) + ' (' + pct(o[j2]) + '): heads are free to look in different places.';
        }
        case 'headout': { const w = H.weights[t], j = argmax(w); return pct(w[j]) + ' of this output is the value vector of ' + q(wd[j]) + '. The output has 8 numbers, like each value it was blended from.'; }
        case 'oproj': return 'Attention changed ' + me + '’s vector by ' + pct(norm(L.attnOut[t]) / norm(L.xIn[t])) + ' of its length. The original vector is still there underneath: residual connections only add.';
        case 'mlp': { const n = L.hidden[t].filter(x => x < 0).length; return n + ' of ' + me + '’s 32 hidden units are negative and GELU squashes them toward zero; the other ' + (32 - n) + ' pass through.'; }
        case 'resid2': return 'The MLP changed ' + me + '’s vector by ' + pct(norm(L.mlpOut[t]) / norm(L.resid1[t])) + ' of its length. ' + (S.l === 0 ? 'This vector is what layer 1 starts from.' : 'This is the last edit; next comes the prediction.');
        case 'logits': { const lg = tr.logits[t], j = argmax(lg); return 'The highest logit is ' + q(V[j]) + ' at ' + fmt(lg[j], 2) + '. Only the gaps between logits matter: adding the same amount to all of them would change nothing.'; }
        case 'probs': {
          const pr = tr.probs[t], j = argmax(pr), alt = ITM.forward(ws(st.w === 'random' ? 'trained' : 'random').W, tk.ids).probs[t], ja = argmax(alt);
          let s = t < T - 1 ? 'At this position the model is guessing what follows ' + me + '. Its top guess is ' + q(V[j]) + '; the word that actually comes next in your prompt, ' + q(wd[t + 1]) + ', got ' + pct(pr[tk.ids[t + 1]]) + ' (rank ' + (pr.filter(x => x > pr[tk.ids[t + 1]]).length + 1) + ' of 25).' : 'The model predicts ' + q(V[j]) + ' with ' + pct(pr[j]) + '.';
          return s + ' With ' + (st.w === 'random' ? 'trained' : 'untrained') + ' weights, the same arithmetic would pick ' + q(V[ja]) + ' (' + pct(alt[ja]) + ').';
        }
      }
    }

    /* ---- Numbers view: the selected token's actual numbers substituted into the equation ---- */
    function vecTable(rows, p, labels) {
      const n = rows[0].v.length;
      return '<div class="mx-scroll"><table class="grid mx-num"><thead><tr><th></th>' + Array.from({ length: n }, (_, i) => '<th scope="col">' + (labels ? esc(labels[i]) : i) + '</th>').join('') + '</tr></thead><tbody>' +
        rows.map(r => '<tr><th scope="row">' + r.l + '</th>' + r.v.map(x => '<td>' + fmt(x, p) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
    }
    function numbers() {
      const S = STEPS[st.step], k = S.k, t = st.t, p = st.p, D = describe(st.step);
      let h = '<div class="mx-numbar"><p class="mx-eq">' + esc(D.eq) + '</p><label class="mx-prec">Decimals <input type="range" data-x="prec" min="2" max="8" value="' + p + '"><output>' + p + '</output></label></div>';
      if (k === 'scores' || k === 'mask' || k === 'softmax') {
        const H = tr.layers[S.l].heads[st.h];
        if (k === 'scores') {
          const terms = H.q[t].map((a, n) => fmt(a, p) + '·' + fmt(H.k[t][n], p));
          h += '<p>Token ' + t + ' (' + q(wd[t]) + '), layer ' + S.l + ', head ' + st.h + '. Worked example for its own key, j = ' + t + ':</p><pre class="mx-pre">q·k = ' + terms.join(' + ') + '\n    = ' + fmt(H.dots[t][t], p) + '\ns   = ' + fmt(H.dots[t][t], p) + ' / √8 = ' + fmt(H.scaled[t][t], p) + '</pre>';
          h += vecTable([{ l: 'q·k_j', v: H.dots[t].slice(0, t + 1) }, { l: 's_j', v: H.scaled[t].slice(0, t + 1) }], p, wd.slice(0, t + 1).map((w, j) => j + ' ' + w));
          if (t < tr.T - 1) h += '<p class="src">Keys j > ' + t + ' are computed too, but masked in the next step.</p>';
        } else if (k === 'mask') {
          h += vecTable([{ l: 'before', v: H.scaled[t] }, { l: 'after', v: H.masked[t] }], p, wd.map((w, j) => j + ' ' + w)) + '<p class="src">Keys after token ' + t + ' become ' + MINUS + '∞, so exp(' + MINUS + '∞) = 0 in the next step.</p>';
        } else {
          const sc = H.masked[t], m = Math.max(...sc), e = sc.map(s => Math.exp(s - m)), tot = e.reduce((a, b) => a + b, 0);
          h += '<p>Token ' + t + ', layer ' + S.l + ', head ' + st.h + '. The largest score is ' + fmt(m, p) + '; subtracting it first keeps exp() from overflowing.</p>' + vecTable([{ l: 's_j', v: sc }, { l: 'exp(s−max)', v: e }, { l: 'w_j', v: H.weights[t] }], p, wd.map((w, j) => j + ' ' + w)) +
            '<p>Σ exp = ' + fmt(tot, p) + ', so w_j = exp(s_j − max) / ' + fmt(tot, p) + '. Σ w_j = ' + H.weights[t].reduce((a, b) => a + b, 0).toFixed(12) + '.</p>';
        }
        return h;
      }
      if (k === 'headout') {
        const H = tr.layers[S.l].heads[st.h], w = H.weights[t];
        return h + '<p>Token ' + t + ', layer ' + S.l + ', head ' + st.h + '. Each value vector is scaled by its weight, then summed:</p>' +
          vecTable(w.map((x, j) => ({ l: 'w=' + fmt(x, p) + ' · v_' + j + ' (' + esc(wd[j]) + ')', v: H.v[j].map(a => a * x) })).filter((r, j) => w[j] !== 0).concat([{ l: 'o_' + t + ' (sum)', v: H.out[t] }]), p);
      }
      if (k === 'tokens') return h + '<pre class="mx-pre">' + wd.map((w, i) => i + ': ' + esc(w) + ' → id ' + tk.ids[i]).join('\n') + '</pre>';
      if (k === 'logits') return h + '<p>Token ' + t + ': the logit for each vocabulary entry is y_' + t + ' · E[entry].</p>' + vecTable([{ l: 'logit', v: tr.logits[t] }, { l: 'softmax', v: tr.probs[t] }], p, V);
      if (k === 'probs') { const pr = tr.probs[t]; return h + vecTable([{ l: 'p', v: pr }], p, V) + '<p>Σ p = ' + pr.reduce((a, b) => a + b, 0).toFixed(12) + '</p>'; }
      h += '<p>Token ' + t + ' (' + q(wd[t]) + '):</p>' + vecTable(D.vec, p);
      if (D.vec2) h += vecTable(D.vec2, p);
      if (D.extra) h += '<p>' + esc(D.extra) + '</p>';
      return h;
    }

    function codeView() {
      const k = STEPS[st.step].k;
      return '<p class="src">The reference implementation, <a href="/js/itm-model.js">itm-model.js</a>: plain JavaScript in float64. The line for this step is highlighted.</p><pre class="mx-code"><code>' +
        Object.keys(CODE).map(n => '<span class="' + (n === k ? 'on' : '') + '"' + (n === k ? ' aria-current="true"' : '') + '>' + esc(CODE[n]) + '</span>').join('\n') + '</code></pre>' +
        '<div class="mx-acts"><button type="button" class="mx-btn" data-a="copy">Copy this line</button> <a class="mx-btn" href="/trace/golden.json" download>Download the golden fixture</a></div>';
    }

    /* ---- render ---- */
    const where = s => { const S = STEPS[s]; return S.l === undefined ? (s < 3 ? 'Input' : 'Output') : 'Layer ' + S.l + ' · ' + (ATTN.includes(S.k) ? 'Attention' : 'MLP'); };
    function mapHTML() {
      const cur = STEPS[st.step], item = s => '<li><button type="button" class="mx-step' + (s === st.step ? ' on' : s < st.step ? ' done' : '') + '" data-s="' + s + '" style="--gc:' + colorOf(s) + '"' + (s === st.step ? ' aria-current="step"' : '') + '><span class="mx-dot" aria-hidden="true"></span><span class="mx-sn">' + (s + 1) + '</span>' + INFO[STEPS[s].k].m + '</button></li>';
      return '<button type="button" class="mx-maptoggle" data-a="map" aria-expanded="' + st.map + '">All 26 steps</button><ol class="mx-groups">' + GROUPS.map(G => {
        if (G.subs) {
          const open = cur.l === G.l;
          if (!open) {
            const same = cur.l !== undefined ? STEPS.findIndex(x => x.l === G.l && x.k === cur.k) : G.subs[0].s[0];
            return '<li class="mx-g shut"><button type="button" class="mx-layer" data-s="' + same + '"' + (st.step > G.subs[1].s[2] ? ' data-done' : '') + '><b>' + G.n + '</b><small>' + (cur.l !== undefined ? 'same steps, next layer' : 'attention, then MLP · 10 steps') + '</small></button></li>';
          }
          return '<li class="mx-g"><span class="mx-gn">' + G.n + '</span><ol>' + G.subs.map(U => '<li class="mx-sub" style="--gc:' + U.c + '"><span class="mx-subn">' + U.n + '</span><ol>' + U.s.map(item).join('') + '</ol></li>').join('') + '</ol></li>';
        }
        return '<li class="mx-g" style="--gc:' + G.c + '"><span class="mx-gn">' + G.n + '</span><ol>' + G.s.map(item).join('') + '</ol></li>';
      }).join('') + '</ol>';
    }

    function render() {
      compute();
      const S = STEPS[st.step], I = INFO[S.k], D = describe(st.step), T = tr.T, last = tr.probs[T - 1], ord = last.map((x, i) => i).sort((a, b) => last[b] - last[a]);
      const txt = $('text'); if (document.activeElement !== txt) txt.value = st.prompt;
      el.querySelectorAll('[data-ex]').forEach(b => b.setAttribute('aria-pressed', String(CFG.prompts[+b.dataset.ex] === st.prompt)));
      $('warn').textContent = (tk.unknown.length ? 'Skipped, not in the vocabulary: ' + tk.unknown.join(', ') + '. ' : '') + (tk.truncated ? 'Cut to the first ' + CFG.maxCtx + ' tokens.' : '');
      $('toks').innerHTML = wd.map((w, i) => '<button type="button" class="mx-tok' + (i === st.t ? ' on' : '') + '" data-t="' + i + '" aria-pressed="' + (i === st.t) + '"><small>' + i + '</small>' + esc(w) + '</button>').join('') +
        '<span class="mx-tokhint">' + (st.t === T - 1 ? 'The last word is where the next-word prediction is made.' : 'Pick the last word to follow the actual prediction.') + '</span>';
      $('pred').innerHTML = '<div class="mx-predtxt"><span class="mx-k">Prediction</span><span>After ' + phrase(T - 1) + ' comes</span><b class="mx-top">' + esc(V[ord[0]]) + ' <small>' + pct(last[ord[0]]) + '</small></b>' +
        (last[ord[1]] >= 0.01 ? '<span class="mx-also">then ' + ord.slice(1, 3).filter(i => last[i] >= 0.01).map(i => q(V[i]) + ' ' + pct(last[i])).join(', ') + '</span>' : '') + (st.step === 25 && st.t === T - 1 ? '' : '<button type="button" class="mx-link" data-a="how">Jump to the answer</button>') + '</div>' +
        '<div class="mx-seg" role="group" aria-label="Weights"><span class="mx-k">Weights</span>' + [['trained', 'Trained'], ['random', 'Untrained']].map(w => '<button type="button" data-w="' + w[0] + '" aria-pressed="' + (w[0] === st.w) + '">' + w[1] + '</button>').join('') + '</div>';
      $('map').innerHTML = mapHTML(); root.classList.toggle('mapopen', st.map);
      const prev = st.step > 0 ? INFO[STEPS[st.step - 1].k].m : '', next = st.step < STEPS.length - 1 ? INFO[STEPS[st.step + 1].k].m : '';
      const ws0 = ws();
      $('stage').innerHTML = '<div class="mx-sh" style="--gc:' + colorOf(st.step) + '"><div class="mx-kick"><span>Step ' + (st.step + 1) + ' of ' + STEPS.length + '</span><span>' + where(st.step) + '</span></div>' +
          '<div class="mx-nav"><button type="button" class="mx-btn" data-a="prev"' + (st.step ? '' : ' disabled') + ' aria-label="Previous step">←</button><button type="button" class="mx-btn primary" data-a="next"' + (next ? '' : ' disabled') + ' aria-label="Next step">→</button></div></div>' +
        '<h2 class="mx-h">' + I.t + ' <small>' + I.tech + '</small></h2><p class="mx-why">' + I.why + '</p>' +
        '<div class="mx-tools"><div class="mx-tabs" role="group" aria-label="View">' + [['visual', 'Picture'], ['math', 'Numbers'], ['code', 'Code']].map(v => '<button type="button" data-view="' + v[0] + '" aria-pressed="' + (v[0] === st.view) + '">' + v[1] + '</button>').join('') + '</div>' +
          (HEADD[S.k] ? '<div class="mx-seg" role="group" aria-label="Attention head"><span class="mx-k">Head</span>' + [0, 1].map(h => '<button type="button" data-h="' + h + '" aria-pressed="' + (h === st.h) + '">' + h + '</button>').join('') + '</div>' : '') + '</div>' +
        '<div class="mx-view">' + (st.view === 'math' ? numbers() : st.view === 'code' ? codeView() : picture()) + '</div>' +
        '<div class="mx-notice" style="--gc:' + colorOf(st.step) + '"><b>Notice</b><p>' + notice() + '</p></div>' +
        '<div class="mx-foot">' + (prev ? '<button type="button" class="mx-btn" data-a="prev"><small>Previous</small>' + prev + '</button>' : '<span></span>') + (next ? '<button type="button" class="mx-btn primary" data-a="next"><small>Next</small>' + next + '</button>' : '<button type="button" class="mx-btn" data-a="restart"><small>Done</small>Start again with another word</button>') + '</div>' +
        '<details class="mx-more" data-x="more"' + (st.more ? ' open' : '') + '><summary>Shapes, sources and reproducibility</summary><dl>' +
          '<dt>Operation</dt><dd><code>' + (S.l === undefined ? '' : 'L' + S.l + '.') + (HEADD[S.k] ? 'H' + st.h + '.' : '') + S.k + '</code></dd><dt>Inputs</dt><dd>' + esc(D.inputs) + '</dd><dt>Output shape</dt><dd><code>' + esc(D.shape) + '</code> float64</dd><dt>Equation</dt><dd><code>' + esc(D.eq) + '</code></dd>' +
          '<dt>Model</dt><dd><code>' + CFG.version + '</code>: 2 layers, 2 heads, d<sub>model</sub> = 16, 25-entry vocabulary</dd>' +
          '<dt>Weights</dt><dd>' + (ws0.meta.trained ? 'trained for ' + ws0.meta.steps + ' Adam steps on a toy grammar; held-out loss ' + ws0.meta.heldOutLoss + ' (uniform guessing ' + ws0.meta.uniformLoss + ')' : 'random initialization, never trained') + '; checksum <code>' + ws0.sum + '</code></dd>' +
          '<dt>Precision</dt><dd>computed in float64' + (ws0.meta.trained ? '; attention weights and logits match an independent NumPy implementation to 1e-9' : '; these random weights are not part of the NumPy check') + '</dd></dl>' +
          '<button type="button" class="mx-btn" data-a="copylink">Copy a link to exactly this view</button></details>';
      $('announce').textContent = 'Step ' + (st.step + 1) + ' of ' + STEPS.length + ': ' + where(st.step) + ', ' + INFO[S.k].t + '. Following ' + wd[st.t] + '.';
      try { history.replaceState(null, '', '#' + new URLSearchParams({ p: st.prompt, step: st.step, t: st.t, l: S.l === undefined ? 0 : S.l, h: st.h, v: st.view, w: st.w }).toString()); } catch (e) {}
    }
    const go = s => { st.step = s; st.map = false; render(); if (root.getBoundingClientRect().top < 0 || $('stage').getBoundingClientRect().top < 0) $('stage').scrollIntoView({ block: 'start' }); };

    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || !el.contains(b)) return;
      const d = b.dataset;
      if (d.s !== undefined) return go(+d.s);
      if (d.t !== undefined) st.t = +d.t;
      else if (d.h !== undefined) st.h = +d.h;
      else if (d.w !== undefined) st.w = d.w;
      else if (d.view) st.view = d.view;
      else if (d.ex !== undefined) { st.prompt = CFG.prompts[+d.ex]; st.t = 99; }
      else if (d.add) { st.prompt = (st.prompt.trim() + ' ' + d.add).trim(); st.t = 99; }
      else if (d.a === 'next') return go(st.step + 1);
      else if (d.a === 'prev') return go(st.step - 1);
      else if (d.a === 'restart') { st.t = 99; return go(0); }
      else if (d.a === 'how') { st.t = 99; return go(25); }
      else if (d.a === 'map') st.map = !st.map;
      else if (d.a === 'copylink') { try { navigator.clipboard.writeText(location.href); b.textContent = 'Link copied'; } catch (x) {} return; }
      else if (d.a === 'copy') { try { navigator.clipboard.writeText(CODE[STEPS[st.step].k]); b.textContent = 'Copied'; } catch (x) {} return; }
      else return;
      render();
    });
    el.addEventListener('input', e => {
      const x = e.target.dataset.x;
      if (x === 'text') { st.prompt = e.target.value; st.t = 99; render(); }
      else if (x === 'prec') e.target.nextElementSibling.textContent = e.target.value;
    });
    /* re-render only when the slider is released, so dragging is not interrupted */
    el.addEventListener('change', e => { if (e.target.dataset.x === 'prec') { st.p = +e.target.value; render(); const r = el.querySelector('[data-x="prec"]'); if (r) r.focus(); } });
    el.addEventListener('toggle', e => { if (e.target.dataset && e.target.dataset.x === 'more') st.more = e.target.open; }, true);
    el.addEventListener('keydown', e => {
      if (e.target.matches('input, textarea, select') || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight' && st.step < STEPS.length - 1) { e.preventDefault(); st.step++; render(); }
      else if (e.key === 'ArrowLeft' && st.step > 0) { e.preventDefault(); st.step--; render(); }
    });
    /* in-page links such as /explorer/#step=7 change only the hash */
    window.addEventListener('hashchange', () => { readHash(); render(); });
    render();
  };

  /* Chapter widget: the real attention patterns of every head, for a chosen prompt. Same engine and weights as the Explorer. */
  window.W.attnreal = el => {
    const { ITM, K } = window; if (!ITM) { el.insertAdjacentHTML('beforeend', '<p class="src">The model engine failed to load.</p>'); return; }
    const V = ITM.CFG.vocab, P = ITM.CFG.prompts;
    const S = { p: 0, r: false, q: -1 };
    el.innerHTML = '<div class="row"><label>Prompt <select data-k="p">' + P.map((q, i) => '<option value="' + i + '">' + esc(q) + '</option>').join('') + '</select></label>' + K.toggle('r', 'random weights (nothing learned)') + '</div>' +
      '<p class="wk-cap">Pick a token to compare what it reads in all four heads at once.</p><div class="wk-toks" data-x="toks" role="group" aria-label="Token doing the looking"></div><div class="ar-grid" data-out></div>' +
      '<p class="src">Real attention weights from the Model Explorer’s 2-layer, 2-head model. Row = the token doing the looking, column = the token it reads; darker means more weight, hatched cells are blocked by the causal mask.</p>';
    const ui = K.bind(el, S, draw, { change: k => { if (k === 'p') S.q = -1; } });
    el.addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) ui.update('q', +b.dataset.q); });
    function draw() {
      const text = P[S.p], tk = ITM.tokenize(text), W = (S.r ? ITM.seeded() : ITM.weights()).W, tr = ITM.forward(W, tk.ids), w = tk.ids.map(i => V[i]), q = S.q < 0 || S.q >= w.length ? w.length - 1 : S.q;
      el.querySelector('[data-x="toks"]').innerHTML = w.map((t, i) => '<button type="button" class="wk-tok" data-q="' + i + '" aria-pressed="' + (i === q) + '">' + esc(t) + '</button>').join('');
      let h = '';
      tr.layers.forEach((L, l) => L.heads.forEach((H, hd) => {
        const link = '/explorer/#' + new URLSearchParams({ p: text, step: l * 10 + 7, t: q, l, h: hd, v: 'visual', w: S.r ? 'random' : 'trained' }).toString(), row = H.weights[q], j = row.indexOf(Math.max(...row));
        h += '<figure class="ar"><figcaption>Layer ' + l + ', head ' + hd + '</figcaption><table class="grid"><thead><tr><th></th>' + w.map(t => '<th scope="col">' + esc(t) + '</th>').join('') + '</tr></thead><tbody>' +
          H.weights.map((r, i) => '<tr' + (i === q ? ' style="outline:2px solid var(--accent);outline-offset:-1px"' : '') + '><th scope="row" class="wk-click" data-q="' + i + '">' + esc(w[i]) + '</th>' + r.map((v, c) => (c > i ? '<td class="m"></td>' : '<td data-q="' + i + '" title="' + esc(w[i] + ' reads ' + w[c] + ': ' + v.toFixed(3)) + '"><i style="opacity:' + Math.min(1, v).toFixed(3) + '"></i></td>')).join('') + '</tr>').join('') +
          '</tbody></table><p class="wk-cap">“' + esc(w[q]) + '” reads <b>' + esc(w[j]) + '</b> most (' + row[j].toFixed(2) + ')' + (j === q ? ': itself' : j === 0 ? ': the start token' : j === q - 1 ? ': the previous token' : '') + '</p><a href="' + link + '">Inspect in the Model Explorer</a></figure>';
      }));
      el.querySelector('[data-out]').innerHTML = h;
    }
    draw();
  };

  /* Test-yourself challenges. Every answer is computed from the live trace, so questions and answers cannot drift from the model. */
  window.W.challenges = el => {
    const { ITM } = window; if (!ITM) { el.insertAdjacentHTML('beforeend', '<p class="src">The model engine failed to load.</p>'); return; }
    const V = ITM.CFG.vocab, P0 = ITM.CFG.prompts[0], P3 = ITM.CFG.prompts[3];
    const run = (text, w) => { const tk = ITM.tokenize(text), tr = ITM.forward((w === 'random' ? ITM.seeded() : ITM.weights()).W, tk.ids); return { tk, tr, words: tk.ids.map(i => V[i]) }; };
    const link = (text, step, t, l, h, w) => '/explorer/#' + new URLSearchParams({ p: text, step, t, l, h, v: 'visual', w: w || 'trained' }).toString();
    const f = x => x.toFixed(3);
    const Q = [];
    { const { tk } = run(P0), t = 3, n = tk.ids.length - 1 - t;
      Q.push({ id: 'mask', q: 'In “' + P0 + '”, token 3 (“sat”) can read only itself and earlier tokens. Counting <bos> as token 0 and the last token as token ' + (tk.ids.length - 1) + ', how many positions get exactly zero attention weight from “sat”?', opts: [n - 3, n, n + 3, 0].map(String), ans: String(n),
        why: 'Tokens ' + (t + 1) + ' to ' + (tk.ids.length - 1) + ' come after “sat”, so their scores are set to −∞ and softmax turns them into exactly 0: ' + n + ' positions.', go: link(P0, 6, t, 0, 0) }); }
    Q.push({ id: 'sum', q: 'Softmax is applied to each row of masked scores. What does each row of attention weights add up to?', opts: ['0', '1', 'The number of tokens', 'It depends on the head'], ans: '1',
      why: 'Softmax outputs are non-negative and normalized, so every row sums to 1 (up to rounding). The Math view of the softmax step prints the sum to 12 decimals.', go: link(P0, 7, 3, 0, 0) });
    { const { tr, words } = run(P0), w = tr.layers[0].heads[0].weights[3], j = w.indexOf(Math.max(...w)), cands = [0, 1, 2, 3];
      Q.push({ id: 'argmax', q: 'In layer 0, head 0, which word does “sat” (token 3) give the most attention weight to?', opts: cands.map(i => i + ' ' + words[i]), ans: j + ' ' + words[j],
        why: 'The weights are ' + cands.map(i => words[i] + ' ' + f(w[i])).join(', ') + '. Heads do not have to look at other words; a head may mostly read the current token.', go: link(P0, 7, 3, 0, 0) }); }
    Q.push({ id: 'scale', q: 'Scores are q·k divided by what, in this model whose heads are 8 numbers wide?', opts: ['8', '√8', '16', '√16'], ans: '√8',
      why: 'Dividing by √d_k keeps the scores from growing with head width, so softmax does not saturate. Here d_k = 8, so the divisor is √8 ≈ 2.83.', go: link(P0, 5, 3, 0, 0) });
    { const r = run(P3), pr = r.tr.probs.at(-1), cands = ['mat', 'dog', 'sat', '.'], best = cands.reduce((a, b) => pr[V.indexOf(b)] > pr[V.indexOf(a)] ? b : a);
      Q.push({ id: 'next', q: 'After “' + P3 + '”, which of these words does the trained model rate most likely?', opts: cands, ans: best,
        why: 'The trained model gives “' + best + '” ' + f(pr[V.indexOf(best)]) + ', while ' + cands.filter(c => c !== best).map(c => c + ' gets ' + f(pr[V.indexOf(c)])).join(', ') + '. In its training grammar, “on the” is always followed by a place.', go: link(P3, 25, r.tk.ids.length - 1, 1, 0) }); }
    { const a = run(P3), b = run(P3, 'random'), pt = a.tr.probs.at(-1), pr = b.tr.probs.at(-1), top = p => V[p.indexOf(Math.max(...p))];
      Q.push({ id: 'random', q: 'Run the same prompt (“' + P3 + '”) with random, untrained weights. Which statement is true?', opts: ['Probabilities are computed differently', 'The arithmetic is identical; only the weight values differ', 'The random model cannot run', 'The mask is disabled'], ans: 'The arithmetic is identical; only the weight values differ',
        why: 'Same code, same steps. Trained weights put ' + f(pt[V.indexOf('mat')] + pt[V.indexOf('bed')]) + ' on mat or bed; random weights put ' + f(pr[V.indexOf('mat')] + pr[V.indexOf('bed')]) + ' there and prefer “' + top(pr) + '”. Learning changes numbers, not the operations.', go: link(P3, 25, a.tk.ids.length - 1, 1, 0, 'random') }); }
    let saved = {}; try { saved = JSON.parse(localStorage.getItem('itm-challenges') || '{}'); } catch (e) {}
    const save = () => { try { localStorage.setItem('itm-challenges', JSON.stringify(saved)); } catch (e) {} };
    el.innerHTML = '<p class="src">Questions are generated from the live model, so every answer is checkable in the Explorer. Your results stay in this browser.</p><div class="ch-score" role="status" data-score></div>' +
      Q.map((q, i) => '<fieldset class="ch-q" data-q="' + q.id + '"><legend>' + (i + 1) + '. ' + esc(q.q) + '</legend>' + q.opts.map(o => '<label class="ch-o"><input type="radio" name="' + q.id + '" value="' + esc(o) + '"> ' + esc(o) + '</label>').join('') +
        '<button class="btn" data-ck="' + q.id + '">Check</button><div class="ch-fb" aria-live="polite"></div></fieldset>').join('') + '<button class="btn" data-reset>Reset answers</button>';
    const show = () => { const n = Q.filter(q => saved[q.id] === 1).length; el.querySelector('[data-score]').textContent = n + ' of ' + Q.length + ' answered correctly'; };
    const mark = (q, fs, ok) => { fs.querySelector('.ch-fb').innerHTML = '<b>' + (ok ? 'Correct.' : 'Not quite.') + '</b> ' + esc(q.why) + ' <a href="' + q.go + '">See it in the Model Explorer</a>'; fs.classList.toggle('ok', ok); fs.classList.toggle('no', !ok); };
    Q.forEach(q => { if (q.id in saved) mark(q, el.querySelector('[data-q="' + q.id + '"]'), saved[q.id] === 1); });
    show();
    el.addEventListener('click', e => {
      if (e.target.closest('[data-reset]')) { saved = {}; save(); el.querySelectorAll('.ch-q').forEach(fs => { fs.classList.remove('ok', 'no'); fs.querySelector('.ch-fb').innerHTML = ''; fs.querySelectorAll('input').forEach(i => { i.checked = false; }); }); show(); return; }
      const b = e.target.closest('[data-ck]'); if (!b) return;
      const q = Q.find(x => x.id === b.dataset.ck), fs = b.closest('fieldset'), pick = fs.querySelector('input:checked');
      if (!pick) { fs.querySelector('.ch-fb').textContent = 'Pick an answer first.'; return; }
      const ok = pick.value === q.ans; saved[q.id] = ok ? 1 : 0; save(); mark(q, fs, ok); show();
    });
  };

  /* Chapter widget: what a mask does to the model's real attention scores. */
  window.W.attnmask = el => {
    const { ITM, K } = window; if (!ITM) { el.insertAdjacentHTML('beforeend', '<p class="src">The model engine failed to load.</p>'); return; }
    const V = ITM.CFG.vocab, P = ITM.CFG.prompts;
    const S = { p: 0, k: 0, c: true, w: 0, q: -1 };
    el.innerHTML = '<div class="row"><label>Prompt <select data-k="p">' + P.map((q, i) => '<option value="' + i + '">' + esc(q) + '</option>').join('') + '</select></label></div>' +
      K.seg('k', 'head', [['0', 'L0 H0'], ['1', 'L0 H1'], ['2', 'L1 H0'], ['3', 'L1 H1']]) + '<div class="wk-bar">' + K.toggle('c', 'causal mask') + '</div>' + K.seg('w', 'sliding window', [['0', 'off'], ['2', '2'], ['3', '3'], ['4', '4']]) +
      '<p class="wk-cap">Click a row to see that token’s weights before and after masking.</p><div class="gscroll" data-out></div><div data-x="row" aria-live="polite"></div>' +
      K.details('About these numbers', '<p class="src">These are the real scores of the Explorer’s trained model, re-normalized under the mask you pick. The model was trained only with the causal mask, so the other settings show what the same scores would give, not a model trained that way.</p>');
    const ui = K.bind(el, S, draw, { change: k => { if (k === 'p') S.q = -1; } });
    el.addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) ui.update('q', +b.dataset.q); });
    function draw() {
      const tk = ITM.tokenize(P[S.p]), tr = ITM.forward(ITM.weights().W, tk.ids), w = tk.ids.map(i => V[i]), n = w.length, q = S.q < 0 || S.q >= n ? Math.min(n - 1, 4) : S.q;
      const H = tr.layers[S.k >> 1].heads[S.k & 1], allow = (i, j) => (!S.c || j <= i) && (!S.w || Math.abs(i - j) < S.w);
      let blocked = 0, h = '<table class="grid"><thead><tr><th></th>' + w.map(t => '<th scope="col">' + esc(t) + '</th>').join('') + '</tr></thead><tbody>';
      const rows = H.scaled.map((row, i) => ITM.math.softmax(row.map((s, j) => (allow(i, j) ? s : -Infinity))));
      rows.forEach((p, i) => {
        h += '<tr' + (i === q ? ' style="outline:2px solid var(--accent);outline-offset:-1px"' : '') + '><th scope="row" class="wk-click" data-q="' + i + '">' + esc(w[i]) + '</th>' + p.map((v, j) => { if (!allow(i, j)) { blocked++; return '<td class="m" data-q="' + i + '" title="blocked"></td>'; } return '<td data-q="' + i + '" title="' + esc(w[i] + ' reads ' + w[j] + ': ' + v.toFixed(3)) + '"><i style="opacity:' + Math.min(1, v).toFixed(3) + '"></i></td>'; }).join('') + '</tr>';
      });
      el.querySelector('[data-out]').innerHTML = h + '</tbody></table>';
      const raw = ITM.math.softmax(H.scaled[q]), masked = rows[q], lost = raw.reduce((s, v, j) => s + (allow(q, j) ? 0 : v), 0);
      el.querySelector('[data-x="row"]').innerHTML = '<div class="kicker">row “' + esc(w[q]) + '”: grey = softmax of all scores, violet = after the mask (renormalized)</div>' +
        w.map((t, j) => '<div class="brow"><span>' + esc(t) + '</span><div class="bar" style="position:relative"><i style="position:absolute;left:0;top:0;height:50%;width:' + (raw[j] * 100).toFixed(1) + '%;background:var(--muted);opacity:.6"></i><i style="position:absolute;left:0;top:50%;height:50%;width:' + (masked[j] * 100).toFixed(1) + '%;background:var(--c4)"></i></div><span>' + (allow(q, j) ? masked[j].toFixed(2) : 'blocked') + '</span></div>').join('') +
        K.stats([{ l: 'blocked cells', v: blocked + ' of ' + n * n }, { l: 'probability the mask removed from this row', v: lost.toFixed(2), s: 'shared out among the allowed tokens' }, { l: 'allowed weights sum to', v: masked.reduce((a, b) => a + b, 0).toFixed(3), tone: 'ok' }]);
    }
    draw();
  };
})();
