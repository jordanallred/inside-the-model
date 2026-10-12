---
title: "Run an automated LLM vulnerability scanner"
description: "Run an open-source scanner on a local model and learn to critique its output"
sidebar:
  label: "Lab 9. Run an automated LLM vulnerability scanner"
---

_Run an open-source scanner on a local model and learn to critique its output_

Lab 9 of 10 · about 45 minutes · runs on a laptop. **Related chapters:** [20. Attacks on language models and their defenses](/guide/security/) · [21. Evaluating models and systems](/guide/evaluation/)

Open-source scanners like **garak** and Microsoft's **PyRIT** automate probe libraries (injection, encoding, leakage, jailbreaks). Run one against your local model so you know what the tooling does and does not find.

~~~bash
pip install garak
python -m garak --help          # check current flags; they change between versions
python -m garak --model_type huggingface --model_name gpt2 --probes promptinject
~~~

Read the report. Which probes succeeded? Which successes are meaningful for a real deployment and which are noise? Being able to critique scanner output is a more useful skill than being able to run it.
