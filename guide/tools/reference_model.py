"""Runs the canonical NumPy reference (public/code/itm_model.py) for tools/verify-trace.mjs.
Usage: python -I tools/reference_model.py [jobs.json] > out.json
jobs.json: {"runs": [{"prompt": "...", "weights": "path/to/weights.json"}]}; default: every built-in prompt, trained weights."""
import json, sys
from pathlib import Path
import numpy as np

sys.dont_write_bytecode = True                      # keep __pycache__ out of public/, which is published as-is
sys.path.insert(0, str(Path('public/code').resolve()))
import itm_model as M

M_ = 0xFFFFFFFF
def checksum(W):
    # FNV-1a over every weight written to 10 decimals, in the order the browser engine uses
    h = 0x811c9dc5
    for A in [W['E']] + [L[k] for L in W['layers'] for k in ('Wq', 'Wk', 'Wv', 'Wo', 'W1', 'W2')]:
        for x in A.flatten():
            for ch in f"{x:.10f},": h = ((h ^ ord(ch)) * 16777619) & M_
    return f"{h:08x}"

cfg, trained = M.load('public/trace')
jobs = json.load(open(sys.argv[1], encoding='utf8'))['runs'] if len(sys.argv) > 1 else [{'prompt': p, 'weights': 'public/trace/weights.json'} for p in cfg['prompts']]
cache, sums, runs = {}, {}, []
for job in jobs:
    path = job['weights']
    if path not in cache:
        raw = json.load(open(path, encoding='utf8'))['weights']
        cache[path] = {'E': np.array(raw['E']), 'layers': [{k: np.array(v) for k, v in L.items()} for L in raw['layers']]}
        sums[path] = checksum(cache[path])
    ids = M.tokenize(job['prompt'], cfg)
    out = M.forward(ids, cache[path], cfg)
    runs.append({'prompt': job['prompt'], 'weights': path, 'ids': ids, 'attention': [[w.tolist() for w in L] for L in out['attention']],
                 'x_final': out['x_final'].tolist(), 'logits': out['logits'].tolist()})
json.dump({'checksums': sums, 'runs': runs}, sys.stdout)
