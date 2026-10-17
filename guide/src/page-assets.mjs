import fs from 'node:fs';
import { createHash } from 'node:crypto';

const source = name => fs.readFileSync('public/js/'+name+'.js','utf8');
const order=['papers','glossary','itm-weights','itm-model','itm-train','case-catalog','case-engine','case-workspace','kit','widgets','widgets2','explorer','trainer','home','compare','cases','cases-story','interaction','site'];
const dependencies={
  'itm-model':['itm-weights'], 'itm-train':['itm-model'], 'case-engine':['itm-model'],
  'case-workspace':['case-engine'], widgets:['kit'], widgets2:['widgets'],
  explorer:['itm-model','kit'], trainer:['itm-train'], home:['case-engine'],
  compare:['itm-model'], cases:['case-catalog','case-engine','case-workspace'],
  'cases-story':['itm-model','kit'],
};
const owners=new Map();
for(const name of ['widgets','widgets2','explorer','trainer','home','compare','cases-story'])
  for(const match of source(name).matchAll(/W\.([\w]+)\s*=/g)) owners.set(match[1],name);
for(const name of ['caseplace','casetraining','casefuture','casecontrols','casesufficiency','caseconfidence']) owners.set(name,'cases');
const hashes=Object.fromEntries(order.map(name=>[name,createHash('sha256').update(source(name)).digest('hex').slice(0,10)]));

export function scriptsFor(body='',id='') {
  const needed=new Set();
  function add(name){if(needed.has(name))return;for(const dep of dependencies[name]||[])add(dep);needed.add(name);}
  const widgets=[...body.matchAll(/data-w="([^"]+)"/g)].map(m=>m[1]);
  for(const widget of widgets){const name=owners.get(widget);if(!name)throw Error('No script registered for widget: '+widget);add(name);}
  if(/<cite\b[^>]*data-p=/.test(body))add('papers');
  if(/^(guide|labs)\/[^/]+$/.test(id))add('glossary');
  if(widgets.some(w=>w!=='homehero'))add('interaction');
  if(widgets.length||needed.has('papers')||needed.has('glossary'))add('site');
  return order.filter(name=>needed.has(name));
}
export const scriptUrl = name => '/js/'+name+'.js?v='+hashes[name];
