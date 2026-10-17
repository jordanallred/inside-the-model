/* Published investigations. Shared by the static generator and browser UI. */
(function (root) {
  root.ITMCaseCatalog = [
    { id: 'place', slug: 'place-or-animal', title: 'Attention and head ablation', question: 'Which head outputs affect the place prediction?', skill: 'Compare output interventions with attention patterns', prompt: 'the cat sat on the', resources: [
      ['Understand attention', '/guide/attention/'], ['Inside the transformer block', '/guide/transformer-block/'], ['Reproduce the forward pass', '/labs/explorer-forward-pass/']
    ] },
    { id: 'training', slug: 'what-training-changes', title: 'Trained and random weights', question: 'Same model. Different weights. Different answer?', skill: 'Compare predictions and measure loss', prompt: 'the cat sat on the', resources: [
      ['Probability and loss', '/guide/softmax-and-loss/'], ['The training loop', '/guide/full-model/'], ['Explore pretraining', '/guide/pretraining/']
    ] },
    { id: 'future', slug: 'hidden-future', title: 'Causal masking', question: 'Can an earlier token read words that come later?', skill: 'Test information flow with a controlled change', prompt: 'the cat sat on the mat', resources: [
      ['Causal attention', '/guide/attention/'], ['Write attention yourself', '/labs/attention-from-scratch/'], ['Compare larger architectures', '/teardown/compare/']
    ] },
    {id:'controls',slug:'choose-the-control',title:'Controlled prompt comparisons',question:'Which experiment could distinguish two explanations?',skill:'Construct and compare your own prompt pair',prompt:'the cat sat on the',resources:[['Causal interventions','/methods/#interpret-interventions-carefully'],['Attention','/guide/attention/']]},
    {id:'sufficiency',slug:'necessary-and-sufficient',title:'Component removal and retention',question:'What does removing a component actually establish?',skill:'Separate necessity from conditional sufficiency',prompt:'the cat sat on the',resources:[['Interventions and their limits','/methods/#interpret-interventions-carefully'],['The residual stream','/guide/transformer-block/#the-block-and-the-residual-stream']]},
    {id:'confidence',slug:'confidence-without-learning',title:'Temperature and probability',question:'Can a prediction become more confident without learning?',skill:'Separate sampling settings from model knowledge',prompt:'the cat sat on the',resources:[['Softmax and probability','/guide/softmax-and-loss/'],['Generation and inference','/guide/kv-cache/']]}
  ];
})(typeof window !== 'undefined' ? window : globalThis);
