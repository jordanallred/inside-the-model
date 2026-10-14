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
      <p class="home-deck">A language model predicts the next token. This guide works through how it gets there, from the first gradient to the final probabilities.</p>
      <div class="home-actions">
        <a class="home-action-primary" href="/explorer/">Open the Model Explorer <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
        <a class="home-action-secondary" href="/guide/gradient-descent/">Start the guide <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
      </div>
      <p class="home-reading-note">21 chapters, with worked examples and a model you can take apart.</p>
    </div>
    <figure class="home-specimen">
      <div class="widget hv not-content" data-w="homehero"></div>
      <figcaption><b>Try it:</b> select a token above. The attention weights and next-token probabilities come from a trained, two-layer teaching model running in this browser.</figcaption>
    </figure>
  </div>
  <div class="home-proof">
    <p>No installation or GPU needed. Your reading progress stays in this browser.</p>
    <a href="#home-inspection-title">How the calculations are checked <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
  </div>
</header>

<section class="home-section home-routes" aria-labelledby="home-routes-title">
  <div class="home-section-heading">
    <h2 id="home-routes-title">Where to start</h2>
    <p>Read in order if the maths is new to you. If you already know the basics, go straight to the model or a lab.</p>
  </div>
  <nav class="home-route-list" aria-label="Ways to begin">
    <a class="home-route home-route-explorer" href="/explorer/"><span><b>Follow a token</b><small>Trace one prompt through the model's actual calculations.</small></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
    <a class="home-route home-route-guide" href="/guide/gradient-descent/"><span><b>Read the chapters</b><small>Build the ideas from gradients to evaluation, in order.</small></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
    <a class="home-route home-route-labs" href="/labs/"><span><b>Run hands-on labs</b><small>Change inputs, inspect tensors, and test the ideas yourself.</small></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></a>
  </nav>
</section>

<section class="home-section home-inspection" aria-labelledby="home-inspection-title">
  <div class="home-inspection-intro">
    <h2 id="home-inspection-title">A small model, fully worked out</h2>
    <p>The Explorer follows a prompt through 26 operations. At each step, you can inspect the calculated values, substitute them into the equation, or read the NumPy code.</p>
    <p class="home-verification">The browser engine is checked against the NumPy reference implementation to within 1e-9. Hand-written backpropagation is checked against finite differences.</p>
    <p class="home-why-small"><b>Why 4,496 parameters?</b> A model this small lets you inspect every value and check it independently. It uses the same operations as production transformers; the chapters explain where larger architectures differ.</p>
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
    <h2 id="home-curriculum-title">The chapters</h2>
    <p>21 chapters · about 13.5 hours</p>
    <p>The guide starts with functions and gradients, then builds a transformer piece by piece. Later chapters cover training, inference, security, and evaluation.</p>
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
  <div><h2 id="home-resources-title">Further reading &amp; practice</h2><p>Compare the teaching model with published architectures, work through a lab, or look up the papers behind a chapter.</p></div>
  <nav aria-label="More resources">
    <a href="/teardown/"><b>Model teardowns</b><span>gpt-oss-120b and DeepSeek-V3, layer by layer</span></a>
    <a href="/labs/"><b>Hands-on labs</b><span>10 reproducible exercises</span></a>
    <a href="/reference/security-guidance/"><b>Public security guidance</b><span>NSA, CISA, and allied agencies</span></a>
    <a href="/reference/papers/"><b>All papers</b><span>119 linked references with chapter citations</span></a>
  </nav>
  <p class="home-sourcing">Every paper is linked (all but three textbooks to arXiv), and each arXiv id and title was checked against the arXiv API. Statements about specific models come from technical reports or model cards; anything that could not be confirmed is marked.</p>
</section>
</div>
