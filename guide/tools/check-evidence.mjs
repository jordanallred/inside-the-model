import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const evidence=JSON.parse(fs.readFileSync('public/trace/evidence-manifest.json','utf8'));
for(const [file,expected]of Object.entries(evidence.source_hashes)){
  const actual=crypto.createHash('sha256').update(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')).digest('hex');
  assert.equal(actual,expected,'Evidence source changed: '+file+'. Run npm run gen before building.');
}
const record=JSON.parse(fs.readFileSync('public/trace/gpt2-causal-check.json','utf8'));
assert.equal(record.revision,'607a30d783dfa663caf39e06633721c8d4cfcd7e');
assert.equal(record.parameter_count,124439808);
assert.match(record.weight_sha256,/^[a-f0-9]{64}$/);
assert.equal(record.measurements.length,2);
for(const r of record.measurements){
  assert.equal(r.token_ids_a.length,r.token_ids_b.length);
  assert.deepEqual(r.token_ids_a.slice(0,r.position+1),r.token_ids_b.slice(0,r.position+1));
  assert.ok(r.token_ids_a.some((id,i)=>id!==r.token_ids_b[i]),'suffix control changes an actual token');
  assert.ok(r.max_probability_difference<=record.tolerance);
  assert.equal(r.max_future_attention,0);
  assert.ok(r.positive_control_max_probability_difference>record.tolerance);
}
const notebook=JSON.parse(fs.readFileSync('public/code/gpt2-causality.ipynb','utf8'));
assert.equal(notebook.nbformat,4);
assert.ok(notebook.cells.some(c=>c.source.join('').includes(record.revision)));
assert.ok(notebook.cells.filter(c=>c.cell_type==='code').every(c=>c.execution_count===null),'the downloadable notebook invites a new run instead of claiming embedded outputs');
for(const variants of Object.values(evidence.transfer_bank))assert.equal(variants.length,3);
console.log('Evidence hashes, pinned GPT-2 execution, positive controls and notebook packaging passed.');
