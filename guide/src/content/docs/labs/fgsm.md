---
title: "Adversarial examples with FGSM"
description: "One gradient step on the input flips a classifier"
sidebar:
  label: "Lab 6. Adversarial examples with FGSM"
---

_One gradient step on the input flips a classifier_

Lab 6 of 10 · about 30 minutes · runs on a laptop. **Related chapters:** [20. Attacks on language models and their defenses](/guide/security/) · [3. Backpropagation and optimizers](/guide/backpropagation/)

~~~bash
pip install torch torchvision
~~~

~~~python
import torch, torch.nn as nn, torch.nn.functional as F
from torchvision import datasets, transforms
tf = transforms.ToTensor()
train = datasets.MNIST('.', train=True, download=True, transform=tf)
test = datasets.MNIST('.', train=False, download=True, transform=tf)
model = nn.Sequential(nn.Flatten(), nn.Linear(784,256), nn.ReLU(), nn.Linear(256,10))
opt = torch.optim.Adam(model.parameters(), 1e-3)
loader = torch.utils.data.DataLoader(train, batch_size=128, shuffle=True)
for epoch in range(2):
    for x, y in loader:
        opt.zero_grad(); F.cross_entropy(model(x), y).backward(); opt.step()

def fgsm(x, y, eps):
    x = x.clone().requires_grad_(True)
    F.cross_entropy(model(x), y).backward()
    return (x + eps * x.grad.sign()).clamp(0, 1).detach()

x, y = next(iter(torch.utils.data.DataLoader(test, batch_size=2000)))
for eps in [0, 0.05, 0.1, 0.2, 0.3]:
    adv = fgsm(x, y, eps)
    print(eps, (model(adv).argmax(1) == y).float().mean().item())
~~~

**Extensions:** turn FGSM into PGD (loop with a small step, project back into the $\epsilon$-ball); adversarially train and re-plot accuracy vs $\epsilon$; test whether attacks crafted on this model fool a second independently trained one (transferability).
