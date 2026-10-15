/* Guided investigations: commit a prediction, collect evidence, then test transfer. */
(function () {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pct = n => (n * 100).toFixed(2) + '%', catalog = window.ITMCaseCatalog || [];
  window.W = window.W || {};
  function storage() { try { return window.localStorage; } catch (_) { return null; } }
  function refreshStatus() {
    const C = window.ITMCases; if (!C) return;
    const p = C.loadProgress(storage());
    document.querySelectorAll('[data-case-status]').forEach(el => {
      const s = p.cases[el.dataset.caseStatus];
      el.textContent = s?.completed ? 'Completed' : s?.prediction ? 'In progress' : 'Start investigation';
    });
    const next = catalog.find(c => !p.cases[c.id].completed);
    document.querySelectorAll('[data-case-start]').forEach(el => {
      el.href = next ? '/cases/' + next.slug + '/' : '/cases/';
      el.textContent = next ? (p.cases[next.id].prediction ? 'Resume: ' : 'Start: ') + next.title : 'Revisit the investigations';
    });
  }
  const definitions = {
    controls:{prediction:'Is the place prediction caused by the verb, the preposition, or is the evidence not enough yet?',choices:[['verb','My starting hypothesis is the verb'],['preposition','My starting hypothesis is the preposition'],['uncertain','I need an experiment first']],mission:'Two explanations fit the original prompt: the verb matters, or the preposition matters. Choose a comparison that separates them.',explanation:'Why is the successful design more informative?',explanations:[['isolated','It changes one candidate cause at a time'],['any-change','Any changed prediction proves the explanation'],['proved','It proves the rule for every possible sentence']],transfers:[],hints:['If you change two candidate causes together, either one could explain the change.','Use one probe that changes the verb and another that removes the preposition.'],wrong:'A controlled experiment separates the candidate causes. A changed output alone cannot tell you which of two simultaneous changes mattered.',conclusion:'You chose an experiment that distinguishes competing explanations. Changing the verb collapses the place signal, while removing the preposition preserves it in these probes. This is evidence about these inputs, including counterfactual inputs outside the training grammar; it is not proof of a universal linguistic rule.',limit:'An experiment is informative when competing explanations predict different outcomes. A confounded comparison can change the output without resolving the question.'},
    sufficiency:{prediction:'If layer 0, head 1 is the only attention head left active, will the model still favor a place after “the cat sat on the”?',choices:[['retains','The place preference will remain'],['loses','The place preference will disappear']],mission:'Compare removing the candidate with retaining only that head among the four attention heads. All embeddings, MLPs, residual paths and output operations remain.',explanation:'What is the strongest supported conclusion?',explanations:[['conditional','The head retains this preference with the other head outputs removed, in the tested context'],['entire','This head is the entire model and works independently'],['universal','This head solves every possible place prediction']],transfers:[],hints:['Removal and isolation ask different questions. Compare both interventions with the baseline.','“Only head left active” does not mean only component left in the model. The MLPs and residual pathways still compute.'],wrong:'The model still includes embeddings, MLPs, normalization and output operations. The measurement supports a conditional statement about the tested head interventions, not an independent model or a universal rule.',conclusion:'Removing the candidate destroys this preference; retaining it while removing the other three head outputs preserves the preference. That is evidence of necessity under one intervention and sufficiency relative to the tested head-output interventions. Other model components remain active, and one context does not establish the full algorithm.',limit:'The intervention zeros head outputs. It does not remove embeddings, MLPs, normalization, residual paths or the output layer. State the context and threshold whenever claiming sufficiency.'},
    confidence:{prediction:'Raise temperature from 1 to 2. Will the identity of the highest-probability next token change?',choices:[['changes','The top token will change'],['same','The top token will stay the same']],mission:'Reuse exactly the same logits and weights. Divide logits by a different positive temperature before softmax; do not sample a token.',explanation:'What caused the probability changes?',explanations:[['temperature','Temperature rescaled the logits before softmax'],['learning','The model learned a new fact'],['architecture','The model acquired additional layers']],transfers:[],hints:['Dividing all logits by the same positive number preserves their ordering.','Probabilities can become sharper or flatter even though the weights and the top-ranked token remain unchanged.'],wrong:'The weight checksum stays the same. Positive temperature rescales logits and changes the distribution without a training update; it preserves their ranking.',conclusion:'You changed the displayed probability distribution without changing a weight. Positive temperature preserves logit order while changing how sharply probability is concentrated. A more confident distribution is not evidence that the model learned or became more correct. Sampling from that distribution can still produce different tokens.',limit:'The ranking statement requires positive temperature. We compare distributions before sampling and do not treat an individual sampled word as a deterministic result.'},
    place: {
      prediction: 'What will happen if you remove one attention head?', choices: [['changes', 'At least one head will change the prediction'], ['same', 'The prediction will stay roughly the same']],
      mission: 'Find a head whose removal takes the chance of a place below 10%. Change one component at a time.',
      explanation: 'Which input is the strongest explanation for the place signal in these tests?', explanations: [['verb', 'The verb, such as “sat”'], ['preposition', 'The preposition, such as “on”'], ['the', 'The final word “the”']],
      transfer: 'With all heads restored, after “the dog ran to the”, is a place or an animal more likely?', transfers: [['place', 'A place'], ['animal', 'An animal']],
      hints: ['Compare all four heads individually. A useful intervention changes one part and keeps everything else fixed.', 'Once you find the head, compare “the cat saw on the” with “the cat sat the”. Which change follows the prediction?'],
      wrong: 'Keep the last “the” and replace “sat” with “saw”. Then keep “sat” and remove “on”. Compare the two results above.',
      conclusion: 'You identified a head whose output is necessary for this place prediction, then used input changes to test an explanation. The verb is the useful signal in these examples. This does not prove the head is sufficient by itself, or that prepositions never matter elsewhere.',
      limit: 'Ablation tests necessity under a particular intervention. Attention weights show what a head reads; alone, they do not establish what causes an output.'
    },
    training: {
      prediction: 'After “the cat sat on the”, which weights give “mat” a higher probability?', choices: [['trained', 'Trained weights'], ['random', 'Untrained weights'], ['same', 'They will be the same']],
      mission: 'Keep the architecture and input fixed. Change only the weights, and measure the probability of “mat” and its loss.',
      explanation: 'What explains the difference you measured?', explanations: [['weights', 'Learning changed the numerical weights'], ['architecture', 'Training added more layers'], ['sampling', 'A lucky random token was sampled']],
      transfer: 'After “the dog chased the”, which weights will give the target “cat” a lower loss?', transfers: [['trained', 'Trained weights'], ['random', 'Untrained weights']],
      hints: ['Probability is assigned before any token is sampled. Compare the same target word in both configurations.', 'For a fixed target, loss is −ln(probability). Increasing its probability reduces that loss.'],
      wrong: 'Both runs have two layers and two heads per layer, and no token is sampled. The weight values are the controlled difference.',
      conclusion: 'The architecture specifies the computation; the weights determine the learned behavior. In the starting mat example, trained weights lower the loss. Which weights win for a particular target depends on the input and target; untrained weights can win a specific comparison. This comparison is not a replay of training, and it does not mean every possible input improves.',
      limit: 'These are two fixed weight sets and selected examples from a synthetic grammar. A single target-token loss is not a measure of general intelligence or overall model quality.'
    },
    future: {
      prediction: 'Change the last word from “mat” to “bed”. Will the prediction at the earlier word “sat” change?', choices: [['changes', 'The earlier prediction will change'], ['same', 'It will stay the same']],
      mission: 'Keep the prefix and its positions fixed. Change only a later word, then compare the entire next-token distribution at “sat”.',
      explanation: 'Why is the earlier prediction unchanged?', explanations: [['mask', 'The causal mask blocks information from later positions'], ['ignored', 'The model ignores every noun'], ['training', 'Training removed the word “bed”']],
      transfer: 'Compare “a dog ran to the mat” and “a dog ran to the bed”. At the earlier token “dog”, will the next-token distributions be the same?', transfers: [['same', 'The same'], ['changes', 'Different']],
      hints: ['The selected position is “sat”, not the final word. Watch where its attention weights are exactly zero.', 'The restriction holds in every layer. Later tokens cannot send information back into an earlier position.'],
      wrong: 'Look at the zero attention weights after the selected position. The mask blocks later information before attention is normalized, in every layer.',
      conclusion: 'You changed a suffix and measured an unchanged earlier distribution. The causal mask prevents a token from reading future positions in this forward pass. This differs from predicting at the end of two different prompts, where a changed word can be part of the visible prefix.',
      limit: 'This is a test of information flow during a forward pass. It does not imply that later words were absent from training data.'
    }
  };
  function explorerLink(id, prompt) {
    return '/explorer/#' + new URLSearchParams({ p: prompt, step: id === 'training' ? 25 : 7, t: id === 'future' ? 3 : window.ITM.tokenize(prompt).ids.length - 1, l: 0, h: id === 'place' ? 1 : 0, v: 'visual', w: 'trained' }).toString();
  }
  function mount(el, id) {
    const C = window.ITMCases, ITM = window.ITM, def = definitions[id], meta = catalog.find(c => c.id === id);
    if (!C || !ITM || !meta) { el.innerHTML = '<p>The experiment could not load. Reload this page, or <a href="/guide/attention/">read the explanation of attention</a>.</p>'; return; }
    let progress = C.loadProgress(storage()), notice = '', customPrompt = 'the cat saw on the', customResult = '', sessionOnly = false;
    const openedAt=performance.now(),N=window.ITMNotebook;
    N?.record(storage(),id,'case-open');
    customPrompt = progress.cases[id].prompt || customPrompt;
    try { sessionOnly = !storage(); } catch (_) { sessionOnly = true; }
    const baseline = id === 'place' ? C.runPlace(meta.prompt) : null;
    const choices = (name, entries, selected) => entries.map(([value, label]) => '<label class="iv-option"><input type="radio" name="' + name + '" value="' + value + '"' + (value === selected ? ' checked' : '') + '> <span>' + esc(label) + '</span></label>').join('');
    const form = (action, title, options, selected, button) => '<form data-form="' + action + '"><fieldset><legend>' + esc(title) + '</legend>' + choices(action, options, selected) + '</fieldset><button class="btn" type="submit">' + button + '</button></form>';
    const metric = (label, value, note) => '<div class="iv-measure"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong><small>' + esc(note) + '</small></div>';
    const placeResult = r => '<div class="iv-measures">' + metric('Chance of a place', pct(r.place), 'mat, bed or home') + metric('Chance of an animal', pct(r.animal), 'cat, dog or bird') + '</div>';
    const distribution = probs => '<div class="iv-bars">' + probs.map((p, i) => [ITM.CFG.vocab[i], p]).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([word, p]) => '<div class="iv-bar"><code>' + esc(word) + '</code><span><i style="width:' + (p * 100).toFixed(2) + '%"></i></span><b>' + pct(p) + '</b></div>').join('') + '</div>';
    function trainingResult(prompt, target) {
      const r = C.runTraining(prompt, target);
      return '<p>Prompt: <code>' + esc(prompt) + '</code> · target: <code>' + target + '</code></p><div class="iv-table-wrap"><table><caption>Same architecture and prompt; different weights</caption><thead><tr><th scope="col">Weights</th><th scope="col">P(' + target + ')</th><th scope="col">Loss (nats)</th></tr></thead><tbody>' + [['Trained', r.trained], ['Untrained', r.random]].map(([name, row]) => '<tr><th scope="row">' + name + '</th><td>' + pct(row.probability) + '</td><td>' + row.loss.toFixed(4) + '</td></tr>').join('') + '</tbody></table></div><p class="iv-note">Loss = −ln(P(target)). Lower loss means more probability assigned to this particular target.</p>';
    }
    function futureResult(a, b, pos) {
      const r = C.runFuture(a, b, pos);
      return '<div class="iv-prompts"><code>' + esc(a) + '</code><code>' + esc(b) + '</code></div><p>Measure at <b>' + esc(r.words[pos]) + '</b> (position ' + pos + '; start token is position 0).</p><div class="iv-measures">' + metric('Largest probability change', r.maxDifference.toExponential(2), 'Across all 25 next-token probabilities') + metric('Attention to future positions', r.futureAttention.toFixed(2), 'Maximum over both inputs, every layer and head') + '</div><p class="iv-note">Distributions are treated as equal within 1e-12. This is a numerical comparison, not a sampled output.</p><div class="iv-attention" role="list" aria-label="Layer 0, head 0 attention at the selected position">' + r.words.map((word, i) => '<span role="listitem" class="' + (i > pos ? 'iv-masked' : '') + '"><code>' + esc(word) + '</code><b>' + r.attention[i].toFixed(3) + '</b>' + (i > pos ? '<small>masked</small>' : '') + '</span>').join('') + '</div>';
    }
    function evidencePanel(s) {
      if(id==='controls')return designPanel(s,true);
      if (id === 'place') {
        const r = Number.isInteger(s.experiment) ? C.runPlace(meta.prompt, [s.experiment]) : baseline;
        return '<p><b>All heads on:</b> ' + pct(baseline.place) + ' chance of a place. Select a head to remove only its output; the other three stay on.</p><div class="iv-heads" role="group" aria-label="Remove one attention head">' + [0, 1, 2, 3].map(i => '<button type="button" data-head="' + i + '" aria-pressed="' + (s.experiment === i) + '"' + (s.explanation ? ' disabled' : '') + '>Layer ' + Math.floor(i / 2) + ', head ' + (i % 2) + '<small>' + (s.experiment === i ? 'output removed' : 'test this head') + '</small></button>').join('') + '</div><div aria-live="polite"><p><b>Current intervention:</b> ' + (Number.isInteger(s.experiment) ? 'layer ' + Math.floor(s.experiment / 2) + ', head ' + s.experiment % 2 + ' removed' : 'none; all heads on') + '.</p>' + placeResult(r) + distribution(r.probs) + (s.experiment !== null ? '<p>' + (C.evidence(id, s.experiment) ? '<b>Evidence found.</b> This single-head intervention takes the place probability below 10%.' : 'The model still expects a place. Try a different head.') + '</p>' : '') + '</div>';
      }
      if (s.experiment !== true) return '<button type="button" class="btn" data-action="experiment">Run the controlled comparison</button>';
      if(id==='sufficiency')return sufficiencyResult(meta.prompt);
      if(id==='confidence')return confidenceResult(meta.prompt,2);
      return id === 'training' ? trainingResult(meta.prompt, 'mat') : futureResult(meta.prompt, 'the cat sat on the bed', 3);
    }
    function controlResult(plan){
      const r=C.runControl(plan);
      return '<div class="iv-table-wrap"><table><caption>Chance of a place; all heads on</caption><thead><tr><th scope="col">Input</th><th scope="col">Probability</th></tr></thead><tbody><tr><th scope="row">the cat sat on the (baseline)</th><td>'+pct(r.baseline)+'</td></tr>'+r.probes.map(p=>'<tr><th scope="row">'+esc(p.prompt)+'</th><td>'+pct(p.place)+'</td></tr>').join('')+'</tbody></table></div><p role="status">'+(r.discriminates?'This design separates the two candidate causes: the verb changes in one probe; the preposition is removed in the other.':plan==='confounded'?'Both the verb and preposition changed. This measurement cannot distinguish which change mattered. Choose a more informative design.':'Repeating the same computation checks consistency, but does not distinguish the two explanations. Choose another design.')+'</p>';
    }
    function designPanel(s,standalone=false){
      const plan=standalone?s.experiment:s.design;
      const labels=[['diagnostic','Change the verb, then separately remove the preposition'],['confounded','Change the verb and remove the preposition together'],['repeat','Run the original input again']];
      return '<div class="iv-design"><h4 tabindex="-1">Choose a test of competing explanations</h4><p>The candidate causes are the verb and the preposition. What comparison would distinguish them?</p><div class="iv-design-options" role="group" aria-label="Experimental designs">'+labels.map(([key,label])=>'<button type="button" data-plan="'+key+'" aria-pressed="'+(plan===key)+'"'+(s.explanation?' disabled':'')+'>'+label+'</button>').join('')+'</div>'+(plan?controlResult(plan):'<p class="iv-note">Select a design before its measurements are revealed.</p>')+'</div>';
    }
    function sufficiencyResult(prompt){
      const r=C.runSufficiency(prompt);
      return '<p>Input: <code>'+esc(prompt)+'</code></p><div class="iv-table-wrap"><table><caption>Chance of a place under head-output interventions</caption><thead><tr><th scope="col">Intervention</th><th scope="col">Probability</th></tr></thead><tbody>'+[['All four heads active',r.baseline],['Remove layer 0, head 1',r.removed],['Keep only layer 0, head 1 among heads',r.kept]].map(([label,p])=>'<tr><th scope="row">'+label+'</th><td>'+pct(p)+'</td></tr>').join('')+'</tbody></table></div><p class="iv-note">All non-attention components remain. “Preference remains” means place probability is above 50% for this input.</p>';
    }
    function confidenceResult(prompt,temperature){
      const r=C.runConfidence(prompt,temperature),V=ITM.CFG.vocab,top=r.original.map((p,i)=>[p,i]).sort((a,b)=>b[0]-a[0]).slice(0,4);
      return '<p>Input: <code>'+esc(prompt)+'</code></p><div class="iv-table-wrap"><table><caption>Same logits, different positive temperature</caption><thead><tr><th scope="col">Next token</th><th scope="col">T = 1</th><th scope="col">T = '+temperature+'</th></tr></thead><tbody>'+top.map(([,i])=>'<tr><th scope="row">'+esc(V[i])+'</th><td>'+pct(r.original[i])+'</td><td>'+pct(r.adjusted[i])+'</td></tr>').join('')+'</tbody></table></div><p><b>Top token:</b> '+esc(V[r.originalTop])+' → '+esc(V[r.adjustedTop])+'. <b>Weights:</b> unchanged (checksum <code>'+r.checksum+'</code>).</p>';
    }
    function inspection() {
      if (id !== 'place') return '';
      const r = C.runPlace(customPrompt), tk = ITM.tokenize(customPrompt), att = r.tr.layers[0].heads[1].weights.at(-1);
      return '<div class="iv-input-study"><h4>Test the input signal</h4><p>All four heads are restored for these input comparisons. The attention row below is layer 0, head 1, read from the final word.</p><div class="iv-tests" role="group" aria-label="Controlled input comparisons">' + ['the cat saw on the', 'the cat sat the', 'the cat slept on the'].map(t => '<button type="button" data-prompt="' + t + '" aria-pressed="' + (t === customPrompt) + '">' + t + '</button>').join('') + '</div><form data-form="prompt"><label for="iv-prompt">Try a supported prompt</label><div class="iv-input-row"><input id="iv-prompt" name="prompt" maxlength="250" value="' + esc(customPrompt) + '" autocomplete="off" spellcheck="false"><button type="submit" class="btn">Run prompt</button></div></form><p role="status">' + esc(customResult) + '</p>' + placeResult(r) + '<div class="iv-attention" role="list" aria-label="Measured attention by token">' + tk.ids.map((token, i) => '<span role="listitem"><code>' + esc(ITM.CFG.vocab[token]) + '</code><b>' + att[i].toFixed(3) + '</b></span>').join('') + '</div><details><summary>Words this model knows</summary><p>' + esc(ITM.CFG.vocab.slice(1).join(', ')) + '</p></details></div>';
    }
    function transferResult() {
      const t=C.transferSpec(id,progress.cases[id].variant);
      if(t.kind==='place')return '<p><b>Transfer measurement, all heads on:</b> <code>'+esc(t.prompt)+'</code></p>'+placeResult(t.result);
      if(t.kind==='training')return trainingResult(t.prompt,t.target);
      if(t.kind==='sufficiency')return sufficiencyResult(t.prompt);
      if(t.kind==='confidence')return confidenceResult(t.prompt,t.result.temperature);
      if(t.kind==='control')return '<div class="iv-measures">'+t.result.map(p=>metric(p.prompt,pct(p.place),'Chance of a place, all heads on')).join('')+'</div><p>Only the verb differs between these two inputs.</p>';
      return futureResult(t.a,t.b,t.position);
    }
    function render(focus) {
      const s = progress.cases[id], hasEvidence = C.evidence(id, s.experiment), correctExplanation = s.explanation === C.answers(id,s.variant).explanation;
      const transfer=C.transferSpec(id,s.variant),canExplain=id!=='place'||s.design==='diagnostic';
      const stage = s.completed ? 4 : correctExplanation ? 3 : hasEvidence ? 2 : s.prediction ? 1 : 0;
      const next = catalog[catalog.findIndex(c => c.id === id) + 1];
      el.innerHTML = '<div class="iv"><nav class="iv-progress" aria-label="Investigation progress"><ol>' + ['Predict', 'Experiment', 'Explain', 'Test your understanding'].map((t, i) => '<li' + (i === Math.min(stage, 3) ? ' aria-current="step"' : '') + '>' + (i + 1) + '. ' + t + (i < stage ? '<span class="iv-done"> · done</span>' : '') + '</li>').join('') + '</ol></nav>' +
        (s.legacy ? '<p class="iv-note">Welcome back. Your earlier work is recognized; this version adds a fresh-example check.</p>' : '') +
        '<p class="iv-save">' + (sessionOnly ? 'Browser storage is unavailable. Progress lasts until you leave this page.' : 'Progress saves in this browser. No account needed.') + '</p>' +
        '<section class="iv-stage" aria-labelledby="iv-predict"><h3 id="iv-predict" tabindex="-1">1. Make a prediction</h3>' + (s.prediction ? '<p>Your prediction: <b>' + esc(def.choices.find(c => c[0] === s.prediction)[1]) + '</b>. A prediction is a starting point; the experiment tests it.</p>' : form('prediction', def.prediction, def.choices, '', 'Record my prediction')) + '</section>' +
        (s.prediction ? '<section class="iv-stage" aria-labelledby="iv-experiment"><h3 id="iv-experiment" tabindex="-1">2. Collect evidence</h3><p>' + def.mission + '</p>' + evidencePanel(s) + '</section>' : '<p class="iv-locked">Record a prediction to open the experiment. It does not need to be right.</p>') +
        (hasEvidence ? '<section class="iv-stage" aria-labelledby="iv-explain"><h3 id="iv-explain" tabindex="-1">3. Explain the result</h3>'+(id==='place'?designPanel(s):'')+(canExplain?inspection()+(correctExplanation?'<p><b>Explanation supported.</b> '+esc(def.explanations.find(c=>c[0]===s.explanation)[1])+'.</p>':form('explanation',def.explanation,def.explanations,s.explanation,'Check against the evidence')+(s.explanation?'<p class="iv-feedback" role="status">'+def.wrong+'</p>':'')):'')+'<p class="iv-note">'+def.limit+'</p></section>':'') +
        (correctExplanation ? '<section class="iv-stage" aria-labelledby="iv-transfer"><h3 id="iv-transfer" tabindex="-1">4. Test your understanding</h3>' + (s.priorExposure ? '<p class="iv-note">You have seen this example’s result before. This is a practice check, rather than a new blind assessment.</p>' : '') + (s.completed ? '<p><b>Prediction checked.</b> ' + (s.priorExposure ? 'Your practice prediction matched the measurement.' : s.attempts > 1 ? 'You revised your answer after seeing the evidence.' : 'Your first prediction matched the fresh-example measurement.') + '</p>' : form('transfer', transfer.question, transfer.choices, s.transfer, s.transfer ? 'Check my revised prediction' : 'Commit prediction and run test')) + (s.transfer ? transferResult() + (!s.completed ? '<p class="iv-feedback" role="status">The measurement does not support that prediction. Compare the values, revise your answer, and explain the difference to yourself.</p>' : '') : '<p class="iv-note">The measurement stays hidden until you commit a prediction.</p>') + '</section>' : '') +
        (s.completed ? '<section class="iv-conclusion" aria-labelledby="iv-closed"><h3 id="iv-closed" tabindex="-1">Investigation complete</h3><p>' + def.conclusion + '</p><div class="iv-next">' + (next ? '<a class="btn" href="/cases/' + next.slug + '/">Next: ' + next.title + '</a>' : '<a class="btn" href="/explorer/">Continue in the Model Explorer</a>') + '<a href="/cases/">All investigations</a></div></section>' : '') +
        '<p class="iv-notice" role="status">' + esc(notice) + '</p><div class="iv-tools"><button type="button" data-action="hint"' + (s.hint >= 2 ? ' disabled' : '') + '>Show a hint' + (s.hint ? ' (' + s.hint + '/2)' : '') + '</button><button type="button" data-action="reset">Restart this investigation</button></div>' + (s.hint ? '<aside class="iv-hint" tabindex="-1"><p>' + def.hints[s.hint - 1] + '</p></aside>' : '') +
        '<section class="iv-resources"><h3>Keep an evidence notebook</h3><p>Record what you changed, what you observed, and what your conclusion does not establish.</p><a class="btn" href="/notebook/?case='+id+'">Write up this investigation</a><h3>Follow the mechanism</h3><p>Inspect the calculation, read the explanation, or reproduce it in code.</p><ul><li><a href="' + explorerLink(id, meta.prompt) + '">Inspect this case in the Model Explorer</a></li>' + meta.resources.map(([label, href]) => '<li><a href="' + href + '">' + label + '</a></li>').join('') + '<li><a href="/methods/">Methods, verification and limitations</a></li></ul></section></div>';
      if (focus) {
        const target = el.querySelector(focus);
        target?.focus({ preventScroll: true });
        if (target?.tagName === 'H3' || target?.classList.contains('iv-hint')) target.scrollIntoView({ block: 'nearest' });
      }
    }
    function update(action, value, focus) {
      const pending = C.transition(progress, id, action, value), backing = storage();
      const merged = backing ? C.mergeCaseProgress(C.loadProgress(backing), pending, id) : pending;
      sessionOnly = !C.saveProgress(backing, merged);
      progress = sessionOnly ? pending : merged;
      const state=progress.cases[id];
      N?.record(backing,id,action,{seconds:(performance.now()-openedAt)/1000,attempt:state.attempts,practice:state.priorExposure,correct:action==='transfer'?state.transfer===C.answers(id,state.variant).transfer:action==='explanation'?state.explanation===C.answers(id,state.variant).explanation:null});
      if(action==='transfer'&&state.completed)N?.record(backing,id,'completed',{seconds:(performance.now()-openedAt)/1000});
      window.dispatchEvent(new Event('itm:case-progress'));
      render(focus);
    }
    el.addEventListener('submit', event => {
      event.preventDefault(); const action = event.target.dataset.form;
      if (action === 'prompt') {
        const text = event.target.elements.prompt.value.trim(), valid = C.validatePrompt(text);
        customResult = valid.ok ? 'Computed with all heads on.' : valid.message;
        if (valid.ok) { customPrompt = text; update('prompt', text, '#iv-prompt'); } else render('#iv-prompt');
        return;
      }
      const pick = event.target.querySelector('input:checked');
      if (!pick) { notice = 'Choose a prediction or explanation before continuing.'; render('form[data-form="' + action + '"] input'); return; }
      notice = '';
      update(action,pick.value,action==='prediction'?'#iv-experiment':action==='explanation'?(pick.value===C.answers(id,progress.cases[id].variant).explanation?'#iv-transfer':'#iv-explain'):(pick.value===C.answers(id,progress.cases[id].variant).transfer?'#iv-closed':'#iv-transfer'));
    });
    el.addEventListener('click', event => {
      const head = event.target.closest('[data-head]');
      const plan=event.target.closest('[data-plan]');
      if(plan){update(id==='place'?'design':'experiment',plan.dataset.plan,'.iv-design h4');return;}
      if (head) { notice = ''; update('experiment', +head.dataset.head, '[data-head="' + head.dataset.head + '"]'); return; }
      const prompt = event.target.closest('[data-prompt]');
      if (prompt) { customPrompt = prompt.dataset.prompt; customResult = 'Computed with all heads on.'; update('prompt', customPrompt, '[data-prompt="' + customPrompt + '"]'); return; }
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      notice = '';
      if (action === 'reset') { customPrompt = 'the cat saw on the'; customResult = ''; }
      update(action, action === 'experiment' ? true : undefined, action === 'reset' ? '#iv-predict' : action === 'hint' ? '.iv-hint' : '#iv-explain');
    });
    render();
  }
  [['caseplace','place'],['casetraining','training'],['casefuture','future'],['casecontrols','controls'],['casesufficiency','sufficiency'],['caseconfidence','confidence']].forEach(([name,id])=>{
    window.W[name] = el => { try { mount(el, id); } catch (e) { console.error('Investigation initialization failed', e); el.innerHTML = '<p>The experiment could not start. Reload the page, or <a href="/cases/">return to the investigations</a>.</p>'; } };
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refreshStatus); else refreshStatus();
  window.addEventListener('itm:case-progress', refreshStatus);
  window.addEventListener('pageshow', refreshStatus);
  window.addEventListener('storage', refreshStatus);
})();
