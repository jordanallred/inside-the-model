import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import '../public/js/case-catalog.js';
import '../public/js/itm-weights.js';
import '../public/js/itm-model.js';
import '../public/js/case-engine.js';

const generated = fs.readFileSync('src/content/docs/index.md', 'utf8');
const generator = fs.readFileSync('tools/gen.mjs', 'utf8');
assert.ok(fs.existsSync('tools/home-template.mjs'), 'generated homepage markup lives in a focused template module');
const template = fs.readFileSync('tools/home-template.mjs', 'utf8');
assert.ok(fs.existsSync('src/styles/home.css'), 'homepage styles are isolated from the shared chapter system');
const styles = fs.readFileSync('src/styles/home.css', 'utf8');
const script = fs.readFileSync('public/js/home.js', 'utf8');

assert.match(generator, /renderHome/, 'the generator delegates homepage structure to its dedicated template');
for (const source of [generated, template]) {
  assert.match(source, /home-proof/, 'the homepage keeps repository-backed proof adjacent to the hero');
  assert.match(source, /home-routes/, 'the homepage offers the investigation sequence');
  assert.match(source, /home-curriculum/, 'the supporting curriculum remains available');
}

assert.match(generated, /data-home-hero/, 'the generated homepage mounts the interactive hero specimen');
assert.match(styles, /prefers-reduced-motion/, 'homepage motion has a reduced-motion path');
assert.match(styles, /@media[^}]+max-width:\s*44rem/s, 'homepage has a compact viewport treatment');
assert.match(script, /dispatchEvent\(new CustomEvent\('homehero:change'/, 'the hero announces meaningful state changes');
assert.match(script, /homehero-fallback/, 'the hero renders a useful fallback when the model is unavailable');
assert.match(styles, /\.hv-go[^}]+min-height:\s*2\.75rem/s, 'the investigation link meets the 44px target floor');
assert.match(styles, /--home-link:/, 'small homepage links use a contrast-safe theme-aware accent');

const index = fs.readFileSync('src/content/docs/cases/index.md', 'utf8');
for (const c of globalThis.ITMCaseCatalog) {
  for (const page of [generated, index]) assert.ok(page.includes('/cases/' + c.slug + '/'), c.title + ' is discoverable');
  assert.ok(fs.existsSync('src/content/docs/cases/' + c.slug + '.md'), 'advertised cases are published');
}
assert.ok(generated.indexOf('/cases/place-or-animal/') < generated.indexOf('/explorer/'), 'investigation is the primary entrance');
assert.match(generated, /data-case-start/, 'primary action can resume local progress');
assert.match(generated, /<details class="home-syllabus">/, 'curriculum is available on demand');
const box = { innerHTML: '', dispatchEvent() {} };
const win = { ITM: globalThis.ITM, ITMCases: globalThis.ITMCases };
vm.runInNewContext(script, { window: win, CustomEvent: class {} });
win.W.homehero(box);
const measured = (100 * globalThis.ITMCases.runPlace('the cat sat on the').place).toFixed(2) + '%';
assert.ok(box.innerHTML.includes(measured), 'homepage baseline comes from the actual model');
win.ITM = undefined;
win.W.homehero(box);
assert.match(box.innerHTML, /homehero-fallback/);
assert.match(box.innerHTML, /href="\/cases\/place-or-animal\/"/, 'fallback keeps a useful next step');

console.log('Homepage structure, responsiveness, and interaction contracts passed.');
