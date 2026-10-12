/* Learning frames make every calculator, simulator, and exercise start with a
   concrete experiment. Widget math stays in its own module. */
(function () {
  const R = {
    homehero: { type: 'Model trace', mission: 'Choose a token or attention head and trace which earlier words matter.', observation: 'A token prediction is built from many small, inspectable attention choices.' },
    explorer: { type: 'Guided exploration', mission: 'Follow one token all the way from text to its next-token probabilities.', observation: 'Each panel is a real intermediate value from the same tiny model.' },
    challenges: { type: 'Knowledge check', mission: 'Commit to an answer, then use the Explorer to verify the calculation.', observation: 'A wrong answer is useful when it tells you which stage to revisit.' },
    gd: { type: 'Simulation', mission: 'Make the step too large, then watch gradient descent stop being descent.', observation: 'The gradient gives a direction, but the learning rate decides whether that direction is safe.', scenarios: [{ label: 'Overshoot', controls: { lr: 1.1 }, actions: ['step'] }, { label: 'Start on the other side', controls: { x0: 2.2 } }] },
    mlp: { type: 'Training lab', mission: 'Change the model’s capacity, then ask it to fit a curve it cannot simply memorize.', observation: 'More hidden units make more bends available; training still has to find them.', scenarios: [{ label: 'One unit', controls: { H: 1 }, actions: ['reset'] }, { label: 'Hard target', controls: { tg: 'wiggle' }, actions: ['reset'] }] },
    opt: { type: 'Optimizer race', mission: 'Raise the step count and compare the paths down the same narrow valley.', observation: 'Adaptive scaling changes how an optimizer sees steep and shallow directions.', scenarios: [{ label: 'Long run', controls: { n: 80 } }, { label: 'Aggressive SGD', controls: { lr: 0.065 } }] },
    softmax: { type: 'Distribution lab', mission: 'Make the true token unlikely, then inspect the loss and the sign of every correction.', observation: 'Training changes logits; probability and loss are consequences of their relative gaps.', scenarios: [{ label: 'Make cat unlikely', controls: { z0: -2 } }, { label: 'Cool sampling', controls: { T: 0.35 } }] },
    bpe: { type: 'Tokenizer workshop', mission: 'Add merges and watch frequent character pairs become reusable tokens.', observation: 'A tokenizer learns compression from repetition, not a dictionary of whole words.', scenarios: [{ label: 'More merges', controls: { n: 20 } }] },
    attnhand: { type: 'Direct manipulation', mission: 'Edit one token vector and follow its effect through scores, weights, and output.', observation: 'Attention is a sequence of visible matrix operations, not a black-box lookup.' },
    attnheat: { type: 'Pattern explorer', mission: 'Turn on a short window and see exactly which historical positions disappear.', observation: 'A causal mask limits information flow before softmax makes any probabilities.' },
    attnmask: { type: 'Masking experiment', mission: 'Shrink the sliding window and compare masked scores with the surviving attention.', observation: 'Masked positions are removed before normalization, so their probability becomes zero.', scenarios: [{ label: 'Window of 2', controls: { w: 2 } }] },
    attnreal: { type: 'Model evidence', mission: 'Switch heads and tokens to find a real attention pattern worth explaining.', observation: 'Heads can specialize, but the pattern is evidence to inspect rather than a label to trust.' },
    rmsnorm: { type: 'Comparison', mission: 'Move the vector’s mean and scale, then compare what RMSNorm and LayerNorm preserve.', observation: 'Normalization controls scale; centering is an additional, separate choice.' },
    dparams: { type: 'Architecture calculator', mission: 'Change width or depth and identify which matrix becomes expensive first.', observation: 'Most transformer parameters live in repeated attention and MLP matrices.', scenarios: [{ label: 'Wider model', controls: { d: 8192 } }, { label: 'More layers', controls: { L: 96 } }] },
    rope: { type: 'Geometry probe', mission: 'Shift query and key together and check whether their relative rotation stays fixed.', observation: 'RoPE encodes distance in the relationship between two rotations.', scenarios: [{ label: 'Large shared shift', controls: { s: 80 } }] },
    ropeext: { type: 'Context extension', mission: 'Extend the context and compare the frequencies that interpolate with those left intact.', observation: 'Long-context methods trade fine local position detail for usable larger distances.', scenarios: [{ label: '32× extension', controls: { s: 32 } }] },
    flops: { type: 'Capacity planning', mission: 'Pick a model preset, then change the GPU count to see what changes and what does not.', observation: 'More GPUs reduce wall-clock time; total training compute remains the same.', scenarios: [{ label: 'Chinchilla preset', actions: ['p2'] }, { label: 'Double the cluster', controls: { G: 32768 } }] },
    kvcalc: { type: 'Memory calculator', mission: 'Raise context length, then compare the cache with a plain multi-head design.', observation: 'KV-cache cost grows with serving context and concurrent sequences, not just model size.', scenarios: [{ label: 'Long context', controls: { s: 256000 } }, { label: 'Batch 32', controls: { u: 32 } }] },
    roofline: { type: 'Systems trade-off', mission: 'Increase batch until the bottleneck changes from bandwidth to compute.', observation: 'Throughput grows when weights are shared across a batch, until another resource takes over.', scenarios: [{ label: 'Batch 64', controls: { B: 64 } }, { label: 'Long context', controls: { c: 64000 } }] },
    onlinesoftmax: { type: 'Streaming trace', mission: 'Change block size and verify that the running result still matches full softmax.', observation: 'Online softmax carries only stable running statistics between blocks.', scenarios: [{ label: 'Tiny blocks', controls: { bs: 2 } }, { label: 'New scores', actions: ['re'] }] },
    gqa: { type: 'Topology comparison', mission: 'Reduce key/value heads and watch query heads share cache entries.', observation: 'Grouped-query attention cuts cache size by sharing keys and values, not queries.', scenarios: [{ label: 'Single KV head', controls: { kv: 1 } }] },
    mla: { type: 'Algebra check', mission: 'Re-roll the example and compare the expanded and absorbed paths again.', observation: 'The same linear algebra can move work from cached keys and values into the query.', scenarios: [{ label: 'Re-roll proof', actions: ['re'] }] },
    linattn: { type: 'Memory experiment', mission: 'Lower the write strength and compare additive memory with overwrite-aware memory.', observation: 'A delta rule can replace a value at a key instead of endlessly accumulating it.', scenarios: [{ label: 'Partial overwrite', controls: { beta: 0.35 } }, { label: 'Forget', controls: { alpha: 0.5 } }] },
    router: { type: 'Routing sandbox', mission: 'Change top-k and see how many experts receive each token.', observation: 'Sparse routing changes active compute while all experts still occupy memory.', scenarios: [{ label: 'Top-1 routing', controls: { K: 1 } }, { label: 'More experts', controls: { E: 16 } }] },
    moecalc: { type: 'Sparse-compute calculator', mission: 'Change top-k and separate total weights from the weights used for one token.', observation: 'MoE earns scale by decoupling capacity from per-token compute.', scenarios: [{ label: 'Top-1', controls: { K: 1 } }, { label: '8-bit weights', controls: { bp: 1 } }] },
    fpformat: { type: 'Number lab', mission: 'Try a tiny value and a huge value to expose rounding, underflow, and clipping.', observation: 'Exponent bits buy range; mantissa bits buy precision between nearby values.', scenarios: [{ label: 'Tiny value', controls: { x: '0.00001' } }, { label: 'Overflow', controls: { x: '1000000' } }] },
    quant: { type: 'Error experiment', mission: 'Add an outlier and compare a global scale with block-wise quantization.', observation: 'Block scales localize the precision damage caused by an outlier.', scenarios: [{ label: 'Extreme outlier', controls: { o: 35 } }, { label: 'Global int4', controls: { sch: 'i4' } }] },
    chinchilla: { type: 'Scaling-law lab', mission: 'Select a published point, then compare its data-to-parameter ratio with the optimum.', observation: 'Undertraining and overtraining are both visible as an imbalanced compute split.', scenarios: [{ label: 'Gopher', actions: ['b'] }, { label: 'Llama 3', actions: ['c'] }] },
    dpo: { type: 'Preference loss lab', mission: 'Reverse a preference margin and compare how reward-model and DPO losses respond.', observation: 'Both losses reward relative preference, but DPO expresses it through policy odds.', scenarios: [{ label: 'Reverse reward', controls: { rw: -1, rl: 1 } }, { label: 'Strong DPO margin', controls: { a: 2, b: -2 } }] },
    grpo: { type: 'RL experiment', mission: 'Toggle rewards to change the group baseline, then push a ratio past its clip limit.', observation: 'GRPO centers rewards within a group; PPO clipping limits how far one update can move.', scenarios: [{ label: 'Hit clip limit', controls: { r: 1.7, A: 1, eps: 0.1 } }] },
    lora: { type: 'Adaptation calculator', mission: 'Raise rank and see how quickly trainable memory approaches a full update.', observation: 'LoRA replaces a large update matrix with two narrow trainable matrices.', scenarios: [{ label: 'Rank 64', controls: { r: 64 } }, { label: 'Adapt all layers', controls: { p: 'all' } }] },
    rag: { type: 'Security exercise', mission: 'Keep the poisoned document, raise retrieval depth, and inspect the assembled prompt.', observation: 'Retrieval can place untrusted instructions beside trusted data; ranking is not authorization.', scenarios: [{ label: 'Retrieve four', controls: { k: 4 } }, { label: 'Remove poison', controls: { poison: false } }] },
    fgsm: { type: 'Adversarial experiment', mission: 'Raise dimension while keeping each feature change tiny until the margin flips.', observation: 'Coordinated small changes add in a high-dimensional direction; random changes mostly cancel.', scenarios: [{ label: 'High dimension', controls: { d: 5 } }, { label: 'Tiny epsilon', controls: { eps: 0.005 } }] },
    sampling: { type: 'Sampling sandbox', mission: 'Cool the distribution, then constrain it with top-p or top-k and compare the survivors.', observation: 'Temperature reshapes all odds; top-p and top-k remove low-probability options.', scenarios: [{ label: 'Precise', controls: { t: 0.3, p: 1, k: 8 } }, { label: 'Narrow top-k', controls: { k: 2 } }] },
    ci: { type: 'Uncertainty calculator', mission: 'Hold the observed rate fixed while increasing trials to see uncertainty contract.', observation: 'A point estimate needs its denominator; certainty comes from repeated evidence.', scenarios: [{ label: 'Small sample', controls: { n: 10, x: 1 } }, { label: 'Large sample', controls: { n: 1000, x: 100 } }] },
    trainer: { type: 'Training microscope', mission: 'Take a few steps, then change the rate until the loss behavior tells you it is unsafe.', observation: 'A gradient update is measurable: true-token probabilities move and every matrix receives a different-sized update.' },
    compare: { type: 'Architecture comparison', mission: 'Choose a scale metric, then remove models to make the trade-off legible.', observation: 'Model size, active compute, and architecture are different axes—not one ranking.' },
  };

  function apply(widget, controls) {
    Object.entries(controls || {}).forEach(([key, value]) => {
      const control = widget.querySelector('[data-k="' + CSS.escape(key) + '"]');
      if (!control) return;
      if (control.type === 'checkbox') control.checked = Boolean(value); else control.value = value;
      control.dispatchEvent(new Event(control.tagName === 'SELECT' || control.type === 'checkbox' ? 'change' : 'input', { bubbles: true }));
    });
  }
  function decorate(widget, name) {
    const item = R[name]; if (!item || widget.dataset.interactionReady) return;
    widget.dataset.interactionReady = 'true';
    const frame = document.createElement('aside'); frame.className = 'interaction-frame'; frame.setAttribute('aria-label', item.type + ': ' + item.mission);
    const scenarios = (item.scenarios || []).map((scenario, index) => '<button class="interaction-scenario" type="button" data-scenario="' + index + '">' + scenario.label + '</button>').join('');
    frame.innerHTML = '<div class="interaction-topline"><span>' + item.type + '</span><button type="button" class="interaction-reset" data-reset>Start over</button></div><p class="interaction-mission">' + item.mission + '</p>' + (scenarios ? '<div class="interaction-scenarios" role="group" aria-label="Suggested experiments"><span>Try:</span>' + scenarios + '</div>' : '') + '<p class="interaction-observation"><b>Notice:</b> ' + item.observation + '</p>';
    const title = widget.querySelector(':scope > .wt'); (title || widget.firstChild).after(frame);
    frame.addEventListener('click', event => {
      const button = event.target.closest('button'); if (!button) return;
      if (button.hasAttribute('data-reset')) { widget.querySelector('[data-a="reset"], [data-reset]')?.click(); return; }
      const scenario = item.scenarios?.[Number(button.dataset.scenario)]; if (!scenario) return;
      apply(widget, scenario.controls);
      (scenario.actions || []).forEach(action => widget.querySelector('[data-a="' + CSS.escape(action) + '"]')?.click());
      frame.querySelectorAll('[data-scenario]').forEach(candidate => candidate.classList.toggle('is-active', candidate === button));
      frame.querySelector('.interaction-observation').innerHTML = '<b>What changed:</b> ' + item.observation;
    });
  }
  window.ITMInteractions = { decorate, registry: R };
})();
