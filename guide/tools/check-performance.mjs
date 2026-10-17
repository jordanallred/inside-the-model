import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { scriptsFor } from '../src/page-assets.mjs';

function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(dir+'/'+e.name) : [dir+'/'+e.name]);
}
for (const file of walk('src/content/docs').filter(f=>f.endsWith('.md'))) {
  const body=fs.readFileSync(file,'utf8'), id=file.replace('src/content/docs/','').replace(/\.md$/,'');
  const scripts=scriptsFor(body,id);
  const context={console,document:{readyState:'loading',addEventListener(){}},localStorage:{removeItem(){}}};
  context.window=context;
  vm.createContext(context);
  for(const name of scripts) vm.runInContext(fs.readFileSync('public/js/'+name+'.js','utf8'),context,{filename:name+'.js'});
  for(const match of body.matchAll(/data-w="([^"]+)"/g)) assert.equal(typeof context.W?.[match[1]],'function',file+': '+match[1]+' and its dependencies load');
}
const home=scriptsFor(fs.readFileSync('src/content/docs/index.md','utf8'),'index');
assert.ok(!home.includes('widgets2')&&!home.includes('explorer')&&!home.includes('itm-train'),'home excludes unrelated calculators and training code');
assert.deepEqual(scriptsFor('Plain reference text','methods'),[],'plain pages need no widget scripts');
if(process.argv.includes('--built')) {
  const homeHtml=fs.readFileSync('dist/index.html','utf8');
  assert.ok(!homeHtml.includes('fonts.googleapis.com'),'home has no blocking external font stylesheet');
  assert.ok(!/href="[^"]*(?:katex|explorer|widgets|cases)[^"]*\.css/.test(homeHtml),'home excludes unused equation and experiment styles');
  for(const file of walk('dist').filter(f=>f.endsWith('.html'))) {
    const html=fs.readFileSync(file,'utf8');
    for(const match of html.matchAll(/(?:src|href)="(\/(?:_astro|js|fonts)\/[^"?#]+)(?:[?#][^"]*)?"/g))
      assert.ok(fs.existsSync('dist'+match[1]),file+': referenced asset exists '+match[1]);
  }
  for(const file of walk('dist/_astro').filter(f=>f.endsWith('.css'))) {
    for(const match of fs.readFileSync(file,'utf8').matchAll(/url\(["']?(\/[^"')]+)["']?\)/g))
      assert.ok(fs.existsSync('dist'+match[1].split(/[?#]/)[0]),file+': font or image exists '+match[1]);
  }
}
console.log('Every published widget loads with its page-specific dependencies; homepage excludes unrelated engines.');
