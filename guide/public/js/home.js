/* Homepage specimen: a measured baseline, with the investigation as the next step. */
(function () {
  window.W = window.W || {};
  window.W.homehero = el => {
    el.parentElement?.querySelector('[data-home-static]')?.remove();
    const fallback = () => { el.innerHTML = '<div class="homehero-fallback"><b>Investigate a model’s place prediction.</b><span>The live baseline could not load. You can reload or open the investigation.</span><a href="/cases/place-or-animal/">Open The place detector</a></div>'; };
    if (!window.ITM || !window.ITMCases || !window.ITM.weights().meta.trained) { fallback(); return; }
    try {
      const C = window.ITMCases, r = C.runPlace('the cat sat on the'), pct = v => v > 0 && v < .0001 ? '&lt;0.01%' : (100 * v).toFixed(2) + '%';
      const V = window.ITM.CFG.vocab;
      el.innerHTML = '<div class="hv-head"><b>A live next-token prediction</b></div><p class="hp-sentence" aria-label="Prompt: the cat sat on the">the cat sat on the <span aria-hidden="true">…</span></p><p class="hp-question">What comes next?</p><div class="hp-predictions">' + ['mat', 'bed', 'cat'].map(w => { const p = r.probs[V.indexOf(w)]; return '<div class="hp-prediction"><code>' + w + '</code><span><i style="width:' + (p * 100).toFixed(2) + '%"></i></span><b>' + pct(p) + '</b></div>'; }).join('') + '</div><p class="hp-baseline"><strong>' + pct(r.place) + '</strong> chance of a place.</p><p class="hp-mystery">Follow the calculation from input tokens to these probabilities.</p><a class="hv-go" href="/explorer/">Inspect this model step by step.</a><p class="hp-source">Computed now · trained weights · all heads on</p>';
      el.dispatchEvent(new CustomEvent('homehero:change', { bubbles: true, detail: { place: r.place } }));
    } catch (_) { fallback(); }
  };
})();
