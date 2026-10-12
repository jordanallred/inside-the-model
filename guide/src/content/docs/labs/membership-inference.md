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
mem, non = idx[:300], idx[300:600]
clf = MLPClassifier((256,), max_iter=500, random_state=0).fit(X[mem], y[mem])

def loss(i):
    p = clf.predict_proba(X[i])[np.arange(len(i)), y[i]]
    return -np.log(np.clip(p, 1e-12, 1))

scores = -np.concatenate([loss(mem), loss(non)])   # low loss means "member"
labels = np.r_[np.ones(300), np.zeros(300)]
print("AUC", roc_auc_score(labels, scores))
~~~

**Then:** add L2 regularization or fewer epochs and watch AUC fall toward 0.5. Compute TPR at 1% FPR from the ROC curve. Discuss: what changes with a model trained on millions of examples?
