/* Measured experiments and assessment progress. No DOM dependencies. */
(function (root) {
  const ITM = root.ITM;
  if (!ITM || !ITM.weights().meta.trained) return;
  const KEY = 'itm-investigations-v2', ids = ['place', 'training', 'future'];
  const PLACES = ['mat', 'bed', 'home'], ANIMALS = ['cat', 'dog', 'bird'];
  const cloned = new Map();
  function validatePrompt(text) {
    if (typeof text !== 'string' || !text.trim()) return { ok: false, message: 'Enter a prompt using the model’s vocabulary.' };
    const tk = ITM.tokenize(text);
    if (tk.truncated) return { ok: false, message: 'This model accepts at most ' + (ITM.CFG.maxCtx - 1) + ' words. Shorten the prompt.' };
    if (tk.unknown.length) return { ok: false, message: 'Unknown words: ' + tk.unknown.join(', ') + '. Choose words from the vocabulary below.' };
    return { ok: true, ids: tk.ids };
  }
  function tokens(text) { const r = validatePrompt(text); if (!r.ok) throw Error(r.message); return r.ids; }
  function weightsWithout(off) {
    if (!Array.isArray(off) || off.some(i => !Number.isInteger(i) || i < 0 || i > 3)) throw Error('Choose a valid attention head.');
    const key = [...new Set(off)].sort().join(',');
    if (!key) return ITM.weights().W;
    if (!cloned.has(key)) {
      const W = JSON.parse(JSON.stringify(ITM.weights().W));
      off.forEach(i => { const l = Math.floor(i / 2), h = i % 2; for (let r = h * ITM.CFG.dHead; r < (h + 1) * ITM.CFG.dHead; r++) W.layers[l].Wo[r].fill(0); });
      cloned.set(key, W);
    }
    return cloned.get(key);
  }
  function runPlace(prompt, off = []) {
    const tr = ITM.forward(weightsWithout(off), tokens(prompt)), probs = tr.probs.at(-1);
    const sum = words => words.reduce((n, w) => n + probs[ITM.CFG.vocab.indexOf(w)], 0);
    return { place: sum(PLACES), animal: sum(ANIMALS), probs, tr };
  }
  function runTraining(prompt, target) {
    const t = ITM.CFG.vocab.indexOf(target); if (t < 1) throw Error('Choose a known target word.');
    const ts = tokens(prompt), run = W => { const probs = ITM.forward(W, ts).probs.at(-1), probability = probs[t]; return { probability, loss: -Math.log(probability), probs }; };
    return { trained: run(ITM.weights().W), random: run(ITM.seeded().W) };
  }
  function runFuture(a, b, position) {
    const A = tokens(a), B = tokens(b);
    if (!Number.isInteger(position) || position < 1 || position >= Math.min(A.length, B.length) - 1) throw Error('Choose a prefix position with words after it.');
    if (A.length !== B.length || A.slice(0, position + 1).some((v, i) => v !== B[i])) throw Error('The inputs need an identical prefix and equal length.');
    const ta = ITM.forward(ITM.weights().W, A), tb = ITM.forward(ITM.weights().W, B);
    const pa = ta.probs[position], pb = tb.probs[position];
    return { a: pa, b: pb, maxDifference: Math.max(...pa.map((p, i) => Math.abs(p - pb[i]))), futureAttention: Math.max(...[ta, tb].flatMap(t => t.layers.flatMap(l => l.heads.flatMap(h => h.weights[position].slice(position + 1))))), attention: ta.layers[0].heads[0].weights[position], words: A.map(i => ITM.CFG.vocab[i]), position };
  }
  const predictionOptions = { place: ['changes', 'same'], training: ['trained', 'random', 'same'], future: ['changes', 'same'] };
  const explanationOptions = { place: ['verb', 'preposition', 'the'], training: ['weights', 'architecture', 'sampling'], future: ['mask', 'ignored', 'training'] };
  const transferOptions = { place: ['place', 'animal'], training: ['trained', 'random'], future: ['same', 'changes'] };
  function answers(id) {
    if (id === 'place') { const r = runPlace('the dog ran to the'); return { explanation: 'verb', transfer: r.place > r.animal ? 'place' : 'animal' }; }
    if (id === 'training') { const r = runTraining('the dog chased the', 'cat'); return { explanation: 'weights', transfer: r.trained.loss < r.random.loss ? 'trained' : 'random' }; }
    return { explanation: 'mask', transfer: runFuture('a dog ran to the mat', 'a dog ran to the bed', 2).maxDifference < 1e-12 ? 'same' : 'changes' };
  }
  function evidence(id, experiment) {
    if (id === 'place') return Number.isInteger(experiment) && experiment >= 0 && experiment < 4 && runPlace('the cat sat on the', [experiment]).place < 0.1;
    return experiment === true && (id === 'training' ? runTraining('the cat sat on the', 'mat').trained.loss < runTraining('the cat sat on the', 'mat').random.loss : runFuture('the cat sat on the mat', 'the cat sat on the bed', 3).maxDifference < 1e-12);
  }
  const blank = () => ({ prediction: '', experiment: null, explanation: '', transfer: '', attempts: 0, hint: 0, prompt: '', priorExposure: false, legacy: false, completed: false });
  function normalizeCase(id, value) {
    const s = blank(), v = value && typeof value === 'object' ? value : {};
    s.legacy = v.legacy === true;
    s.priorExposure = v.priorExposure === true;
    if (id === 'place' && typeof v.prompt === 'string' && v.prompt.length <= 250 && validatePrompt(v.prompt).ok) s.prompt = v.prompt;
    s.hint = Number.isInteger(v.hint) ? Math.max(0, Math.min(2, v.hint)) : 0;
    if (predictionOptions[id].includes(v.prediction)) s.prediction = v.prediction;
    if (s.prediction && (id === 'place' ? Number.isInteger(v.experiment) && v.experiment >= 0 && v.experiment < 4 : v.experiment === true)) s.experiment = v.experiment;
    if (evidence(id, s.experiment) && explanationOptions[id].includes(v.explanation)) s.explanation = v.explanation;
    const correct = answers(id);
    if (s.explanation === correct.explanation && transferOptions[id].includes(v.transfer)) { s.transfer = v.transfer; s.attempts = Number.isInteger(v.attempts) ? Math.max(1, Math.min(100, v.attempts)) : 1; }
    s.completed = !!s.transfer && s.transfer === correct.transfer;
    return s;
  }
  function normalizeProgress(value) {
    const v = value && typeof value === 'object' && value.version === 2 ? value : {};
    return { version: 2, cases: Object.fromEntries(ids.map(id => [id, normalizeCase(id, v.cases?.[id])])) };
  }
  function loadProgress(storage) {
    try {
      const raw = storage.getItem(KEY);
      if (raw) return normalizeProgress(JSON.parse(raw));
      const legacy = JSON.parse(storage.getItem('itm-cases') || '{}'), state = normalizeProgress(null);
      state.cases.place.legacy = legacy?.place?.solved === true || legacy?.place?.found === true;
      return state;
    } catch (_) { return normalizeProgress(null); }
  }
  function saveProgress(storage, state) { try { storage.setItem(KEY, JSON.stringify(normalizeProgress(state))); return true; } catch (_) { return false; } }
  function transition(state, id, action, value) {
    const p = normalizeProgress(state); if (!ids.includes(id)) return p;
    const s = p.cases[id];
    if (action === 'reset') { p.cases[id] = { ...blank(), priorExposure: s.priorExposure || !!s.transfer }; return p; }
    if (action === 'prediction' && !s.prediction && predictionOptions[id].includes(value)) s.prediction = value;
    if (action === 'experiment' && s.prediction && !s.explanation && (id === 'place' ? Number.isInteger(value) && value >= 0 && value < 4 : value === true)) s.experiment = value;
    if (action === 'explanation' && evidence(id, s.experiment) && !s.transfer && explanationOptions[id].includes(value)) s.explanation = value;
    if (action === 'transfer' && s.explanation === answers(id).explanation && transferOptions[id].includes(value)) { s.transfer = value; s.attempts++; }
    if (action === 'hint') s.hint = Math.min(2, s.hint + 1);
    if (action === 'prompt' && id === 'place' && typeof value === 'string' && value.length <= 250 && validatePrompt(value).ok) s.prompt = value;
    return normalizeProgress(p);
  }
  function mergeCaseProgress(persisted, local, id) {
    const latest = normalizeProgress(persisted), pending = normalizeProgress(local);
    if (ids.includes(id)) latest.cases[id] = pending.cases[id];
    return latest;
  }
  root.ITMCases = { KEY, PLACES, ANIMALS, validatePrompt, runPlace, runTraining, runFuture, answers, evidence, normalizeProgress, loadProgress, saveProgress, mergeCaseProgress, transition };
})(typeof window !== 'undefined' ? window : globalThis);
