/* Model Explorer: steps through the full forward pass of the itm-toy-1.0 model (see itm-model.js).
   Every number shown comes from ITM.forward(); nothing here invents values. Views: Visual, Math, Code.
   State (prompt, step, token, layer, head) lives in the URL hash so an example can be shared. */
(function () {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MINUS = '−';

  /* ---- the sequence of operations, in the order the reference model executes them ---- */
  const STEPS = [{ k: 'tokens' }, { k: 'embed' }, { k: 'pos' }];
  for (let l = 0; l < 2; l++) ['ln1', 'qkv', 'scores', 'mask', 'softmax', 'headout', 'oproj', 'ln2', 'mlp', 'resid2'].forEach(k => STEPS.push({ k, l }));
  STEPS.push({ k: 'lnf' }, { k: 'logits' }, { k: 'probs' });
  const HEADD = { qkv: 1, scores: 1, mask: 1, softmax: 1, headout: 1 };

  const LABEL = {
    tokens: 'Prompt to token IDs', embed: 'Embedding lookup', pos: 'Add positions', ln1: 'RMSNorm before attention', qkv: 'Project to Q, K, V', scores: 'Scaled dot-product scores',
    mask: 'Causal mask', softmax: 'Softmax over keys', headout: 'Weighted sum of values', oproj: 'Output projection and residual', ln2: 'RMSNorm before MLP',
    mlp: 'MLP with GELU', resid2: 'Second residual', lnf: 'Final RMSNorm', logits: 'Logits (tied unembedding)', probs: 'Next-token probabilities',
  };
  const PURPOSE = {
    tokens: 'Words become integer IDs through a fixed 25-entry vocabulary (23 words, a period and &lt;bos&gt;). &lt;bos&gt; is always prepended. Real models use subword tokenizers (BPE) with vocabularies of 30k to 200k entries.',
    embed: 'Each ID selects one row of the embedding matrix E. This is a table lookup, not a calculation.',
    pos: 'Attention has no built-in sense of order, so a sinusoidal position pattern (scaled by 0.5) is added to each embedding. The sum is the residual stream x⁰.',
    ln1: 'Pre-norm: each token vector is rescaled to unit root-mean-square before attention reads it. The residual stream itself is left untouched.',
    qkv: 'Three learned linear maps turn each normalized vector into a query (what I look for), a key (what I offer) and a value (what I send). Each head owns 8 of the 16 columns.',
    scores: 'Every query is dot-multiplied with every key, then divided by √8 so score size does not grow with head width. This table is still unmasked.',
    mask: 'A token may not read tokens after it. Future positions are set to −∞ so softmax gives them exactly zero weight.',
    softmax: 'Each row of scores becomes a probability distribution over the positions that token may read. Each row sums to 1.',
    headout: 'Each head returns, for every token, the weight-averaged value vectors of the tokens it attends to.',
    oproj: 'The two heads are concatenated and mixed by W_o, then added back onto the residual stream.',
    ln2: 'Same RMSNorm again, before the MLP.',
    mlp: 'A per-token two-layer network: expand 16 to 32 dimensions, apply GELU, project back to 16. No information moves between tokens here.',
    resid2: 'The MLP output is added to the residual stream. This vector is the layer’s output.',
    lnf: 'One last RMSNorm before reading out the vocabulary.',
    logits: 'Each normalized vector is dotted with every embedding row (weights are tied), giving one score per vocabulary entry.',
    probs: 'Softmax over the logits gives the next-token distribution. With the trained weights the top candidates tend to fit the toy grammar. Switch Weights to Random to run the identical computation with nothing learned.',
  };

  /* ---- pipeline diagram: which block each step belongs to ---- */
  const BLOCKS = [
    { n: 'Tokens', sub: 'text to IDs', c: 'var(--c1)', has: (S) => S.k === 'tokens' },
    { n: 'Embed + position', sub: 'IDs to vectors', c: 'var(--c1)', has: (S) => S.k === 'embed' || S.k === 'pos' },
  ];
  for (let l = 0; l < 2; l++) {
    BLOCKS.push({ n: 'Layer ' + l + ' attention', sub: 'tokens read each other', c: 'var(--c4)', has: S => S.l === l && ['ln1', 'qkv', 'scores', 'mask', 'softmax', 'headout', 'oproj'].includes(S.k) });
    BLOCKS.push({ n: 'Layer ' + l + ' MLP', sub: 'each token thinks alone', c: 'var(--c3)', has: S => S.l === l && ['ln2', 'mlp', 'resid2'].includes(S.k) });
  }
  BLOCKS.push({ n: 'Output', sub: 'vocabulary scores', c: 'var(--c2)', has: S => ['lnf', 'logits', 'probs'].includes(S.k) });

  /* ---- guided tour: each stop sets the explorer state and explains what to look at ---- */
  const TOUR = [
    { s: 0, t: 3, v: 'visual', x: 'Welcome. This is a complete, tiny language model running in your browser. Every table you see is a real number the model computed. First, the sentence becomes integers: each word has a fixed ID. Pick any token above to follow it through the whole model.' },
    { s: 2, t: 3, v: 'visual', x: 'Each ID selects a 16-number vector (its embedding), and a position pattern is added so the model knows word order. The selected row, “sat”, is the vector we will follow.' },
    { s: 4, t: 3, v: 'visual', x: 'Attention starts here. From each token’s vector the model makes a query (what am I looking for?), a key (what do I offer?) and a value (what do I send?). Try switching head 0 and head 1: they have different weights.' },
    { s: 6, t: 3, v: 'visual', x: 'The mask. A token may only read itself and earlier tokens, so every score to its right becomes −∞ (the hatched cells). This is what makes the model predict the next word instead of peeking at it.' },
    { s: 7, t: 3, v: 'visual', x: 'Softmax turns each row of scores into weights that sum to 1. Read the highlighted row: it says how much “sat” draws from each earlier token. Switch to Math to see the exact sums, or Code to see the line that does it.' },
    { s: 8, t: 3, v: 'math', x: 'The head output is a weighted average of the value vectors. This is the whole point of attention: information from other tokens flows into this token’s vector. You can recompute it by hand from the table.' },
    { s: 11, t: 3, v: 'visual', x: 'After attention comes the MLP, which works on each token separately. Together, attention (move information between tokens) and MLP (process it) make one layer. This model stacks two.' },
    { s: 25, t: 99, v: 'visual', x: 'Finally the last token’s vector is compared with every word in the vocabulary, giving next-token probabilities. The trained weights favor words that fit the toy grammar. Use the Weights switch to run the same steps with random weights and see that the arithmetic is identical but the prediction is not. That is the whole forward pass.' },
  ];

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

  /* ---- small HTML helpers ---- */
  const fmt = (x, p) => (x === -Infinity ? MINUS + '∞' : (x < 0 ? MINUS : '') + Math.abs(x).toFixed(p));
  function vecTable(rows, p, labels) {
    const n = rows[0].v.length;
    return '<div class="gscroll"><table class="grid vt"><thead><tr><th></th>' + Array.from({ length: n }, (_, i) => '<th scope="col">' + (labels ? esc(labels[i]) : i) + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map(r => '<tr><th scope="row">' + r.l + '</th>' + r.v.map(x => '<td>' + fmt(x, p) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  }
  function heat(rows, p, o) {
    o = o || {};
    let mx = 0; rows.forEach(r => r.forEach(v => { if (isFinite(v)) mx = Math.max(mx, Math.abs(v)); })); mx = mx || 1;
    const rl = o.rowLabels, cl = o.colLabels, n = rows[0].length;
    return '<div class="gscroll"><table class="grid hm"><caption class="sr-only">' + esc(o.name || '') + '</caption><thead><tr><th></th>' +
      Array.from({ length: n }, (_, j) => '<th scope="col">' + esc(cl ? cl[j] : j) + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map((r, i) => '<tr' + (i === o.sel ? ' class="sel" aria-current="true"' : '') + '><th scope="row">' + esc(rl ? rl[i] : i) + '</th>' + r.map((v, j) => {
        const masked = o.causal && j > i, a = isFinite(v) ? Math.min(1, Math.abs(v) / mx) : 0;
        const cls = masked ? ' class="m"' : '', bg = a ? ' style="--a:' + (a * 0.85).toFixed(3) + ';--s:' + (v < 0 ? 'var(--c2)' : 'var(--c1)') + '"' : '';
        return '<td' + cls + bg + '><i></i><span>' + (masked && !isFinite(v) ? MINUS + '∞' : fmt(v, p)) + '</span></td>';
      }).join('') + '</tr>').join('') + '</tbody></table></div>';
  }

  window.W = window.W || {};
  window.W.explorer = el => {
    const { ITM } = window; if (!ITM) { el.insertAdjacentHTML('beforeend', '<p class="src">The model engine failed to load.</p>'); return; }
    const { CFG } = ITM, V = CFG.vocab;
    const st = { prompt: CFG.prompts[0], step: 0, t: 99, l: 0, h: 0, view: 'visual', p: 3, w: 'trained' };
    try {
      const q = new URLSearchParams(location.hash.slice(1));
      if (q.get('p')) st.prompt = q.get('p');
      ['step', 't', 'l', 'h'].forEach(k => { if (q.get(k) !== null && !isNaN(+q.get(k))) st[k] = +q.get(k); });
      if (['visual', 'math', 'code'].includes(q.get('v'))) st.view = q.get('v');
      if (q.get('w') === 'random') st.w = 'random';
    } catch (e) {}
    let tk, tr, tour = -1;
    const hadHash = !!location.hash.slice(1);
    const applyTour = i => { const T = TOUR[i]; tour = i; st.prompt = CFG.prompts[0]; st.step = T.s; st.t = T.t; st.view = T.v; if (STEPS[T.s].l !== undefined) st.l = STEPS[T.s].l; };
    const endTour = () => { tour = -1; try { localStorage.setItem('itm-xp-toured', '1'); } catch (e) {} };
    const ws = () => (st.w === 'random' ? ITM.seeded() : ITM.weights());
    const compute = () => { tk = ITM.tokenize(st.prompt); tr = ITM.forward(ws().W, tk.ids); st.t = Math.max(0, Math.min(tr.T - 1, st.t)); st.step = Math.max(0, Math.min(STEPS.length - 1, st.step)); st.l = Math.max(0, Math.min(1, st.l)); st.h = Math.max(0, Math.min(1, st.h)); };
    const words = () => tk.ids.map(i => V[i]);

    el.innerHTML = '<div class="xp" tabindex="-1">' +
      '<div class="xp-top"><label class="xp-prompt">Prompt <select data-x="preset" aria-label="Example prompt">' + CFG.prompts.map((p, i) => '<option value="' + i + '">' + esc(p) + '</option>').join('') + '<option value="custom">Custom…</option></select></label>' +
      '<input type="text" data-x="text" aria-label="Prompt text" spellcheck="false" maxlength="120"><span class="xp-note" data-x="note" role="status"></span></div>' +
      '<div class="xp-tour" data-x="tour" hidden role="region" aria-label="Guided tour"></div>' +
      '<div class="xp-pipe" data-x="pipe" role="group" aria-label="Model pipeline: jump to a stage"></div>' +
      '<div class="xp-strip" data-x="strip" role="group" aria-label="Tokens: pick the token to inspect"></div>' +
      '<div class="xp-nav"><button class="btn" data-a="prev">← Previous</button><button class="btn primary" data-a="next">Next →</button><span class="xp-pos" data-x="pos"></span>' +
      '<select data-x="step" aria-label="Jump to operation"></select><button class="btn quiet" data-a="tour">Guided tour</button><button class="btn quiet" data-a="reset">Reset</button></div>' +
      '<div class="xp-sel" role="group" aria-label="Which layer, head and weights to show"><span>Layer <span class="chips" data-x="layers" role="group" aria-label="Layer"></span></span><span>Head <span class="chips" data-x="heads" role="group" aria-label="Head"></span></span><span>Weights <span class="chips" data-x="wts" role="group" aria-label="Weights"></span></span>' +
      '<span class="xp-prec">Decimals <input type="range" data-x="prec" min="2" max="8" value="3" aria-label="Displayed decimals"><output data-x="precout">3</output></span></div>' +
      '<div class="xp-tabs" role="group" aria-label="View"><button data-view="visual" aria-pressed="true">Visual</button><button data-view="math" aria-pressed="false">Math</button><button data-view="code" aria-pressed="false">Code</button></div>' +
      '<div class="xp-main"><div class="xp-view" data-x="view" role="region" aria-label="Operation view"></div><aside class="xp-prov" data-x="prov" aria-label="Operation details"></aside></div>' +
      '<p class="src xp-foot" data-x="foot"></p><div class="sr-only" role="status" data-x="announce"></div></div>';
    const $ = k => el.querySelector('[data-x="' + k + '"]');

    function stepKey(s) { return STEPS[s].k; }
    function opId(s) { const S = STEPS[s]; return (S.l === undefined ? '' : 'L' + S.l + '.') + (HEADD[S.k] ? 'H' + st.h + '.' : '') + S.k; }

    /* ---- per-step description: tensors shown, shape, inputs, equation ---- */
    function describe(s, p) {
      const S = STEPS[s], k = S.k, L = tr.layers[S.l === undefined ? 0 : S.l], H = L.heads[st.h], T = tr.T, d = CFG.dModel, rl = words().map((w, i) => i + ' ' + w);
      const lay = n => (S.l === 0 ? 'x⁰' : 'resid2 of layer 0');
      switch (k) {
        case 'tokens': return { shape: '[' + T + ']', dtype: 'int', inputs: 'prompt text', eq: 'ids_t = vocab.indexOf(word_t)', mats: [{ n: 'token IDs', rows: tk.ids.map(i => [i]), cl: ['id'], rl }], vec: null };
        case 'embed': return { shape: '[' + T + ', 16]', inputs: 'ids, E [25, 16]', eq: 'e_t = E[ids_t]', mats: [{ n: 'e', rows: tr.tokEmb, rl }], vec: [{ l: 'e_t = E[' + tk.ids[st.t] + ']', v: tr.tokEmb[st.t] }] };
        case 'pos': return { shape: '[' + T + ', 16]', inputs: 'e, PE', eq: 'x⁰_t = e_t + 0.5 · PE(t)', mats: [{ n: 'x⁰', rows: tr.x0, rl }], vec: [{ l: 'e_t', v: tr.tokEmb[st.t] }, { l: '0.5·PE(' + st.t + ')', v: tr.pe[st.t].map(x => 0.5 * x) }, { l: 'x⁰_t', v: tr.x0[st.t] }] };
        case 'ln1': case 'ln2': case 'lnf': {
          const src = k === 'ln1' ? L.xIn : k === 'ln2' ? L.resid1 : tr.layers[1].resid2, out = k === 'ln1' ? L.ln1 : k === 'ln2' ? L.ln2 : tr.lnf, rms = ITM.math.rmsOf(src[st.t]);
          return { shape: '[' + T + ', 16]', inputs: (k === 'ln1' ? lay() : k === 'ln2' ? 'resid1' : 'resid2 of layer 1') + ', no learned scale', eq: 'y = x / √(mean(x²) + 10⁻⁵)', mats: [{ n: 'normalized', rows: out, rl }],
            vec: [{ l: 'x_t', v: src[st.t] }, { l: 'y_t', v: out[st.t] }], extra: 'RMS term for token ' + st.t + ': √(mean(x²) + 10⁻⁵) = ' + fmt(rms, p) };
        }
        case 'qkv': return { shape: '3 × [' + T + ', 8] per head', inputs: 'ln1, W_q, W_k, W_v columns ' + st.h * 8 + '–' + (st.h * 8 + 7), eq: 'q = y·W_q,  k = y·W_k,  v = y·W_v',
          mats: [{ n: 'q (head ' + st.h + ')', rows: H.q, rl }, { n: 'k', rows: H.k, rl }, { n: 'v', rows: H.v, rl }], vec: [{ l: 'q_' + st.t, v: H.q[st.t] }, { l: 'k_' + st.t, v: H.k[st.t] }, { l: 'v_' + st.t, v: H.v[st.t] }] };
        case 'scores': return { shape: '[' + T + ', ' + T + ']', inputs: 'q, k', eq: 's_ij = q_i · k_j / √8', mats: [{ n: 'scaled scores (unmasked)', rows: H.scaled, rl, cl: words().map((w, j) => j + ' ' + w), causal: true, sel: st.t }], scoreTable: true };
        case 'mask': return { shape: '[' + T + ', ' + T + ']', inputs: 'scaled scores', eq: 's_ij = ' + MINUS + '∞  when j > i', mats: [{ n: 'masked scores', rows: H.masked, rl, cl: words().map((w, j) => j + ' ' + w), causal: true, sel: st.t }] };
        case 'softmax': return { shape: '[' + T + ', ' + T + ']', inputs: 'masked scores', eq: 'w_ij = exp(s_ij − max_j s_ij) / Σ_j exp(s_ij − max_j s_ij)', mats: [{ n: 'attention weights', rows: H.weights, rl, cl: words().map((w, j) => j + ' ' + w), causal: true, sel: st.t }], softTable: true };
        case 'headout': return { shape: '[' + T + ', 8]', inputs: 'weights, v', eq: 'o_i = Σ_j w_ij · v_j', mats: [{ n: 'head output', rows: H.out, rl }], outTable: true };
        case 'oproj': return { shape: '[' + T + ', 16]', inputs: 'concat(heads), W_o, ' + lay(), eq: 'resid1 = x + concat(o⁰, o¹)·W_o', mats: [{ n: 'attention output', rows: L.attnOut, rl }, { n: 'resid1', rows: L.resid1, rl }], vec: [{ l: 'concat_t', v: L.concat[st.t] }, { l: 'attnOut_t', v: L.attnOut[st.t] }, { l: 'x_t', v: L.xIn[st.t] }, { l: 'resid1_t', v: L.resid1[st.t] }] };
        case 'mlp': return { shape: '[' + T + ', 32] → [' + T + ', 16]', inputs: 'ln2, W_1 [16, 32], W_2 [32, 16]', eq: 'm = GELU(y·W_1)·W_2', mats: [{ n: 'hidden (before GELU)', rows: L.hidden, rl }, { n: 'after GELU', rows: L.act, rl }, { n: 'MLP output', rows: L.mlpOut, rl }], vec: [{ l: 'hidden_t', v: L.hidden[st.t] }, { l: 'GELU(hidden_t)', v: L.act[st.t] }], vec2: [{ l: 'mlpOut_t', v: L.mlpOut[st.t] }] };
        case 'resid2': return { shape: '[' + T + ', 16]', inputs: 'resid1, MLP output', eq: 'resid2 = resid1 + m', mats: [{ n: 'layer output', rows: L.resid2, rl }], vec: [{ l: 'resid1_t', v: L.resid1[st.t] }, { l: 'm_t', v: L.mlpOut[st.t] }, { l: 'resid2_t', v: L.resid2[st.t] }] };
        case 'logits': return { shape: '[' + T + ', 25]', inputs: 'final norm, E', eq: 'logits_t = y_t · Eᵀ', mats: [{ n: 'logits', rows: tr.logits, rl, cl: V }], vec: null };
        case 'probs': return { shape: '[' + T + ', 25]', inputs: 'logits', eq: 'p_t = softmax(logits_t)', mats: [{ n: 'probabilities', rows: tr.probs, rl, cl: V }], probs: true };
      }
    }

    /* ---- Visual view ---- */
    function viewVisual(D, p) {
      let h = '';
      D.mats.forEach(m => { h += '<h3>' + esc(m.n) + ' <small>[' + m.rows.length + ', ' + m.rows[0].length + ']</small></h3>' + heat(m.rows, p, { rowLabels: m.rl, colLabels: m.cl, causal: m.causal, sel: m.sel === undefined ? st.t : m.sel, name: m.n }); });
      if (D.probs) {
        const pr = tr.probs[st.t], order = pr.map((x, i) => i).sort((a, b) => pr[b] - pr[a]).slice(0, 8);
        h += '<h3>Top next-token candidates after “' + esc(words()[st.t]) + '” (token ' + st.t + ')</h3>' + order.map((i, r) => '<div class="brow"><span>' + esc(V[i]) + '</span><span class="bar"><i style="width:' + (pr[i] * 100).toFixed(2) + '%;background:var(--c3)"></i></span><span>' + fmt(pr[i], p) + '</span></div>').join('') +
          '<p class="src">Greedy choice: <b>' + esc(V[order[0]]) + '</b>. ' + (st.w === 'random' ? 'These weights are random, so the ranking shows mechanics, not meaning.' : 'Trained on a toy grammar, so the ranking reflects that grammar only.') + '</p>';
      }
      if (HEADD[STEPS[st.step].k] && STEPS[st.step].k === 'softmax') {
        const w = tr.layers[STEPS[st.step].l].heads[st.h].weights[st.t];
        h += '<h3>Where token ' + st.t + ' (“' + esc(words()[st.t]) + '”) looks</h3>' + w.map((x, j) => '<div class="brow"><span>' + j + ' ' + esc(words()[j]) + '</span><span class="bar"><i style="width:' + (x * 100).toFixed(2) + '%;background:var(--c4)"></i></span><span>' + fmt(x, p) + '</span></div>').join('');
      }
      return h;
    }

    /* ---- Math view: the selected token's actual numbers substituted into the equation ---- */
    function viewMath(D, p) {
      const S = STEPS[st.step], k = S.k, t = st.t, wd = words();
      let h = '<p class="xp-eq">' + esc(D.eq) + '</p>';
      if (D.scoreTable || D.softTable || k === 'mask') {
        const H = tr.layers[S.l].heads[st.h];
        if (k === 'scores') {
          const j0 = t, terms = H.q[t].map((a, n) => fmt(a, p) + '·' + fmt(H.k[j0][n], p));
          h += '<p>Token ' + t + ' (“' + esc(wd[t]) + '”), layer ' + S.l + ', head ' + st.h + '. Worked example for key j = ' + j0 + ':</p><pre class="xp-pre">q·k = ' + terms.join(' + ') + '\n    = ' + fmt(H.dots[t][j0], p) + '\ns   = ' + fmt(H.dots[t][j0], p) + ' / √8 = ' + fmt(H.scaled[t][j0], p) + '</pre>';
          h += vecTable([{ l: 'q·k_j', v: H.dots[t].slice(0, t + 1) }, { l: 's_j', v: H.scaled[t].slice(0, t + 1) }], p, wd.slice(0, t + 1).map((w, j) => j + ' ' + w));
          if (t < tr.T - 1) h += '<p class="src">Keys j > ' + t + ' are computed in the table but masked in the next step.</p>';
        } else if (k === 'mask') {
          h += vecTable([{ l: 'before', v: H.scaled[t] }, { l: 'after', v: H.masked[t] }], p, wd.map((w, j) => j + ' ' + w)) + '<p class="src">Keys after token ' + t + ' become ' + MINUS + '∞, so exp(' + MINUS + '∞) = 0 in the next step.</p>';
        } else {
          const sc = H.masked[t], m = Math.max(...sc), e = sc.map(s => Math.exp(s - m)), tot = e.reduce((a, b) => a + b, 0);
          h += '<p>Token ' + t + ', layer ' + S.l + ', head ' + st.h + '. max score = ' + fmt(m, p) + '.</p>' + vecTable([{ l: 's_j', v: sc }, { l: 'exp(s−max)', v: e }, { l: 'w_j', v: H.weights[t] }], p, wd.map((w, j) => j + ' ' + w)) +
            '<p>Σ exp = ' + fmt(tot, p) + ', so w_j = exp(s_j − max) / ' + fmt(tot, p) + '. Σ w_j = ' + H.weights[t].reduce((a, b) => a + b, 0).toFixed(12) + '.</p>';
        }
        return h;
      }
      if (D.outTable) {
        const H = tr.layers[S.l].heads[st.h], w = H.weights[t];
        h += '<p>Token ' + t + ', layer ' + S.l + ', head ' + st.h + '. Each value vector is scaled by its weight, then summed:</p>' +
          vecTable(w.map((x, j) => ({ l: 'w=' + fmt(x, p) + ' · v_' + j + ' (' + esc(wd[j]) + ')', v: H.v[j].map(a => a * x) })).filter((r, j) => w[j] !== 0).concat([{ l: 'o_' + t + ' (sum)', v: H.out[t] }]), p);
        return h;
      }
      if (k === 'tokens') return h + '<pre class="xp-pre">' + wd.map((w, i) => i + ': ' + w + ' → id ' + tk.ids[i]).join('\n') + '</pre>';
      if (k === 'logits') {
        const lg = tr.logits[t];
        return h + '<p>Token ' + t + ': logit for each vocabulary entry = y_' + t + ' · E[entry].</p>' + vecTable([{ l: 'logit', v: lg }, { l: 'softmax', v: tr.probs[t] }], p, V);
      }
      if (k === 'probs') { const pr = tr.probs[t]; return h + vecTable([{ l: 'p', v: pr }], p, V) + '<p>Σ p = ' + pr.reduce((a, b) => a + b, 0).toFixed(12) + '</p>'; }
      h += '<p>Token ' + t + ' (“' + esc(wd[t]) + '”):</p>' + vecTable(D.vec, p);
      if (D.vec2) h += vecTable(D.vec2, p);
      if (D.extra) h += '<p>' + esc(D.extra) + '</p>';
      return h;
    }

    function viewCode() {
      const k = stepKey(st.step);
      return '<p class="src">Reference implementation, <a href="/js/itm-model.js">itm-model.js</a> (pure JavaScript, float64). The active operation is highlighted.</p><pre class="xp-code"><code>' +
        Object.keys(CODE).map(n => '<span class="' + (n === k ? 'on' : '') + '"' + (n === k ? ' aria-current="true"' : '') + '>' + esc(CODE[n]) + '</span>').join('\n') + '</code></pre>' +
        '<button class="btn" data-a="copy">Copy the active line</button> <a class="btn" href="/trace/golden.json" download>Download golden fixture</a>';
    }

    /* ---- render ---- */
    function render() {
      compute();
      const S = STEPS[st.step], D = describe(st.step, st.p);
      const sel = $('preset'); const pi = CFG.prompts.indexOf(st.prompt); sel.value = pi >= 0 ? String(pi) : 'custom';
      const txt = $('text'); if (document.activeElement !== txt) txt.value = st.prompt;
      $('note').textContent = (tk.unknown.length ? 'Not in the vocabulary: ' + tk.unknown.join(', ') + '. ' : '') + (tk.truncated ? 'Truncated to ' + CFG.maxCtx + ' tokens. ' : '');
      $('strip').innerHTML = words().map((w, i) => '<button class="tok' + (i === st.t ? ' on' : '') + '" data-t="' + i + '" aria-pressed="' + (i === st.t) + '"><small>' + i + '</small>' + esc(w) + '<small>id ' + tk.ids[i] + '</small></button>').join('');
      $('step').innerHTML = STEPS.map((s, i) => '<option value="' + i + '"' + (i === st.step ? ' selected' : '') + '>' + (i + 1) + '. ' + (s.l === undefined ? '' : 'Layer ' + s.l + ': ') + LABEL[s.k] + '</option>').join('');
      $('pos').textContent = 'Step ' + (st.step + 1) + ' of ' + STEPS.length;
      $('announce').textContent = 'Step ' + (st.step + 1) + ' of ' + STEPS.length + ': ' + (S.l === undefined ? '' : 'layer ' + S.l + ', ') + LABEL[S.k] + '. Token ' + st.t + ', ' + words()[st.t] + '.';
      $('layers').innerHTML = [0, 1].map(l => '<button class="chipbtn" data-l="' + l + '" aria-pressed="' + (l === st.l) + '">' + l + '</button>').join('');
      $('heads').innerHTML = [0, 1].map(h => '<button class="chipbtn" data-h="' + h + '" aria-pressed="' + (h === st.h) + '">' + h + '</button>').join('');
      $('wts').innerHTML = [['trained', 'Trained'], ['random', 'Random']].map(w => '<button class="chipbtn" data-w="' + w[0] + '" aria-pressed="' + (w[0] === st.w) + '">' + w[1] + '</button>').join('');
      el.querySelectorAll('[data-view]').forEach(b => { const on = b.dataset.view === st.view; b.setAttribute('aria-pressed', on); b.classList.toggle('on', on); });
      el.querySelector('[data-a="prev"]').disabled = st.step === 0; el.querySelector('[data-a="next"]').disabled = st.step === STEPS.length - 1;
      $('view').innerHTML = '<h2 class="xp-h">' + (S.l === undefined ? '' : 'Layer ' + S.l + ' · ') + LABEL[S.k] + '</h2><p class="xp-why">' + PURPOSE[S.k] + '</p>' + (st.view === 'visual' ? viewVisual(D, st.p) : st.view === 'math' ? viewMath(D, st.p) : viewCode());
      $('prov').innerHTML = '<h3>Operation</h3><dl><dt>ID</dt><dd><code>' + opId(st.step) + '</code></dd><dt>Selected</dt><dd>token ' + st.t + ' “' + esc(words()[st.t]) + '”' + (S.l === undefined ? '' : ', layer ' + S.l) + (HEADD[S.k] ? ', head ' + st.h : '') + '</dd>' +
        '<dt>Inputs</dt><dd>' + esc(D.inputs) + '</dd><dt>Output shape</dt><dd><code>' + esc(D.shape) + '</code> float64</dd><dt>Equation</dt><dd><code>' + esc(D.eq) + '</code></dd></dl>' +
        '<h3>Reference model</h3><dl><dt>Version</dt><dd><code>' + CFG.version + '</code></dd><dt>Weights</dt><dd>' + (ws().meta.trained ? 'trained: ' + ws().meta.steps + ' Adam steps on a toy grammar; held-out loss ' + ws().meta.heldOutLoss + ' (uniform guessing ' + ws().meta.uniformLoss + ')' : 'random initialization, never trained') + '; checksum <code>' + ws().sum + '</code></dd><dt>Precision</dt><dd>values shown to ' + st.p + ' decimals; computed in float64' + (ws().meta.trained ? '; attention weights and logits checked against NumPy to 1e-9' : '; these random weights are not part of the NumPy check') + '</dd></dl>' +
        '<button class="btn" data-a="copylink">Copy link to this state</button>';
      $('foot').innerHTML = 'The model has 2 layers, 2 heads, d<sub>model</sub> = 16 and a 25-entry vocabulary. It is a teaching model: real LLMs are far larger, use subword tokenizers, and train on vastly more data. See <a href="/teardown/compare/">how it compares with real models</a> and the <a href="/guide/transformer-block/">transformer chapter</a>.';
      const box = BLOCKS.findIndex(B => B.has(S));
      $('pipe').innerHTML = BLOCKS.map((B, i) => '<button class="blk' + (i === box ? ' on' : '') + '" data-blk="' + i + '" style="--bc:' + B.c + '"' + (i === box ? ' aria-current="step"' : '') + '><b>' + B.n + '</b><small>' + B.sub + '</small></button>' + (i < BLOCKS.length - 1 ? '<span class="arr" aria-hidden="true">→</span>' : '')).join('');
      const tb = $('tour');
      if (tour >= 0) {
        tb.hidden = false;
        tb.innerHTML = '<div class="xp-tourhead">Guided tour · ' + (tour + 1) + ' of ' + TOUR.length + '</div><p>' + TOUR[tour].x + '</p><div class="xp-tourbtns"><button class="btn" data-tour="prev"' + (tour === 0 ? ' disabled' : '') + '>← Back</button>' +
          (tour < TOUR.length - 1 ? '<button class="btn primary" data-tour="next">Next →</button>' : '<button class="btn primary" data-tour="exit">Finish and explore</button>') + '<button class="btn" data-tour="exit">Exit tour</button></div>';
      } else { tb.hidden = true; tb.innerHTML = ''; }
      try { const q = new URLSearchParams({ p: st.prompt, step: st.step, t: st.t, l: st.l, h: st.h, v: st.view, w: st.w }); history.replaceState(null, '', '#' + q.toString()); } catch (e) {}
    }

    el.addEventListener('click', e => {
      const b = e.target.closest('button,[data-t]'); if (!b || !el.contains(b)) return;
      if (b.dataset.tour) { if (b.dataset.tour === 'next') applyTour(tour + 1); else if (b.dataset.tour === 'prev') applyTour(tour - 1); else endTour(); render(); return; }
      if (b.dataset.a === 'tour') { applyTour(0); render(); el.querySelector('.xp-tour').scrollIntoView({ block: 'nearest' }); return; }
      if (b.dataset.blk !== undefined) { const B = BLOCKS[+b.dataset.blk], i = STEPS.findIndex((x, n) => B.has(x) && (x.l === undefined || x.l === st.l || B.n.indexOf('Layer ' + x.l) === 0)); if (i >= 0) { st.step = i; if (STEPS[i].l !== undefined) st.l = STEPS[i].l; } render(); return; }
      if (b.dataset.t !== undefined) st.t = +b.dataset.t;
      else if (b.dataset.l !== undefined) st.l = +b.dataset.l;
      else if (b.dataset.h !== undefined) st.h = +b.dataset.h;
      else if (b.dataset.w !== undefined) st.w = b.dataset.w;
      else if (b.dataset.view) st.view = b.dataset.view;
      else if (b.dataset.a === 'next') st.step++;
      else if (b.dataset.a === 'prev') st.step--;
      else if (b.dataset.a === 'reset') { st.step = 0; st.t = tr.T - 1; st.l = 0; st.h = 0; }
      else if (b.dataset.a === 'copylink') { try { navigator.clipboard.writeText(location.href); b.textContent = 'Copied'; } catch (x) {} return; }
      else if (b.dataset.a === 'copy') { try { navigator.clipboard.writeText(CODE[stepKey(st.step)]); b.textContent = 'Copied'; } catch (x) {} return; }
      else return;
      if (STEPS[st.step].l !== undefined && b.dataset.l === undefined) st.l = STEPS[st.step].l;
      if (b.dataset.l !== undefined) { const i = STEPS.findIndex((s, n) => s.l === st.l && s.k === STEPS[st.step].k); if (STEPS[st.step].l !== undefined && i >= 0) st.step = i; }
      render();
    });
    el.addEventListener('change', e => {
      const x = e.target.dataset.x;
      if (x === 'step') st.step = +e.target.value;
      else if (x === 'preset' && e.target.value !== 'custom') { st.prompt = CFG.prompts[+e.target.value]; st.t = ITM.tokenize(st.prompt).ids.length - 1; }
      else if (x === 'text') { st.prompt = e.target.value; st.t = 99; }
      else return;
      render();
    });
    el.addEventListener('input', e => { if (e.target.dataset.x === 'prec') { st.p = +e.target.value; $('precout').textContent = st.p; render(); } });
    el.addEventListener('keydown', e => {
      if (e.target.matches('input[type=text]')) return;
      if (e.key === 'ArrowRight' && st.step < STEPS.length - 1) { st.step++; render(); } else if (e.key === 'ArrowLeft' && st.step > 0) { st.step--; render(); }
    });
    if (!hadHash) { let seen = false; try { seen = !!localStorage.getItem('itm-xp-toured'); } catch (e) {} if (!seen) applyTour(0); }
    render();
  };

  /* Chapter widget: the real attention patterns of every head, for a chosen prompt. Same engine and weights as the Explorer. */
  window.W.attnreal = el => {
    const { ITM } = window; if (!ITM) { el.insertAdjacentHTML('beforeend', '<p class="src">The model engine failed to load.</p>'); return; }
    const V = ITM.CFG.vocab, P = ITM.CFG.prompts;
    el.innerHTML = '<div class="row"><label>Prompt <select data-k="p">' + P.map((q, i) => '<option value="' + i + '">' + esc(q) + '</option>').join('') + '</select></label>' +
      '<label><input type="checkbox" data-k="r"> random weights (nothing learned)</label></div><div class="ar-grid" data-out></div>' +
      '<p class="src">Real attention weights from the Model Explorer\u2019s 2-layer, 2-head model. Row = the token doing the looking, column = the token it reads; darker means more weight, hatched cells are blocked by the causal mask. Open any head in the Explorer to see the scores, the mask and the arithmetic behind it.</p>';
    const draw = () => {
      const text = P[+el.querySelector('[data-k="p"]').value], rand = el.querySelector('[data-k="r"]').checked;
      const tk = ITM.tokenize(text), W = (rand ? ITM.seeded() : ITM.weights()).W, tr = ITM.forward(W, tk.ids), w = tk.ids.map(i => V[i]);
      let h = '';
      tr.layers.forEach((L, l) => L.heads.forEach((H, hd) => {
        const link = '/explorer/#' + new URLSearchParams({ p: text, step: l * 10 + 7, t: tk.ids.length - 1, l, h: hd, v: 'visual', w: rand ? 'random' : 'trained' }).toString();
        const best = H.weights.map((r, i) => { const j = r.indexOf(Math.max(...r)); return w[i] + ' \u2192 ' + w[j] + ' (' + r[j].toFixed(2) + ')'; }).join('\n');
        h += '<figure class="ar"><figcaption>Layer ' + l + ', head ' + hd + '</figcaption><table class="grid"><thead><tr><th></th>' + w.map(t => '<th scope="col">' + esc(t) + '</th>').join('') + '</tr></thead><tbody>' +
          H.weights.map((r, i) => '<tr><th scope="row">' + esc(w[i]) + '</th>' + r.map((v, j) => j > i ? '<td class="m"></td>' : '<td title="' + esc(w[i] + ' reads ' + w[j] + ': ' + v.toFixed(3)) + '"><i style="opacity:' + Math.min(1, v).toFixed(3) + '"></i></td>').join('') + '</tr>').join('') +
          '</tbody></table><details><summary>Strongest read per token</summary><pre>' + esc(best) + '</pre></details><a href="' + link + '">Inspect in the Model Explorer</a></figure>';
      }));
      el.querySelector('[data-out]').innerHTML = h;
    };
    el.addEventListener('change', draw); draw();
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
    const { ITM } = window; if (!ITM) { el.insertAdjacentHTML('beforeend', '<p class="src">The model engine failed to load.</p>'); return; }
    const V = ITM.CFG.vocab, P = ITM.CFG.prompts;
    el.innerHTML = '<div class="row"><label>Prompt <select data-k="p">' + P.map((q, i) => '<option value="' + i + '">' + esc(q) + '</option>').join('') + '</select></label>' +
      '<label>Layer <select data-k="l"><option>0</option><option>1</option></select></label><label>Head <select data-k="h"><option>0</option><option>1</option></select></label>' +
      '<label><input type="checkbox" data-k="c" checked> causal mask</label></div>' +
      '<div class="ctl"><label>sliding window (0 = off)</label><input type="range" data-k="w" min="0" max="10" step="1" value="0" aria-label="Sliding window size"><output data-k="wo">0</output></div>' +
      '<div class="gscroll" data-out></div><p class="src" data-note></p>';
    const draw = () => {
      const g = k => el.querySelector('[data-k="' + k + '"]'), tk = ITM.tokenize(P[+g('p').value]), tr = ITM.forward(ITM.weights().W, tk.ids), w = tk.ids.map(i => V[i]);
      const H = tr.layers[+g('l').value].heads[+g('h').value], causal = g('c').checked, win = +g('w').value; g('wo').textContent = win;
      const txt = []; let h = '<table class="grid"><thead><tr><th></th>' + w.map(t => '<th scope="col">' + esc(t) + '</th>').join('') + '</tr></thead><tbody>', blocked = 0;
      H.scaled.forEach((row, i) => {
        const ok = row.map((_, j) => (!causal || j <= i) && (!win || Math.abs(i - j) < win)), p = ITM.math.softmax(row.map((s, j) => (ok[j] ? s : -Infinity)));
        h += '<tr><th scope="row">' + esc(w[i]) + '</th>' + p.map((v, j) => { if (!ok[j]) { blocked++; return '<td class="m" title="blocked"></td>'; } return '<td title="' + esc(w[i] + ' reads ' + w[j] + ': ' + v.toFixed(3)) + '"><i style="opacity:' + Math.min(1, v).toFixed(3) + '"></i></td>'; }).join('') + '</tr>';
        txt.push(w[i] + ': ' + p.map((v, j) => (ok[j] ? w[j] + ' ' + v.toFixed(2) : null)).filter(Boolean).join(', '));
      });
      el.querySelector('[data-out]').innerHTML = h + '</tbody></table><details><summary>Weights as numbers</summary><pre>' + esc(txt.join('\n')) + '</pre></details>';
      el.querySelector('[data-note]').textContent = blocked + ' of ' + (w.length * w.length) + ' cells are blocked. Hatched = not allowed; darker = more weight; every row of allowed cells sums to 1. These are the real scores of the Explorer\u2019s trained model, re-normalized under the mask you pick. The model was trained only with the causal mask, so the other settings show what the same scores would give, not a model trained that way.';
    };
    el.addEventListener('input', draw); el.addEventListener('change', draw); draw();
  };
})();
