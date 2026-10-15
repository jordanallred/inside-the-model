---
title: Python development with Astral
description: Use uv for Python and environments, Ruff for linting and formatting, and ty for type checking when extending the experiments.
---

We recommend Astral's Python tools when you reproduce or extend an experiment. Start with **uv** to manage Python, packages and environments. Add **Ruff** for linting and formatting, and **ty** for type checking as your code grows. The browser investigations need none of these tools.

## Run the NumPy reference

[Install uv using Astral's instructions](https://docs.astral.sh/uv/getting-started/installation/). Then download the [reference script](/code/itm_model.py), [model configuration](/trace/model.json) and [trained weights](/trace/weights.json) into one folder. Open a terminal in that folder and run:

```sh
uv venv --python 3.12
uv pip install numpy
uv run --no-project python itm_model.py "the cat sat on the"
```

These commands create an isolated `.venv`, install NumPy there, and run the model. They work in PowerShell, macOS and Linux shells without activating the environment. uv can download Python 3.12 if it is missing. The three files must stay together so the script can find the configuration and weights.

To rebuild the computation yourself, follow [Reproduce the Explorer's forward pass](/labs/explorer-forward-pass/). For the larger model, use the [GPT-2 replication's pinned requirements](/replications/gpt2-causality/#reproduce-it), which also include its CPU package index.

## Develop your own experiment

Create a separate project when you want to change the model or add tests:

```sh
uv init --bare --python 3.12 model-experiments
cd model-experiments
uv add numpy
uv add --dev ruff ty
```

Add your Python files to this directory. Then run:

```sh
uv run ruff check .
uv run ruff format --check .
uv run ty check
```

Use `uv run ruff format .` when you want to apply formatting. Ruff finds lint issues and handles formatting; ty checks types. Neither validates the mathematical result. Compare your outputs with known traces and include a control that should change the result.

Commit `pyproject.toml`, `uv.lock` and `.python-version` with your experiment. Someone cloning it can use `uv sync --locked` and run the same commands. Keep `.venv/` out of version control. When sharing a measured claim, record the model revision, inputs, package versions and numerical tolerance as well.

## Official references

- [uv: Python environments](https://docs.astral.sh/uv/pip/environments/) and [working on projects](https://docs.astral.sh/uv/guides/projects/).
- [Ruff: linter and formatter](https://docs.astral.sh/ruff/).
- [ty: installation and project use](https://docs.astral.sh/ty/installation/).
