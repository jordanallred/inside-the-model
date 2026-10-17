/* Ungraded experiment workspaces. Legacy assessment records are read for migration, never rewritten. */
(function (root) {
  const C=root.ITMCases, catalog=root.ITMCaseCatalog, KEY='itm-experiment-workspaces-v1';
  const defaults=id=>({prompt:catalog.find(c=>c.id===id)?.prompt||'the cat sat on the',target:'mat',temperature:2,position:3,a:'the cat sat on the mat',b:'the cat sat on the bed',head:null,plan:'diagnostic',example:0,exampleShown:false,explored:false,custom:id==='controls'});
  const valid=(v,fallback)=>typeof v==='string'&&v.length<=250&&C.validatePrompt(v).ok?v:fallback;
  function normalize(value){
    const source=value&&value.version===1&&value.cases&&typeof value.cases==='object'?value.cases:{};
    const cases={};
    for(const {id}of catalog){const d=defaults(id),s=source[id]||{};
      if(id==='controls'){d.a='the cat sat on the';d.b='the cat saw on the';}
      cases[id]={...d,prompt:valid(s.prompt,d.prompt),a:valid(s.a,d.a),b:valid(s.b,d.b),target:root.ITM.CFG.vocab.slice(1).includes(s.target)?s.target:d.target,temperature:Number.isFinite(s.temperature)&&s.temperature>=.25&&s.temperature<=4?s.temperature:d.temperature,position:Number.isInteger(s.position)&&s.position>=1&&s.position<root.ITM.CFG.maxCtx-1?s.position:d.position,head:Number.isInteger(s.head)&&s.head>=0&&s.head<4?s.head:null,plan:['diagnostic','confounded','repeat'].includes(s.plan)?s.plan:d.plan,example:Number.isInteger(s.example)&&s.example>=0&&s.example<3?s.example:0,exampleShown:s.exampleShown===true,explored:s.explored===true,custom:typeof s.custom==='boolean'?s.custom:d.custom};
    }
    return {version:1,cases};
  }
  function read(storage){
    const raw=storage.getItem(KEY);if(raw)return normalize(JSON.parse(raw));
    const state=normalize(null),old=JSON.parse(storage.getItem('itm-investigations-v2')||'null');
    if(old?.version===2)for(const {id}of catalog){const previous=old.cases?.[id];if(!previous)continue;state.cases[id].explored=previous.experiment!==null&&previous.experiment!==undefined;if(id==='place'){state.cases[id].head=Number.isInteger(previous.experiment)&&previous.experiment>=0&&previous.experiment<4?previous.experiment:null;state.cases[id].prompt=valid(previous.prompt,state.cases[id].prompt);}}
    return state;
  }
  function load(storage){try{return read(storage);}catch(_){return normalize(null);}}
  function commit(storage,local,id,patch){
    let latest,readable=true;try{latest=read(storage);}catch(_){latest=normalize(local);readable=false;}
    if(!catalog.some(c=>c.id===id))return {state:latest,persisted:false};
    if(local?.transient)latest.cases[id]={...latest.cases[id],...normalize(local).cases[id]};
    const explored=latest.cases[id].explored||patch.explored===true;
    latest.cases[id]={...latest.cases[id],...patch,explored};const state=normalize(latest);
    let persisted=false;if(readable)try{storage.setItem(KEY,JSON.stringify(state));persisted=true;}catch(_){}
    state.transient=!persisted;return {state,persisted};
  }
  function reset(storage,local,id){const latest=load(storage),explored=latest.cases[id]?.explored||local.cases[id]?.explored;return commit(storage,local,id,{...defaults(id),...(id==='controls'?{a:'the cat sat on the',b:'the cat saw on the'}:{}),explored:!!explored});}
  root.ITMWorkspace={KEY,defaults,normalize,load,commit,reset};
})(typeof window!=='undefined'?window:globalThis);
