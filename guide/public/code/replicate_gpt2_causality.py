"""Reproduce causal prefix invariance on pinned GPT-2 weights, on a CPU.

Install torch and transformers in a virtual environment; see the accompanying
requirements and notebook. First run downloads roughly 0.5 GB of model weights.
No account, token, GPU, remote inference, or trust_remote_code is required.
"""
import argparse
import hashlib
import importlib.metadata
import json
import platform
from datetime import datetime, timezone
from pathlib import Path

MODEL = "openai-community/gpt2"
REVISION = "607a30d783dfa663caf39e06633721c8d4cfcd7e"


def run(output: Path):
    import torch
    from huggingface_hub import hf_hub_download
    from transformers import AutoModelForCausalLM, AutoTokenizer

    torch.set_num_threads(2)
    tokenizer = AutoTokenizer.from_pretrained(MODEL, revision=REVISION)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL, revision=REVISION, use_safetensors=True,
        attn_implementation="eager", trust_remote_code=False,
    ).cpu().eval()
    tolerance = 1e-6
    measurements = []
    pairs = [
        ("The cat sat", " on the mat", " on the bed", "The dog sat"),
        ("Alice and Bob went", " to the park", " to the beach", "Alice and Sam went"),
    ]
    with torch.inference_mode():
        for prefix, suffix_a, suffix_b, control_prefix in pairs:
            prefix_ids = tokenizer.encode(prefix)
            a = prefix_ids + tokenizer.encode(suffix_a)
            b = prefix_ids + tokenizer.encode(suffix_b)
            control = tokenizer.encode(control_prefix) + tokenizer.encode(suffix_a)
            position = len(prefix_ids) - 1
            assert len(a) == len(b), "suffix lengths must be controlled"
            assert len(tokenizer.encode(control_prefix)) == len(prefix_ids)
            out_a = model(torch.tensor([a]), output_attentions=True)
            out_b = model(torch.tensor([b]), output_attentions=True)
            out_control = model(torch.tensor([control]))
            pa = out_a.logits[0, position].softmax(-1)
            pb = out_b.logits[0, position].softmax(-1)
            pc = out_control.logits[0, position].softmax(-1)
            difference = float((pa - pb).abs().max())
            control_difference = float((pa - pc).abs().max())
            future = max(float(layer[0, :, position, position + 1:].abs().max())
                         for out in [out_a, out_b] for layer in out.attentions)
            assert difference <= tolerance, "causal prefix check failed"
            assert future == 0.0, "future attention is not zero"
            assert control_difference > tolerance, "positive control did not change the distribution"
            top = pa.topk(5)
            measurements.append({
                "prefix": prefix, "input_a": prefix + suffix_a,
                "input_b": prefix + suffix_b, "positive_control": control_prefix + suffix_a,
                "token_ids_a": a, "token_ids_b": b, "position": position,
                "max_probability_difference": difference,
                "max_future_attention": future,
                "positive_control_max_probability_difference": control_difference,
                "top_tokens_at_prefix": [
                    {"token_id": int(i), "text": tokenizer.decode([int(i)]), "probability": float(p)}
                    for p, i in zip(top.values, top.indices)
                ],
            })
    weight_path = hf_hub_download(MODEL, "model.safetensors", revision=REVISION)
    digest = hashlib.sha256()
    with open(weight_path, "rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    result = {
        "schema_version": 1, "executed_at": datetime.now(timezone.utc).isoformat(),
        "model": MODEL, "revision": REVISION, "weight_sha256": digest.hexdigest(),
        "parameter_count": sum(p.numel() for p in model.parameters()),
        "device": "cpu", "dtype": str(next(model.parameters()).dtype),
        "attention_implementation": "eager", "dropout": "disabled via eval()",
        "python": platform.python_version(), "platform": platform.platform(),
        "packages": {name: importlib.metadata.version(name) for name in ["torch", "transformers", "huggingface_hub"]},
        "tolerance": tolerance, "measurements": measurements,
        "scope": "Two controlled prefix/suffix comparisons and two changed-prefix positive controls. This tests causal information flow, not interpretability of GPT-2 behavior generally.",
    }
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "revision": REVISION, "checks": len(measurements), "max_difference": max(m["max_probability_difference"] for m in measurements)}))
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("gpt2-causal-check.json"))
    run(parser.parse_args().output)
