---
title: "Controlled prompt comparisons"
description: Two explanations fit the same prediction. Design a comparison that makes them disagree, then inspect the model's measured response.
---

After **the cat sat on the**, the model favors a place. Perhaps **sat** carries the signal. Perhaps **on** does. Both explanations fit the starting example.

Enter a prompt pair to measure your own comparison, or select a worked design with fixed example inputs. A dramatic change in a prediction can still leave the cause unclear if you changed two things at once.

<div class="widget not-content" data-w="casecontrols" data-title="Design a discriminating control"><p data-widget-fallback>The interactive experiment uses JavaScript. If it does not appear, enable JavaScript or reload. You can also <a href="/guide/attention/">read how attention works</a>.</p></div>

## Evidence has a scope

Some probes deliberately leave the grammar used for training. That lets us challenge a hypothesis, but it means the model's response describes this trained model under these inputs, rather than a rule about English. The position-preserving worked design replaces one token at a time: sat → saw, then on → and. All token positions stay fixed. The and probe is outside the grammar; the result does not prove that prepositions never matter in other contexts.
