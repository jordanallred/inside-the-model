---
title: Understand language models by taking them apart
description: See how a language model turns a prompt into a prediction. Explore attention, training and sampling through live computations in your browser.
template: splash
head:
  - tag: style
    content: ":root { --sl-content-width: 78rem; }"
---

<div class="home-landing">
<header class="home-stage" data-home-hero>
  <div class="home-stage-inner">
    <div class="home-hero-copy">
      <h1>See how a language model turns text into a prediction.</h1>
      <p class="home-deck">Follow a prompt through a working model, from tokens to attention to next-word probabilities. Change the inputs, inspect the actual numbers, and understand what each step does. It all runs in your browser.</p>
      <div class="home-actions">
        <a class="home-action-primary" href="/explorer/">Open the Model Explorer</a>
        <a class="home-action-secondary" href="/cases/">Explore attention, training and sampling <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
      </div>
      <p class="home-reading-note">Start in the browser. Follow the equations and reproduce the measurements in Python when you want more depth.</p>
    </div>
    <figure class="home-specimen">
      <div class="widget hv not-content" data-w="homehero"><p data-home-static>A small, trained transformer runs here in your browser. <a href="/cases/place-or-animal/">Investigate its place prediction.</a></p></div>
      <figcaption>A real computation from our two-layer teaching model. Small enough to inspect every value; trained on a 25-token synthetic language.</figcaption>
    </figure>
  </div>
  <div class="home-proof">
    <p>Working experiments. Reproducible code. Progress saved in your browser.</p>
    <a href="#home-inspection-title">Inspect the evidence behind the model <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
  </div>
</header>

<section class="home-section home-routes" aria-labelledby="home-routes-title">
  <div class="home-section-heading">
    <h2 id="home-routes-title">Choose a question.<br>Test an explanation.</h2>
    <p>Compare sampling settings, model weights, information flow and component interventions. Every workbench is open: change the inputs, inspect the measurements, and decide what the evidence supports.</p>
  </div>
  <nav class="home-route-list" aria-label="Investigations in learning order">
    <a class="home-route home-case" href="/cases/place-or-animal/"><span class="home-case-number">01</span><span><b>The place detector</b><span class="home-case-question">Which head outputs affect the place prediction?</span><small>Compare output interventions with attention patterns</small><span class="home-case-status" data-case-status="place">Start investigation</span></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
    <a class="home-route home-case" href="/cases/what-training-changes/"><span class="home-case-number">02</span><span><b>What training changes</b><span class="home-case-question">Same model. Different weights. Different answer?</span><small>Compare predictions and measure loss</small><span class="home-case-status" data-case-status="training">Start investigation</span></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
    <a class="home-route home-case" href="/cases/hidden-future/"><span class="home-case-number">03</span><span><b>The hidden future</b><span class="home-case-question">Can an earlier token read words that come later?</span><small>Test information flow with a controlled change</small><span class="home-case-status" data-case-status="future">Start investigation</span></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
    <a class="home-route home-case" href="/cases/choose-the-control/"><span class="home-case-number">04</span><span><b>Choose the control</b><span class="home-case-question">Which experiment could distinguish two explanations?</span><small>Construct and compare your own prompt pair</small><span class="home-case-status" data-case-status="controls">Start investigation</span></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
    <a class="home-route home-case" href="/cases/necessary-and-sufficient/"><span class="home-case-number">05</span><span><b>Necessary—and sufficient?</b><span class="home-case-question">What does removing a component actually establish?</span><small>Separate necessity from conditional sufficiency</small><span class="home-case-status" data-case-status="sufficiency">Start investigation</span></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
    <a class="home-route home-case" href="/cases/confidence-without-learning/"><span class="home-case-number">06</span><span><b>Confidence without learning</b><span class="home-case-question">Can a prediction become more confident without learning?</span><small>Separate sampling settings from model knowledge</small><span class="home-case-status" data-case-status="confidence">Start investigation</span></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
  </nav>
</section>

