---
title: "Membership inference with a loss threshold"
description: "Measure how much a model leaks about its training set"
sidebar:
  label: "Lab 8. Membership inference with a loss threshold"
---

_Measure how much a model leaks about its training set_

Lab 8 of 10 · about 30 minutes · runs on a laptop. **Related chapters:** [20. Attacks on language models and their defenses](/guide/security/)

~~~python
import numpy as np
from sklearn.datasets import load_digits
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import roc_auc_score

X, y = load_digits(return_X_y=True); X = X / 16
idx = np.random.RandomState(0).permutation(len(X))
mem, non = idx[:100], idx[100:200]
clf = MLPClassifier((256,), max_iter=500, random_state=0).fit(X[mem], y[mem])

def loss(i):
    p = clf.predict_proba(X[i])[np.arange(len(i)), y[i]]
    return -np.log(np.clip(p, 1e-12, 1))

scores = -np.concatenate([loss(mem), loss(non)])   # low loss means "member"
labels = np.r_[np.ones(100), np.zeros(100)]
print("AUC", roc_auc_score(labels, scores))   # about 0.75 for this split; other splits give roughly 0.6 to 0.8
~~~

The model has memorized its 100 training digits (100% training accuracy against about 92% on the others), and that gap is the signal the attack reads.

**Then:** try a stronger L2 penalty (`alpha=1`, then `alpha=3`) and earlier stopping (`max_iter=10`, then `20`), and print held-out accuracy next to each AUC. Averaged over five different splits, moderate L2 barely moves the AUC (about 0.70 down to 0.68), while stopping early lowers it toward 0.6 but wrecks the model (held-out accuracy 46% at `max_iter=10`). Privacy defenses trade utility. Compute the true-positive rate at 1% false-positive rate from `roc_curve`, the number [chapter 20](/guide/security/) says to report. Then train on 300 examples instead of 100: the AUC falls to about 0.6 by itself, because a model that generalizes leaks less. Discuss: what changes with a model trained on millions of examples?
