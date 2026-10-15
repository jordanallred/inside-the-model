import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import '../public/js/itm-weights.js';
import '../public/js/itm-model.js';
import '../public/js/case-engine.js';
import '../public/js/case-catalog.js';
import '../public/js/case-workspace.js';
const C=globalThis.ITMCases;
function mount(widget='caseplace'){
 const saved=new Map(),storage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},handlers={};
 const el={innerHTML:'',addEventListener:(name,fn)=>handlers[name]=fn,querySelector:()=>null};
 const window={ITMWorkspace:globalThis.ITMWorkspace,ITM:globalThis.ITM,ITMCases:C,ITMCaseCatalog:globalThis.ITMCaseCatalog,localStorage:storage,addEventListener(){},dispatchEvent(){}};
 vm.runInNewContext(fs.readFileSync('public/js/cases.js','utf8'),{window,document:{readyState:'loading',addEventListener(){}},performance:{now:()=>0},Event:class{},URLSearchParams,console});
 window.W[widget](el);return{storage,handlers,el};
}
function complete(){let p=C.normalizeProgress(null);for(const [a,v]of[['prediction','changes'],['experiment',1],['design','diagnostic'],['explanation','verb'],['transfer','place']])p=C.transition(p,'place',a,v);return p;}
const hint=h=>h.handlers.click({target:{closest:s=>s==='[data-head]'?{dataset:{head:'1'}}:null}});
test('new experiments preserve legacy completion and exposure history',()=>{
 const h=mount();C.saveProgress(h.storage,complete());hint(h);
 const state=C.loadProgress(h.storage).cases.place;assert.equal(state.completed,true);assert.deepEqual(state.seen,[0]);assert.equal(globalThis.ITMWorkspace.load(h.storage).cases.place.explored,true);
});
test('invalid prompt stays editable and keeps the last valid measurement',()=>{
 const h=mount();C.saveProgress(h.storage,complete());hint(h);
 h.handlers.input({target:{name:'prompt',type:'text',value:'the cat spaceship'}});
 h.handlers.submit({preventDefault(){},target:{matches:()=>true}});
 assert.match(h.el.innerHTML,/value="the cat spaceship"/);assert.match(h.el.innerHTML,/aria-invalid="true"/);assert.match(h.el.innerHTML,/Results for/);
});
test('control presets replace custom fields with their measured canonical inputs',()=>{
 const h=mount('casecontrols');
 h.handlers.input({target:{name:'a',type:'text',value:'the dog ran to the'}});
 h.handlers.submit({preventDefault(){},target:{matches:()=>true}});
 h.handlers.click({target:{closest:s=>s==='[data-plan]'?{dataset:{plan:'confounded'}}:null}});
 assert.match(h.el.innerHTML,/name="a"[^>]*value="the cat sat on the"/);
 assert.match(h.el.innerHTML,/name="b"[^>]*value="the cat saw and the"/);
 assert.doesNotMatch(h.el.innerHTML,/the dog ran to the/);
});
test('direct exploration does not fabricate a prediction',()=>{
 const h=mount();assert.match(h.el.innerHTML,/data-run/);assert.match(h.el.innerHTML,/data-head/);assert.doesNotMatch(h.el.innerHTML,/type="radio"|data-form="explanation"|answered correctly/);
 assert.equal(globalThis.ITMWorkspace.load(h.storage).cases.place.explored,false);
});
