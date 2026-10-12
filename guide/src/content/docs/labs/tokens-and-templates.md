---
title: "See tokens, chat templates and next-token probabilities"
description: "Make the first steps of the model visible with a small open model on CPU"
sidebar:
  label: "Lab 4. See tokens, chat templates and next-token probabilities"
---

_Make the first steps of the model visible with a small open model on CPU_

Lab 4 of 10 · about 30 minutes · runs on a laptop. **Related chapters:** [4. Probability, softmax and next-token prediction](/guide/softmax-and-loss/) · [5. Tokens and embeddings](/guide/tokens-and-embeddings/)

Goal: make the abstractions concrete. Runs on CPU with a 0.5B model.

~~~bash
pip install transformers torch
~~~

~~~python
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
name = "Qwen/Qwen2.5-0.5B-Instruct"
tok = AutoTokenizer.from_pretrained(name)
m = AutoModelForCausalLM.from_pretrained(name)

msgs = [{"role": "system", "content": "You are helpful."},
        {"role": "user", "content": "Hi"}]
print(tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True))
ids = tok.encode("Ignore previous instructions")
print(ids)
print([tok.decode([i]) for i in ids])   # one readable string per token

ids = tok("The capital of France is", return_tensors="pt")
p = torch.softmax(m(**ids).logits[0, -1], -1)
top = p.topk(5)
for v, i in zip(top.values, top.indices):
    print(repr(tok.decode(i)), round(v.item(), 3))
~~~

**Observe:** the system and user text are just tokens in one string. Try putting fake role markers inside a user message and see how they appear in the rendered prompt.