<section class="home-section home-method" aria-labelledby="home-method-title">
  <div class="home-section-heading"><h2 id="home-method-title">Build an explanation you can test.</h2><p>You do the investigating. The site gives you the instruments, the evidence, and help when you need it.</p></div>
  <ol class="home-method-list">
    <li><b>Choose a baseline</b><p>Start with a concrete behavior and a comparison you can interpret. Form a prediction if it helps your reasoning.</p></li>
    <li><b>Intervene &amp; measure</b><p>Remove a head, swap weights, or change the input. Compare the actual probabilities and intermediate values.</p></li>
    <li><b>Interpret &amp; reproduce</b><p>Inspect the reasoning, test another context, and reproduce the comparison in Python. State what the evidence leaves unresolved.</p></li>
  </ol>
</section>

<section class="home-section home-inspection" aria-labelledby="home-inspection-title">
  <div class="home-inspection-intro">
    <h2 id="home-inspection-title">Small by design.<br>Open to inspection.</h2>
    <p>Our 4,496-parameter transformer makes its calculations visible. The six guided investigations use the same model, weights, and engine as the Model Explorer.</p>
    <p class="home-verification">The browser engine is checked against an independent NumPy implementation to within 1e-9. Hand-written backpropagation is checked against finite differences.</p>
    <p class="home-why-small">This model learns a tiny synthetic grammar. It does not have the capabilities of a production LLM. Each investigation explains what its evidence supports; architecture comparisons show where larger models differ.</p>
  </div>
  <div class="home-inspection-list">
    <a class="home-inspection-row" href="/explorer/"><span>Inspect</span><b>Trace a token through 26 operations</b><small>Move between calculated values, equations, and the reference code.</small></a>
    <a class="home-inspection-row" href="/labs/explorer-forward-pass/"><span>Reproduce</span><b>Match the model's numbers yourself</b><small>Download the weights and rebuild the forward pass in NumPy.</small></a>
    <a class="home-inspection-row" href="/teardown/compare/"><span>Connect</span><b>Bridge the teaching model and larger architectures</b><small>Understand which operations transfer and which design choices change.</small></a>
  </div>
</section>

<section class="home-resources" aria-labelledby="home-library-title">
  <div><h2 id="home-library-title">The reference behind the investigations.</h2><p>Go deeper when a question calls for it. The complete guide, labs, and model teardowns stay within reach.</p></div>
  <nav aria-label="Supporting library">
    <a href="#home-curriculum-title"><b>The complete guide</b><span>24 chapters, from gradients to evaluation</span></a>
    <a href="/labs/"><b>Hands-on labs</b><span>10 reproducible exercises</span></a>
    <a href="/teardown/"><b>Model teardowns</b><span>Published architectures, layer by layer</span></a>
    <a href="/reference/papers/"><b>Papers &amp; sources</b><span>151 linked references</span></a>
    <a href="/reference/security-guidance/"><b>Security guidance</b><span>Public guidance from security agencies</span></a>
    <a href="/run-locally/"><b>Run locally</b><span>Download the model and a ready-to-run Python experiment</span></a>
    <a href="/python-tools/"><b>Python tools</b><span>Develop with uv, Ruff and ty from Astral</span></a>
    <a href="/teach/"><b>Teach a workshop</b><span>Session plan, discussion rubric and instructor notes</span></a>
    <a href="/methods/"><b>Methods &amp; evidence</b><span>Verification, provenance and review status</span></a>
    <a href="/replications/gpt2-causality/"><b>Reproduce a GPT-2 experiment</b><span>Pinned weights, measured controls and a runnable notebook</span></a>
    <a href="/field-notes/"><b>Field notes</b><span>Practical questions connected to testable explanations</span></a>
    <a href="/cases/story-circuit/"><b>Further investigation</b><span>Who gets the ball? Trace a decision in the larger case-file model.</span></a>
  </nav>
