#!/usr/bin/env node
// Portable structural quality gate for a PRODUCT repo.
// Copy to scripts/quality-gate.mjs and wire `npm run gate`. No dependencies; Node >= 18.
//
// What it does:
//   1. Reads the maturity level declared in product/README.md.
//   2. Runs the structural checks it can run without product knowledge.
//   3. A check blocks only if its gate's stage belongs to the declared level
//      (build-standard SCHEME.md §4). Everything above the level runs as warn.
//   4. A live waiver demotes its gate from block to warn and forces channel = beta.
//
// What it does NOT do: it never claims to cover a whole level. Gates it cannot
// check are printed under "not machine-checked" so the green line is honest.

import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { execFile, spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);

// execFile cannot write stdin, and `git check-ignore` needs it.
function runWithStdin(cmd, args, cwd, input) {
  return new Promise((done) => {
    const p = spawn(cmd, args, { cwd });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.on('error', () => done(''));
    p.on('close', () => done(out));
    p.stdin.on('error', () => {});
    p.stdin.end(input);
  });
}

// --- repo root: from this file, not from cwd -------------------------------
// `npm run gate` from a workspace package would otherwise check the wrong tree
// and pass because nothing it looks for exists there.
async function findRoot() {
  if (process.env.GATE_ROOT) return resolve(process.env.GATE_ROOT);
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i += 1) {
    if (await exists(dir, 'product')) return dir;
    if (await exists(dir, '.git')) return dir;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return process.cwd();
}
async function exists(...p) {
  try { await stat(join(...p)); return true; } catch { return false; }
}

const ROOT = await findRoot();
const has = (p) => exists(ROOT, p);
const read = (p) => readFile(join(ROOT, p), 'utf8');
const readOr = async (p, fallback = '') => ((await has(p)) ? read(p) : fallback);

