---
title: "Who gets the ball?"
description: In “tom and ann went to the park . ann gave a ball to”, the model answers tom, every time. Find the heads that make the choice, and how the model rules out the wrong person.
---

Read this story:

<code>tom and ann went to the park . ann gave a ball to</code> …

The next word has to be <code>tom</code>. Ann is giving the ball, so it goes to the other person. The case-file model gets this right in all 24 possible stories, every pair of names with either one giving the ball. It is the same kind of reasoning a real language model needs to finish “When Mary and John went to the store, John gave a drink to”.

Answering needs more than recognizing names. The model has to keep track of who is in the story, notice who is giving, and pick the other one. Your job is to find the parts of the model that make that choice, and work out how they make it.

<div class="widget not-content" data-w="casestory" data-title="Further investigation: Who gets the ball?"><p data-widget-fallback>The interactive experiment uses JavaScript. If it does not appear, enable JavaScript or reload. You can also <a href="/guide/attention/">read how attention works</a>.</p></div>

## New tools in this case

**Testing on every story at once.** One example can mislead: a head might matter for “tom and ann” and not for “sam and max”. Every switch here is tested on all 24 stories, and the numbers are totals over all of them.

**Two measures, not one.** Some heads break the model so badly that it stops expecting a name at all. That tells you the head matters, but not that it makes the choice you are studying. So the case tracks two things separately: whether the model still expects a name, and whether it prefers the right person over the giver. Choosing what to measure is a large part of real interpretability work.

**Reasoning from what a head can see.** An attention head reads vectors at token positions. In a later layer, those vectors can already contain information from earlier context. A strong attention weight identifies where a head reads, but does not establish which features it passes on. Compare attention with output interventions to constrain an explanation, while keeping those limits explicit.

**A stranger as the giver.** You can make someone who is not in the story give the ball, as in <code>tom and ann went to the park . sam gave a ball to</code>. The model never saw a sentence like that while training, so it is a fair test of any explanation you come up with.

## How this connects to real models

Researchers studying GPT-2 small, a real language model with 124 million parameters, found a circuit for exactly this kind of sentence <cite data-p="wang2022" data-s></cite>. Their model also rules out the repeated name, though by a different route: some heads notice which name appears twice, others stop later heads from attending to it, and “name mover” heads copy the remaining name into the answer. In GPT-2 the work is spread across 26 attention heads. The case-file model is small enough that you can find its version yourself, and it is free to solve the problem its own way.

## About the case-file model

This case uses the **case-file model**, a second model built for investigations. It has exactly the same architecture as the model in the [Model Explorer](/explorer/): 2 layers, 2 attention heads per layer, 16 numbers per word. It lives in a larger world, though, with 33 words instead of 25 and passages of up to 23 words instead of 15.

Its training sentences come from a grammar with three kinds of sentence:

- **Animal sentences**, the same as the Explorer model's: “the big cat sat on the mat”, “a dog chased the small bird”. About a third are followed by “then it” and a verb, or “then it was” and an adjective. Unlike in the Explorer model's world, that adjective must repeat the one the animal was given, as in “the red cat ran home . then it was red”.
- **Name sentences**, such as “tom sat on the bed” or “ann saw a cat”.
- **Name stories**: “tom and ann went to the park .” followed by one of them giving a ball to the other.

The model trained for 12,000 steps, each on 64 passages. Its loss on new passages is within 0.011 of the best any model could reach on this grammar, which can be computed exactly because the grammar's probabilities are known.

We trained 24 copies of it from different random starting points and chose the one whose mechanisms are clearest to investigate. All 24 learned the stories almost perfectly, but where each copy put the work differed. In this one, the elimination step sits in a single head; in others it was shared across several. The grammar, the training script and the choice of copy are all in the repository: `tools/case_grammar.py`, `tools/train_model.py --case` and `public/trace/case-model.json`.