</section>
<section class="home-section home-curriculum" aria-labelledby="home-curriculum-title">
  <div class="home-curriculum-intro"><h2 id="home-curriculum-title">Prefer a structured read?</h2><p>Build the foundations in order, or use the chapters as a reference beside an experiment.</p><a href="/guide/gradient-descent/">Start with the foundations <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a></div>
  <details class="home-syllabus"><summary>Browse all 24 chapters</summary><div class="home-curriculum-list"><section class="home-curriculum-part"><header><div><h3>Foundations</h3><p>Functions, gradients, networks, probability and tokens. Everything later is built from these.</p></div></header><ol><li><span>1</span><a href="/guide/gradient-descent/">Functions, parameters and gradient descent</a><small>30 min</small></li><li><span>2</span><a href="/guide/neural-networks/">Neural networks and the multilayer perceptron</a><small>35 min</small></li><li><span>3</span><a href="/guide/backpropagation/">Backpropagation and optimizers</a><small>40 min</small></li><li><span>4</span><a href="/guide/softmax-and-loss/">Probability, softmax and next-token prediction</a><small>30 min</small></li><li><span>5</span><a href="/guide/tokens-and-embeddings/">Tokens and embeddings</a><small>30 min</small></li></ol></section>
<section class="home-curriculum-part"><header><div><h3>The transformer</h3><p>Attention, the block, position, and the complete model.</p></div></header><ol><li><span>6</span><a href="/guide/attention/">Attention</a><small>45 min</small></li><li><span>7</span><a href="/guide/transformer-block/">The transformer block</a><small>40 min</small></li><li><span>8</span><a href="/guide/rope/">Position and rotary embeddings</a><small>40 min</small></li><li><span>9</span><a href="/guide/full-model/">The full model and its training loop</a><small>35 min</small></li></ol></section>
<section class="home-curriculum-part"><header><div><h3>Fast attention and inference</h3><p>Why generation is memory-bound, and the designs that cut the cost.</p></div></header><ol><li><span>10</span><a href="/guide/kv-cache/">Generating text: the KV cache and inference cost</a><small>35 min</small></li><li><span>11</span><a href="/guide/gqa-and-mla/">Grouped-query and latent attention</a><small>35 min</small></li><li><span>12</span><a href="/guide/flashattention/">FlashAttention</a><small>30 min</small></li><li><span>13</span><a href="/guide/sparse-and-linear-attention/">Local, sparse and linear attention; state-space models</a><small>45 min</small></li></ol></section>
<section class="home-curriculum-part"><header><div><h3>Scaling the network</h3><p>Experts and low-precision numbers.</p></div></header><ol><li><span>14</span><a href="/guide/mixture-of-experts/">Mixture of experts</a><small>40 min</small></li><li><span>15</span><a href="/guide/low-precision/">Floating point and quantization</a><small>40 min</small></li></ol></section>
<section class="home-curriculum-part"><header><div><h3>Training</h3><p>Pretraining at scale, post-training and adaptation.</p></div></header><ol><li><span>16</span><a href="/guide/pretraining/">Pretraining at scale</a><small>40 min</small></li><li><span>17</span><a href="/guide/post-training/">Post-training: instruction tuning, preferences and reinforcement learning</a><small>50 min</small></li><li><span>18</span><a href="/guide/lora/">Adapting models: LoRA, QLoRA and distillation</a><small>25 min</small></li></ol></section>
<section class="home-curriculum-part"><header><div><h3>Systems</h3><p>Prompting, retrieval, tools and agents.</p></div></header><ol><li><span>19</span><a href="/guide/applications/">Prompting, retrieval, tools, agents and MCP</a><small>40 min</small></li></ol></section>
<section class="home-curriculum-part"><header><div><h3>Security and evaluation</h3><p>The attacks and defenses, tied back to the papers, and how to measure any of it honestly.</p></div></header><ol><li><span>20</span><a href="/guide/security/">Attacks on language models and their defenses</a><small>60 min</small></li><li><span>21</span><a href="/guide/evaluation/">Evaluating models and systems</a><small>45 min</small></li></ol></section>
<section class="home-curriculum-part"><header><div><h3>Looking inside</h3><p>Reading what a trained model computes, finding the parts that do it, and changing them on purpose.</p></div></header><ol><li><span>22</span><a href="/guide/reading-the-residual-stream/">Reading the residual stream: lenses, probes and attribution</a><small>40 min</small></li><li><span>23</span><a href="/guide/features-and-circuits/">Features, superposition and circuits</a><small>50 min</small></li><li><span>24</span><a href="/guide/intervening/">Intervening: patching, steering, ablation and editing</a><small>50 min</small></li></ol></section></div></details>
</section>
</div>
