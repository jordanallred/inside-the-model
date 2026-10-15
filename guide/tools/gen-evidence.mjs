// Recompute public teaching-model measurements and package the executed GPT-2 replication.
import fs from 'node:fs';
import crypto from 'node:crypto';
import '../public/js/itm-weights.js';
import '../public/js/itm-model.js';
import '../public/js/case-engine.js';
import '../public/js/case-catalog.js';
const C=globalThis.ITMCases;
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')).digest('hex');
const files=['public/js/itm-model.js','public/js/itm-weights.js','public/js/case-engine.js','public/js/case-workspace.js','public/code/itm_model.py','public/trace/weights.json','public/code/replicate_gpt2_causality.py'];
const manifest={schema_version:1,model:globalThis.ITM.manifest(),source_hashes:Object.fromEntries(files.map(f=>[f,hash(f)])),measurements:{place:{baseline:C.runPlace('the cat sat on the').place,head_removed:C.runPlace('the cat sat on the',[1]).place},control:C.runControl('diagnostic'),sufficiency:C.runSufficiency('the cat sat on the'),confidence:{temperature:2,original_top:C.runConfidence('the cat sat on the',2).originalTop,adjusted_top:C.runConfidence('the cat sat on the',2).adjustedTop}},transfer_bank:Object.fromEntries(globalThis.ITMCaseCatalog.map(c=>[c.id,[0,1,2].map(v=>{const s=C.transferSpec(c.id,v);return {variant:v,question:s.question,expected:s.expected};})])),verification_commands:['npm run verify','node tools/check-cases.mjs','node tools/check-investigation-expansion.mjs'],scope:'Computed teaching-model fixtures. Worked-comparison outcomes are included for reproducibility. They are freely visible and do not assess learning.'};
manifest.hash_normalization='SHA-256 of UTF-8 text with CRLF normalized to LF';
fs.writeFileSync('public/trace/evidence-manifest.json',JSON.stringify(manifest,null,2)+'\n');
const result=JSON.parse(fs.readFileSync('public/trace/gpt2-causal-check.json','utf8'));
if(result.revision!=='607a30d783dfa663caf39e06633721c8d4cfcd7e'||result.measurements.length!==2||result.measurements.some(m=>m.max_probability_difference>result.tolerance||m.max_future_attention!==0||m.positive_control_max_probability_difference<=result.tolerance))throw Error('GPT-2 execution record failed its checks');
const script=fs.readFileSync('public/code/replicate_gpt2_causality.py','utf8').replace(/\r\n/g,'\n');
const code=script.split('\nif __name__ == "__main__":')[0];
const md=source=>({cell_type:'markdown',metadata:{},source:source.split('\n').map(x=>x+'\n')});
const py=source=>({cell_type:'code',execution_count:null,metadata:{},outputs:[],source:source.split('\n').map(x=>x+'\n')});
const notebook={nbformat:4,nbformat_minor:5,metadata:{kernelspec:{display_name:'Python 3',language:'python',name:'python3'},language_info:{name:'python',version:result.python}},cells:[md('# Does GPT-2 read the future?\n\nPredict before running: will changing a suffix change an earlier position’s next-token distribution? Then change a word in the prefix as a positive control.\n\nThis notebook loads pinned GPT-2 weights on CPU. First run downloads roughly 0.5 GB; allow several GB of available RAM. It performs no remote inference and needs no account.\n\nSource: https://huggingface.co/openai-community/gpt2/tree/'+result.revision+'\n\nPublished measurements: https://insidethemodel.app/trace/gpt2-causal-check.json\n\nThe measured result concerns causal information flow in these comparisons, not general model understanding.'),py('%pip install --extra-index-url https://download.pytorch.org/whl/cpu torch=='+result.packages.torch+' transformers=='+result.packages.transformers+' huggingface_hub=='+result.packages.huggingface_hub),md('## Controlled measurement\n\nThe code verifies equal sequence lengths, identical token prefixes, dropout disabled, future attention exactly zero, and a changed-prefix positive control. It fails before publishing a result if a check fails.'),py(code),py('result = run(Path("gpt2-causal-check.json"))\nfor measurement in result["measurements"]:\n    print(measurement["prefix"], measurement["max_probability_difference"], measurement["positive_control_max_probability_difference"])'),md('## Try your own controlled inputs\n\nKeep the measured prefix token IDs fixed and use equal-length suffixes. The helper validates complete text tokenization, including the prefix/suffix boundary.'),py('custom = run(Path("my-gpt2-check.json"), pairs=[("The dog ran", " to the park", " to the beach", "The cat ran")])'),md('## Investigate further\n\n1. Predict and test another equal-token-length suffix pair.\n2. Change a token before the selected position; explain why this control should be able to change the result.\n3. Repeat with another pinned causal model, record model/revision/environment, and compare tolerances.\n4. Write what the result does not establish: zero future attention does not identify the algorithm used to choose a token.\n\nThis notebook is distributed with the site’s noncommercial code license. GPT-2 has its own model license, linked in its model card.')]};
fs.writeFileSync('public/code/gpt2-causality.ipynb',JSON.stringify(notebook,null,2)+'\n');
fs.writeFileSync('public/code/replication-requirements.txt','--extra-index-url https://download.pytorch.org/whl/cpu\ntorch=='+result.packages.torch+'\ntransformers=='+result.packages.transformers+'\nhuggingface_hub=='+result.packages.huggingface_hub+'\n');
fs.mkdirSync('src/content/docs/replications',{recursive:true});
fs.writeFileSync('src/content/docs/replications/gpt2-causality.md',`---
title: Does GPT-2 read the future?
description: A reproducible CPU experiment on pinned GPT-2 weights, with measured prefix invariance, positive controls and downloadable code.
---

The browser's [hidden-future investigation](/cases/hidden-future/) uses a tiny teaching model. Does the same information-flow restriction appear in a model trained on natural text? We ran two controlled comparisons on **GPT-2 (${result.parameter_count.toLocaleString('en-US')} parameters)** and changed-prefix positive controls.

## Predict the result

Compare **The cat sat on the mat** with **The cat sat on the bed**, measuring at the earlier token **sat**. Does the next-token distribution at that position change? What if you change **cat** to **dog** instead?

The six-token sequences have an identical three-token prefix in the suffix comparison. The script checks token IDs rather than assuming that words and tokens align. The second comparison uses **Alice and Bob went** with two different suffixes.

<details><summary>Reveal the measured results</summary>

| Prefix being measured | Largest probability difference after suffix change | Largest future attention | Changed-prefix control difference |
| --- | --- | --- | --- |
${result.measurements.map(m=>'| '+m.prefix+' | '+m.max_probability_difference.toExponential(3)+' | '+m.max_future_attention.toExponential(3)+' | '+m.positive_control_max_probability_difference.toExponential(3)+' |').join('\n')}

Both suffix changes preserve the selected earlier distribution within **${result.tolerance}**. Future attention is exactly zero in all layers and heads at the tested position. Both positive controls change the distribution beyond tolerance. This supports the causal information-flow restriction in these tests and confirms that the comparison can detect a change when information is allowed to reach the selected position.

</details>

## Reproduce it

Download the [Jupyter notebook](/code/gpt2-causality.ipynb), [standalone Python script](/code/replicate_gpt2_causality.py), [pinned requirements](/code/replication-requirements.txt), and [execution record](/trace/gpt2-causal-check.json). The notebook includes the full experiment and follow-up questions. Its output cells are intentionally empty so you can generate your own results; the separate execution record contains the run reported here.

We recommend [Astral’s Python tooling](/python-tools/). With [uv installed](https://docs.astral.sh/uv/getting-started/installation/), download the script and requirements into one folder and run:

\`\`\`text
uv venv --python 3.12
uv pip install -r replication-requirements.txt
uv run --no-project python replicate_gpt2_causality.py --output my-gpt2-check.json
\`\`\`

No environment activation is needed. Existing pip-based environments also work with the same requirements.

The first run downloads roughly 0.5 GB of weights. Allow several GB of available RAM. No account, GPU or remote inference is required. The website displays saved measurements; loading this page does not download or run GPT-2.

## Try your own comparison

The script accepts a prefix, two suffixes and a changed-prefix positive control. All four custom arguments must be supplied together. See the [practical investigation workflow](/investigate/#reproduce-a-comparison-on-gpt-2) for a command you can adapt. It validates token IDs from the complete texts, equal sequence lengths and an actual suffix change before reporting a result.

## Provenance and conditions

- Model: [${result.model}](https://huggingface.co/${result.model}/tree/${result.revision}), revision \`${result.revision}\`.
- Weight-file SHA-256: \`${result.weight_sha256}\`.
- Execution: \`${result.executed_at}\` (UTC), ${result.platform}, Python ${result.python}.
- Packages: PyTorch ${result.packages.torch}, Transformers ${result.packages.transformers}, Hugging Face Hub ${result.packages.huggingface_hub}.
- Device and numbers: ${result.device}, ${result.dtype}; eager attention; dropout disabled with eval().
- Measurement: all ${result.measurements.length} suffix comparisons and their positive controls passed the assertions in the downloadable script.

The [GPT-2 model card](https://huggingface.co/openai-community/gpt2) describes the model and license. The [Transformers GPT-2 documentation](https://huggingface.co/docs/transformers/model_doc/gpt2) documents the implementation interface.

## What this does not establish

This is an executed replication of a causal-mask property, not a new interpretability discovery or an independent explanation of GPT-2's decisions. Two examples do not validate all inputs, architectures or numerical environments. Floating-point differences can depend on implementation and hardware; compare with the stated tolerance and retain positive controls.

Try a new token-controlled example before inspecting its result. Record the prediction, observation and limitations in your [notes](/notebook/?case=future). See [methods and review status](/methods/) for how this result is checked and corrected.
`);
console.log('Generated teaching evidence, executed GPT-2 report, requirements and runnable notebook.');
