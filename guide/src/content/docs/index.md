---
title: See exactly how LLMs work
description: An interactive guide to the calculations, code, training, and inference behind large language models.
template: splash
head:
  - tag: style
    content: ":root { --sl-content-width: 78rem; }"
---

<div class="home-landing">
<header class="home-stage" data-home-hero>
  <div class="home-stage-inner">
    <div class="home-hero-copy">
      <h1>See exactly<br>how LLMs work.</h1>
      <p class="home-tagline">From text to tensors to understanding.</p>
      <p class="home-deck">An interactive guide to the calculations, code, training, and inference behind large language models.</p>
      <div class="home-actions">
        <a class="home-action-primary" href="/explorer/">Open the Model Explorer <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
        <a class="home-action-secondary" href="/guide/gradient-descent/">Start the guide <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
      </div>
    </div>
    <div class="home-specimen">
      <div class="widget hv not-content" data-w="homehero"></div>
      <span class="home-callout home-callout-attention">attention weight<br><small>from earlier tokens</small></span>
      <span class="home-callout home-callout-input">input token<br><small>selected</small></span>
      <span class="home-callout home-callout-output">next-token<br>probability</span>
    </div>
  </div>
  <div class="home-proof" role="list" aria-label="How this guide is verified">
    <div role="listitem"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 11l3.5-4M13.5 7l3.5 4M7 13l3.5 4M13.5 17l3.5-4"/><circle cx="12" cy="19" r="2"/></svg><span class="home-proof-copy"><b>26 operations</b><span>from prompt to next-token probabilities</span></span></div>
    <div role="listitem"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 9"/></svg><span class="home-proof-copy"><b>checked to 1e-9</b><span>against an independent implementation</span></span></div>
    <div role="listitem"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8h18M7 6h.01M10 6h.01"/></svg><span class="home-proof-copy"><b>runs in your browser</b><span>no installation or GPU required</span></span></div>
    <div role="listitem"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><span class="home-proof-copy"><b>progress stays private</b><span>everything remains in this browser</span></span></div>
  </div>
</header>

<section class="home-section home-routes" aria-labelledby="home-routes-title">
  <div class="home-section-heading">
    <h2 id="home-routes-title">Choose your way in</h2>
    <p>Same model. Different starting points. Follow the route that matches what you want to understand.</p>
  </div>
  <nav class="home-route-list" aria-label="Ways to begin">
    <a class="home-route home-route-explorer" href="/explorer/"><span><b>Follow a token</b><small>Trace one prompt through the model's actual calculations.</small></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
    <a class="home-route home-route-guide" href="/guide/gradient-descent/"><span><b>Read the chapters</b><small>Build the ideas from gradients to evaluation, in order.</small></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
    <a class="home-route home-route-labs" href="/labs/"><span><b>Run hands-on labs</b><small>Change inputs, inspect tensors, and test the ideas yourself.</small></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
  </nav>
</section>

<section class="home-section home-inspection" aria-labelledby="home-inspection-title">
  <div class="home-inspection-intro">
    <h2 id="home-inspection-title">Every number has a way back</h2>
    <p>The Explorer does not animate a story over a black box. It exposes the values the model actually computed, then lets you inspect the same operation as a diagram, an equation, or code.</p>
    <p class="home-verification">The browser engine is checked against the NumPy reference implementation to within 1e-9. Hand-written backpropagation is checked against finite differences.</p>
    <p class="home-why-small"><b>Why so small?</b> The model has 4,496 trained parameters. That is small enough to show every value and check each one against an independent implementation, and it is built from the same operations as production transformers. Larger models can be watched; this one can be checked.</p>
  </div>
  <div class="home-inspection-list">
    <a class="home-inspection-row home-inspection-trace" href="/explorer/"><span>Trace</span><b>Follow a token through 26 operations</b><small>Pick the token, layer, and head. Share the exact state as a link.</small></a>
    <a class="home-inspection-row home-inspection-math" href="/explorer/#step=5&amp;t=3&amp;l=0&amp;h=0&amp;v=math"><span>Math</span><b>Recompute one attention score by hand</b><small>See the real q, k, and v values substituted into each equation.</small></a>
    <a class="home-inspection-row home-inspection-code" href="/explorer/#step=7&amp;t=3&amp;l=0&amp;h=0&amp;v=code"><span>Code</span><b>Read the reference implementation</b><small>The current operation is highlighted in the NumPy reference, with downloadable test fixtures.</small></a>
    <a class="home-inspection-row home-inspection-compare" href="/explorer/#step=25&amp;t=5&amp;l=1&amp;h=0&amp;v=visual&amp;w=random"><span>Compare</span><b>See what training changes</b><small>Run the same arithmetic with trained and random weights.</small></a>
  </div>
</section>

<section class="home-section home-curriculum" aria-labelledby="home-curriculum-title">
  <div class="home-curriculum-intro">
    <h2 id="home-curriculum-title">The complete route</h2>
    <p>21 chapters · about 13.5 hours</p>
    <p>Start with functions and gradients, finish with modern systems, security, and honest evaluation. Every chapter works through concrete numbers before stating the general rule.</p>
    <a href="/guide/gradient-descent/">Begin with chapter one <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
  </div>
  <div class="home-curriculum-list">
