---
title: Run the model in your IDE
description: Download the teaching model, weights and a locked Python project. Open it in your preferred editor and run a comparison with uv.
---

The browser is the easiest place to explore. Use the local project when you want to set a breakpoint, change the arithmetic or build an experiment of your own.

**[Download the Python starter project](/code/inside-the-model-starter.zip)**

It includes the NumPy reference implementation, model configuration, trained weights, an editable experiment and a locked dependency file. No repository clone, GPU, model account or API key is needed.

## Open and run

1. [Install uv](https://docs.astral.sh/uv/getting-started/installation/) if you do not have it.
2. Extract the ZIP and open its `inside-the-model` folder in your IDE.
3. Open the IDE's terminal in that folder and run:

```sh
uv sync --locked
uv run experiment.py
```

uv creates `.venv` and can install Python 3.12 if needed. The first setup downloads Python/packages; subsequent experiments run locally on CPU with the included weights.

The experiment prints the most likely next tokens, changes temperature without changing weights, and compares two suffixes while holding the measured prefix fixed. A changed-prefix positive control checks that the measurement can detect a difference.

## Make it yours

Edit `PROMPT` and `TEMPERATURE` in `experiment.py`, then rerun it. Set a breakpoint in `itm_model.py` and follow its `# step:` comments alongside the [browser Explorer](/explorer/).

For editor Run/Debug controls, select the Python interpreter inside `.venv`: `.venv/Scripts/python.exe` on Windows or `.venv/bin/python` on macOS/Linux. VS Code, Cursor and PyCharm can open this folder and use that interpreter; the terminal commands work regardless of editor choice.

The model has a 25-token vocabulary and a small synthetic grammar. It makes its arithmetic inspectable; it does not reproduce the capabilities of a production assistant. For a larger, pinned model, use the [GPT-2 reproduction](/replications/gpt2-causality/).

See [Python development with Astral](/python-tools/) to add Ruff and ty, and [methods and provenance](/methods/) for what the browser/reference comparison verifies.
