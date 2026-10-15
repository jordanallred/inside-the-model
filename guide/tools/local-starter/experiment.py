"""Run a prediction, change temperature, and check causal information flow.

Edit PROMPT or the suffix pair, then run: uv run experiment.py
No model service, account or GPU is used.
"""
import numpy as np

from itm_model import forward, load, softmax, tokenize

PROMPT = "the cat sat on the"
TEMPERATURE = 2.0


def main():
    cfg, weights = load()
    trace = forward(tokenize(PROMPT, cfg), weights, cfg)
    if TEMPERATURE <= 0:
        raise ValueError("TEMPERATURE must be positive")
    probabilities = trace["probs"][-1]
    adjusted = softmax(trace["logits"][-1] / TEMPERATURE)
    print(f"Prompt: {PROMPT}")
    print(f"{'Token':>10} {'T=1':>12} {f'T={TEMPERATURE:g}':>12}")
    for i in np.argsort(-probabilities)[:5]:
        print(f"{cfg['vocab'][i]:>10} {probabilities[i]:12.6f} {adjusted[i]:12.6f}")
    print("Temperature rescales fixed logits; it does not update the weights.")

    prefix = "the cat sat on the"
    a, b = prefix + " mat", prefix + " bed"
    ids_a, ids_b = tokenize(a, cfg), tokenize(b, cfg)
    position = len(tokenize(prefix, cfg)) - 1
    assert len(ids_a) == len(ids_b)
    assert ids_a[:position + 1] == ids_b[:position + 1]
    assert ids_a[position + 1:] != ids_b[position + 1:]
    first = forward(ids_a, weights, cfg)["probs"][position]
    second = forward(ids_b, weights, cfg)["probs"][position]
    difference = np.max(np.abs(first - second))
    control = forward(tokenize("the cat saw on the mat", cfg), weights, cfg)["probs"][position]
    control_difference = np.max(np.abs(first - control))
    assert difference < 1e-12, "Changed suffix affected the fixed prefix"
    assert control_difference > 1e-6, "Positive control was not sensitive"
    print(f"\nChanged suffix, fixed prefix: maximum probability difference = {difference:.3e}")
    print(f"Changed prefix, positive control: maximum difference = {control_difference:.3e}")
    print("This measures causal information flow in this teaching model, not factual accuracy.")


if __name__ == "__main__":
    main()
