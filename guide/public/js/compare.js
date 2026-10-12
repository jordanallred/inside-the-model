/* Architecture comparison: the Explorer's toy model against the real models in the teardowns.
   Real-model figures come from the site's teardown pages (gpt-oss-120b, DeepSeek-V3) and the dense-model presets in the parameter-count widget (Llama 3 8B). */
(function () {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = n => (n >= 1e9 ? (n / 1e9).toFixed(n >= 1e12 ? 0 : 1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n));
  window.W = window.W || {};
  window.W.compare = el => {
    const { ITM } = window; if (!ITM) { el.insertAdjacentHTML('beforeend', '<p class="src">The model engine failed to load.</p>'); return; }
    const C = ITM.CFG, V = C.vocab.length, toyParams = V * C.dModel + C.nLayers * (4 * C.dModel * C.dModel + 2 * C.dModel * C.dMlp);
    const M = [
      { id: 'toy', n: 'Toy model (Explorer)', c: 'var(--c3)', layers: C.nLayers, d: C.dModel, params: toyParams, active: toyParams, vocab: V, link: '/explorer/',
        rows: {
          tokens: V + ' whole words plus <bos>', pos: 'Fixed sinusoidal pattern added once to the embeddings', norm: 'RMSNorm before attention and MLP, no learned scale',
          attn: C.nHeads + ' heads of size ' + C.dHead + ', full multi-head, causal mask', mlp: 'Dense GELU MLP, ' + C.dModel + ' → ' + C.dMlp + ' → ' + C.dModel, out: 'Tied with the embedding', size: fmt(toyParams) + ' parameters, all used for every token' } },
      { id: 'llama', n: 'Llama 3 8B', c: 'var(--c1)', layers: 32, d: 4096, params: 8e9, active: 8e9, vocab: 128256, link: '/guide/transformer-block/',
        rows: {
          tokens: '128,256-token vocabulary', pos: 'Rotary position embeddings (RoPE), applied to queries and keys inside attention', norm: 'RMSNorm before attention and MLP, with learned scales',
          attn: '32 query heads of size 128, 8 key/value heads (grouped-query)', mlp: 'Gated MLP (SwiGLU), hidden width 14,336', out: 'Untied output matrix', size: '8B parameters, all used for every token' } },
      { id: 'oss', n: 'gpt-oss-120b', c: 'var(--c4)', layers: 36, d: 2880, params: 116.8e9, active: 5.1e9, vocab: 201088, link: '/teardown/gpt-oss-120b/',
        rows: {
          tokens: '201,088 tokens (o200k_harmony)', pos: 'RoPE, base 150,000, YaRN factor 32 (4,096 to 131,072 tokens)', norm: 'RMSNorm before each attention and expert block',
          attn: '64 query heads of size 64, 8 key/value heads, alternating 128-token sliding window and full attention', mlp: '128 experts per layer, top-4 routing, expert width 2,880', out: 'Untied output matrix', size: '116.8B total, 5.1B active per token' } },
      { id: 'dsv3', n: 'DeepSeek-V3', c: 'var(--c2)', layers: 61, d: 7168, params: 671e9, active: 37e9, vocab: 129280, link: '/teardown/deepseek-v3/',
        rows: {
          tokens: '129,280 tokens (byte-level BPE)', pos: 'RoPE with YaRN factor 40, on a separate 64-wide rotary part of each key', norm: 'RMSNorm',
          attn: 'Multi-head latent attention: 128 heads, keys and values compressed to a 512-wide latent', mlp: '1 shared plus 256 routed experts, 8 routed per token, expert width 2,048 (first 3 layers dense)', out: 'Untied output matrix, plus a multi-token prediction objective', size: '671B total, 37B active per token' } },
    ];
    const OPS = [
      ['tokens', 'Tokens and vocabulary', 'step=0&t=3'], ['pos', 'Position information', 'step=2&t=3'], ['norm', 'Normalization', 'step=3&t=3'],
      ['attn', 'Attention', 'step=7&t=3'], ['mlp', 'Feed-forward block', 'step=11&t=3'], ['out', 'Output matrix', 'step=24&t=8'], ['size', 'Size and compute', 'step=25&t=8'],
    ];
    const METRICS = [['layers', 'Layers'], ['d', 'Model width'], ['vocab', 'Vocabulary size'], ['params', 'Total parameters'], ['active', 'Parameters used per token']];
    const st = { on: { toy: true, llama: true, oss: true, dsv3: true }, m: 'params' };
    el.innerHTML = '<div class="cmp-pick" role="group" aria-label="Models to compare">' + M.map(m => '<button class="chipbtn" data-id="' + m.id + '" aria-pressed="true" style="--bc:' + m.c + '">' + esc(m.n) + '</button>').join('') + '</div>' +
      '<div class="cmp-scale"><label>Scale <select data-k="m" aria-label="Metric for the bars">' + METRICS.map(x => '<option value="' + x[0] + '">' + x[1] + '</option>').join('') + '</select></label><span class="src">Bars use a logarithmic scale: each step to the right is 10× larger.</span></div>' +
      '<div class="cmp-bars" data-x="bars"></div><div class="gscroll"><table class="cmp-t" data-x="tbl"></table></div>' +
      '<p class="src">The toy model’s numbers come directly from the Explorer’s engine. The other models’ figures come from this site’s teardown pages and the dense-model presets of the parameter-count widget, which cite the technical reports and model cards. Open any row in the Explorer to see the toy model’s version of that operation.</p>';
    function draw() {
      const on = M.filter(m => st.on[m.id]), key = st.m;
      const mx = Math.log10(Math.max(...M.map(m => m[key]))), mn = Math.log10(Math.min(...M.map(m => m[key])));
      el.querySelector('[data-x=bars]').innerHTML = on.map(m => {
        const frac = mx === mn ? 1 : 0.04 + 0.96 * (Math.log10(m[key]) - mn) / (mx - mn);
        return '<div class="cmp-bar"><span>' + esc(m.n) + '</span><span class="cmp-track"><i style="width:' + (frac * 100).toFixed(1) + '%;background:' + m.c + '"></i></span><b>' + (key === 'layers' || key === 'd' || key === 'vocab' ? m[key].toLocaleString('en-US') : fmt(m[key])) + '</b></div>';
      }).join('') + (on.some(m => m.id === 'toy') && on.length > 1 ? '<p class="src">The largest model shown has ' + (Math.max(...on.map(m => m[key])) / M[0][key]).toLocaleString('en-US', { maximumFractionDigits: 0 }) + '× the toy model’s value for this metric.</p>' : '');
      el.querySelector('[data-x=tbl]').innerHTML = '<thead><tr><th scope="col">Operation</th>' + on.map(m => '<th scope="col" style="--bc:' + m.c + '"><a href="' + m.link + '">' + esc(m.n) + '</a></th>').join('') + '</tr></thead><tbody>' +
        OPS.map(o => '<tr><th scope="row">' + esc(o[1]) + (on.some(m => m.id === 'toy') ? '<br><a class="cmp-go" href="/explorer/#' + o[2] + '&l=0&h=0&v=visual">see it in the Explorer</a>' : '') + '</th>' + on.map(m => '<td>' + esc(m.rows[o[0]]) + '</td>').join('') + '</tr>').join('') + '</tbody>';
    }
    el.addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (!b) return; const id = b.dataset.id; if (st.on[id] && Object.values(st.on).filter(Boolean).length === 1) return; st.on[id] = !st.on[id]; b.setAttribute('aria-pressed', st.on[id]); draw(); });
    el.addEventListener('change', e => { if (e.target.dataset.k === 'm') { st.m = e.target.value; draw(); } });
    el.querySelector('[data-k=m]').value = st.m; draw();
  };
})();
