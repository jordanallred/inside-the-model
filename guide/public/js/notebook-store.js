/* Portable evidence notes and bounded learning activity. Nothing is transmitted. */
(function(root){
  const KEY='itm-evidence-notebook-v1',IDS=['place','training','future','controls','sufficiency','confidence','story'];
  const FIELDS=['question','prediction','intervention','observation','conclusion','limitations'];
  const TYPES=['case-open','prediction','experiment','design','explanation','transfer','completed','note-saved'];
  const text=v=>typeof v==='string'?v.slice(0,2000):'';
  function normalize(value){
    const v=value&&typeof value==='object'&&value.version===1?value:{};
    const notes={};
    for(const id of IDS){const note=v.notes?.[id];if(note&&typeof note==='object')notes[id]=Object.fromEntries(FIELDS.map(k=>[k,text(note[k])]));}
    const events=Array.isArray(v.events)?v.events.filter(e=>e&&IDS.includes(e.caseId)&&TYPES.includes(e.type)&&typeof e.at==='string'&&Number.isFinite(Date.parse(e.at))).slice(-200).map(e=>({caseId:e.caseId,type:e.type,at:e.at.slice(0,30),correct:typeof e.correct==='boolean'?e.correct:null,attempt:Number.isInteger(e.attempt)?Math.min(100,Math.max(0,e.attempt)):0,practice:e.practice===true,seconds:Number.isFinite(e.seconds)?Math.max(0,Math.min(86400,Math.round(e.seconds))):0})):[];
    return {version:1,notes,events};
  }
  function load(storage){try{return normalize(JSON.parse(storage.getItem(KEY)||'null'));}catch(_){return normalize(null);}}
  function save(storage,data){try{storage.setItem(KEY,JSON.stringify(normalize(data)));return true;}catch(_){return false;}}
  function record(storage,caseId,type,extra={}){
    if(!IDS.includes(caseId)||!TYPES.includes(type))return false;
    const data=load(storage);data.events.push({...extra,caseId,type,at:new Date().toISOString()});return save(storage,data);
  }
  function markdown(value){
    const data=normalize(value),lines=['# My model investigations','', 'Notes exported from Inside the Model. These are learner observations, not a reviewed research result.',''];
    for(const [id,note]of Object.entries(data.notes)){lines.push('## '+id,'');for(const field of FIELDS)lines.push('### '+field[0].toUpperCase()+field.slice(1),'',note[field]||'(not recorded)','');}
    return lines.join('\n');
  }
  root.ITMNotebook={KEY,IDS,FIELDS,normalize,load,save,record,markdown};
})(typeof window!=='undefined'?window:globalThis);
