import assert from 'node:assert/strict';
import fs from 'node:fs';

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
  assert.match(source, /home-routes/, 'the homepage offers distinct Explorer, guide, and lab routes');
  assert.match(source, /home-curriculum/, 'the homepage presents the generated curriculum as a continuous syllabus');
}

assert.match(generated, /data-home-hero/, 'the generated homepage mounts the interactive hero specimen');
assert.match(styles, /prefers-reduced-motion/, 'homepage motion has a reduced-motion path');
assert.match(styles, /@media[^}]+max-width:\s*44rem/s, 'homepage has a compact viewport treatment');
assert.match(script, /aria-pressed/, 'token and head controls expose their selected state');
assert.match(script, /dispatchEvent\(new CustomEvent\('homehero:change'/, 'the hero announces meaningful state changes');
assert.match(script, /focusTarget/, 'the hero restores keyboard focus after rerendering its controls');
assert.match(script, /homehero-fallback/, 'the hero renders a useful fallback when the model is unavailable');
assert.match(styles, /\.hv-chip[^}]+min-height:\s*2\.75rem/s, 'attention-head controls meet the 44px target floor');
assert.match(styles, /\.hv-go[^}]+min-height:\s*2\.75rem/s, 'the Explorer link meets the 44px target floor');
assert.match(styles, /--home-link:/, 'small homepage links use a contrast-safe theme-aware accent');

console.log('Homepage structure, responsiveness, and interaction contracts passed.');
