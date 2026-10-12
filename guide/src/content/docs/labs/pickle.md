---
title: "Why loading a pickled model can run code"
description: "See the risk in a disposable environment, then compare with a data-only format"
sidebar:
  label: "Lab 7. Why loading a pickled model can run code"
---

_See the risk in a disposable environment, then compare with a data-only format_

Lab 7 of 10 · about 20 minutes · runs on a laptop. **Related chapters:** [20. Attacks on language models and their defenses](/guide/security/)

~~~python
import pickle
class Evil:
    def __reduce__(self):
        return (print, ("code ran during load",))   # an attacker would run a command
blob = pickle.dumps(Evil())
pickle.loads(blob)        # prints: code ran during load
~~~

That is all it takes: loading a pickled "model" executes whatever the file's author put there. Now compare:

~~~bash
pip install safetensors torch
~~~

~~~python
from safetensors.torch import save_file, load_file
import torch
save_file({"w": torch.randn(2, 2)}, "m.safetensors")
print(load_file("m.safetensors"))     # tensors only, no code path
~~~

Also try `torch.load(path, weights_only=True)` on a pickle-based checkpoint. Write down what a defender's policy should be: allowed formats, scanning, sandboxed first load, hash pinning.
