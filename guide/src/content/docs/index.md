---
title: See exactly how LLMs work
description: An interactive guide to the calculations, code, training, and inference behind large language models.
template: splash
head:
  - tag: style
    content: ":root { --sl-content-width: 74rem; }"
hero:
  tagline: From text to tensors to understanding. An interactive guide to the calculations, code, training, and inference behind large language models.
  image:
    html: '<div class="widget hv not-content" data-w="homehero"></div>'
  actions:
    - text: Open the Model Explorer
      link: /explorer/
      icon: right-arrow
    - text: Start the guide
      link: /guide/gradient-descent/
      variant: secondary
    - text: Hands-on labs
      link: /labs/
      variant: minimal
---

<div class="home-stats">
<div><b>21</b><span>chapters, about 13.5 hours</span></div>
<div><b>10</b><span>hands-on labs</span></div>
<div><b>2</b><span>layer-by-layer teardowns</span></div>
<div><b>118</b><span>papers, each linked</span></div>
</div>

## Every number is inspectable

A small transformer runs in your browser, and every value it computes is on the screen. Nothing is animated for effect: if a number appears, you can see where it came from.

<div class="home-cards">
<a class="hc hc-flow" href="/explorer/"><span class="hc-k">Trace</span><b>Follow a token through 26 operations</b><span>Step from prompt to next-token probabilities. Pick the token, layer and head, and share the exact state as a link.</span></a>
<a class="hc hc-attn" href="/explorer/#step=5&t=3&l=0&h=0&v=math"><span class="hc-k">Math</span><b>Recompute it by hand</b><span>The real q, k and v values are substituted into each equation, so one attention score can be checked on paper.</span></a>
<a class="hc hc-in" href="/explorer/#step=7&t=3&l=0&h=0&v=code"><span class="hc-k">Code</span><b>Read the reference implementation</b><span>The operation you are inspecting is highlighted in plain JavaScript, with downloadable test fixtures.</span></a>
<a class="hc hc-out" href="/explorer/#step=25&t=5&l=1&h=0&v=visual&w=random"><span class="hc-k">Compare</span><b>Trained against random weights</b><span>Run the identical arithmetic with and without learning, and see exactly what training changes.</span></a>
</div>

The browser engine is checked against an independent NumPy implementation to within 1e-9, and the hand-written backpropagation is checked against finite differences. The model is deliberately tiny and says so wherever it differs from production systems.

## Start where you are

<div class="home-paths">
<a href="/guide/gradient-descent/"><b>Curious beginner</b><span>Start with functions and gradients. Needs calculus and linear algebra, but no machine-learning background.</span></a>
<a href="/explorer/"><b>Software engineer</b><span>Connect tensor shapes and operations to code in the Explorer and the labs.</span></a>
<a href="/teardown/"><b>ML practitioner</b><span>Verify the mathematics, then compare against real open-weight models.</span></a>
<a href="/labs/"><b>Instructor or student</b><span>Share reproducible examples by link, then check understanding with the challenges and labs.</span></a>
</div>

## Curriculum

Each chapter opens with a box saying who can skip it, works through numbers before stating general rules, includes widgets you can poke, and ends with the research behind it.

<div class="home-parts">
<section class="part"><span class="part-n">01</span><h3>Foundations</h3><p>Functions, gradients, networks, probability and tokens. Everything later is built from these.</p><ol><li><em>1.</em><a href="/guide/gradient-descent/">Functions, parameters and gradient descent</a><span>30 min</span></li><li><em>2.</em><a href="/guide/neural-networks/">Neural networks and the multilayer perceptron</a><span>35 min</span></li><li><em>3.</em><a href="/guide/backpropagation/">Backpropagation and optimizers</a><span>40 min</span></li><li><em>4.</em><a href="/guide/softmax-and-loss/">Probability, softmax and next-token prediction</a><span>30 min</span></li><li><em>5.</em><a href="/guide/tokens-and-embeddings/">Tokens and embeddings</a><span>30 min</span></li></ol></section>
<section class="part"><span class="part-n">02</span><h3>The transformer</h3><p>Attention, the block, position, and the complete model.</p><ol><li><em>6.</em><a href="/guide/attention/">Attention</a><span>45 min</span></li><li><em>7.</em><a href="/guide/transformer-block/">The transformer block</a><span>40 min</span></li><li><em>8.</em><a href="/guide/rope/">Position and rotary embeddings</a><span>40 min</span></li><li><em>9.</em><a href="/guide/full-model/">The full model and its training loop</a><span>35 min</span></li></ol></section>
<section class="part"><span class="part-n">03</span><h3>Fast attention and inference</h3><p>Why generation is memory-bound, and the designs that cut the cost.</p><ol><li><em>10.</em><a href="/guide/kv-cache/">Generating text: the KV cache and inference cost</a><span>35 min</span></li><li><em>11.</em><a href="/guide/gqa-and-mla/">Grouped-query and latent attention</a><span>35 min</span></li><li><em>12.</em><a href="/guide/flashattention/">FlashAttention</a><span>30 min</span></li><li><em>13.</em><a href="/guide/sparse-and-linear-attention/">Local, sparse and linear attention; state-space models</a><span>45 min</span></li></ol></section>
<section class="part"><span class="part-n">04</span><h3>Scaling the network</h3><p>Experts and low-precision numbers.</p><ol><li><em>14.</em><a href="/guide/mixture-of-experts/">Mixture of experts</a><span>40 min</span></li><li><em>15.</em><a href="/guide/low-precision/">Floating point and quantization</a><span>40 min</span></li></ol></section>
<section class="part"><span class="part-n">05</span><h3>Training</h3><p>Pretraining at scale, post-training and adaptation.</p><ol><li><em>16.</em><a href="/guide/pretraining/">Pretraining at scale</a><span>40 min</span></li><li><em>17.</em><a href="/guide/post-training/">Post-training: instruction tuning, preferences and reinforcement learning</a><span>50 min</span></li><li><em>18.</em><a href="/guide/lora/">Adapting models: LoRA, QLoRA and distillation</a><span>25 min</span></li></ol></section>
<section class="part"><span class="part-n">06</span><h3>Systems</h3><p>Prompting, retrieval, tools and agents.</p><ol><li><em>19.</em><a href="/guide/applications/">Prompting, retrieval, tools, agents and MCP</a><span>40 min</span></li></ol></section>
<section class="part"><span class="part-n">07</span><h3>Security and evaluation</h3><p>The attacks and defenses, tied back to the papers, and how to measure any of it honestly.</p><ol><li><em>20.</em><a href="/guide/security/">Attacks on language models and their defenses</a><span>60 min</span></li><li><em>21.</em><a href="/guide/evaluation/">Evaluating models and systems</a><span>45 min</span></li></ol></section>
</div>

## Also here

- [Model teardowns](/teardown/): follow one token through gpt-oss-120b and DeepSeek-V3, layer by layer, with their real configurations.
- [Hands-on labs](/labs/): 10 exercises that make the chapters concrete.
- [Public security guidance for AI systems](/reference/security-guidance/): what NSA, CISA and allied agencies have published.
- [All papers](/reference/papers/): every reference, with the chapters that cite it.

Every paper is linked (all but three textbooks to arXiv), and every arXiv id and title was checked against the arXiv API. Statements about specific models come from their technical reports or model cards, and anything that could not be confirmed is marked. Reading progress stays private to this browser.
