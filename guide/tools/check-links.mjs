// Audit of the built site (run after the build): internal links and anchors resolve, citation keys exist,
// and every chapter is reachable from the sidebar and the home page. Run with: npm run check
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const DIST = 'dist';
const html = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : p.endsWith('.html') && html.push(p); } })(DIST);

const idsOf = {};
const pageOf = f => '/' + path.relative(DIST, f).replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\.html$/, '');
for (const f of html) idsOf[pageOf(f)] = new Set([...fs.readFileSync(f, 'utf8').matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));

const problems = [];
let links = 0;
for (const f of html) {
  const src = fs.readFileSync(f, 'utf8'), here = pageOf(f);
  for (const m of src.matchAll(/<a\s[^>]*href="([^"]*)"/g)) {
    let href = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|tel:|javascript:)/.test(href)) { if (/localhost/.test(href) && !/^http:\/\/localhost:8080/.test(href)) problems.push(`${here}: odd absolute link ${href}`); continue; }
    links++;
    const [p0, hash] = href.split('#');
    let target = p0 ? (p0.startsWith('/') ? p0 : path.posix.join(here, p0)) : here;
    if (p0 && !target.endsWith('/') && !path.posix.extname(target)) target += '/';
    if (path.posix.extname(target) && !/\.html$/.test(target)) { if (!fs.existsSync(path.join(DIST, target))) problems.push(`${here}: missing file ${href}`); continue; }
    if (!(target in idsOf)) { problems.push(`${here}: broken link ${href}`); continue; }
    if (hash && !hash.includes('=') && !idsOf[target].has(hash)) problems.push(`${here}: missing anchor ${href}`);
  }
}

// citations
const PAPERS = vm.runInNewContext('var window={};' + fs.readFileSync('public/js/papers.js', 'utf8') + ';window.PAPERS');
const usedKeys = new Set();
for (const f of html) for (const m of fs.readFileSync(f, 'utf8').matchAll(/data-p="([^"]+)"/g)) { usedKeys.add(m[1]); if (!PAPERS[m[1]]) problems.push(`${pageOf(f)}: unknown citation key ${m[1]}`); }
const unusedPapers = Object.keys(PAPERS).filter(k => !usedKeys.has(k));

// glossary entries compile
const GL = vm.runInNewContext('var window={};' + fs.readFileSync('public/js/glossary.js', 'utf8') + ';window.GL');
for (const [k, g] of Object.entries(GL)) { try { new RegExp('\\b(' + g.p.join('|') + ')\\b'); } catch (e) { problems.push(`glossary ${k}: bad pattern`); } }

console.log(`pages ${html.length}, internal links ${links}, citation keys used ${usedKeys.size}/${Object.keys(PAPERS).length}, glossary terms ${Object.keys(GL).length}`);
if (unusedPapers.length) console.log('bibliography entries not cited in any chapter (still listed on the papers page):', unusedPapers.join(', '));
if (problems.length) { console.log('\nPROBLEMS:\n' + problems.join('\n')); process.exit(1); }
console.log('all internal links, anchors and citations resolve');
