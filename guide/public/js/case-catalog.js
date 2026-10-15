/* Published investigations. Shared by the static generator and browser UI. */
(function (root) {
  root.ITMCaseCatalog = [
    { id: 'place', slug: 'place-or-animal', title: 'The place detector', question: 'Which head outputs affect the place prediction?', skill: 'Compare output interventions with attention patterns', minutes: 10, prompt: 'the cat sat on the', resources: [
      ['Understand attention', '/guide/attention/'], ['Inside the transformer block', '/guide/transformer-block/'], ['Reproduce the forward pass', '/labs/explorer-forward-pass/']
    ] },
    { id: 'training', slug: 'what-training-changes', title: 'What training changes', question: 'Same model. Different weights. Different answer?', skill: 'Compare predictions and measure loss', minutes: 8, prompt: 'the cat sat on the', resources: [
      ['Probability and loss', '/guide/softmax-and-loss/'], ['The training loop', '/guide/full-model/'], ['Explore pretraining', '/guide/pretraining/']
    ] },
    { id: 'future', slug: 'hidden-future', title: 'The hidden future', question: 'Can an earlier token read words that come later?', skill: 'Test information flow with a controlled change', minutes: 8, prompt: 'the cat sat on the mat', resources: [
      ['Causal attention', '/guide/attention/'], ['Write attention yourself', '/labs/attention-from-scratch/'], ['Compare larger architectures', '/teardown/compare/']
    ] },
    {id:'controls',slug:'choose-the-control',title:'Choose the control',question:'Which experiment could distinguish two explanations?',skill:'Construct and compare your own prompt pair',minutes:12,prompt:'the cat sat on the',resources:[['Causal interventions','/guide/intervening/'],['Attention','/guide/attention/']]},
    {id:'sufficiency',slug:'necessary-and-sufficient',title:'Necessary—and sufficient?',question:'What does removing a component actually establish?',skill:'Separate necessity from conditional sufficiency',minutes:12,prompt:'the cat sat on the',resources:[['Interventions and their limits','/guide/intervening/'],['The residual stream','/guide/reading-the-residual-stream/']]},
    {id:'confidence',slug:'confidence-without-learning',title:'Confidence without learning',question:'Can a prediction become more confident without learning?',skill:'Separate sampling settings from model knowledge',minutes:10,prompt:'the cat sat on the',resources:[['Softmax and probability','/guide/softmax-and-loss/'],['Generation and inference','/guide/kv-cache/']]}
  ];
})(typeof window !== 'undefined' ? window : globalThis);
