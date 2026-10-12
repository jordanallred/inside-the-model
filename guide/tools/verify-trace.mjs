// Checks the browser engine (public/js/itm-model.js) against the independent NumPy reference. Tolerance 1e-9.
// Also writes public/trace/golden.json: the canonical traces readers can download as test fixtures.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import '../public/js/itm-weights.js';
import '../public/js/itm-model.js';
import '../public/js/itm-train.js';

const { ITM } = globalThis, TOL = 1e-9;
const run = exe => JSON.parse(execFileSync(exe, ['-I', 'tools/reference_model.py'], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] }).toString());
let py;
for (const exe of [process.env.PYTHON, 'python', 'python3', 'py'].filter(Boolean)) {
  try { py = run(exe); break; } catch (e) { if (e.code !== 'ENOENT' && !/not found|was not found/i.test(String(e.stderr))) { console.error(String(e.stderr)); process.exit(1); } }
}
if (!py) { console.error('verify-trace: Python with numpy not found (set PYTHON=path)'); process.exit(1); }
const { W, sum } = ITM.weights();
let worst = 0, bad = 0;
const cmp = (name, a, b) => {
  const flat = x => (Array.isArray(x) ? x.flatMap(flat) : [x]), A = flat(a), B = flat(b);
  if (A.length !== B.length) { bad++; console.error(`${name}: length ${A.length} vs ${B.length}`); return; }
  A.forEach((v, i) => { const e = v === B[i] ? 0 : Math.abs(v - B[i]); worst = Math.max(worst, e); if (!(e <= TOL)) { bad++; if (bad < 8) console.error(`${name}[${i}]: ${v} vs ${B[i]}`); } });
};
if (sum !== py.checksum) { bad++; console.error(`checksum ${sum} (js) vs ${py.checksum} (python)`); }
const golden = { manifest: ITM.manifest(), tolerance: TOL, runs: [] };
py.runs.forEach(run => {
  const { ids } = ITM.tokenize(run.prompt), tr = ITM.forward(W, ids);
  cmp(run.prompt + ' ids', ids, run.ids);
  tr.layers.forEach((L, l) => L.heads.forEach((H, h) => cmp(`${run.prompt} L${l}H${h} weights`, H.weights, run.weights[l][h])));
  cmp(run.prompt + ' x_final', tr.layers.at(-1).resid2, run.x_final);
  cmp(run.prompt + ' logits', tr.logits, run.logits);
  // invariants
  tr.layers.forEach((L, l) => L.heads.forEach((H, h) => H.weights.forEach((w, i) => {
    if (Math.abs(w.reduce((a, b) => a + b, 0) - 1) > 1e-12) { bad++; console.error(`row sum L${l}H${h} t${i}`); }
    if (w.slice(i + 1).some(v => v !== 0)) { bad++; console.error(`mask leak L${l}H${h} t${i}`); }
  })));
  const short = ITM.forward(W, ids.slice(0, 4));   // causality: earlier positions ignore later tokens
  cmp(run.prompt + ' causal', short.logits, tr.logits.slice(0, 4));
  golden.runs.push({ prompt: run.prompt, ids, logits: tr.logits, attention: tr.layers.map(L => L.heads.map(H => H.weights)) });
});
// gradient check: hand-written backprop (itm-train.js) against central finite differences, on a clone of the trained weights
{
  const ids = ITM.tokenize(ITM.CFG.prompts[1]).ids, Wc = ITM.cloneW(W), { G } = ITM.lossGrad(Wc, ids), gm = ITM.gmats(G), wm = ITM.mats(Wc);
  let r = 12345; const rnd = n => { r = (r * 1664525 + 1013904223) >>> 0; return r % n; };
  let gw = 0;
  wm.forEach(([name, M], k) => { for (let n = 0; n < 4; n++) {
    const i = rnd(M.length), j = rnd(M[0].length), old = M[i][j], e = 1e-6;
    M[i][j] = old + e; const lp = ITM.lossGrad(Wc, ids).loss; M[i][j] = old - e; const lm = ITM.lossGrad(Wc, ids).loss; M[i][j] = old;
    const num = (lp - lm) / (2 * e), ana = gm[k][1][i][j], rel = Math.abs(num - ana) / Math.max(1e-7, Math.abs(num) + Math.abs(ana)); gw = Math.max(gw, rel);
    if (rel > 1e-4) { bad++; console.error(`gradient ${name}[${i}][${j}]: numeric ${num} vs analytic ${ana}`); }
  } });
  console.log(`verify-trace: gradient check (JS backprop vs finite differences), worst relative error ${gw.toExponential(2)}`);
}
fs.mkdirSync('public/trace', { recursive: true });
fs.writeFileSync('public/trace/golden.json', JSON.stringify(golden));
if (bad) { console.error(`verify-trace FAILED (${bad} problems)`); process.exit(1); }
console.log(`verify-trace: checksum ${sum}, ${py.runs.length} prompts, max |js - numpy| = ${worst.toExponential(2)} (tolerance ${TOL})`);
