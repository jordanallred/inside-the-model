import fs from 'node:fs';
import { zipSync } from 'fflate';

// Fixed timestamps and sorted names keep the downloadable project reproducible.
const sources = {
  'README.md':'tools/local-starter/README.md',
  'experiment.py':'tools/local-starter/experiment.py',
  'pyproject.toml':'tools/local-starter/pyproject.toml',
  'uv.lock':'tools/local-starter/uv.lock',
  'itm_model.py':'public/code/itm_model.py',
  'model.json':'public/trace/model.json',
  'weights.json':'public/trace/weights.json',
  'LICENSE-CODE.md':'../LICENSE-CODE.md',
};
const entries = {};
for (const [name, source] of Object.entries(sources).sort()) {
  entries['inside-the-model/'+name] = new TextEncoder().encode(fs.readFileSync(source,'utf8').replace(/\r\n/g,'\n'));
}
entries['inside-the-model/.gitignore'] = new TextEncoder().encode('.venv/\n__pycache__/\n');
fs.writeFileSync('public/code/inside-the-model-starter.zip', zipSync(entries, { level:9, mtime:new Date(1980,0,1) }));
console.log('Packaged standalone model, weights, locked environment and experiment.');