<section class="home-curriculum-part"><header><span>01</span><div><h3>Foundations</h3><p>Functions, gradients, networks, probability and tokens. Everything later is built from these.</p></div><small>165 min</small></header><ol><li><span>1</span><a href="/guide/gradient-descent/">Functions, parameters and gradient descent</a><small>30 min</small></li><li><span>2</span><a href="/guide/neural-networks/">Neural networks and the multilayer perceptron</a><small>35 min</small></li><li><span>3</span><a href="/guide/backpropagation/">Backpropagation and optimizers</a><small>40 min</small></li><li><span>4</span><a href="/guide/softmax-and-loss/">Probability, softmax and next-token prediction</a><small>30 min</small></li><li><span>5</span><a href="/guide/tokens-and-embeddings/">Tokens and embeddings</a><small>30 min</small></li></ol></section>
<section class="home-curriculum-part"><header><span>02</span><div><h3>The transformer</h3><p>Attention, the block, position, and the complete model.</p></div><small>160 min</small></header><ol><li><span>6</span><a href="/guide/attention/">Attention</a><small>45 min</small></li><li><span>7</span><a href="/guide/transformer-block/">The transformer block</a><small>40 min</small></li><li><span>8</span><a href="/guide/rope/">Position and rotary embeddings</a><small>40 min</small></li><li><span>9</span><a href="/guide/full-model/">The full model and its training loop</a><small>35 min</small></li></ol></section>
<section class="home-curriculum-part"><header><span>03</span><div><h3>Fast attention and inference</h3><p>Why generation is memory-bound, and the designs that cut the cost.</p></div><small>145 min</small></header><ol><li><span>10</span><a href="/guide/kv-cache/">Generating text: the KV cache and inference cost</a><small>35 min</small></li><li><span>11</span><a href="/guide/gqa-and-mla/">Grouped-query and latent attention</a><small>35 min</small></li><li><span>12</span><a href="/guide/flashattention/">FlashAttention</a><small>30 min</small></li><li><span>13</span><a href="/guide/sparse-and-linear-attention/">Local, sparse and linear attention; state-space models</a><small>45 min</small></li></ol></section>
<section class="home-curriculum-part"><header><span>04</span><div><h3>Scaling the network</h3><p>Experts and low-precision numbers.</p></div><small>80 min</small></header><ol><li><span>14</span><a href="/guide/mixture-of-experts/">Mixture of experts</a><small>40 min</small></li><li><span>15</span><a href="/guide/low-precision/">Floating point and quantization</a><small>40 min</small></li></ol></section>
<section class="home-curriculum-part"><header><span>05</span><div><h3>Training</h3><p>Pretraining at scale, post-training and adaptation.</p></div><small>115 min</small></header><ol><li><span>16</span><a href="/guide/pretraining/">Pretraining at scale</a><small>40 min</small></li><li><span>17</span><a href="/guide/post-training/">Post-training: instruction tuning, preferences and reinforcement learning</a><small>50 min</small></li><li><span>18</span><a href="/guide/lora/">Adapting models: LoRA, QLoRA and distillation</a><small>25 min</small></li></ol></section>
<section class="home-curriculum-part"><header><span>06</span><div><h3>Systems</h3><p>Prompting, retrieval, tools and agents.</p></div><small>40 min</small></header><ol><li><span>19</span><a href="/guide/applications/">Prompting, retrieval, tools, agents and MCP</a><small>40 min</small></li></ol></section>
<section class="home-curriculum-part"><header><span>07</span><div><h3>Security and evaluation</h3><p>The attacks and defenses, tied back to the papers, and how to measure any of it honestly.</p></div><small>105 min</small></header><ol><li><span>20</span><a href="/guide/security/">Attacks on language models and their defenses</a><small>60 min</small></li><li><span>21</span><a href="/guide/evaluation/">Evaluating models and systems</a><small>45 min</small></li></ol></section>
  </div>
</section>

<section class="home-resources" aria-labelledby="home-resources-title">
  <div><h2 id="home-resources-title">Go from the toy model to the real thing</h2><p>The teaching model is deliberately tiny and says so wherever it differs from production systems. Keep going with real architectures, reproducible labs, security guidance, and the primary literature.</p></div>
  <nav aria-label="More resources">
    <a href="/teardown/"><b>Model teardowns</b><span>gpt-oss-120b and DeepSeek-V3, layer by layer</span></a>
    <a href="/labs/"><b>Hands-on labs</b><span>10 reproducible exercises</span></a>
    <a href="/reference/security-guidance/"><b>Public security guidance</b><span>NSA, CISA, and allied agencies</span></a>
    <a href="/reference/papers/"><b>All papers</b><span>118 linked references with chapter citations</span></a>
  </nav>
  <p class="home-sourcing">Every paper is linked (all but three textbooks to arXiv), and each arXiv id and title was checked against the arXiv API. Statements about specific models come from technical reports or model cards; anything that could not be confirmed is marked.</p>
</section>
</div>
