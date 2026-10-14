/* Published investigations. Shared by the static generator and browser UI. */
(function (root) {
  root.ITMCaseCatalog = [
    { id: 'place', slug: 'place-or-animal', title: 'The place detector', question: 'Which part knows a place comes next?', skill: 'Find a component by removing it', minutes: 10, prompt: 'the cat sat on the', resources: [
      ['Understand attention', '/guide/attention/'], ['Inside the transformer block', '/guide/transformer-block/'], ['Reproduce the forward pass', '/labs/explorer-forward-pass/']
    ] },
    { id: 'training', slug: 'what-training-changes', title: 'What training changes', question: 'Same model. Different weights. Different answer?', skill: 'Compare predictions and measure loss', minutes: 8, prompt: 'the cat sat on the', resources: [
      ['Probability and loss', '/guide/softmax-and-loss/'], ['The training loop', '/guide/full-model/'], ['Explore pretraining', '/guide/pretraining/']
    ] },
    { id: 'future', slug: 'hidden-future', title: 'The hidden future', question: 'Can an earlier token read words that come later?', skill: 'Test information flow with a controlled change', minutes: 8, prompt: 'the cat sat on the mat', resources: [
      ['Causal attention', '/guide/attention/'], ['Write attention yourself', '/labs/attention-from-scratch/'], ['Compare larger architectures', '/teardown/compare/']
    ] }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
