/* Case files: investigations of the trained toy model. The reader switches heads off, edits the prompt and reads attention;
   every number, and every check of an answer, is computed live by the same engine and weights as the Model Explorer. */
(function () {
  const W = window.W, K = window.K, esc = K.esc;
  const HEADS = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const headName = (l, h) => 'Layer ' + l + ', head ' + h;
  const pct = v => Math.round(v * 100) + '%';

  /* Weights with some heads switched off. Zeroing a head's rows of Wo removes its output from the residual stream and
     leaves everything else, including the other heads, untouched. */
  function knockout(ITM) {
    const cache = {};
    return off => {
      const key = HEADS.map((_, i) => (off[i] ? 1 : 0)).join('');
      if (cache[key]) return cache[key];
      const W0 = ITM.weights().W, dh = ITM.CFG.dHead, Wc = JSON.parse(JSON.stringify(W0));
      HEADS.forEach(([l, h], i) => { if (off[i]) for (let r = h * dh; r < (h + 1) * dh; r++) Wc.layers[l].Wo[r] = Wc.layers[l].Wo[r].map(() => 0); });
      return (cache[key] = Wc);
    };
  }

  /* Case 1: after "sat on the", why does the model expect a place and never an animal? */
  W.caseplace = el => {
    const { ITM } = window; if (!ITM) { el.insertAdjacentHTML('beforeend', '<p class="src">The model engine failed to load.</p>'); return; }
    const V = ITM.CFG.vocab, weightsWith = knockout(ITM);
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
})();