// Local calendar date. toISOString() is UTC and kills a waiver eight hours early
// in UTC+8.
const today = (() => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

// --- gate metadata ---------------------------------------------------------
// Stage and severity come from ship-standard/gates.json. Vendor that file to
// product/gates.json and this script will validate against it; without it these
// pinned values are used and drift is reported as a warning.
const STAGE = {
  'DOC-1': 'see', 'DOC-2': 'see', 'DOC-3': 'see', 'DOC-5': 'see',
  'DIAG-1': 'see', 'KERNEL-1': 'see', 'COMPOUND-1': 'see', 'COMPOUND-2': 'see',
  'COMPOUND-6': 'see', 'PROBE-1': 'see', 'PROBE-2': 'see', 'PROBE-6': 'see',
  'COMPOUND-5': 'release', 'LAUNCH-5': 'release', 'LAUNCH-11': 'release',
};
const DIMENSION = {
  'DOC-1': 'doc-system', 'DOC-2': 'doc-system', 'DOC-3': 'doc-system', 'DOC-5': 'doc-system',
  'DIAG-1': 'diagnose', 'KERNEL-1': 'quality-kernel',
  'COMPOUND-1': 'compound', 'COMPOUND-2': 'compound', 'COMPOUND-5': 'compound', 'COMPOUND-6': 'compound',
  'PROBE-1': 'probe', 'PROBE-2': 'probe', 'PROBE-6': 'probe',
  'LAUNCH-5': 'launch', 'LAUNCH-11': 'launch',
};
let APPLIES = {
  launch: 'all', resilience: 'opt-in', diagnose: 'all', 'quality-kernel': 'opt-in',
  'acceptance-path': 'opt-in', 'pre-ship': 'opt-in', compound: 'opt-in', probe: 'all', 'doc-system': 'all',
};
const LEVELS = {
  L0: ['see'],
  L1: ['see', 'change-safe'],
  L2: ['see', 'change-safe', 'contract'],
  L3: ['see', 'change-safe', 'contract', 'release'],
};
// Gates in the see stage that this script deliberately does not try to check.
const NOT_CHECKED = {
  'DIAG-1': '分层与每层证据是产品知识，脚本判不了',
  'PROBE-6': '「同一 PR 补了风险」是过程，静态判不了；用 PR 模板兜',
  'LAUNCH-11': '第三条路径有没有靠公布主机地址，脚本判不了',
};
let NON_WAIVABLE = ['LAUNCH-5', 'LAUNCH-11', 'PRESHIP-4'];
let knownGateIds = null;

const vendored = await readOr('product/gates.json');
if (vendored) {
  try {
    const spec = JSON.parse(vendored);
    knownGateIds = new Set(spec.gates.filter((g) => !g.deprecated).map((g) => g.id));
    NON_WAIVABLE = spec.nonWaivable ?? NON_WAIVABLE;
    APPLIES = spec.applies ?? APPLIES;
    for (const g of spec.gates) {
      if (STAGE[g.id] && STAGE[g.id] !== g.stage) {
        warn('GATE-DRIFT', `${g.id} stage pinned as ${STAGE[g.id]} but gates.json says ${g.stage}`);
      }
      if (STAGE[g.id]) { STAGE[g.id] = g.stage; DIMENSION[g.id] = g.dimension; }
    }
  } catch {
    warn('GATE-DRIFT', 'product/gates.json is not valid JSON — using pinned stages');
  }
}

// --- findings --------------------------------------------------------------
const findings = [];  // { id, msg }
const notes = [];
function bad(id, msg) { findings.push({ id, msg }); }
function warn(id, msg) { findings.push({ id, msg, forceWarn: true }); }

// --- level -----------------------------------------------------------------
const AUTHORITY = 'product/README.md';
const authority = await readOr(AUTHORITY);
let level = null;
let promoteBy = null;

if (!authority.trim()) {
  bad('DOC-1', `${AUTHORITY} missing or empty — no authority table`);
} else {
  const rows = authority.split('\n').filter((l) => /^\|/.test(l) && /\]\(/.test(l));
  if (rows.length < 3) {
    bad('DOC-1', `${AUTHORITY} has ${rows.length} linked authority row(s); a real authority table links a file per concern`);
  }
  // Anchored on a declaration. A bare /L[0-3]/ also matches prose such as
  // "don't declare L3 yet", which is the opposite of a declaration.
  const m = authority.match(/(?:当前级别|current level|maturity level)\s*[:：]?\s*\**\s*L([0-3])\b/i);
  if (!m) {
    bad('DOC-1', `${AUTHORITY} does not declare a maturity level — write a line like "当前级别：**L0 看见**"`);
  } else level = `L${m[1]}`;

  const due = authority.match(/(?:升级|promote)[^\n|]*?(\d{4}-\d{2}-\d{2})/);
  if (!due) {
    bad('DOC-1', `${AUTHORITY} declares a level but no promotion due date — a level with no clock is a permanent excuse`);
  } else {
    promoteBy = due[1];
    if (promoteBy < today) bad('DOC-1', `promotion to the next level was due ${promoteBy} and has not happened`);
  }
  if (!/主柱|pillar/i.test(authority)) {
    bad('KERNEL-1', `${AUTHORITY} does not name the product's 主柱 (or state that it has none — SCHEME §11)`);
  }
}
const effective = level ?? 'L0';

// opt-in dimensions only bind when the product says they apply. A long-running
// signup farm needs resilience; a library does not. Without this, deriving
// levels from stage would force irrelevant gates on everyone.
const declaredDims = new Set(
  (authority.match(/(?:适用纬度|opt-in dimensions)\s*[:：]([^\n]*)/i)?.[1] ?? '')
    .split(/[、,，\s]+/).map((s) => s.trim().replace(/[`*]/g, '')).filter(Boolean),
);
const dimBinds = (id) => {
  const d = DIMENSION[id];
  return !d || APPLIES[d] !== 'opt-in' || declaredDims.has(d);
};
notes.push(`level: ${level ?? 'undeclared (treated as L0)'}${promoteBy ? ` · promote by ${promoteBy}` : ''}`);
notes.push(`opt-in dimensions: ${declaredDims.size ? [...declaredDims].join(', ') : 'none declared'}`);

// --- COMPOUND-2 contract directory ----------------------------------------
const CONTRACT = ['product/roadmap.md', 'product/risks.md', 'product/quality-gates.md', 'STATUS.md'];
for (const f of CONTRACT) {
  if (!(await has(f))) bad('COMPOUND-2', `contract file missing: ${f}`);
}
if (!(await has('product/spec'))) bad('COMPOUND-2', 'contract directory missing: product/spec/');

// --- COMPOUND-1 north star -------------------------------------------------
const roadmap = await readOr('product/roadmap.md');
if (roadmap) {
  const northStar = /北极星|north star/i.test(roadmap) || /北极星|north star/i.test(authority);
  if (!northStar) bad('COMPOUND-1', 'no 北极星 written in product/roadmap.md or the authority table');
  if (!/out.?of.?scope|不做|本季度不/i.test(roadmap)) {
    warn('COMPOUND-6', 'product/roadmap.md does not say what is out of scope this quarter');
  }
}

// --- PROBE-1 PR template ---------------------------------------------------
const prTemplateNames = [
  '.github/pull_request_template.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/PULL_REQUEST_TEMPLATE/pull_request_template.md',
];
let prTemplate = '';
for (const n of prTemplateNames) if (await has(n)) prTemplate = await read(n);
if (!prTemplate) {
  bad('PROBE-1', 'no PR template — the seven steps have nowhere to show up');
} else {
  const steps = [/诊断|diagnos/i, /规格|spec/i, /计划|plan/i, /红|red|probe/i, /绿|green/i, /验证|verif/i, /反思|reflect/i];
  const missing = steps.filter((r) => !r.test(prTemplate)).length;
  if (missing) bad('PROBE-1', `PR template is missing ${missing} of the seven steps`);
}

// --- PROBE-2 gate list says warn or block ---------------------------------
const gateDoc = await readOr('product/quality-gates.md');
if (gateDoc) {
  const gateRows = gateDoc.split('\n').filter((l) => /^\|/.test(l) && /\b[A-Z]+-\d+\b/.test(l));
  const unlabelled = gateRows.filter((l) => !/\b(warn|block|阻断|警告)\b/i.test(l));
  if (!gateRows.length) bad('PROBE-2', 'product/quality-gates.md references no gate id');
  else if (unlabelled.length) bad('PROBE-2', `${unlabelled.length} gate row(s) do not say warn or block`);
  if (knownGateIds) {
    for (const l of gateRows) {
      const id = l.match(/\b([A-Z]+-\d+)\b/)?.[1];
      if (id && !knownGateIds.has(id)) warn('PROBE-2', `unknown gate id referenced: ${id}`);
    }
  }
}

// --- DOC-3 / COMPOUND-5 risk register -------------------------------------
// Column-indexed. A substring match on "open" both misses `mitigating` and
// fires on the word "open" inside a closed row's prose.
function parseTable(text, idPattern) {
  const lines = text.split('\n');
  const out = [];
  let header = null;
  for (const line of lines) {
    if (!/^\s*\|/.test(line)) { header = null; continue; }
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (/^[-\s:|]+$/.test(line.replace(/\|/g, '-'))) continue;
    if (!header) { header = cells.map((c) => c.toLowerCase()); continue; }
    if (idPattern && !idPattern.test(cells[0] ?? '')) continue;
    out.push({ cells, header });
  }
  return out;
}
const col = (row, ...names) => {
  for (const n of names) {
    const i = row.header.findIndex((h) => h.includes(n));
    if (i >= 0) return (row.cells[i] ?? '').toLowerCase();
  }
  return '';
};

let openS1 = 0;
if (!(await has('product/risks.md'))) {
  // Deleting the register must never be cheaper than filling it in.
  bad('DOC-3', 'product/risks.md missing — open problems have nowhere authoritative to live');
} else {
  const rows = parseTable(await read('product/risks.md'), /^R-\d+/);
  if (!rows.length) warn('DOC-3', 'product/risks.md has no risk rows yet');
  for (const r of rows) {
    const sev = col(r, '严重', 'sever', 's1');
    const status = col(r, '状态', 'status');
    if (!status) { warn('DOC-3', `risk ${r.cells[0]} has no status column`); continue; }
    if (/s1/.test(sev) && status !== 'closed' && status !== '已关闭') openS1 += 1;
  }
  notes.push(`open S1: ${openS1}`);
  if (openS1 > 0) bad('COMPOUND-5', `${openS1} open S1 — official release blocked`);
}

// --- DOC-2 STATUS is generated, fresh, and version-consistent -------------
if (!(await has('STATUS.md'))) {
  bad('DOC-2', 'STATUS.md missing — copy templates/render-status.mjs and generate one');
} else {
  const before = await read('STATUS.md');
  if (!/generated by|由.*生成|自动生成/i.test(before)) {
    bad('DOC-2', 'STATUS.md has no generator banner — if it is hand-written it will drift');
  }
  if (await has('scripts/render-status.mjs')) {
    try {
      await run(process.execPath, ['scripts/render-status.mjs'], { cwd: ROOT });
      const after = await read('STATUS.md');
      const strip = (s) => s.replace(/^.*(生成时间|generated at|timestamp).*$/gim, '');
      if (strip(before) !== strip(after)) {
        await writeFile(join(ROOT, 'STATUS.md'), before);
        bad('DOC-2', 'STATUS.md is stale — run scripts/render-status.mjs and commit the result');
      }
    } catch (e) {
      warn('DOC-2', `scripts/render-status.mjs failed: ${String(e.message).split('\n')[0]}`);
    }
  } else {
    bad('DOC-2', 'scripts/render-status.mjs missing — STATUS.md cannot be proven generated');
  }

  const shipped = await shippedVersion();
  if (shipped && !before.includes(shipped)) {
    bad('DOC-2', `STATUS.md does not mention the shipped version ${shipped} — it is out of date`);
  } else if (shipped) notes.push(`version: ${shipped}`);
}
async function shippedVersion() {
  for (const [file, re] of [
    ['package.json', /"version"\s*:\s*"([^"]+)"/],
    ['src-tauri/tauri.conf.json', /"version"\s*:\s*"([^"]+)"/],
    ['pyproject.toml', /^version\s*=\s*"([^"]+)"/m],
    ['Cargo.toml', /^version\s*=\s*"([^"]+)"/m],
  ]) {
    const text = await readOr(file);
    const m = text.match(re);
    if (m) return m[1];
  }
  return null;
}

// --- waivers ---------------------------------------------------------------
// Append-only ledger. `open` rows are live; closed rows stay so the count of
// renewals is computed rather than self-reported.
const liveWaivers = new Set();
if (await has('product/waivers.md')) {
  const rows = parseTable(await read('product/waivers.md'), /^[A-Z]+-\d+$/);
  const seen = new Map();
  for (const r of rows) {
    const id = r.cells[0];
    seen.set(id, (seen.get(id) ?? 0) + 1);
    const status = col(r, '状态', 'status') || 'open';
    const due = (col(r, '到期', 'due') || '').match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
    const owner = col(r, 'owner', '负责');

    if (NON_WAIVABLE.includes(id)) { bad('WAIVER', `${id} is not waivable (gates.json nonWaivable)`); continue; }
    if (knownGateIds && !knownGateIds.has(id)) bad('WAIVER', `${id} is not a gate id`);
    if (status === 'closed' || status === '已关闭') continue;

    // A malformed waiver grants nothing. Otherwise "no owner" would still buy
    // the demotion it is being rejected for.
    const problems = [];
    if (!owner || ['—', '-', 'tbd', 'n/a', ''].includes(owner)) {
      problems.push(`has no owner — "${owner || 'empty'}" is not a person`);
    }
    if (!due) problems.push('has no due date');
    else if (due < today) problems.push(`expired on ${due} — the gate is failing again`);
    else if (daysBetween(today, due) > 90) {
      problems.push(`is waived until ${due}, longer than a release cycle — shorten it or fix the gate`);
    }
    if (seen.get(id) >= 3) {
      problems.push(`waived ${seen.get(id)} times — change the product or change the gate (SCHEME §6)`);
    }
    for (const p of problems) bad('WAIVER', `${id} ${p}`);
    if (!problems.length) liveWaivers.add(id);
  }
}

// --- DOC-5 / LAUNCH-5 document scan ---------------------------------------
const SKIP_DIRS = new Set([
  'node_modules', 'target', 'dist', 'build', 'out', '.next', 'vendor',
  'coverage', '.venv', 'venv', 'Pods', '__pycache__',
]);
async function walk(dir = '.', acc = []) {
  for (const e of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const rel = dir === '.' ? e.name : `${dir}/${e.name}`;
    if (e.isDirectory()) await walk(rel, acc);
    else if (e.name.endsWith('.md')) acc.push(rel);
  }
  return acc;
}
let docs = await walk();

// A gitignored local note is not a repository leak. Scanning it produces a false
// alarm that teaches people to ignore the gate.
if (docs.length) {
  const stdout = await runWithStdin('git', ['check-ignore', '--stdin'], ROOT, docs.join('\n'));
  const ignored = new Set(stdout.split('\n').map((s) => s.trim()).filter(Boolean));
  if (ignored.size) docs = docs.filter((d) => !ignored.has(d));
}

const SECRET_SHAPES = [
  /\b(sk-[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{12,}|xox[baprs]-[A-Za-z0-9-]{10,})\b/,
  /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
const CREDENTIAL_TEXT = [
  /(密码|口令|password|passphrase|secret|token)\s*[:：=]\s*[^\s<{$][^\s]{5,}/i,
  /^\s*\|\s*(密码|口令|password|passphrase)\s*\|\s*[^\s|][^|]{4,}\|/im,
];
for (const f of docs) {
  const text = await read(f);
  const archived = f.includes('archive/');
  if (!archived && /最新|latest-version|current-only/i.test(f)) {
    bad('DOC-5', `living doc claims to be the moving latest -> ${f}`);
  }
  if (!archived) {
    for (const line of text.split('\n')) {
      if (/^#{1,6}\s/.test(line) && /最新版|当前唯一|the latest version/i.test(line)) {
        bad('DOC-5', `heading claims to be the moving latest -> ${f}: ${line.trim().slice(0, 40)}`);
      }
    }
  }
  if (SECRET_SHAPES.some((r) => r.test(text))) bad('LAUNCH-5', `credential-shaped string in ${f}`);
  else if (CREDENTIAL_TEXT.some((r) => r.test(text))) bad('LAUNCH-5', `plaintext credential in ${f}`);
}
notes.push(`markdown scanned: ${docs.length}`);

// --- verdict ---------------------------------------------------------------
// A non-waivable gate guards irreversible harm (SCHEME leak 5). Letting L0
// downgrade it to a warning would mean the ladder can bless a leaked key.
const inLevel = (id) => NON_WAIVABLE.includes(id)
  || (dimBinds(id) && LEVELS[effective].includes(STAGE[id] ?? 'release'));
const whyWarn = (id) => (dimBinds(id) ? `above ${effective}` : `${DIMENSION[id]} not declared`);
const blocking = [];
const warnings = [];
for (const f of findings) {
  const isBlock = !f.forceWarn && (f.id === 'WAIVER' || inLevel(f.id));
  if (isBlock && liveWaivers.has(f.id)) warnings.push({ ...f, waived: true });
  else if (isBlock) blocking.push(f);
  else warnings.push(f);
}

console.log(`quality gate — ${ROOT}`);
for (const n of notes) console.log(`  · ${n}`);
for (const w of warnings) {
  console.log(`  warn  ${w.id}: ${w.msg}${w.waived ? ' [waived]' : w.forceWarn ? '' : ` [${whyWarn(w.id)}]`}`);
}
for (const f of blocking) console.log(`  FAIL  ${f.id}: ${f.msg}`);

const manual = Object.entries(NOT_CHECKED).filter(([id]) => inLevel(id));
if (manual.length) {
  console.log(`\n  not machine-checked at ${effective} (verify by hand):`);
  for (const [id, why] of manual) console.log(`    ${id} — ${why}`);
}

const channel = blocking.length ? 'blocked' : liveWaivers.size || openS1 ? 'beta' : 'release';
console.log(`\nchannel: ${channel}${liveWaivers.size ? ` (${liveWaivers.size} live waiver)` : ''}`);

if (blocking.length) {
  console.log(`${blocking.length} blocking problem(s) at ${effective}. Fix them, or file a waiver with an owner and a due date in product/waivers.md.`);
  process.exit(1);
}
console.log(`structural gates green at ${effective}${warnings.length ? ` (${warnings.length} warning)` : ''}.`);
