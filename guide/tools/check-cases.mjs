import assert from 'node:assert/strict';
import '../public/js/itm-weights.js';
import '../public/js/itm-model.js';
const { ITM } = globalThis;
await import('../public/js/case-engine.js').catch(() => {});
assert.ok(globalThis.ITMCases, 'an experiment engine must support measured investigation outcomes');
const C = globalThis.ITMCases;
const baseline = C.runPlace('the cat sat on the', []);
assert.ok(baseline.place > 0.9);
const ablated = [0, 1, 2, 3].map(i => C.runPlace('the cat sat on the', [i]));
assert.ok(ablated[1].place < 0.1, 'the candidate head is necessary on the baseline');
assert.ok(ablated.filter(r => r.place < 0.1).length === 1, 'one single-head ablation identifies the candidate');
assert.ok(C.runPlace('the dog ran to the', []).place > 0.5);
for (const [prompt, target] of [['the cat sat on the', 'mat'], ['the dog chased the', 'cat']]) {
  const r = C.runTraining(prompt, target);
  assert.ok(r.trained.probability > r.random.probability, 'trained weights improve the named continuation on this fixture');
  assert.ok(r.trained.loss < r.random.loss);
  assert.equal(r.trained.loss, -Math.log(r.trained.probability));
}
for (const [a, b, pos] of [['the cat sat on the mat', 'the cat sat on the bed', 3], ['a dog ran to the mat', 'a dog ran to the bed', 2]]) {
  const r = C.runFuture(a, b, pos);
  assert.ok(r.maxDifference < 1e-12);
  assert.equal(r.futureAttention, 0);
}
assert.throws(() => C.runFuture('the cat sat', 'the dog sat', 2), /prefix/i);
for (const text of ['', 'zebra', 'the '.repeat(40)]) assert.equal(C.validatePrompt(text).ok, false);
assert.equal(C.validatePrompt('the cat sat').ok, true);
assert.throws(() => C.runPlace('zebra', []));
let p = C.normalizeProgress(null);
assert.equal(p.version, 2);
assert.equal(p.cases.place.completed, false);
assert.equal(C.normalizeProgress({version:2,cases:{place:{completed:true}}}).cases.place.completed, false, 'stored completion alone is insufficient');
p = C.transition(p, 'place', 'transfer', 'place');
assert.equal(p.cases.place.completed, false, 'transfer cannot bypass evidence');
p = C.transition(p, 'place', 'prediction', 'changes');
p = C.transition(p, 'place', 'experiment', 1);
p = C.transition(p, 'place', 'design', 'diagnostic');
p = C.transition(p, 'place', 'explanation', 'verb');
p = C.transition(p, 'place', 'transfer', 'animal');
assert.equal(p.cases.place.completed, false, 'wrong transfer does not complete');
p = C.transition(p, 'place', 'transfer', 'place');
assert.equal(p.cases.place.completed, true);
assert.equal(C.normalizeProgress(JSON.parse(JSON.stringify(p))).cases.place.completed, true);
const completedPlace = p;
const staleTrainingTab = C.transition(C.normalizeProgress(null), 'training', 'prediction', 'trained');
assert.equal(typeof C.mergeCaseProgress, 'function', 'concurrent case updates merge with current persisted progress');
const merged = C.mergeCaseProgress(completedPlace, staleTrainingTab, 'training');
assert.equal(merged.cases.place.completed, true, 'a stale training tab preserves another case completion');
assert.equal(merged.cases.training.prediction, 'trained');
p = C.transition(p, 'training', 'prediction', 'trained');
p = C.transition(p, 'place', 'reset');
assert.equal(p.cases.place.completed, false);
assert.deepEqual(p.cases.place.seen,[0], 'restart preserves exposure history');
assert.equal(p.cases.place.variant,1,'restart chooses an unseen example');
assert.equal(C.normalizeProgress(JSON.parse(JSON.stringify(p))).cases.place.variant,1);
assert.equal(p.cases.training.prediction, 'trained');
const legacy = {getItem:k => k === 'itm-cases' ? '{"place":{"solved":true}}' : null};
assert.equal(C.loadProgress(legacy).cases.place.legacy, true);
assert.equal(C.loadProgress(legacy).cases.place.completed, false);
for (const storage of [{getItem:()=>'{broken'}, {getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}}]) {
  assert.equal(C.loadProgress(storage).cases.place.completed, false);
  assert.doesNotThrow(() => C.saveProgress(storage, p));
}
console.log('Case measurements, assessment gates, validation, migration and storage checks passed.');
