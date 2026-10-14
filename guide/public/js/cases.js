/* Case files: investigations of trained toy models. The reader switches heads off, edits the prompt and reads attention;
   every number, and every check of an answer, is computed live by the Model Explorer's engine. Case 1 uses the Explorer's
   own weights; later cases use the case-file model (same architecture, larger world), fetched only on those pages. */
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

  /* Case 1: after "sat on the", why does the model expect a place and never an animal? */
  W.caseplace = el => {
    const { ITM } = window; if (!ITM) { el.insertAdjacentHTML('beforeend', '<p class="src">The model engine failed to load.</p>'); return; }
    const V = ITM.CFG.vocab, weightsWith = knockout(ITM.weights().W, ITM.CFG.dHead);
    const PLACES = ['mat', 'bed', 'home'], ANIMALS = ['cat', 'dog', 'bird'];
    const START = 'the cat sat on the', TARGET = 1; /* index into HEADS of the head that turns out to matter */
    const TESTS = ['the cat saw on the', 'the cat sat the', 'the dog ran to the', 'the cat on the', 'ran the', 'the cat slept on the'];
    const CHOICES = [
      ['prep', 'The word just before the last “the”: on, to or under'],
      ['verb', 'The verb: “sat” or “ran”'],
      ['first', 'The first word of the sentence'],
      ['the', 'The word “the” itself'],
    ];
    const KEY = 'itm-cases';
    let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
    const progress = Object.assign({ found: false, solved: false }, saved.place);
    const save = () => { saved.place = progress; try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} };
    const S = { off: [false, false, false, false], prompt: START, pick: '', answered: false };

    const run = (text, off) => {
      const tk = ITM.tokenize(text), tr = ITM.forward(weightsWith(off || S.off), tk.ids), pr = tr.probs.at(-1);
      const sum = ws => ws.reduce((s, w) => s + pr[V.indexOf(w)], 0);
      return { tk, tr, pr, words: tk.ids.map(i => V[i]), place: sum(PLACES), animal: sum(ANIMALS) };
    };
    const bars = r => r.pr.map((p, i) => [V[i], p]).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([w, p]) => { const kind = PLACES.includes(w) ? 'place' : ANIMALS.includes(w) ? 'animal' : '';
        return '<div class="brow"><span>' + esc(w) + (kind ? ' <small class="cs-kind">' + kind + '</small>' : '') + '</span><div class="bar"><i style="width:' + (p * 100).toFixed(1) + '%;background:' + (kind === 'place' ? 'var(--c3)' : kind === 'animal' ? 'var(--c2)' : 'var(--muted)') + '"></i></div><span>' + pct(p) + '</span></div>'; }).join('');
    const switches = () => '<div class="cs-heads" role="group" aria-label="Attention heads: press to switch one off or back on">' +
      HEADS.map(([l, h], i) => '<button type="button" class="cs-head" data-head="' + i + '" aria-pressed="' + S.off[i] + '"><b><span>Layer ' + l + ',</span> <span>head ' + h + '</span></b><span class="cs-state">' + (S.off[i] ? 'off' : 'on') + '</span></button>').join('') + '</div>';
    const link = (text, l, h) => '/explorer/#' + new URLSearchParams({ p: text, step: l * 10 + 7, t: ITM.tokenize(text).ids.length - 1, l, h, v: 'visual', w: 'trained' }).toString();

    el.innerHTML = '<div class="cs" data-x="case"></div>';
    const box = el.querySelector('[data-x="case"]');

    function stage1() {
      const r = run(START), n = S.off.filter(Boolean).length, gone = r.place < 0.1;
      let verdict;
      if (!n) verdict = K.say('info', 'All four heads are on. The model is ' + pct(r.place) + ' sure a place comes next. Switch heads off to find the one it cannot do without.');
      else if (gone && n === 1) verdict = K.say('ok', '<b>Found it.</b> With only ' + headName(...HEADS[S.off.indexOf(true)]) + ' off, the chance of a place falls to ' + pct(r.place) + ' and the model guesses an animal (' + pct(r.animal) + '). The other three heads can stay on; this one is necessary.');
      else if (gone) verdict = K.say('warn', 'That works, but ' + n + ' heads are off. Which of them is actually necessary? Switch them back on one at a time and watch the place bars.');
      else verdict = K.say('info', 'Still ' + pct(r.place) + ' sure of a place with ' + n + (n === 1 ? ' head' : ' heads') + ' off. This one is not what the model relies on.');
      if (gone && n === 1 && S.off[TARGET] && !progress.found) { progress.found = true; save(); }
      return '<section class="cs-step" aria-labelledby="cs1"><h3 id="cs1">1. Find the part responsible</h3>' +
        '<p>The prompt is <code>' + esc(START) + '</code>. The model is a 2-layer transformer with 2 attention heads per layer. Switch heads off until the model stops expecting a place (below 10%), using as few as you can.</p>' +
        switches() + '<div class="cs-pred" aria-live="polite"><div class="kicker">What the model predicts next</div>' + bars(r) +
        K.stats([{ l: 'chance of a place', v: pct(r.place), s: PLACES.join(', '), tone: r.place >= 0.5 ? 'ok' : 'warn' }, { l: 'chance of an animal', v: pct(r.animal), s: ANIMALS.join(', ') }]) + '</div>' + verdict +
        '</section>';
    }

    function stage2() {
      const r = run(S.prompt), on = run(S.prompt, [false, false, false, false]), w = r.words;
      const unk = r.tk.unknown.length ? K.say('warn', 'The model does not know ' + r.tk.unknown.map(u => '“' + esc(u) + '”').join(', ') + ', so ' + (r.tk.unknown.length > 1 ? 'they were' : 'it was') + ' left out. It only knows these words: ' + esc(V.slice(1).join(' ')) + '.') : '';
      const att = on.tr.layers[0].heads[1].weights.at(-1), top = att.indexOf(Math.max(...att));
      const read = '<div class="kicker">What layer 0, head 1 reads from the last word, “' + esc(w.at(-1)) + '”</div>' +
        w.map((t, j) => '<div class="brow"><span>' + esc(t) + '</span><div class="bar"><i style="width:' + (att[j] * 100).toFixed(1) + '%;background:var(--c4)"></i></div><span>' + att[j].toFixed(2) + '</span></div>').join('') +
        '<p class="wk-cap">It reads <b>' + esc(w[top]) + '</b> most (' + att[top].toFixed(2) + '). <a href="' + link(r.words.slice(1).join(' '), 0, 1) + '">Inspect this head in the Model Explorer</a></p>';
      let feedback = '';
      if (S.answered) {
        const saw = run('the cat saw on the', [false, false, false, false]), noOn = run('the cat sat the', [false, false, false, false]);
        const evidence = ' Two sentences settle it. In <code>the cat saw on the</code> the word “on” is still there, but the verb is “saw”, and the chance of a place is ' + pct(saw.place) + '. In <code>the cat sat the</code> there is no “on” at all, but the verb is “sat”, and the chance of a place is ' + pct(noOn.place) + '.';
        /* a wrong answer gets the one experiment that disproves it, not the solution */
        const test = '<button type="button" class="wk-tok" data-test="the cat saw on the">the cat saw on the</button>';
        const why = {
          prep: 'If the word before the last “the” were what mattered, this sentence would still get a place: it still has “on” there.',
          first: 'If the first word were what mattered, this sentence would still get a place: it starts with the same word.',
          the: 'If “the” itself were the signal, this sentence would still get a place: it ends with the same “the”.',
        }[S.pick];
        feedback = S.pick === 'verb'
          ? K.say('ok', '<b>Correct.</b> The head looks back past “on” to the verb.' + evidence)
          : K.say('warn', '<b>Test that idea first.</b> ' + why + ' Try ' + test + ' and see what the model predicts, then compare it with the original sentence.');
      }
      return '<section class="cs-step" aria-labelledby="cs2"><h3 id="cs2">2. Find out what it reads</h3>' +
        '<p>Layer 0, head 1 is necessary. But what in the sentence tells it that a place comes next? Edit the prompt and watch both what the head reads and what the model predicts. Switching heads off still works here.</p>' +
        '<label class="cs-prompt">Prompt <input type="text" data-x="prompt" value="' + esc(S.prompt) + '" autocomplete="off" spellcheck="false"></label>' +
        '<div class="cs-tests" role="group" aria-label="Sentences to try"><span>Try:</span>' + TESTS.map(t => '<button type="button" class="wk-tok" data-test="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>' + unk +
        switches() + '<div class="cs-cols"><div>' + read + '</div><div class="cs-pred" aria-live="polite"><div class="kicker">What the model predicts next</div>' + bars(r) +
        K.stats([{ l: 'chance of a place', v: pct(r.place), tone: r.place >= 0.5 ? 'ok' : 'warn' }, { l: 'chance of an animal', v: pct(r.animal) }]) + '</div></div>' +
        '<fieldset class="ch-q"><legend>What tells the model that a place comes next?</legend>' + CHOICES.map(([v, label]) => '<label class="ch-o"><input type="radio" name="cs-why" value="' + v + '"' + (S.pick === v ? ' checked' : '') + '> ' + label + '</label>').join('') +
        '<button type="button" class="btn" data-x="check">Check my answer</button><div aria-live="polite">' + feedback + '</div></fieldset></section>';
    }

    function stage3() {
      const slept = run('the cat slept on the', [false, false, false, false]), sleptAtt = slept.tr.layers[0].heads[1].weights.at(-1)[3];
      const share = 'I solved Case 1 on Inside the Model: I found the attention head that knows a mat is a place. ' + location.origin + location.pathname;
      return '<section class="cs-step cs-closed" aria-labelledby="cs3"><h3 id="cs3">Case closed</h3>' +
        '<p>Layer 0, head 1 looks back from the last “the” to the verb. When the verb is “sat” or “ran”, its output is what pushes the prediction toward a place. Switch it off and the model falls back on what usually follows “the”: an animal. The preposition you might have expected to matter, “on”, plays no part.</p>' +
        '<p>You used the three basic tools of <b>mechanistic interpretability</b>, the research field that works out how trained models compute their answers:</p><ul>' +
        '<li><b>Ablation</b>: switch a component off and measure what breaks.</li><li><b>Inspection</b>: read what an attention head looks at.</li><li><b>Counterfactuals</b>: change one thing in the input and see whether the behavior follows it.</li></ul>' +
        '<p><b>Something to try next.</b> In <code>the cat slept on the</code> the head still reads the verb (weight ' + sleptAtt.toFixed(2) + ' on “slept”), yet the chance of a place is only ' + pct(slept.place) + '. Why would reading the verb help after “sat” but not after “slept”? The answer is in the sentences the model learned from, listed under “How the model was trained” below.</p>' +
        '<div class="cs-share"><label>Share what you found <input type="text" readonly data-x="share" value="' + esc(share) + '"></label><button type="button" class="btn" data-x="copy">Copy</button><span data-x="copied" aria-live="polite"></span></div>' +
        '<button type="button" class="btn" data-x="restart">Start the case again</button></section>';
    }

    function render(focusSel) {
      box.innerHTML = stage1() + (progress.found ? stage2() : '') + (progress.solved ? stage3() : '');
      if (focusSel) { const f = box.querySelector(focusSel); if (f) { f.focus({ preventScroll: true }); if (f.setSelectionRange && f.type === 'text') f.setSelectionRange(f.value.length, f.value.length); } }
    }

    box.addEventListener('click', e => {
      const head = e.target.closest('[data-head]');
      if (head) {
        /* both stages share the switches; keep focus on the button that was pressed, in the stage it was pressed in */
        const i = +head.dataset.head, stage = [...box.querySelectorAll('.cs-step')].indexOf(head.closest('.cs-step')), wasFound = progress.found;
        S.off[i] = !S.off[i]; render();
        box.querySelectorAll('.cs-step')[stage]?.querySelector('[data-head="' + i + '"]')?.focus({ preventScroll: true });
        if (!wasFound && progress.found) box.querySelector('#cs2')?.scrollIntoView({ behavior: K.reduced() ? 'auto' : 'smooth', block: 'nearest' });
        return;
      }
      const test = e.target.closest('[data-test]');
      if (test) { S.prompt = test.dataset.test; render('[data-x="prompt"]'); return; }
      const x = e.target.closest('[data-x]')?.dataset.x;
      if (x === 'check') {
        const pick = box.querySelector('input[name="cs-why"]:checked');
        if (!pick) { e.target.closest('fieldset').querySelector('[aria-live]').innerHTML = K.say('info', 'Pick an answer first.'); return; }
        S.pick = pick.value; S.answered = true;
        if (S.pick === 'verb' && !progress.solved) { progress.solved = true; save(); }
        render('[data-x="check"]');
        if (progress.solved) box.querySelector('#cs3')?.scrollIntoView({ behavior: K.reduced() ? 'auto' : 'smooth', block: 'nearest' });
      } else if (x === 'copy') {
        const f = box.querySelector('[data-x="share"]'), done = ok => { box.querySelector('[data-x="copied"]').textContent = ok ? 'Copied.' : 'Select the text and copy it.'; };
        if (navigator.clipboard) navigator.clipboard.writeText(f.value).then(() => done(true), () => { f.select(); done(false); }); else { f.select(); done(false); }
      } else if (x === 'restart') {
        progress.found = false; progress.solved = false; save();
        Object.assign(S, { off: [false, false, false, false], prompt: START, pick: '', answered: false });
        render(); box.querySelector('#cs1').scrollIntoView({ block: 'nearest' });
      }
    });
    box.addEventListener('input', e => { if (e.target.dataset.x === 'prompt') { S.prompt = e.target.value; render('[data-x="prompt"]'); } });

    el._itm = { S, set(p) { Object.assign(S, p); render(); }, act() {}, reset() { Object.assign(S, { off: [false, false, false, false], prompt: START, pick: '', answered: false }); render(); } };
    el.dataset.itm = '';
    render();
  };

  /* Case 2: "tom and ann went to the park . ann gave a ball to" -> tom. Which heads decide which name, and how? */
  W.casestory = el => {
    const { ITM } = window; if (!ITM) { el.insertAdjacentHTML('beforeend', '<p class="src">The model engine failed to load.</p>'); return; }
    el.innerHTML = '<p class="src" role="status">Loading the case-file model…</p>';
    fetch('/trace/case-weights.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
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

    const KEY = 'itm-cases';
    let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
    const progress = Object.assign({ found: [], solved: false }, saved.story);
    const save = () => { saved.story = progress; try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} };
    const S = { off: OFF0.slice(), a: 'tom', b: 'ann', g: 'ann', pick: '', answered: false };
    const CHOICES = [
      ['copy', 'It copies the name it reads into the answer'],
      ['rule-out', 'It works by elimination: the head tells the model who gave the ball, and the model rules that person out'],
      ['first', 'It favors whoever was named first'],
      ['none', 'It only looks; the choice does not depend on it'],
    ];
    const HINTS = {
      copy: 'The head reads the giver. If it copied that name into the answer, the model would answer with the giver. Check what the model predicts for the giver.',
      first: 'Make the first-named person the giver, and see whether the model still picks them.',
      none: 'Go back to step 1: with this head off, the model falls to a coin flip. If the choice did not depend on it, switching it off would change nothing.',
    };
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
        else if (DECIDERS.includes(i)) {
          if (!progress.found.includes(i)) { progress.found.push(i); save(); }
          verdict = K.say('ok', '<b>Found one.</b> With ' + nm + ' off, the model still expects a name (' + pct(r.names) + '), but it prefers the right person in only ' + r.right + ' of 24 stories: a coin flip.');
        } else verdict = K.say('info', 'With ' + nm + ' off, the model still prefers the right person in ' + r.right + ' of 24 stories. The choice does not depend on this head.');
      }
      const found = progress.found.filter(i => DECIDERS.includes(i));
      const tally = '<p class="cs-found"><b>Found ' + found.length + ' of ' + DECIDERS.length + ':</b> ' + (found.length ? found.map(i => headName(...HEADS[i])).join(', ') : 'none yet') + '</p>';
      return '<section class="cs-step" aria-labelledby="cs2-1"><h3 id="cs2-1">1. Find the heads that make the choice</h3>' +
        '<p>Every switch is tested on all 24 possible stories: each pair of names, with either one giving the ball. Two numbers matter. Does the model still expect a name next? And does it prefer the right person over the one who gave the ball? Look for heads that leave the first number high but turn the second into a coin flip. There are ' + DECIDERS.length + '.</p>' +
        switches(S.off) + '<div aria-live="polite">' + K.stats([{ l: 'expects a name next', v: pct(r.names), s: 'average over 24 stories', tone: r.names >= 0.6 ? 'ok' : 'warn' }, { l: 'prefers the right person', v: r.right + ' of 24', s: 'over the one who gave the ball', tone: r.right >= 20 ? 'ok' : 'warn' }]) +
        verdict + tally + '</div><div class="cs-pred"><div class="kicker">One example: <code>' + esc(text(ex.a, ex.b, ex.g)) + '</code> …</div>' + nameBars(tr, ex) + '</div></section>';
    }

    function stage2() {
      const st = { a: S.a, b: S.b, g: S.g }, tr = run(st), words = ['<bos>'].concat(text(st.a, st.b, st.g).split(' '));
      const att = tr.layers[EL].heads[EH].weights.at(-1), top = att.indexOf(Math.max(...att));
      const sel = (k, label, opts) => '<label>' + label + ' <select data-pick="' + k + '">' + opts.map(o => '<option value="' + o[0] + '"' + (S[k] === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></label>';
      const giverOpts = [[st.a, st.a + ' (named first)'], [st.b, st.b + ' (named second)']].concat(NAMES.filter(n => n !== st.a && n !== st.b).map(n => [n, n + ' (not in the story)']));
      let feedback = '';
      if (S.answered) {
        if (S.pick === 'rule-out') {
          /* every number here is recomputed from the model over all 24 stories */
          let minGiver = 1, maxAnswer = 0, maxGiverP = 0;
          ALL.forEach(x => { const t = run(x), w = t.layers[EL].heads[EH].weights.at(-1); minGiver = Math.min(minGiver, w[GIVER2]); maxAnswer = Math.max(maxAnswer, w[x.ans === x.a ? 1 : 3]); maxGiverP = Math.max(maxGiverP, p(t, x.g)); });
          const offR = sweep(single(ELIM));
          let both = 0; ALL.forEach(x => { const t = run(x, single(ELIM)); both += (p(t, x.a) + p(t, x.b)) / ALL.length; });
          feedback = K.say('ok', '<b>Correct.</b> In every one of the 24 stories, this head puts at least ' + minGiver.toFixed(2) + ' of its attention on the giver and at most ' + maxAnswer.toFixed(2) + ' on the right answer, so all it can pass on is who gave the ball. Yet the choice depends on it: switched off, the model still puts ' + pct(both) + ' of its guesses on the two people in the story, but prefers the right one in only ' + offR.right + ' of 24. Knowing the giver is what lets it rule one of them out. And the model never answers with the giver: its highest chance in any story is ' + (maxGiverP * 100).toFixed(1) + '%.');
        } else feedback = K.say('warn', '<b>Test that idea first.</b> ' + HINTS[S.pick]);
      }
      return '<section class="cs-step" aria-labelledby="cs2-2"><h3 id="cs2-2">2. Find out how it chooses</h3>' +
        '<p>' + headName(EL, EH) + ' works at the very last word, “to”, so it acts just before the answer. Build stories and watch what it reads. Try the giver as either person, and try a stranger. All heads are on here.</p>' +
        '<div class="cs-build">' + sel('a', 'First name', NAMES.map(n => [n, n])) + sel('b', 'Second name', NAMES.filter(n => n !== st.a).map(n => [n, n])) + sel('g', 'Who gave the ball', giverOpts) + '</div>' +
        '<p class="cs-story"><code>' + esc(text(st.a, st.b, st.g)) + '</code> …</p>' +
        '<div class="cs-cols"><div><div class="kicker">What ' + headName(EL, EH).toLowerCase() + ' reads from “to”</div>' +
        words.map((w, j) => (att[j] >= 0.02 || j === top) ? '<div class="brow"><span>' + esc(w) + (j === GIVER2 ? ' <small class="cs-kind">gave the ball</small>' : '') + '</span><div class="bar"><i style="width:' + (att[j] * 100).toFixed(1) + '%;background:var(--c4)"></i></div><span>' + att[j].toFixed(2) + '</span></div>' : '').join('') +
        '<p class="wk-cap">Words it gives less than 0.02 are hidden.</p></div>' +
        '<div class="cs-pred" aria-live="polite"><div class="kicker">What the model predicts next</div>' + nameBars(tr, st) + '</div></div>' +
        '<fieldset class="ch-q"><legend>This head reads the person who gave the ball, but the answer is the other person. How can that help?</legend>' + CHOICES.map(([v, label]) => '<label class="ch-o"><input type="radio" name="cs2-why" value="' + v + '"' + (S.pick === v ? ' checked' : '') + '> ' + label + '</label>').join('') +
        '<button type="button" class="btn" data-x="check">Check my answer</button><div aria-live="polite">' + feedback + '</div></fieldset></section>';
    }

    function stage3() {
      const [HL, HH] = HEADS[HELPER];
      let went = 0, below = 0, lowest = 0;
      ALL.forEach(st => {
        const t = run(st); went += t.layers[HL].heads[HH].weights[GIVER2][4] / ALL.length;
        const P = Object.fromEntries(NAMES.map(n => [n, push(t, n)])); below += P[st.g] < P[st.ans]; lowest += NAMES.every(n => n === st.g || P[st.g] < P[n]);
      });
      const share = 'I solved Case 2 on Inside the Model: I found how a language model works out who gets the ball, by elimination. ' + location.origin + location.pathname;
      return '<section class="cs-step cs-closed" aria-labelledby="cs2-3"><h3 id="cs2-3">Case closed</h3>' +
        '<p>The model answers by <b>elimination</b>. ' + headName(EL, EH) + ' looks back from “to” at the person who gave the ball, and passes that on. The model rules the giver out, and of the two people in the story, the one left over wins. Switch the head off and the model still knows who is in the story, but nothing tells it whom to rule out, so it picks between the two at random.</p>' +
        '<p>Researchers found a circuit for the same kind of sentence in GPT-2 small, a real language model with 124 million parameters, spread across many more heads. The paper is linked below the case.</p>' +
        '<p><b>Going further: where does the ruling-out happen?</b> A head’s <i>push</i> is how much its output alone, passed straight to the final scores, raises or lowers each name. This head’s push puts the giver below the right answer in ' + below + ' of 24 stories, and below all three other names in ' + lowest + '. So part of the ruling-out happens in the head itself. Any further ruling-out must happen in the layer-1 MLP: it is the only part of the model after this head that can change which name scores higher.</p>' +
        '<p><b>An open question.</b> ' + headName(HL, HH) + ' is needed too, but it does not look at names. From the giver’s position it mostly reads the word “went” (weight ' + went.toFixed(2) + ' on average). What it contributes is not settled here. Switch it off, build stories, and see what you can find out.</p>' +
        '<div class="cs-share"><label>Share what you found <input type="text" readonly data-x="share" value="' + esc(share) + '"></label><button type="button" class="btn" data-x="copy">Copy</button><span data-x="copied" aria-live="polite"></span></div>' +
        '<button type="button" class="btn" data-x="restart">Start the case again</button></section>';
    }

    const allFound = () => DECIDERS.every(i => progress.found.includes(i));
    function render(focusSel) {
      box.innerHTML = stage1() + (allFound() ? stage2() : '') + (progress.solved ? stage3() : '');
      if (focusSel) box.querySelector(focusSel)?.focus({ preventScroll: true });
    }
    box.addEventListener('click', e => {
      const head = e.target.closest('[data-head]');
      if (head) {
        const i = +head.dataset.head, had = allFound();
        S.off[i] = !S.off[i]; render('[data-head="' + i + '"]');
        if (!had && allFound()) box.querySelector('#cs2-2')?.scrollIntoView({ behavior: K.reduced() ? 'auto' : 'smooth', block: 'nearest' });
        return;
      }
      const x = e.target.closest('[data-x]')?.dataset.x;
      if (x === 'check') {
        const pick = box.querySelector('input[name="cs2-why"]:checked');
        if (!pick) { e.target.closest('fieldset').querySelector('[aria-live]').innerHTML = K.say('info', 'Pick an answer first.'); return; }
        S.pick = pick.value; S.answered = true;
        if (S.pick === 'rule-out' && !progress.solved) { progress.solved = true; save(); }
        render('[data-x="check"]');
        if (progress.solved) box.querySelector('#cs2-3')?.scrollIntoView({ behavior: K.reduced() ? 'auto' : 'smooth', block: 'nearest' });
      } else if (x === 'copy') {
        const f = box.querySelector('[data-x="share"]'), done = ok => { box.querySelector('[data-x="copied"]').textContent = ok ? 'Copied.' : 'Select the text and copy it.'; };
        if (navigator.clipboard) navigator.clipboard.writeText(f.value).then(() => done(true), () => { f.select(); done(false); }); else { f.select(); done(false); }
      } else if (x === 'restart') {
        progress.found = []; progress.solved = false; save();
        Object.assign(S, { off: OFF0.slice(), a: 'tom', b: 'ann', g: 'ann', pick: '', answered: false });
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
    el._itm = { S, set(q) { Object.assign(S, q); render(); }, act() {}, reset() { Object.assign(S, { off: OFF0.slice(), a: 'tom', b: 'ann', g: 'ann', pick: '', answered: false }); render(); } };
    el.dataset.itm = '';
    render();
  }
})();
