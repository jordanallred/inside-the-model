/* Home page hero: "trace a token". Real attention weights and next-token probabilities from the trained Explorer model (itm-model.js). */
(function () {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  window.W = window.W || {};
  window.W.homehero = el => {
    const { ITM } = window;
    if (!ITM) {
      el.innerHTML = '<div class="homehero-fallback"><b>The live trace could not load.</b><span>You can still inspect every operation in the Model Explorer.</span><a href="/explorer/">Open the Model Explorer →</a></div>';
      return;
    }
    const V = ITM.CFG.vocab, text = 'the cat sat on the mat', tk = ITM.tokenize(text), w = tk.ids.map(i => V[i]), n = w.length;
    const tr = ITM.forward(ITM.weights().W, tk.ids);
    const st = { t: 5, k: 0 };                       // k indexes the four heads: layer = k >> 1, head = k & 1
    const W = 700, H = 130, cx = i => ((i + 0.5) / n) * W;
    el.innerHTML = '<div class="hv-head"><b>Token trace</b><span class="hv-coords" data-x="coords"></span></div>' +
      '<svg class="hv-arcs" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" data-x="arcs"></svg>' +
      '<div class="hv-row" style="grid-template-columns:repeat(' + n + ',1fr)" role="group" aria-label="Tokens of the sentence “' + esc(text) + '”" data-x="row"></div>' +
      '<div class="hv-subhead"><span data-x="attention-label"></span><div class="hv-heads" role="group" aria-label="Attention head"></div></div>' +
      '<div class="hv-attention" data-x="attention"></div>' +
      '<div class="hv-out" aria-live="polite" data-x="out"></div>' +
      '<div class="hv-logits" data-x="logits"></div>' +
      '<a class="hv-go" data-x="go">Inspect every step in the Explorer</a>';
    const q = k => el.querySelector('[data-x="' + k + '"]');
    function draw() {
      const L = st.k >> 1, h = st.k & 1, t = st.t, wt = tr.layers[L].heads[h].weights[t], pr = tr.probs[t];
      q('coords').innerHTML = '<span>model: 2-layer</span><span>layer: ' + L + '</span><span>head: ' + h + '</span><span>position: ' + (t + 1) + '/' + n + '</span>';
      let svg = '';
      for (let j = 0; j <= t; j++) {
        const x1 = cx(j), x2 = cx(t), a = Math.min(1, wt[j]), sw = (1 + 9 * a).toFixed(1);
        if (j === t) { svg += '<circle cx="' + x2 + '" cy="' + (H - 14) + '" r="' + (4 + 12 * a).toFixed(1) + '" fill="none" stroke="var(--itm-violet)" stroke-width="' + sw + '" opacity="' + (0.3 + 0.7 * a).toFixed(2) + '"/>'; continue; }
        const mid = (x1 + x2) / 2, up = 28 + (x2 - x1) * 0.18;
        svg += '<path d="M' + x1 + ' ' + (H - 2) + ' Q' + mid + ' ' + (H - 2 - up * 2) + ' ' + x2 + ' ' + (H - 2) + '" fill="none" stroke="var(--itm-violet)" stroke-width="' + sw + '" stroke-linecap="round" opacity="' + (0.18 + 0.82 * a).toFixed(2) + '"/>';
      }
      q('arcs').innerHTML = svg;
      q('row').innerHTML = w.map((tok, i) => '<button class="hv-tok' + (i === t ? ' on' : '') + (i > t ? ' off' : '') + '" data-t="' + i + '" aria-pressed="' + (i === t) + '"><b>' + esc(tok) + '</b><small>' + (i <= t ? wt[i].toFixed(2) : '–') + '</small></button>').join('');
      q('attention-label').textContent = 'Attention weights to “' + w[t] + '”';
      el.querySelector('.hv-heads').innerHTML = [0, 1, 2, 3].map(k => '<button class="hv-chip" data-k="' + k + '" aria-pressed="' + (k === st.k) + '">L' + (k >> 1) + ' H' + (k & 1) + '</button>').join('');
      q('attention').innerHTML = w.map((_, i) => '<span>' + (i <= t ? wt[i].toFixed(2) : '–') + '</span>').join('');
      const top = pr.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).slice(0, 3);
      q('out').innerHTML = '<div class="hv-next">After “' + esc(tk.ids.slice(1, t + 1).map(i => V[i]).join(' ') || 'start') + '” the model rates next:</div>' +
        top.map(([p, i]) => '<div class="hv-bar"><span>' + esc(V[i]) + '</span><span class="hv-track"><i style="width:' + (p * 100).toFixed(1) + '%"></i></span><em>' + (p * 100).toFixed(0) + '%</em></div>').join('');
      q('logits').textContent = 'logits (top 3)   ' + top.map(([, i]) => V[i] + '  ' + tr.logits[t][i].toFixed(2)).join('   |   ');
      q('go').href = '/explorer/#' + new URLSearchParams({ p: text, step: L * 10 + 7, t, l: L, h, v: 'visual' }).toString();
      el.dispatchEvent(new CustomEvent('homehero:change', { detail: { token: w[t], layer: L, head: h } }));
    }
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const focusTarget = b.dataset.t !== undefined ? ['t', b.dataset.t] : b.dataset.k !== undefined ? ['k', b.dataset.k] : null;
      if (!focusTarget) return;
      if (focusTarget[0] === 't') st.t = +focusTarget[1]; else st.k = +focusTarget[1];
      draw();
      el.querySelector(`[data-${focusTarget[0]}="${focusTarget[1]}"]`)?.focus();
    });
    draw();
  };
})();
