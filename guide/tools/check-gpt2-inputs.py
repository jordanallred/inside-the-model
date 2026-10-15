"""Input-control checks without downloading a model or importing torch."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("replication", Path(__file__).resolve().parents[1] / "public/code/replicate_gpt2_causality.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class Words:
    def encode(self, text):
        return text.split()

class InputControls(unittest.TestCase):
    def test_valid_pair_preserves_every_nonintervened_token(self):
        a, b, control, position = module.prepare_pair(Words(), "the cat ran", " to the park", " to the beach", "the dog ran")
        self.assertEqual(position, 2)
        self.assertEqual(a[:position + 1], b[:position + 1])
        self.assertEqual(a[position + 1:], control[position + 1:])
        self.assertNotEqual(a[position + 1:], b[position + 1:])

    def test_invalid_controls_are_rejected(self):
        pairs = [("the cat", " sat", " sat", "the dog"), ("the cat", " sat", " ran home", "the dog"), ("the cat", " sat", " ran", "the big dog"), ("the cat", " sat", " ran", "the cat"), ("A", "B", "C", "D")]
        for pair in pairs:
            with self.subTest(pair=pair), self.assertRaises(ValueError):
                module.prepare_pair(Words(), *pair)

if __name__ == "__main__":
    unittest.main()
