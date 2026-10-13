/* Chapter widget: take real gradient steps on a copy of the Model Explorer's weights. Uses ITM.sgdStep (hand-written backprop, itm-train.js). */
(function () {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  window.W = window.W || {};
  window.W.trainer = el => {
    const { ITM } = window; if (!ITM || !ITM.sgdStep) { el.insertAdjacentHTML('beforeend', '<p class="src">The model engine failed to load.</p>'); return; }
    const V = ITM.CFG.vocab, P = ITM.CFG.prompts;
    el.innerHTML = '<div class="row"><label>Sentence <select data-k="p">' + P.map((q, i) => '<option value="' + i + '">' + esc(q) + '</option>').join('') + '</select></label>' +
      '<label>Start from <select data-k="s"><option value="seeded">random weights</option><option value="weights">trained weights</option></select></label></div>' +
      '<div class="ctl"><label>learning rate</label><input type="range" data-k="lr" min="-2" max="0.2" step="0.05" value="-1" aria-label="Learning rate (log scale)"><output data-k="lrout"></output></div>' +
      '<div class="row"><button class="btn primary" data-a="1">Take 1 step</button><button class="btn" data-a="10">Take 10 steps</button><button class="btn" data-a="reset">Reset</button></div>' +
      '<div data-out aria-live="polite"></div>' +
      '<p class="src">Each step runs a forward pass, measures the loss (mean negative log-probability of the true next word), backpropagates to get a gradient for every weight, then moves each weight a small step against its gradient: w → w − lr · gradient. This is plain gradient descent on a <b>copy</b> of the weights, using the same engine as the Explorer. It trains on one sentence, so it memorizes it. Real pretraining averages over millions of tokens per step and uses an Adam-style optimizer (usually AdamW). Try a learning rate near the top of the slider to see a step overshoot.</p>';
    let W, hist, last, p0;
    const get = k => el.querySelector('[data-k="' + k + '"]');
    const ids = () => ITM.tokenize(P[+get('p').value]).ids;
    const lr = () => Math.pow(10, +get('lr').value);
    function reset() {
      W = ITM.cloneW(ITM[get('s').value]().W); hist = []; last = null;
      const r = ITM.lossGrad(W, ids()); p0 = r.tr.probs.map((p, t) => (t < ids().length - 1 ? p[ids()[t + 1]] : null)); hist.push(r.loss); draw();
    }
    function draw() {
      const I = ids(), r = ITM.lossGrad(W, I), N = I.length - 1;
      get('lrout').textContent = lr().toFixed(3);
      const spark = (() => { const w = 260, h = 60, mx = Math.max(...hist, 0.01), n = Math.max(hist.length, 2); return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="Loss over steps"><polyline fill="none" stroke="var(--c3)" stroke-width="2" points="' + hist.map((v, i) => (i / (n - 1) * (w - 8) + 4).toFixed(1) + ',' + (h - 6 - v / mx * (h - 12)).toFixed(1)).join(' ') + '"/></svg>'; })();
      const rows = I.slice(0, N).map((id, t) => {
        const tgt = I[t + 1], pn = r.tr.probs[t][tgt];
        return '<tr><th scope="row">' + esc(V[id]) + '</th><td>' + esc(V[tgt]) + '</td><td>' + p0[t].toFixed(3) + '</td><td>' + pn.toFixed(3) + '</td><td class="bar"><i style="width:' + (pn * 100).toFixed(1) + '%"></i></td></tr>';
      }).join('');
      const mx = last ? Math.max(...last.map(x => x.change / (x.norm || 1)), 1e-12) : 1;
      const mt = last ? '<div class="gscroll"><table class="grid tr-t"><thead><tr><th>matrix</th><th>gradient size</th><th>update size</th><th>relative update</th></tr></thead><tbody>' + last.map(x => '<tr><th scope="row">' + esc(x.name) + '</th><td>' + x.grad.toExponential(2) + '</td><td>' + x.change.toExponential(2) + '</td><td class="bar"><i style="width:' + (x.change / (x.norm || 1) / mx * 100).toFixed(1) + '%"></i></td></tr>').join('') + '</tbody></table></div>' : '<p class="src">Take a step to see the gradient of every weight matrix.</p>';
      const lastP = r.tr.probs[I.length - 1], top = lastP.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).slice(0, 3).map(a => V[a[1]] + ' ' + a[0].toFixed(2)).join(', ');
      el.querySelector('[data-out]').innerHTML = '<div class="tr-head"><div><div class="kicker">step ' + (hist.length - 1) + '</div><div class="tr-loss">loss ' + r.loss.toFixed(4) + '</div><div class="kicker">uniform guessing = ' + Math.log(V.length).toFixed(3) + '</div></div>' + spark + '</div>' +
        '<h3>Probability the model gives each true next word</h3><div class="gscroll"><table class="grid tr-t"><thead><tr><th>reads</th><th>true next</th><th>at step 0</th><th>now</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="src">After the whole sentence the model’s top guesses are: ' + esc(top) + '</p><h3>The last step, matrix by matrix</h3>' + mt;
    }
    function step(n) {
      for (let i = 0; i < n; i++) {
        const nm = ITM.mats(W).map(([name, M]) => [name, Math.sqrt(M.reduce((s, r) => s + r.reduce((a, v) => a + v * v, 0), 0))]);
        const r = ITM.sgdStep(W, ids(), lr()); W = r.W; last = r.info.map((x, k) => ({ ...x, norm: nm[k][1] })); hist.push(ITM.lossGrad(W, ids()).loss);
      }
      draw();
    }
    el.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === 'reset') reset(); else step(+b.dataset.a); });
    el.addEventListener('change', e => { if (e.target.dataset.k === 'p' || e.target.dataset.k === 's') reset(); });
    el.addEventListener('input', e => { if (e.target.dataset.k === 'lr') get('lrout').textContent = lr().toFixed(3); });
    /* "Start over" in the learning frame restores the controls too, not just the weights */
    el._itm = { reset() { get('p').value = '0'; get('s').value = 'seeded'; get('lr').value = '-1'; reset(); } }; el.dataset.itm = '';
    reset();
  };
})();
