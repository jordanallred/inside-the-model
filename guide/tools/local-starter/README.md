# Inside the Model — local experiments

The same NumPy reference model and trained weights used to verify the browser
Explorer. It has 4,496 parameters and a 25-token synthetic vocabulary. It is a
teaching model, not an assistant or an application troubleshooting service.

## Start

1. Install uv: https://docs.astral.sh/uv/getting-started/installation/
2. Extract this archive and open the extracted folder in your preferred IDE.
3. In its terminal, run:

```sh
uv sync --locked
uv run experiment.py
```

uv installs Python 3.12 if needed and creates an isolated `.venv`. The first
setup needs internet access for Python/packages. All model files are included;
the experiments then run locally on CPU without an account or model download.

In VS Code, Cursor or another Python editor, select the interpreter in `.venv`:
`.venv/Scripts/python.exe` on Windows or `.venv/bin/python` on macOS/Linux.
In PyCharm, open this folder and select that existing interpreter. The terminal
commands above work independently of editor integrations.

## Explore

Edit `PROMPT` and `TEMPERATURE` in `experiment.py`. It prints next-token
probabilities before/after temperature scaling and checks a fixed-prefix suffix
comparison against a changed-prefix positive control. Read the printed limits.

Follow the `# step:` comments in `itm_model.py` to connect its arithmetic to the
26 steps in https://insidethemodel.app/explorer/. Configuration and weights stay
next to the script; no files from a repository checkout are needed.

For a direct prediction:

```sh
uv run itm_model.py "the dog sat on the"
```

For larger models: https://insidethemodel.app/replications/gpt2-causality/
For Ruff and ty: https://insidethemodel.app/python-tools/

Code license: see LICENSE-CODE.md. Keep uv.lock when sharing this project.
