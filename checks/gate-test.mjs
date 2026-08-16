#!/usr/bin/env node
// Runs templates/quality-gate.mjs against real fixture repos and asserts the
// outcome. `node --check` only proves the file parses; every runtime bug the
// template ever shipped would have passed that.
//
// Fixtures use {{FUTURE}} / {{PAST}} placeholders so the suite does not rot on
// a fixed calendar date.

import { cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const shift = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const SUBS = { '{{FUTURE}}': shift(45), '{{PAST}}': shift(-30), '{{TOO_FAR}}': shift(400) };

async function materialize(name) {
  const dir = await mkdtemp(join(tmpdir(), `gate-${name}-`));
  await cp(join(ROOT, 'checks/fixtures', name), dir, { recursive: true });
  await mkdir(join(dir, 'scripts'), { recursive: true });
  for (const s of ['quality-gate.mjs', 'render-status.mjs']) {
    await cp(join(ROOT, 'templates', s), join(dir, 'scripts', s));
  }
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const e of await readdir(cur, { withFileTypes: true })) {
      const p = join(cur, e.name);
      if (e.isDirectory()) { stack.push(p); continue; }
      if (!e.name.endsWith('.md')) continue;
      let text = await readFile(p, 'utf8');
      let changed = false;
      for (const [k, v] of Object.entries(SUBS)) {
        if (text.includes(k)) { text = text.split(k).join(v); changed = true; }
      }
      if (changed) await writeFile(p, text);
    }
  }
  return dir;
}

