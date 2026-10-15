/* Client behavior for the guide: citations, interactive widgets, inline definitions, focus view. */
(function () {
  const ready = f => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', f) : f());
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function cite(el) {
    const k = el.dataset.p, p = (window.PAPERS || {})[k];
    if (!p) { el.textContent = '[?' + k + ']'; return; }
    const href = p.x ? 'https://arxiv.org/abs/' + p.x : p.u;
    el.innerHTML = el.hasAttribute('data-s')
      ? '<a href="' + href + '" target="_blank" rel="noopener">' + p.a + ' (' + p.y + ')</a>'
      : p.a + ' (' + p.y + '). <a href="' + href + '" target="_blank" rel="noopener">' + esc(p.t) + '</a>' + (p.x ? ' <span class="src">arXiv:' + p.x + '</span>' : '');
  }

  const SKIP = 'code,pre,a,cite,h1,h2,h3,h4,summary,.katex,.katex-display,.widget,.term,button,.starlight-aside,table,.sl-markdown-content > p:first-child';
  function wrapTerms(root) {
    const GL = window.GL || {};
    Object.keys(GL).forEach(k => {
      const re = new RegExp('\\b(' + GL[k].p.join('|') + ')\\b');
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = tw.nextNode())) {
        if (n.parentElement.closest(SKIP)) continue;
        const m = re.exec(n.nodeValue); if (!m) continue;
        const after = n.splitText(m.index); after.splitText(m[0].length);
        const sp = document.createElement('button');
        sp.type='button';sp.setAttribute('aria-expanded','false');sp.setAttribute('aria-label','Define '+after.nodeValue);
        sp.className = 'term'; sp.dataset.t = k; sp.textContent = after.nodeValue; after.replaceWith(sp);
        break;
      }
    });
  }

  let pop, activeTerm;
  function hidePop(){if(pop)pop.hidden=true;if(activeTerm){activeTerm.setAttribute('aria-expanded','false');activeTerm.removeAttribute('aria-describedby');}activeTerm=null;}
  function showPop(el) {
    const g = (window.GL || {})[el.dataset.t]; if (!g) return;
    if (!pop) { pop = document.createElement('div'); pop.id = 'pop'; pop.setAttribute('role','tooltip'); document.body.appendChild(pop); }
    hidePop();activeTerm=el;el.setAttribute('aria-expanded','true');el.setAttribute('aria-describedby','pop');
    pop.hidden = false; pop.innerHTML = '<b>' + esc(el.dataset.t) + '</b>' + esc(g.d);
    const r = el.getBoundingClientRect(), w = pop.offsetWidth;
    pop.style.left = Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - w - 8)) + 'px';
    pop.style.top = (window.scrollY + r.bottom + 6) + 'px'; pop.dataset.for = el.dataset.t;
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('.term');
    if (t) { if (pop && !pop.hidden && activeTerm === t) hidePop(); else showPop(t); return; }
    if (pop && !e.target.closest('#pop')) hidePop();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && pop) hidePop();
  });

  /* earlier versions kept self-reported chapter progress here; drop it */
  try { localStorage.removeItem('book-progress'); } catch (e) {}

  ready(() => {
    const root = document.querySelector('.sl-markdown-content');
    if (root) {
      root.querySelectorAll('cite[data-p]').forEach(cite);
      root.querySelectorAll('.widget[data-w]').forEach(w => {
        const f = window.W && window.W[w.dataset.w];
        if (!f) { w.insertAdjacentHTML('beforeend', '<p class="src">Missing widget: ' + esc(w.dataset.w) + '</p>'); return; }
        if (w.dataset.title) w.insertAdjacentHTML('afterbegin', '<div class="wt">' + esc(w.dataset.title) + '</div>');
        const box = document.createElement('div'); w.appendChild(box);
        try { f(box); w.querySelector('[data-widget-fallback]')?.remove(); window.ITMInteractions?.decorate(w, w.dataset.w); } catch (e) { box.innerHTML = '<p class="src">Widget error: ' + esc(e.message) + '</p>'; console.error(e); }
      });
      if (/^\/(guide\/[^/]+|labs\/[^/]+)\/?$/.test(location.pathname)) wrapTerms(root);
    }
  });
})();
