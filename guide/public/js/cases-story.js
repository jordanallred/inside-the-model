/* Preserve the published case-file-model investigation as a further investigation. */
(function () {
  const W = window.W, K = window.K, esc = K.esc;
  const HEADS = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const headName = (l, h) => 'Layer ' + l + ', head ' + h;
  const pct = v => Math.round(v * 100) + '%';

  /* Weights with some heads switched off. Zeroing a head's rows of Wo removes its output from the residual stream and
     leaves everything else, including the other heads, untouched. */
  function knockout(W0, dh) {
    const cache = {};
    return off => {
      const key = HEADS.map((_, i) => (off[i] ? 1 : 0)).join('');
      if (cache[key]) return cache[key];
      const Wc = JSON.parse(JSON.stringify(W0));
      HEADS.forEach(([l, h], i) => { if (off[i]) for (let r = h * dh; r < (h + 1) * dh; r++) Wc.layers[l].Wo[r] = Wc.layers[l].Wo[r].map(() => 0); });
      return (cache[key] = Wc);
    };
  }

  /* Case 2: "tom and ann went to the park . ann gave a ball to" -> tom. Which heads decide which name, and how? */
  W.casestory = el => {
    const { ITM } = window; if (!ITM) { el.insertAdjacentHTML('beforeend', '<p class="src">The model engine failed to load.</p>'); return; }
    el.innerHTML = '<p class="src" role="status">Loading the case-file model…</p>';
    fetch('/trace/case-weights.json', { cache: 'no-cache' }) /* revalidate, so a retrained model is never served stale */.then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(M => story(el, ITM, M))
      .catch(() => { el.innerHTML = '<p class="src">The case-file model failed to load. Reload the page to try again.</p>'; });
  };

  function story(el, ITM, M) {
    const V = M.config.vocab, W0 = M.weights, weightsWith = knockout(W0, ITM.CFG.dHead), dh = ITM.CFG.dHead, d = W0.E[0].length;
    const NAMES = ['tom', 'ann', 'sam', 'max'], GIVER2 = 9; /* position of the giver in sentence 2 (after <bos>) */
    const text = (a, b, g) => a + ' and ' + b + ' went to the park . ' + g + ' gave a ball to';
    const ids = t => [0].concat(t.split(' ').map(w => V.indexOf(w)));
    const ALL = []; NAMES.forEach(a => NAMES.forEach(b => { if (a !== b) [a, b].forEach(g => ALL.push({ a, b, g, ans: g === a ? b : a })); }));
    const OFF0 = [false, false, false, false];
    const run = (st, off) => ITM.forward(weightsWith(off || OFF0), ids(text(st.a, st.b, st.g)));
    const p = (tr, w) => tr.probs.at(-1)[V.indexOf(w)];
    const sweepCache = {};
    const sweep = off => { /* how the model does over all 24 stories with these heads off */
      const key = off.map(Number).join(''); if (sweepCache[key]) return sweepCache[key];
      let right = 0, names = 0;
      ALL.forEach(st => { const tr = run(st, off); right += p(tr, st.ans) > p(tr, st.g); names += NAMES.reduce((s, n) => s + p(tr, n), 0) / ALL.length; });
      return (sweepCache[key] = { right, names });
    };
    const single = i => HEADS.map((_, j) => j === i);
    /* Heads the decision depends on: switched off alone, the model still expects a name but picks at chance. */
    const DECIDERS = HEADS.map((_, i) => i).filter(i => { const r = sweep(single(i)); return r.names >= 0.6 && r.right <= 16; });
    /* Of those, the one that looks at the giver from the last word makes the final step; the other is its helper. */
    const giverAttention = i => ALL.reduce((s, st) => s + run(st).layers[HEADS[i][0]].heads[HEADS[i][1]].weights.at(-1)[GIVER2], 0) / ALL.length;
    const ELIM = DECIDERS.slice().sort((x, y) => giverAttention(y) - giverAttention(x))[0], HELPER = DECIDERS.find(i => i !== ELIM);
    const [EL, EH] = HEADS[ELIM];
    /* The head's direct push on a name: its output at the last word, through Wo and the unembedding, scaled by the final norm. */
    const push = (tr, w) => {
      const out = tr.layers[EL].heads[EH].out.at(-1), Wo = W0.layers[EL].Wo, c = Array(d).fill(0);
      for (let j = 0; j < d; j++) for (let k = 0; k < dh; k++) c[j] += out[k] * Wo[EH * dh + k][j];
      const x = tr.layers[tr.layers.length - 1].resid2.at(-1), r = Math.sqrt(x.reduce((s, v) => s + v * v, 0) / d + 1e-5), e = W0.E[V.indexOf(w)];
      return c.reduce((s, v, j) => s + v * e[j], 0) / r;
    };

    const S = { off: OFF0.slice(), a: 'tom', b: 'ann', g: 'ann', explain: false, deep: false };
    const nameBars = (tr, st) => NAMES.map(n => {
      const v = p(tr, n), tag = n === st.g ? 'gave the ball' : n === st.a || n === st.b ? 'in the story' : 'not in the story';
      return '<div class="brow"><span>' + n + ' <small class="cs-kind">' + tag + '</small></span><div class="bar"><i style="width:' + (v * 100).toFixed(1) + '%;background:' + (n === st.g ? 'var(--c2)' : tag === 'in the story' ? 'var(--c3)' : 'var(--muted)') + '"></i></div><span>' + pct(v) + '</span></div>';
    }).join('');
    const switches = off => '<div class="cs-heads" role="group" aria-label="Attention heads: press to switch one off or back on">' +
      HEADS.map(([l, h], i) => '<button type="button" class="cs-head" data-head="' + i + '" aria-pressed="' + off[i] + '"><b><span>Layer ' + l + ',</span> <span>head ' + h + '</span></b><span class="cs-state">' + (off[i] ? 'off' : 'on') + '</span></button>').join('') + '</div>';

    el.innerHTML = '<div class="cs" data-x="case"></div>';
    const box = el.querySelector('[data-x="case"]');

    function stage1() {
      const n = S.off.filter(Boolean).length, r = sweep(S.off), ex = { a: 'tom', b: 'ann', g: 'ann', ans: 'tom' }, tr = run(ex, S.off);
      let verdict;
      if (!n) verdict = K.say('info', 'All heads on: the model prefers the right person in ' + r.right + ' of 24 stories. Switch heads off, one at a time.');
      else if (n > 1) verdict = K.say('info', 'Several heads are off, so you cannot tell which one matters. Test them one at a time.');
      else {
        const i = S.off.indexOf(true), nm = headName(...HEADS[i]);
        if (r.names < 0.6) verdict = K.say('warn', 'With ' + nm + ' off, the model no longer expects a name at all (' + pct(r.names) + '). That breaks the model in general, not the choice between two people. Keep looking for a head that leaves the model sure a name is coming.');
        else if (DECIDERS.includes(i)) verdict = K.say('ok', 'With ' + nm + ' off, the model still expects a name (' + pct(r.names) + '), but it prefers the right person in only ' + r.right + ' of 24 stories: a coin flip. That is consistent with this head being one of the ' + DECIDERS.length + ' that make the choice.');
        else verdict = K.say('info', 'With ' + nm + ' off, the model still prefers the right person in ' + r.right + ' of 24 stories. The choice does not depend on this head.');
      }
      return '<section class="cs-step" aria-labelledby="cs2-1"><h3 id="cs2-1">1. Find the heads that make the choice</h3>' +
        '<p>Every switch is tested on all 24 possible stories: each pair of names, with either one giving the ball. Two numbers matter. Does the model still expect a name next? And does it prefer the right person over the one who gave the ball? Look for heads that leave the first number high but turn the second into a coin flip. There are ' + DECIDERS.length + '.</p>' +
        switches(S.off) + '<div aria-live="polite">' + K.stats([{ l: 'expects a name next', v: pct(r.names), s: 'average over 24 stories', tone: r.names >= 0.6 ? 'ok' : 'warn' }, { l: 'prefers the right person', v: r.right + ' of 24', s: 'over the one who gave the ball', tone: r.right >= 20 ? 'ok' : 'warn' }]) +
        verdict + '</div><div class="cs-pred"><div class="kicker">One example: <code>' + esc(text(ex.a, ex.b, ex.g)) + '</code> …</div>' + nameBars(tr, ex) + '</div></section>';
    }

    function stage2() {
      const st = { a: S.a, b: S.b, g: S.g }, tr = run(st), words = ['<bos>'].concat(text(st.a, st.b, st.g).split(' '));
      const att = tr.layers[EL].heads[EH].weights.at(-1), top = att.indexOf(Math.max(...att));
      const sel = (k, label, opts) => '<label>' + label + ' <select data-pick="' + k + '">' + opts.map(o => '<option value="' + o[0] + '"' + (S[k] === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></label>';
      const giverOpts = [[st.a, st.a + ' (named first)'], [st.b, st.b + ' (named second)']].concat(NAMES.filter(n => n !== st.a && n !== st.b).map(n => [n, n + ' (not in the story)']));
      let explanation = '';
      if (S.explain) {
        /* every number here is recomputed from the model over all 24 stories, on request */
        let minGiver = 1, maxAnswer = 0, maxGiverP = 0;
        ALL.forEach(x => { const t = run(x), w = t.layers[EL].heads[EH].weights.at(-1); minGiver = Math.min(minGiver, w[GIVER2]); maxAnswer = Math.max(maxAnswer, w[x.ans === x.a ? 1 : 3]); maxGiverP = Math.max(maxGiverP, p(t, x.g)); });
        const offR = sweep(single(ELIM));
        let both = 0; ALL.forEach(x => { const t = run(x, single(ELIM)); both += (p(t, x.a) + p(t, x.b)) / ALL.length; });
        explanation = K.say('info', 'Testing all 24 stories: this head puts at least ' + minGiver.toFixed(2) + ' of its attention on the giver and at most ' + maxAnswer.toFixed(2) + ' on the right answer, so its strongest read is the giver’s position. In later layers, a position’s vector can already contain earlier context; attention alone does not establish which features a head passes on. It never answers with the giver directly: its highest predicted chance for the giver in any story is ' + (maxGiverP * 100).toFixed(1) + '%. Switched off, the model still puts ' + pct(both) + ' of its guesses on the two people in the story, but prefers the right one in only ' + offR.right + ' of 24 (section 1). So knowing the giver is what lets the model rule one of them out, for the stories tested here.');
      }
      return '<section class="cs-step" aria-labelledby="cs2-2"><h3 id="cs2-2">2. Find out how it chooses</h3>' +
        '<p>' + headName(EL, EH) + ' works at the very last word, “to”, so it acts just before the answer. It reads the person who gave the ball, but the answer is the other person. Build stories and watch what it reads, then open the explanation for how reading the giver can still decide the answer. Try the giver as either person, and try a stranger. All heads are on here.</p>' +
        '<div class="cs-build">' + sel('a', 'First name', NAMES.map(n => [n, n])) + sel('b', 'Second name', NAMES.filter(n => n !== st.a).map(n => [n, n])) + sel('g', 'Who gave the ball', giverOpts) + '</div>' +
        '<p class="cs-story"><code>' + esc(text(st.a, st.b, st.g)) + '</code> …</p>' +
        '<div class="cs-cols"><div><div class="kicker">What ' + headName(EL, EH).toLowerCase() + ' reads from “to”</div>' +
        words.map((w, j) => (att[j] >= 0.02 || j === top) ? '<div class="brow"><span>' + esc(w) + (j === GIVER2 ? ' <small class="cs-kind">gave the ball</small>' : '') + '</span><div class="bar"><i style="width:' + (att[j] * 100).toFixed(1) + '%;background:var(--c4)"></i></div><span>' + att[j].toFixed(2) + '</span></div>' : '').join('') +
        '<p class="wk-cap">Words it gives less than 0.02 are hidden.</p></div>' +
        '<div class="cs-pred" aria-live="polite"><div class="kicker">What the model predicts next</div>' + nameBars(tr, st) + '</div></div>' +
        '<button type="button" class="btn" data-x="explain" aria-expanded="' + S.explain + '">' + (S.explain ? 'Hide explanation' : 'Inspect explanation') + '</button><div aria-live="polite">' + explanation + '</div></section>';
    }

    function stage3() {
      const [HL, HH] = HEADS[HELPER];
      let deep = '';
      if (S.deep) {
        let went = 0, below = 0, lowest = 0;
        ALL.forEach(st => {
          const t = run(st); went += t.layers[HL].heads[HH].weights[GIVER2][4] / ALL.length;
          const P = Object.fromEntries(NAMES.map(n => [n, push(t, n)])); below += P[st.g] < P[st.ans]; lowest += NAMES.every(n => n === st.g || P[st.g] < P[n]);
        });
        deep = K.say('info', '<b>Where does the ruling-out happen?</b> A head’s <i>push</i> is how much its output alone, passed straight to the final scores, raises or lowers each name. ' + headName(EL, EH) + '’s push puts the giver below the right answer in ' + below + ' of 24 stories, and below all three other names in ' + lowest + '. So part of the ruling-out happens in the head itself; any further ruling-out would have to happen in the layer-1 MLP, the only part of the model after this head that can still change which name scores higher.<br><br><b>An open question.</b> ' + headName(HL, HH) + ' is needed too: switching it off also breaks the choice (test it in section 1). But it does not look at names; from the giver’s position it mostly reads the word “went” (weight ' + went.toFixed(2) + ' on average). What it contributes is not settled here.');
      }
      return '<section class="cs-step" aria-labelledby="cs2-3"><h3 id="cs2-3">3. How the heads fit together</h3>' +
        '<p>For the stories tested in sections 1 and 2, switching ' + headName(EL, EH) + ' off leaves the model still sure a name is coming but only at chance between the two people, and the head reads the giver rather than the answer. Together that is evidence for the model answering by <b>elimination</b>: the head reports who gave the ball, and the two people in the story minus the giver leaves the answer.</p>' +
        '<p>Researchers found a circuit for the same kind of sentence in GPT-2 small, a real language model with 124 million parameters, spread across many more heads. The paper is linked below the case.</p>' +
        '<button type="button" class="btn" data-x="deep" aria-expanded="' + S.deep + '">' + (S.deep ? 'Hide deeper analysis' : 'Inspect deeper analysis') + '</button><div aria-live="polite">' + deep + '</div>' +
        '<button type="button" class="btn" data-x="restart">Reset heads and story</button></section>';
    }

    function render(focusSel) {
      box.innerHTML = stage1() + stage2() + stage3();
      if (focusSel) box.querySelector(focusSel)?.focus({ preventScroll: true });
    }
    box.addEventListener('click', e => {
      const head = e.target.closest('[data-head]');
      if (head) { const i = +head.dataset.head; S.off[i] = !S.off[i]; render('[data-head="' + i + '"]'); return; }
      const x = e.target.closest('[data-x]')?.dataset.x;
      if (x === 'explain') { S.explain = !S.explain; render('[data-x="explain"]'); }
      else if (x === 'deep') { S.deep = !S.deep; render('[data-x="deep"]'); }
      else if (x === 'restart') {
        Object.assign(S, { off: OFF0.slice(), a: 'tom', b: 'ann', g: 'ann', explain: false, deep: false });
        render(); box.querySelector('#cs2-1').scrollIntoView({ block: 'nearest' });
      }
    });
    box.addEventListener('change', e => {
      const k = e.target.dataset.pick; if (!k) return;
      const was = { a: S.a, b: S.b, g: S.g };
      S[k] = e.target.value;
      if (S.b === S.a) S.b = NAMES.find(n => n !== S.a);
      /* keep the giver's role (first, second or stranger) when the names change */
      if (k !== 'g') S.g = was.g === was.a ? S.a : was.g === was.b ? S.b : (NAMES.includes(was.g) && was.g !== S.a && was.g !== S.b ? was.g : NAMES.find(n => n !== S.a && n !== S.b));
      render('[data-pick="' + k + '"]');
    });
    el._itm = { S, set(q) { Object.assign(S, q); render(); }, act() {}, reset() { Object.assign(S, { off: OFF0.slice(), a: 'tom', b: 'ann', g: 'ann', explain: false, deep: false }); render(); } };
    el.dataset.itm = '';
    render();
  }
})();
