import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const failures = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

for (const file of walk(dist)) {
  if (!/\.(?:html|js|xml)$/i.test(file)) continue;
  const output = fs.readFileSync(file, 'utf8');
  if (/localhost(?::\d+)?/i.test(output)) failures.push(`${path.relative(root, file)} contains a localhost URL`);
  if (/\/api\/state\//.test(output)) failures.push(`${path.relative(root, file)} calls the retired shared progress API`);
  if (/progress is saved on the computer running this site|phone and laptop share it/i.test(output)) {
    failures.push(`${path.relative(root, file)} contains retired local-hosting copy`);
  }
}

const siteScript = fs.readFileSync(path.join(root, 'public', 'js', 'site.js'), 'utf8');
if (!/localStorage\.getItem\('book-progress'\)/.test(siteScript)) {
  failures.push('the browser-local reading-progress store is missing');
}

if (failures.length) {
  console.error('Public deployment check failed:\n' + failures.map(f => `- ${f}`).join('\n'));
  process.exit(1);
}

console.log('Public deployment check passed.');
