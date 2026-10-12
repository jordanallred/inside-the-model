/* Client behavior for the guide: citations, interactive widgets, inline definitions, progress, focus view. */
(function () {
  const ready = f => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', f) : f());
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CHS = window.CHAPTERS || [];

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
        const sp = document.createElement('span');
        sp.className = 'term'; sp.tabIndex = 0; sp.dataset.t = k; sp.textContent = after.nodeValue; after.replaceWith(sp);
        break;
      }
    });
  }

  let pop;
  function showPop(el) {
    const g = (window.GL || {})[el.dataset.t]; if (!g) return;
    if (!pop) { pop = document.createElement('div'); pop.id = 'pop'; document.body.appendChild(pop); }
    pop.hidden = false; pop.innerHTML = '<b>' + esc(el.dataset.t) + '</b>' + esc(g.d);
    const r = el.getBoundingClientRect(), w = pop.offsetWidth;
    pop.style.left = Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - w - 8)) + 'px';
    pop.style.top = (window.scrollY + r.bottom + 6) + 'px'; pop.dataset.for = el.dataset.t;
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('.term');
    if (t) { if (pop && !pop.hidden && pop.dataset.for === t.dataset.t) pop.hidden = true; else showPop(t); return; }
    if (pop && !e.target.closest('#pop')) pop.hidden = true;
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && pop) pop.hidden = true;
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('term') && e.target.tagName === 'SPAN') { e.preventDefault(); showPop(e.target); }
  });

  /* ---- progress (private to this browser) ---- */
  let S = { done: {}, skip: {} };
  try { Object.assign(S, JSON.parse(localStorage.getItem('book-progress') || '{}')); } catch (e) {}
  const chapterByPath = () => { const m = location.pathname.match(/\/guide\/([^/]+)\/?$/); return m ? CHS.find(c => c.slug === m[1]) : null; };
  function markSidebar() {
    document.querySelectorAll('#starlight__sidebar a[href]').forEach(a => {
      const m = a.getAttribute('href').match(/\/guide\/([^/]+)\/?$/); if (!m) return;
      const c = CHS.find(x => x.slug === m[1]); if (!c) return;
      a.classList.toggle('ch-done', !!S.done[c.id]); a.classList.toggle('ch-skipped', !!S.skip[c.id]);
    });
  }
  function save() {
    try { localStorage.setItem('book-progress', JSON.stringify(S)); } catch (e) {}
    markSidebar();
  }

  ready(() => {
    markSidebar();
    const root = document.querySelector('.sl-markdown-content');
    if (root) {
      root.querySelectorAll('cite[data-p]').forEach(cite);
      root.querySelectorAll('.widget[data-w]').forEach(w => {
        const f = window.W && window.W[w.dataset.w];
        if (!f) { w.insertAdjacentHTML('beforeend', '<p class="src">Missing widget: ' + esc(w.dataset.w) + '</p>'); return; }
        if (w.dataset.title) w.insertAdjacentHTML('afterbegin', '<div class="wt">' + esc(w.dataset.title) + '</div>');
        const box = document.createElement('div'); w.appendChild(box);
        try { f(box); window.ITMInteractions?.decorate(w, w.dataset.w); } catch (e) { box.innerHTML = '<p class="src">Widget error: ' + esc(e.message) + '</p>'; console.error(e); }
      });
      if (/^\/(guide\/[^/]+|labs\/[^/]+)\/?$/.test(location.pathname)) wrapTerms(root);
      const c = chapterByPath();
      if (c) {
        const p = document.createElement('div');
        p.innerHTML = '<hr><p><label><input type="checkbox" id="dn"' + (S.done[c.id] ? ' checked' : '') + '> I understand this chapter</label><br><label><input type="checkbox" id="sk"' + (S.skip[c.id] ? ' checked' : '') + '> I already knew this and skipped it</label></p>';
        root.appendChild(p);
        const dn = p.querySelector('#dn'), sk = p.querySelector('#sk');
        dn.onchange = () => { if (dn.checked) { S.done[c.id] = true; delete S.skip[c.id]; sk.checked = false; } else delete S.done[c.id]; save(); };
        sk.onchange = () => { if (sk.checked) { S.skip[c.id] = true; delete S.done[c.id]; dn.checked = false; } else delete S.skip[c.id]; save(); };
      }
    }
  });
})();
