/* Measured experiments and assessment progress. No DOM dependencies. */
(function (root) {
  const ITM = root.ITM;
  if (!ITM || !ITM.weights().meta.trained) return;
  const KEY = 'itm-investigations-v2', ids = ['place', 'training', 'future', 'controls', 'sufficiency', 'confidence'];
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
  function runControl(plan) {
    const prompts = {diagnostic:['the cat saw on the','the cat sat the'],confounded:['the cat saw the'],repeat:['the cat sat on the']}[plan];
    if (!prompts) throw Error('Choose an experimental design.');
    const baseline = runPlace('the cat sat on the').place;
    const probes = prompts.map(prompt => ({prompt,place:runPlace(prompt).place}));
    return {baseline,probes,discriminates:plan==='diagnostic' && baseline-probes[0].place>.5 && Math.abs(baseline-probes[1].place)<.05};
  }
  function runSufficiency(prompt) {
    return {baseline:runPlace(prompt).place,removed:runPlace(prompt,[1]).place,kept:runPlace(prompt,[0,2,3]).place};
  }
  function runConfidence(prompt, temperature) {
    if (!Number.isFinite(temperature) || temperature<.25 || temperature>4) throw Error('Choose a temperature from 0.25 to 4.');
    const trace=ITM.forward(ITM.weights().W,tokens(prompt)), original=trace.probs.at(-1), adjusted=ITM.math.softmax(trace.logits.at(-1).map(z=>z/temperature));
    const top = ps => ps.indexOf(Math.max(...ps));
    return {original,adjusted,originalTop:top(original),adjustedTop:top(adjusted),temperature,checksum:ITM.weights().sum};
  }
  const predictionOptions = { place:['changes','same'],training:['trained','random','same'],future:['changes','same'],controls:['verb','preposition','uncertain'],sufficiency:['retains','loses'],confidence:['changes','same'] };
  Object.values(predictionOptions).forEach(options=>{if(!options.includes('uncertain'))options.push('uncertain');});
  const explanationOptions = {place:['verb','preposition','the'],training:['weights','architecture','sampling'],future:['mask','ignored','training'],controls:['isolated','any-change','proved'],sufficiency:['conditional','entire','universal'],confidence:['temperature','learning','architecture']};
  const plans=['diagnostic','confounded','repeat'];
  function transferSpec(id, variant=0) {
    const v=Number.isInteger(variant)&&variant>=0&&variant<3?variant:0;
    if(id==='place') {
      const prompt=['the dog ran to the','the bird sat under the','the cat slept on the'][v],result=runPlace(prompt);
      return {question:'All heads on: after “'+prompt+'”, is a place or an animal more likely?',choices:[['place','A place'],['animal','An animal']],expected:result.place>result.animal?'place':'animal',kind:'place',prompt,result};
    }
    if(id==='training') {
      const [prompt,target]=[['the dog chased the','cat'],['the bird sat under the','bed'],['the cat sat on the','cat']][v],result=runTraining(prompt,target);
      return {question:'After “'+prompt+'”, which weights give the specific target “'+target+'” a lower loss? Compare this target, even if it is an unusual continuation.',choices:[['trained','Trained weights'],['random','Untrained weights']],expected:result.trained.loss<result.random.loss?'trained':'random',kind:'training',prompt,target,result};
    }
    if(id==='future') {
      const [a,b,position]=[['a dog ran to the mat','a dog ran to the bed',2],['the bird sat on the mat','the bird sat on the bed',3],['a cat sat under the mat','a cat sat under the bed',2]][v],result=runFuture(a,b,position);
      return {question:'Compare “'+a+'” and “'+b+'”. At “'+result.words[position]+'” (position '+position+'), are the next-token distributions the same?',choices:[['same','The same'],['changes','Different']],expected:result.maxDifference<1e-12?'same':'changes',kind:'future',a,b,position,result};
    }
    if(id==='controls') {
      const pair=[['the dog ran to the','the dog saw to the'],['the bird sat under the','the bird saw under the'],['the cat sat on the','the cat saw on the']][v];
      const result=pair.map(prompt=>({prompt,place:runPlace(prompt).place}));
      return {question:'In “'+pair[0]+'” versus “'+pair[1]+'”, which variable changes? This is a controlled prompt comparison, including inputs outside the training grammar.',choices:[['verb','Only the verb'],['both','Both the verb and preposition']],expected:'verb',kind:'control',result};
    }
    if(id==='sufficiency') {
      const prompt=['the dog ran to the','the bird sat under the','the cat sat on the'][v],result=runSufficiency(prompt);
      return {question:'For “'+prompt+'”, keep only layer 0, head 1 active among the attention heads. Do you predict more than 50% probability of a place? Embeddings, MLPs and all other model operations remain.',choices:[['retains','Yes, the place preference remains'],['loses','No, it falls below 50%']],expected:result.kept>.5?'retains':'loses',kind:'sufficiency',prompt,result};
    }
    const prompt=['the dog chased the','the bird sat on the','the cat ran home'][v],temperature=[2,.5,3][v],result=runConfidence(prompt,temperature);
    return {question:'After “'+prompt+'”, change temperature from 1 to '+temperature+'. Will the identity of the highest-probability next token change? No token is sampled.',choices:[['same','The top token stays the same'],['changes','The top token changes']],expected:result.originalTop===result.adjustedTop?'same':'changes',kind:'confidence',prompt,result};
  }
  function answers(id,variant=0) {
    return {explanation:{place:'verb',training:'weights',future:'mask',controls:'isolated',sufficiency:'conditional',confidence:'temperature'}[id],transfer:transferSpec(id,variant).expected};
  }
  function evidence(id, experiment) {
    if (id === 'place') return Number.isInteger(experiment) && experiment >= 0 && experiment < 4 && runPlace('the cat sat on the', [experiment]).place < 0.1;
    if (id === 'controls') return experiment==='diagnostic'&&runControl(experiment).discriminates;
    if (id === 'sufficiency') {const r=runSufficiency('the cat sat on the');return experiment===true&&r.removed<.1&&r.kept>.9;}
    if (id === 'confidence') {const r=runConfidence('the cat sat on the',2);return experiment===true&&r.originalTop===r.adjustedTop;}
    return experiment === true && (id === 'training' ? runTraining('the cat sat on the', 'mat').trained.loss < runTraining('the cat sat on the', 'mat').random.loss : runFuture('the cat sat on the mat', 'the cat sat on the bed', 3).maxDifference < 1e-12);
  }
  const blank = () => ({ prediction:'',experiment:null,design:'',explanation:'',transfer:'',attempts:0,hint:0,prompt:'',variant:0,seen:[],priorExposure:false,legacy:false,completed:false });
  function normalizeCase(id, value) {
    const s = blank(), v = value && typeof value === 'object' ? value : {};
    s.legacy = v.legacy === true;
    s.variant=Number.isInteger(v.variant)&&v.variant>=0&&v.variant<3?v.variant:0;
    s.seen=Array.isArray(v.seen)?[...new Set(v.seen.filter(n=>Number.isInteger(n)&&n>=0&&n<3))]:[];
    if(v.priorExposure===true&&!Array.isArray(v.seen)&&!s.seen.includes(0))s.seen.push(0);
    s.priorExposure=s.seen.includes(s.variant)&&!v.transfer;
    if (id === 'place' && typeof v.prompt === 'string' && v.prompt.length <= 250 && validatePrompt(v.prompt).ok) s.prompt = v.prompt;
    s.hint = Number.isInteger(v.hint) ? Math.max(0, Math.min(2, v.hint)) : 0;
    if (predictionOptions[id].includes(v.prediction)) s.prediction = v.prediction;
    if (s.prediction && (id==='place'?Number.isInteger(v.experiment)&&v.experiment>=0&&v.experiment<4:id==='controls'?plans.includes(v.experiment):v.experiment===true))s.experiment=v.experiment;
    if(plans.includes(v.design)&&evidence(id,s.experiment))s.design=v.design;
    const designed=id!=='place'||s.design==='diagnostic';
    if (evidence(id,s.experiment)&&designed&&explanationOptions[id].includes(v.explanation))s.explanation=v.explanation;
    const correct=answers(id,s.variant),spec=transferSpec(id,s.variant);
    if(id==='place'&&!designed&&spec.choices.some(([value])=>value===v.transfer)){s.legacy=true;if(!s.seen.includes(s.variant))s.seen.push(s.variant);s.priorExposure=true;}
    if (s.explanation===correct.explanation&&spec.choices.some(([value])=>value===v.transfer)) {
      s.transfer=v.transfer;s.attempts=Number.isInteger(v.attempts)?Math.max(1,Math.min(100,v.attempts)):1;
      // Keep whether this run began as practice separately from exposure caused by this run.
      s.priorExposure=v.priorExposure===true;
      if(!s.seen.includes(s.variant))s.seen.push(s.variant);
    }
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
    if(action==='reset') {
      const seen=[...s.seen];if(s.transfer&&!seen.includes(s.variant))seen.push(s.variant);
      const unseen=[0,1,2].find(n=>!seen.includes(n)),variant=unseen===undefined?(s.variant+1)%3:unseen;
      p.cases[id]={...blank(),seen,variant,priorExposure:seen.includes(variant)};return p;
    }
    if (action === 'prediction' && !s.prediction && predictionOptions[id].includes(value)) s.prediction = value;
    if(action==='experiment'&&s.prediction&&!s.explanation&&(id==='place'?Number.isInteger(value)&&value>=0&&value<4:id==='controls'?plans.includes(value):value===true))s.experiment=value;
    if(action==='design'&&id==='place'&&evidence(id,s.experiment)&&!s.explanation&&plans.includes(value))s.design=value;
    if(action==='explanation'&&evidence(id,s.experiment)&&(id!=='place'||s.design==='diagnostic')&&!s.transfer&&explanationOptions[id].includes(value))s.explanation=value;
    if(action==='transfer'&&s.explanation===answers(id,s.variant).explanation&&transferSpec(id,s.variant).choices.some(([key])=>key===value)){s.transfer=value;s.attempts++;}
    if (action === 'hint') s.hint = Math.min(2, s.hint + 1);
    if (action === 'prompt' && id === 'place' && typeof value === 'string' && value.length <= 250 && validatePrompt(value).ok) s.prompt = value;
    return normalizeProgress(p);
  }
  function mergeCaseProgress(persisted, local, id) {
    const latest = normalizeProgress(persisted), pending = normalizeProgress(local);
    if (ids.includes(id)) latest.cases[id] = pending.cases[id];
    return latest;
  }
  root.ITMCases = { KEY, PLACES, ANIMALS, validatePrompt, runPlace, runTraining, runFuture,runControl,runSufficiency,runConfidence,transferSpec,answers,evidence,normalizeProgress,loadProgress,saveProgress,mergeCaseProgress,transition };
})(typeof window !== 'undefined' ? window : globalThis);
