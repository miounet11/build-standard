#!/usr/bin/env node
// Self-check for this standard repo. A standard that cannot check itself is a wish.
// Usage: node checks/check.mjs

import { readFile, readdir, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const warnings = [];
const fail = (code, msg) => failures.push(`${code}: ${msg}`);
const warn = (code, msg) => warnings.push(`${code}: ${msg}`);

const read = (p) => readFile(join(ROOT, p), 'utf8');

// Pinned copy of ship-standard/gates.json. Validating against real ids instead
// of a hardcoded prefix list is what stops `DOC-99` from passing.
const pinned = JSON.parse(await read('checks/gates.pinned.json'));
const GATE_IDS = new Set(pinned.gates.map((g) => g.id));
const SUPERSEDED = new Map(
  pinned.gates.filter((g) => g.deprecated).map((g) => [g.id, g.supersededBy]),
);

async function listMarkdown(dir = '.', acc = []) {
  for (const e of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const rel = dir === '.' ? e.name : `${dir}/${e.name}`;
    if (e.isDirectory()) await listMarkdown(rel, acc);
    else if (e.name.endsWith('.md')) acc.push(rel);
  }
  return acc;
}

// --- versions must not drift ----------------------------------------------
const catalog = JSON.parse(await read('catalog.json'));
const pkg = JSON.parse(await read('package.json'));
if (catalog.version !== pkg.version) {
  fail('VERSION-DRIFT', `catalog.json ${catalog.version} != package.json ${pkg.version}`);
}
if (catalog.description !== pkg.description) {
  fail('VERSION-DRIFT', 'catalog.json and package.json describe this repo differently — two pitches is two authorities');
}

// --- catalog ↔ files ------------------------------------------------------
for (const p of catalog.practices) {
  try {
    await stat(join(ROOT, p.path));
  } catch {
    fail('CATALOG-MISSING', `catalog lists ${p.path} but the file does not exist`);
  }
}
try {
  await stat(join(ROOT, catalog.scheme));
} catch {
  fail('CATALOG-MISSING', `catalog.scheme points at missing ${catalog.scheme}`);
}

// Orphans in both directions: a practice file nobody indexed is a second authority
// waiting to happen.
const practiceFiles = (await readdir(join(ROOT, 'practices')))
  .filter((f) => f.endsWith('.md') && !['README.md', '_template.md'].includes(f))
  .map((f) => `practices/${f}`);
const indexed = new Set(catalog.practices.map((p) => p.path));
for (const f of practiceFiles) {
  if (!indexed.has(f)) fail('CATALOG-ORPHAN', `${f} exists but catalog.json does not list it`);
}

// Iron rule 3 applied to ourselves: the practice list is written in four places.
// They must agree, or this repo is the thing it warns about.
for (const [file, section] of [['README.md', null], ['practices/README.md', null]]) {
  const text = await read(file);
  const body = section ? text.split(section)[1] ?? '' : text;
  for (const p of catalog.practices) {
    const name = p.path.replace('practices/', '').replace('.md', '');
    if (!body.includes(name)) fail('LIST-DRIFT', `${file} does not list practice "${name}"`);
  }
}
const exampleText = await read('examples/our-studio.md');
const spelled = exampleText.match(/([一二三四五六七八九十]+|\d+)\s*(?:份|条)实践/);
const NUM = { 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 };
if (spelled) {
  const claimed = NUM[spelled[1]] ?? Number(spelled[1]);
  if (claimed !== catalog.practices.length) {
    fail('LIST-DRIFT', `examples/our-studio.md claims ${spelled[0]} but catalog has ${catalog.practices.length}`);
  }
}

// --- SCHEME must keep its load-bearing parts ------------------------------
const scheme = await read('SCHEME.md');
const section = (heading) => scheme.split(heading)[1]?.split('\n## ')[0] ?? '';

for (const s of ['## 1. 因果模型', '## 3. 十二条铁律', '## 4. 成熟度', '## 6. 豁免机制', '## 11. 明确不适用']) {
  if (!scheme.includes(s)) fail('SCHEME-SECTION', `SCHEME.md is missing "${s}"`);
}

// The causal model is only a rejection test if every rule names a leak and every
// leak is actually plugged. Otherwise it is decoration.
const leakRows = section('## 1. 因果模型').match(/^\| \*\*(\d+)\*\* \|/gm) ?? [];
const leakIds = new Set(leakRows.map((r) => r.match(/\d+/)[0]));
if (leakIds.size < 4) fail('SCHEME-LEAKS', `§1 declares ${leakIds.size} leaks; the model needs at least 4`);

const lawsSection = section('## 3. 十二条铁律');
const laws = lawsSection.match(/^\d+\. \*\*.*$/gm) ?? [];
if (laws.length !== 12) fail('SCHEME-LAWS', `expected 12 iron rules in §3, found ${laws.length}`);
const plugged = new Set();
for (const law of laws) {
  const tags = law.match(/（(\d+(?:、\d+)*)）/);
  if (!tags) {
    fail('SCHEME-UNTAGGED', `iron rule does not name the leak it plugs: ${law.slice(0, 40)}…`);
    continue;
  }
  for (const t of tags[1].split('、')) {
    if (!leakIds.has(t)) fail('SCHEME-BADTAG', `iron rule cites leak ${t}, which §1 does not declare`);
    plugged.add(t);
  }
}
for (const id of leakIds) {
  if (!plugged.has(id)) fail('SCHEME-UNPLUGGED', `leak ${id} is declared but no iron rule plugs it`);
}

// --- §4 must derive levels, not hand-list ids -----------------------------
// This is the defect that put 18 gates outside every level: a second mapping.
const maturity = section('## 4. 成熟度');
const handListed = [...maturity.matchAll(/`([A-Z]{3,}-\d+)`/g)].map((m) => m[1]);
if (handListed.length) {
  fail('SCHEME-DUP-AUTHORITY', `§4 hand-lists gate ids (${handListed.join(', ')}); levels must be derived from gates.json stage`);
}
for (const level of ['L0', 'L1', 'L2', 'L3']) {
  if (!maturity.includes(`**${level} `)) fail('SCHEME-MATURITY', `maturity level ${level} is missing from §4`);
}
if (!/gates\.json/.test(maturity)) {
  fail('SCHEME-DUP-AUTHORITY', '§4 must point at gates.json for the actual per-level gate sets');
}
// The loop belongs to practices/loop.md. A second copy here is the same defect.
const loop = section('## 5. 一笔改动怎么走');
if (/\|\s*1\.?\s*诊断\s*\|/.test(loop)) {
  fail('SCHEME-DUP-AUTHORITY', '§5 repeats the seven-step table; practices/loop.md owns it');
}
if (!/practices\/loop\.md/.test(loop)) fail('SCHEME-SECTION', '§5 must link practices/loop.md');
if (/以本页为准/.test(scheme)) {
  fail('SCHEME-DUP-AUTHORITY', 'SCHEME claims to override the other authorities; that makes it a second authority');
}

// --- every referenced gate id must be a real gate -------------------------
const mdFiles = await listMarkdown();
for (const f of mdFiles) {
  if (f.startsWith('checks/fixtures/')) continue; // fixtures are deliberately wrong
  const text = await read(f);
  for (const m of text.matchAll(/`([A-Z]{3,}-\d+)`/g)) {
    if (!GATE_IDS.has(m[1])) {
      fail('GATE-UNKNOWN', `${f}: ${m[1]} is not a gate in gates.json ${pinned.version}`);
    } else if (SUPERSEDED.has(m[1]) && f !== 'CHANGELOG.md') {
      fail('GATE-DEPRECATED', `${f}: ${m[1]} is deprecated upstream, use ${SUPERSEDED.get(m[1])}`);
    }
  }
}
if (!scheme.includes('ship-standard')) fail('SCHEME-BOUNDARY', 'SCHEME.md must point acceptance at ship-standard');
for (const id of pinned.nonWaivable) {
  if (!scheme.includes(id)) warn('SCHEME-BOUNDARY', `${id} is non-waivable upstream but §6 does not mention it`);
}

// --- doc-system rules applied to ourselves --------------------------------
for (const f of mdFiles) {
  const fixture = f.startsWith('checks/fixtures/');
  const text = await read(f);
  if (!fixture && /最新|latest-version|FINAL/i.test(f)) {
    fail('DOC-5', `file name claims a moving target: ${f}`);
  }
  if (!fixture) {
    for (const line of text.split('\n')) {
      if (/^#{1,6}\s/.test(line) && /最新版|当前唯一/.test(line)) {
        fail('DOC-5', `${f}: heading claims a moving target: ${line.trim()}`);
      }
    }
  }

  const headings = text.split('\n').filter((l) => /^##\s+\S/.test(l)).map((l) => l.trim());
  const dupes = [...new Set(headings.filter((h, i) => headings.indexOf(h) !== i))];
  if (dupes.length) fail('DOC-DUP-HEADING', `${f}: repeated heading ${dupes.join(', ')}`);

  // All relative links, not just ./ and ../ — a bare `practices/loop.md` was
  // previously unchecked, which is most of the generated STATUS.
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = m[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    // templates/ are copied into a product repo, so their ./ links resolve there.
    // templates/README.md is not copied, so its links must resolve here.
    if (f.startsWith('templates/') && f !== 'templates/README.md' && target.startsWith('./')) continue;
    if (fixture) continue;
    try {
      await stat(resolve(dirname(join(ROOT, f)), target.split('#')[0]));
    } catch {
      fail('LINK-DEAD', `${f}: dead relative link ${target}`);
    }
  }

  if (fixture) continue;
  if (/\b(sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{12,}|ghp_[A-Za-z0-9]{20,})\b/.test(text)) {
    fail('SECRET', `${f}: looks like a credential`);
  }
  if (/\b\d{1,3}(\.\d{1,3}){3}\b/.test(text) && !/0\.0\.0\.0|127\.0\.0\.1/.test(text)) {
    warn('HOST-IN-DOC', `${f}: contains a bare IP address`);
  }
}

// --- the shipped templates must exist and run -----------------------------
for (const t of [
  'templates/product-README.md', 'templates/roadmap.md', 'templates/risks.md',
  'templates/waivers.md', 'templates/quality-gates.md',
  'templates/quality-gate.mjs', 'templates/render-status.mjs',
]) {
  try {
    await stat(join(ROOT, t));
  } catch {
    fail('TEMPLATE-MISSING', `${t} is promised but not shipped`);
  }
}
try {
  await run(process.execPath, [join(ROOT, 'checks/gate-test.mjs')]);
} catch (err) {
  fail('TEMPLATE-BROKEN', `gate fixtures failed:\n${err.stdout ?? err.message}`);
}

// --- STATUS must be generated --------------------------------------------
try {
  const status = await read('STATUS.md');
  if (!/Generated by/.test(status)) fail('DOC-2', 'STATUS.md is missing the generated banner');
  if (!status.includes(catalog.version)) {
    fail('DOC-2', `STATUS.md does not show catalog version ${catalog.version} — run npm run status`);
  }
} catch {
  fail('DOC-2', 'STATUS.md is missing — run npm run status');
}

// --- report --------------------------------------------------------------
console.log('build-standard self-check');
console.log(`  practices:  ${catalog.practices.length}`);
console.log(`  iron rules: ${laws.length} plugging ${plugged.size}/${leakIds.size} leaks`);
console.log(`  gates pinned at ship-standard ${pinned.version} (${GATE_IDS.size} ids)`);
console.log(`  markdown:   ${mdFiles.length}`);
for (const w of warnings) console.log(`  warn  ${w}`);
for (const f of failures) console.log(`  FAIL  ${f}`);

if (failures.length) {
  console.log(`\n${failures.length} blocking problem(s).`);
  process.exit(1);
}
console.log(`\nall gates green${warnings.length ? ` (${warnings.length} warning)` : ''}.`);
