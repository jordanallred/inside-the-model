// Syntax-check every browser script in public/js before building, so one typo cannot silently disable a feature.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
let bad = 0;
for (const f of fs.readdirSync('public/js').filter(f => f.endsWith('.js'))) {
  try { execFileSync(process.execPath, ['--check', `public/js/${f}`], { stdio: 'pipe' }); }
  catch (e) { bad++; console.error(`SYNTAX ERROR in public/js/${f}:\n${e.stderr}`); }
}
if (bad) process.exit(1);
console.log('public/js: all scripts parse');
