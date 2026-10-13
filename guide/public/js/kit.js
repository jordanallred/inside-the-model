/* Widget kit: the shared building blocks of the chapter figures. State binding (controls <-> one state object), segmented
   choices, stat cards, verdict lines, pixel-accurate SVG charts with draggable and keyboard-operable handles, and a
   play/step transport. Widgets register an API on their box so the learning frame (interaction.js) can drive them. */
(function () {
  const K = (window.K = {});
  const esc = (K.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
  const decOf = step => (String(step).split('.')[1] || '').length;
  let uid = 0;
  K.id = p => (p || 'wk') + ++uid;
  K.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  K.reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- controls ---- */
  K.slider = (k, label, min, max, step, hint) => {
    const id = K.id('s');
    return '<div class="ctl"><label for="' + id + '">' + label + (hint ? ' <small>' + hint + '</small>' : '') + '</label><input id="' + id + '" type="range" data-k="' + k + '" min="' + min + '" max="' + max + '" step="' + (step || 1) + '"><output data-o="' + k + '" for="' + id + '"></output></div>';
  };
  K.seg = (k, label, opts, cls) => '<div class="wk-seg' + (cls ? ' ' + cls : '') + '" role="radiogroup" aria-label="' + esc(label) + '" data-seg="' + k + '"><span class="wk-seg-l" aria-hidden="true">' + label + '</span><span class="wk-seg-b">' +
    opts.map(o => '<button type="button" role="radio" data-v="' + esc(o[0]) + '" aria-checked="false"' + (o[2] ? ' title="' + esc(o[2]) + '"' : '') + '>' + o[1] + '</button>').join('') + '</span></div>';
  K.toggle = (k, label) => '<label class="wk-toggle"><input type="checkbox" data-k="' + k + '"><span aria-hidden="true"></span>' + label + '</label>';
  K.btn = (a, label, primary) => '<button type="button" class="btn' + (primary ? ' primary' : '') + '" data-a="' + a + '">' + label + '</button>';

  /* ---- read-outs ---- */
  K.stats = items => '<div class="wk-stats">' + items.filter(Boolean).map(i => '<div class="wk-stat' + (i.tone ? ' is-' + i.tone : '') + '"><span>' + i.l + '</span><b>' + i.v + '</b>' + (i.s ? '<small>' + i.s + '</small>' : '') + '</div>').join('') + '</div>';
  K.say = (tone, html) => '<p class="wk-say is-' + tone + '">' + html + '</p>';
  K.details = (summary, html) => '<details class="wk-more"><summary>' + summary + '</summary>' + html + '</details>';
  K.heat = (v, max, pos, neg) => { const a = Math.min(1, Math.abs(v) / (max || 1)); return 'background:color-mix(in srgb,' + (v >= 0 ? pos || 'var(--c1)' : neg || 'var(--c2)') + ' ' + (a * 70).toFixed(0) + '%,transparent)'; };
  K.sup = n => String(n).replace(/[-0-9]/g, c => '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'['-0123456789'.indexOf(c)]);
  K.sci = (v, d) => { if (!isFinite(v)) return String(v); if (v === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e); return m.toFixed(d == null ? 1 : d) + '×10' + K.sup(e); };

  /* ---- state binding ---- */
  K.bind = (el, S, render, o) => {
    o = o || {};
    const init = JSON.parse(JSON.stringify(S));
    const fmt = k => { const f = o.fmt && o.fmt[k], c = el.querySelector('input[type=range][data-k="' + k + '"]'); return f ? f(S[k]) : (+S[k]).toFixed(c ? decOf(c.step || 1) : 0); };
    const sync = () => {
      el.querySelectorAll('[data-k]').forEach(c => {
        const k = c.dataset.k; if (!(k in S)) return;
        if (c.type === 'checkbox') c.checked = !!S[k];
        else if (c !== document.activeElement || c.type === 'range' || c.tagName === 'SELECT') { if (String(c.value) !== String(S[k])) c.value = S[k]; }
        if (c.type === 'range') c.setAttribute('aria-valuetext', fmt(k));
      });
      el.querySelectorAll('[data-seg]').forEach(g => g.querySelectorAll('[data-v]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === String(S[g.dataset.seg])))));
      el.querySelectorAll('output[data-o]').forEach(x => { if (x.dataset.o in S) x.textContent = fmt(x.dataset.o); });
    };
    const coerce = (k, v) => (typeof init[k] === 'number' ? +v : typeof init[k] === 'boolean' ? v === true || v === 'true' : v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v);
    const update = (k, v) => { S[k] = coerce(k, v); if (o.change) o.change(k, S[k]); sync(); render(k); };
    el.addEventListener('input', e => { const c = e.target.closest('[data-k]'); if (c && c.dataset.k in S && c.type !== 'checkbox' && c.tagName !== 'SELECT') update(c.dataset.k, c.value); });
    el.addEventListener('change', e => { const c = e.target.closest('[data-k]'); if (c && c.dataset.k in S && (c.type === 'checkbox' || c.tagName === 'SELECT')) update(c.dataset.k, c.type === 'checkbox' ? c.checked : c.value); });
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-seg] [data-v]');
      if (b && el.contains(b)) { const k = b.closest('[data-seg]').dataset.seg; if (k in S) { update(k, b.dataset.v); return; } }
      const a = e.target.closest('[data-a]');
      if (a && o.act && el.contains(a)) {
        const had = document.activeElement === a, name = a.dataset.a;
        o.act(name, a); sync(); render();
        if (had && !a.isConnected) { const again = el.querySelector('[data-a="' + name + '"]'); if (again) again.focus({ preventScroll: true }); }
      }
    });
    el.addEventListener('keydown', e => {
      const b = e.target.closest && e.target.closest('[data-seg] [data-v]'); if (!b || !/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return;
      const all = [...b.parentElement.querySelectorAll('[data-v]')], i = all.indexOf(b), n = all[(i + (/Right|Down/.test(e.key) ? 1 : all.length - 1)) % all.length];
      e.preventDefault(); n.focus(); n.click();
    });
    let lastW = 0;
    if (window.ResizeObserver) new ResizeObserver(() => { const w = Math.round(el.getBoundingClientRect().width); if (w && Math.abs(w - lastW) > 2) { const first = !lastW; lastW = w; if (!first) render(); } }).observe(el);
    const api = {
      S,
      set(p) { Object.keys(p).forEach(k => { S[k] = coerce(k, p[k]); if (o.change) o.change(k, S[k]); }); sync(); render(); },
      act(n) { if (o.act) o.act(n); sync(); render(); },
      reset() { (o.players || []).forEach(p => p.stop()); Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(JSON.stringify(init))); if (o.reset) o.reset(); sync(); render(); },
      sync, update,
    };
    el._itm = api; el.dataset.itm = '';
    sync();
    return api;
  };

  /* ---- transport: a cancellable interval that stops itself when the step function returns false ---- */
  K.player = (fn, ms, onchange) => {
    let t = null;
    const p = {
      get on() { return !!t; },
      start() { if (t) return; t = setInterval(() => { if (fn() === false) p.stop(); }, ms); if (onchange) onchange(); },
      stop() { if (!t) return; clearInterval(t); t = null; if (onchange) onchange(); },
      toggle() { if (t) p.stop(); else p.start(); },
    };
    return p;
  };
  K.playBtn = (p, a, label) => '<button type="button" class="btn primary wk-play" data-a="' + (a || 'play') + '" aria-pressed="' + p.on + '">' + (p.on ? 'Pause' : (label || 'Play')) + '</button>';

  /* ---- charts: SVG drawn in real pixels so text stays legible at any width ---- */
  K.box = (svg, h) => {
    const w = Math.max(260, Math.round((svg.parentElement || svg).getBoundingClientRect().width) || 640);
    const hh = typeof h === 'function' ? Math.round(h(w)) : h;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + hh); svg.setAttribute('width', w); svg.setAttribute('height', hh);
    return { w, h: hh };
  };
  K.lin = (d0, d1, r0, r1) => { const f = v => r0 + (v - d0) / (d1 - d0) * (r1 - r0); f.inv = p => d0 + (p - r0) / (r1 - r0) * (d1 - d0); f.d = [d0, d1]; f.r = [r0, r1]; return f; };
  K.log = (d0, d1, r0, r1) => { const a = Math.log10(d0), b = Math.log10(d1), f = v => r0 + (Math.log10(Math.max(v, 1e-300)) - a) / (b - a) * (r1 - r0); f.inv = p => Math.pow(10, a + (p - r0) / (r1 - r0) * (b - a)); f.d = [d0, d1]; f.r = [r0, r1]; f.isLog = true; return f; };
  K.path = pts => pts.filter(p => isFinite(p[0]) && isFinite(p[1])).map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
  K.text = (x, y, s, cls, anchor) => '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '"' + (cls ? ' class="' + cls + '"' : '') + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + s + '</text>';
  K.ticks = (sc, n) => {
    if (sc.isLog) { const out = [], a = Math.ceil(Math.log10(sc.d[0]) - 1e-9), b = Math.floor(Math.log10(sc.d[1]) + 1e-9), st = Math.max(1, Math.ceil((b - a + 1) / (n || 6))); for (let e = a; e <= b; e += st) out.push(Math.pow(10, e)); return out; }
    const [d0, d1] = sc.d, span = Math.abs(d1 - d0), raw = span / (n || 5), mag = Math.pow(10, Math.floor(Math.log10(raw))), st = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || raw, out = [];
    for (let v = Math.ceil(Math.min(d0, d1) / st) * st; v <= Math.max(d0, d1) + st * 1e-9; v += st) out.push(Math.round(v / st) * st);
    return out;
  };
  /* Axes with tick labels. fx/fy format tick values; labels name the axes. */
  K.axes = (X, Y, o) => {
    o = o || {}; let s = '';
    const fx = o.fx || (v => String(v)), fy = o.fy || (v => String(v)), x0 = X.r[0], x1 = X.r[1], y0 = Y.r[0], y1 = Y.r[1];
    (o.noGridY ? [] : K.ticks(Y, o.ny || 4)).forEach(v => { const y = Y(v); s += '<line class="wk-grid" x1="' + x0 + '" x2="' + x1 + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' + K.text(x0 - 6, y + 4, fy(v), 'wk-tick', 'end'); });
    K.ticks(X, o.nx || 5).forEach(v => { const x = X(v); s += '<line class="wk-grid" y1="' + y0 + '" y2="' + (y0 + 4) + '" x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '"/>' + K.text(x, y0 + 16, fx(v), 'wk-tick', 'middle'); });
    s += '<line class="wk-axis" x1="' + x0 + '" x2="' + x1 + '" y1="' + y0 + '" y2="' + y0 + '"/>';
    if (o.xl) s += K.text((x0 + x1) / 2, y0 + 32, o.xl, 'wk-axl', 'middle');
    if (o.yl) s += K.text(x0, y1 - 8, o.yl, 'wk-axl', 'start');
    return s;
  };
  K.handle = (name, x, y, label, value, cls) => '<g class="wk-h' + (cls ? ' ' + cls : '') + '" data-h="' + name + '" tabindex="0" role="slider" aria-label="' + esc(label) + '" aria-valuetext="' + esc(value) + '" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"><circle class="wk-h-hit" r="16"/><circle class="wk-h-dot" r="7"/></g>';
  K.svgPt = (svg, e) => { const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal; return [(e.clientX - r.left) / r.width * vb.width + vb.x, (e.clientY - r.top) / r.height * vb.height + vb.y]; };
  /* Drag any [data-h] inside a persistent <svg>. on.move(name, [x, y]) on pointer moves, on.key(name, dir, big) on arrow keys,
     on.bg(point) returns a handle name to start dragging when the empty chart is pressed. */
  K.drag = (svg, on) => {
    let cur = null;
    svg.classList.add('wk-drag');
    svg.addEventListener('pointerdown', e => {
      const h = e.target.closest('[data-h]');
      cur = h ? h.dataset.h : on.bg ? on.bg(K.svgPt(svg, e)) : null;
      if (!cur) return;
      e.preventDefault(); try { svg.setPointerCapture(e.pointerId); } catch (x) {}
      svg.classList.add('is-dragging'); on.move(cur, K.svgPt(svg, e));
      const f = svg.querySelector('[data-h="' + cur + '"]'); if (f && h) f.focus({ preventScroll: true });
    });
    svg.addEventListener('pointermove', e => { if (cur) on.move(cur, K.svgPt(svg, e)); });
    const end = () => { if (cur && on.end) on.end(cur); cur = null; svg.classList.remove('is-dragging'); };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    svg.addEventListener('keydown', e => {
      const h = e.target.closest('[data-h]'); if (!h || !on.key) return;
      const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key]; if (!dir) return;
      e.preventDefault(); const name = h.dataset.h; on.key(name, dir, e.shiftKey, e.key);
      const f = svg.querySelector('[data-h="' + name + '"]'); if (f) f.focus({ preventScroll: true });
    });
  };
})();
