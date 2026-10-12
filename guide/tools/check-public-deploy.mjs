import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const failures = [];
const siteUrl = (process.env.SITE_URL || 'https://insidethemodel.app').replace(/\/$/, '');

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

function read(relative) {
  const file = path.join(dist, relative);
  if (!fs.existsSync(file)) {
    failures.push(`missing ${relative}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

const home = read('index.html');
const notFound = read('404.html');
const robots = read('robots.txt');
const sitemap = read('sitemap-index.xml');
const socialCard = path.join(dist, 'social-card.png');

if (!home.includes(`<link rel="canonical" href="${siteUrl}/"`)) failures.push('home page lacks the expected canonical URL');
for (const [name, value] of [
  ['og:url', `${siteUrl}/`],
  ['og:image', `${siteUrl}/social-card.png`],
  ['twitter:image', `${siteUrl}/social-card.png`],
]) {
  if (!new RegExp(`<meta (?:property|name)="${name}" content="${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(home)) {
    failures.push(`home page lacks ${name}`);
  }
}
if (!/meta (?:name|property)="twitter:card" content="summary_large_image"/.test(home)) failures.push('home page lacks a large X/Twitter card');
if (!home.includes('"@type":"WebSite"')) failures.push('home page lacks WebSite JSON-LD');
if (!home.includes('"@type":"LearningResource"')) failures.push('home page lacks LearningResource JSON-LD');
if (!/meta name="robots" content="noindex"/.test(notFound)) failures.push('404 page is indexable');
if (!robots.includes(`Sitemap: ${siteUrl}/sitemap-index.xml`)) failures.push('robots.txt lacks the expected sitemap URL');
if (!sitemap.includes(siteUrl)) failures.push('sitemap does not use the expected site URL');
if (!fs.existsSync(socialCard)) failures.push('missing social-card.png');

if (failures.length) {
  console.error('Public deployment check failed:\n' + failures.map(f => `- ${f}`).join('\n'));
  process.exit(1);
}

console.log('Public deployment check passed.');
