import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import '../public/js/itm-weights.js';
import '../public/js/itm-model.js';
import '../public/js/case-engine.js';
import '../public/js/case-catalog.js';
const C=globalThis.ITMCases;
function mount(){
 const saved=new Map(),storage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},handlers={};
 const el={innerHTML:'',addEventListener:(name,fn)=>handlers[name]=fn,querySelector:()=>null};
 const window={ITM:globalThis.ITM,ITMCases:C,ITMCaseCatalog:globalThis.ITMCaseCatalog,localStorage:storage,addEventListener(){},dispatchEvent(){}};
 vm.runInNewContext(fs.readFileSync('public/js/cases.js','utf8'),{window,document:{readyState:'loading',addEventListener(){}},performance:{now:()=>0},Event:class{},URLSearchParams,console});
 window.W.caseplace(el);return{storage,handlers,el};
}
function complete(){let p=C.normalizeProgress(null);for(const [a,v]of[['prediction','changes'],['experiment',1],['design','diagnostic'],['explanation','verb'],['transfer','place']])p=C.transition(p,'place',a,v);return p;}
const hint=h=>h.handlers.click({target:{closest:s=>s==='[data-action]'?{dataset:{action:'hint'}}:null}});
test('a stale tab cannot erase completion and exposure when requesting a hint',()=>{
 const h=mount();C.saveProgress(h.storage,complete());hint(h);
 const state=C.loadProgress(h.storage).cases.place;assert.equal(state.completed,true);assert.deepEqual(state.seen,[0]);assert.equal(state.hint,1);
});
test('invalid prompt stays editable and keeps the last valid measurement',()=>{
 const h=mount();C.saveProgress(h.storage,complete());hint(h);
 h.handlers.submit({preventDefault(){},target:{dataset:{form:'prompt'},elements:{prompt:{value:'the cat spaceship'}}}});
 assert.match(h.el.innerHTML,/value="the cat spaceship"/);assert.match(h.el.innerHTML,/aria-invalid="true"/);assert.match(h.el.innerHTML,/Results for/);
});
await import('../public/js/notebook-store.js');
const N=globalThis.ITMNotebook;
test('free-form notes preserve old structured notes and round-trip backups',()=>{
 const legacy=N.normalize({version:1,notes:{place:{question:'Why?',observation:'99.9%'}}});
 assert.equal(N.noteText(legacy.notes.place),'Question\nWhy?\n\nObservation\n99.9%');
 const next=N.normalize({version:1,notes:{place:{text:'A useful observation\n\nA question for next time'}}});
 assert.equal(next.notes.place.text,'A useful observation\n\nA question for next time');
 assert.match(N.markdown(next),/A useful observation/);
 assert.equal(N.normalize({version:1,notes:{place:{text:'x'.repeat(17000)}}}).notes.place.text.length,16000);
});
function notesHarness(initial,blocked=false){
 const map=new Map(initial?[[N.KEY,JSON.stringify(initial)]]:[]),timers=new Map(),handlers={},windowHandlers={};let tid=0;
 const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>{if(blocked)throw Error('quota');map.set(k,v);}};
 const status={},storageLabel={},backup={open:false},include={checked:false},input={id:'nb-notes',value:''};let form;
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const el={addEventListener:(k,fn)=>handlers[k]=fn,querySelector:s=>({'[data-notes]':form,'.nb-message':status,'.nb-storage':storageLabel,'.nb-backup':backup,'[data-timeline]':include}[s]||null)};
 Object.defineProperty(el,'innerHTML',{set(v){this.html=v;input.value=(v.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/)?.[1]||'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&');form={dataset:{notes:v.match(/data-notes="([^"]+)"/)?.[1]},elements:{notes:input}};}});
 const window={ITMNotebook:N,ITMCaseCatalog:globalThis.ITMCaseCatalog,K:{esc},addEventListener:(k,fn)=>windowHandlers[k]=fn};
 vm.runInNewContext(fs.readFileSync('public/js/notebook.js','utf8'),{window,localStorage:storage,location:{search:''},URLSearchParams,setTimeout:fn=>{timers.set(++tid,fn);return tid;},clearTimeout:id=>timers.delete(id),console});window.W.notebook(el);
 const type=value=>{input.value=value;handlers.input({target:input});};
 const flush=()=>{for(const [k,fn]of [...timers]){timers.delete(k);fn();}};
 return{storage,el,input,status,type,flush,handlers,windowHandlers};
}
test('notes autosave without rebuilding the editor or losing typing focus',()=>{
 const h=notesHarness();h.type('An observation worth keeping');h.flush();
 assert.equal(N.load(h.storage).notes.place.text,'An observation worth keeping');assert.equal(h.status.textContent,'Saved.');assert.equal(h.input.value,'An observation worth keeping');
});
test('unavailable storage preserves notes in memory and protects navigation',()=>{
 const h=notesHarness(null,true);h.type('Do not lose this');h.flush();let prevented=false;
 h.windowHandlers.beforeunload({preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.equal(h.input.value,'Do not lose this');assert.match(h.status.textContent,/Download a backup/);
});
test('backup confirmation and cancellation do not discard current note edits',()=>{
 const h=notesHarness();h.type('Current draft');
 h.handlers.click({target:{closest:s=>s==='[data-erase]'?{}:null}});
 h.handlers.click({target:{closest:s=>s==='[data-cancel]'?{}:null}});
 assert.equal(h.input.value,'Current draft');h.flush();assert.equal(N.load(h.storage).notes.place.text,'Current draft');
});
test('all characters in a full legacy note survive conversion and save',()=>{
 const legacy=Object.fromEntries(N.FIELDS.map(f=>[f,'x'.repeat(1990)+'IMPORTANT!']));
 const rendered=N.noteText(legacy),saved=N.normalize({version:1,notes:{place:{text:rendered}}});
 assert.equal(saved.notes.place.text,rendered);assert.ok(saved.notes.place.text.endsWith('IMPORTANT!'));
});
test('direct exploration does not fabricate a prediction',()=>{
 const h=mount();h.handlers.click({target:{closest:s=>s==='[data-action]'?{dataset:{action:'explore'}}:null}});
 assert.equal(C.loadProgress(h.storage).cases.place.prediction,'uncertain');assert.match(h.el.innerHTML,/Remove one attention head/);
});