async function gate(dir) {
  try {
    const { stdout } = await run(process.execPath, ['scripts/quality-gate.mjs'], { cwd: dir });
    return { code: 0, out: stdout };
  } catch (e) {
    return { code: e.code ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

const failures = [];
const check = (name, ok, detail) => {
  if (!ok) failures.push(`${name}: ${detail}`);
};

// --- green: a correctly set up L0 repo must pass --------------------------
{
  const dir = await materialize('green');
  await run(process.execPath, ['scripts/render-status.mjs'], { cwd: dir });
  const { code, out } = await gate(dir);
  check('green', code === 0, `expected exit 0, got ${code}\n${out}`);
  check('green', /structural gates green at L0/.test(out), `no green line\n${out}`);
  check('green', /channel: release/.test(out), `expected release channel\n${out}`);
  // COMPOUND-5 is a release-stage gate: at L0 it must never block.
  check('green', !/FAIL {2}COMPOUND-5/.test(out), 'COMPOUND-5 blocked at L0');
  // The gate must admit what it cannot check instead of implying full coverage.
  check('green', /not machine-checked at L0/.test(out) && /DIAG-1/.test(out), 'no honesty section');
  await rm(dir, { recursive: true, force: true });
}

// --- red: every defect below used to pass silently ------------------------
{
  const dir = await materialize('red');
  const { code, out } = await gate(dir);
  check('red', code === 1, `expected exit 1, got ${code}\n${out}`);
  const mustFail = [
    ['DOC-1', 'empty authority table must not pass'],
    ['DOC-2', 'missing STATUS must fail'],
    ['DOC-3', 'deleting the risk register must be worse than filling it in'],
    ['DOC-5', 'a living doc named 最新 must fail'],
    ['COMPOUND-1', 'missing north star must fail'],
    ['COMPOUND-2', 'incomplete contract directory must fail'],
    ['KERNEL-1', 'unnamed pillars must fail'],
    ['PROBE-1', 'missing PR template must fail'],
    ['LAUNCH-5', 'plaintext credential must fail'],
    ['WAIVER', 'a broken waiver ledger must fail'],
  ];
  for (const [id, why] of mustFail) {
    check('red', new RegExp(`FAIL {2}${id}:`).test(out), `${why} (${id} not reported)\n${out}`);
  }
  check('red', /expired on/.test(out), 'expired waiver not caught');
  check('red', /is not a person/.test(out), 'owner "—" accepted');
  check('red', /not waivable/.test(out), 'LAUNCH-5 waiver accepted');
  check('red', /channel: blocked/.test(out), 'channel should be blocked');
  await rm(dir, { recursive: true, force: true });
}

// --- waived: a live waiver demotes its gate and forces beta ---------------
{
  const dir = await materialize('waived');
  await run(process.execPath, ['scripts/render-status.mjs'], { cwd: dir });
  const { code, out } = await gate(dir);
  check('waived', code === 0, `a waived gate must not block, got exit ${code}\n${out}`);
  check('waived', /warn {2}DOC-5.*\[waived\]/.test(out), `DOC-5 not demoted by its waiver\n${out}`);
  check('waived', /channel: beta/.test(out), `a waiver must force beta, not release\n${out}`);
  await rm(dir, { recursive: true, force: true });
}

// --- capitalized / mitigating S1 must still be counted --------------------
{
  const dir = await materialize('green');
  await writeFile(
    join(dir, 'product/risks.md'),
    ['| ID | Severity | Area | Status | Risk | Owner |',
      '|----|----------|------|--------|------|-------|',
      '| R-001 | S1 | Core | Open | boom | me |',
      '| R-002 | S1 | Core | mitigating | still boom | me |',
      '| R-003 | S1 | Core | closed | fixed the open socket leak | me |',
      ''].join('\n'),
  );
  await run(process.execPath, ['scripts/render-status.mjs'], { cwd: dir });
  const { out } = await gate(dir);
  check('s1-parse', /open S1: 2/.test(out), `Open/mitigating must count, "open" in closed prose must not\n${out}`);
  await rm(dir, { recursive: true, force: true });
}

// --- an undeclared opt-in dimension must not block ------------------------
{
  const dir = await materialize('green');
  const readme = join(dir, 'product/README.md');
  await writeFile(readme, (await readFile(readme, 'utf8')).replace('适用纬度：compound、quality-kernel', ''));
  await rm(join(dir, 'product/quality-gates.md'));
  await run(process.execPath, ['scripts/render-status.mjs'], { cwd: dir });
  const { code, out } = await gate(dir);
  check('opt-in', code === 0, `an undeclared opt-in dimension must not block, got exit ${code}\n${out}`);
  check('opt-in', /warn {2}COMPOUND-2.*\[compound not declared\]/.test(out), `COMPOUND-2 not demoted\n${out}`);
  // doc-system always applies, so a missing contract file still fails there.
  check('opt-in', /FAIL {2}DOC-1/.test(out) === false, `DOC-1 should still pass\n${out}`);
  await rm(dir, { recursive: true, force: true });
}

// --- L3 promotes release-stage gates to blocking --------------------------
{
  const dir = await materialize('green');
  const readme = join(dir, 'product/README.md');
  await writeFile(readme, (await readFile(readme, 'utf8')).replace('**L0 看见**', '**L3 可上线**'));
  await writeFile(
    join(dir, 'product/risks.md'),
    ['| ID | Severity | Area | Status | Risk | Owner |',
      '|----|----------|------|--------|------|-------|',
      '| R-001 | S1 | Core | open | boom | me |',
      ''].join('\n'),
  );
  await run(process.execPath, ['scripts/render-status.mjs'], { cwd: dir });
  const { code, out } = await gate(dir);
  check('l3', code === 1, `an open S1 must block at L3, got exit ${code}\n${out}`);
  check('l3', /FAIL {2}COMPOUND-5/.test(out), `COMPOUND-5 must block at L3\n${out}`);
  await rm(dir, { recursive: true, force: true });
}

// --- report ----------------------------------------------------------------
if (failures.length) {
  console.log('gate fixture test');
  for (const f of failures) console.log(`  FAIL  ${f}`);
  console.log(`\n${failures.length} failure(s).`);
  process.exit(1);
}
console.log('gate fixture test: 6 scenarios green (green / red / waived / s1-parse / opt-in / l3).');
