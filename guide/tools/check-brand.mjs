import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const fail = (message) => {
  console.error(`Brand check failed: ${message}`);
  process.exitCode = 1;
};

const tokens = read('../src/styles/brand-tokens.css');
const brand = read('../src/styles/brand.css');
const config = read('../astro.config.mjs');

for (const [name, value] of Object.entries({
  'deep space': '#0B1020',
  indigo: '#6366F1',
  sky: '#3B82F6',
  teal: '#14B8A6',
  violet: '#A78BFA',
  peach: '#FB923C',
  sand: '#F8FAFC',
  slate: '#334155',
})) {
  if (!tokens.includes(value)) fail(`missing approved ${name} token (${value})`);
}

if (!config.includes("logo: { src: '/brand/logo-horizontal-light.svg'")) {
  fail('desktop header must use the approved horizontal light lockup');
}
if (!brand.includes('--sl-color-accent: var(--itm-link)')) {
  fail('the interface accent must use the shared link token');
}
if (!brand.includes('--sl-color-bg: var(--itm-paper)')) {
  fail('light reading surfaces must use the shared paper token');
}
if (!brand.includes('--sl-color-bg: var(--itm-night)')) {
  fail('dark reading surfaces must use the shared night token');
}
if (brand.includes("background: url('/brand/symbol.svg')")) {
  fail('the home hero must not use the brand mark as unexplained decorative imagery');
}

if (!process.exitCode) console.log('Brand check passed.');
