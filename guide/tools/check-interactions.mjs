import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const docs = fs.readdirSync(path.join(root, 'src/content/docs'), { recursive: true })
  .filter(file => file.endsWith('.md'))
  .map(file => read(path.join('src/content/docs', file)));
const used = new Set([...docs.join('\n').matchAll(/data-w="([\w-]+)"/g)].map(match => match[1]));
const registry = read('public/js/interaction.js');
const covered = new Set([...registry.matchAll(/^\s+([\w-]+):\s*\{/gm)].map(match => match[1]));
const missing = [...used].filter(name => !covered.has(name));
if (missing.length) {
  console.error('Interactions without a learning-frame registry entry:\n' + missing.map(name => `- ${name}`).join('\n'));
  process.exit(1);
}
console.log(`interaction coverage: ${used.size} documented widgets registered`);
