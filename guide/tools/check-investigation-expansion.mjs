import assert from 'node:assert/strict';
import '../public/js/itm-weights.js';
import '../public/js/itm-model.js';
import '../public/js/case-engine.js';
const C = globalThis.ITMCases;
const migrated=C.normalizeProgress({version:2,cases:{place:{prediction:'changes',experiment:1,explanation:'verb',transfer:'place',attempts:1,priorExposure:false}}});
assert.deepEqual(migrated.cases.place.seen,[0],'legacy transfer exposure survives the new design gate');
assert.equal(migrated.cases.place.priorExposure,true,'a previously revealed legacy example is practice');
assert.equal(typeof C.runControl, 'function', 'learners can run competing experimental designs');
assert.ok(C.runControl('diagnostic').discriminates);
assert.equal(C.runControl('confounded').discriminates, false);
assert.equal(C.runControl('repeat').discriminates, false);
const sufficient = C.runSufficiency('the cat sat on the');
assert.ok(sufficient.baseline > .9 && sufficient.removed < .1 && sufficient.kept > .9);
const confidence = C.runConfidence('the cat sat on the', 2);
assert.equal(confidence.originalTop, confidence.adjustedTop);
assert.ok(confidence.adjusted[confidence.adjustedTop] < confidence.original[confidence.originalTop]);
assert.throws(() => C.runConfidence('the cat', 0));
for (const id of ['place','training','future','controls','sufficiency','confidence']) {
  for (let variant=0; variant<3; variant++) {
    const spec = C.transferSpec(id, variant);
    assert.ok(spec.question && spec.choices.some(([value]) => value === spec.expected));
    assert.equal(C.answers(id,variant).transfer,spec.expected);
  }
}
let p=C.normalizeProgress(null);
p=C.transition(p,'place','prediction','changes');
p=C.transition(p,'place','experiment',1);
p=C.transition(p,'place','explanation','verb');
assert.equal(p.cases.place.explanation,'','first case requires a discriminating experiment, not just a multiple choice answer');
p=C.transition(p,'place','design','diagnostic');
p=C.transition(p,'place','explanation','verb');
for(let n=0;n<4;n++) {
  if(n) {
    p=C.transition(p,'place','prediction','changes');
    p=C.transition(p,'place','experiment',1);
    p=C.transition(p,'place','design','diagnostic');
    p=C.transition(p,'place','explanation','verb');
  }
  const s=p.cases.place;
  assert.equal(s.priorExposure,n>=3,'unseen variants precede practice');
  p=C.transition(p,'place','transfer',C.answers('place',s.variant).transfer);
  assert.ok(p.cases.place.completed);
  p=C.transition(p,'place','reset');
}
console.log('Experiment design, sufficiency, temperature and legacy transfer checks passed.');
