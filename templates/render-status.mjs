#!/usr/bin/env node
// Portable STATUS generator for a PRODUCT repo.
// Copy to scripts/render-status.mjs and wire `npm run status`. No dependencies; Node >= 18.
//
// STATUS.md answers one question: what is broken right now. It is generated so
// that nobody can hand-edit a percentage into it.
//
// Deliberately NO wall-clock timestamp in the output: the generation time is the
// commit time, and a timestamp would make `git diff --exit-code STATUS.md` — the
// one CI line that proves STATUS is fresh — fail on every run.
//
// Extend the VERSION_SOURCES and the "product signals" section for your repo.
// Keep it generated; do not start hand-writing rows.

import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

async function exists(...p) { try { await stat(join(...p)); return true; } catch { return false; } }
async function findRoot() {
  if (process.env.GATE_ROOT) return resolve(process.env.GATE_ROOT);
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i += 1) {
    if (await exists(dir, 'product') || await exists(dir, '.git')) return dir;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return process.cwd();
}
const ROOT = await findRoot();
const readOr = async (p, fallback = '') => {
  try { return await readFile(join(ROOT, p), 'utf8'); } catch { return fallback; }
};

const today = (() => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();

// --- version ---------------------------------------------------------------
const VERSION_SOURCES = [
  ['package.json', /"version"\s*:\s*"([^"]+)"/],
  ['src-tauri/tauri.conf.json', /"version"\s*:\s*"([^"]+)"/],
  ['pyproject.toml', /^version\s*=\s*"([^"]+)"/m],
  ['Cargo.toml', /^version\s*=\s*"([^"]+)"/m],
];
let version = null;
let versionFrom = null;
for (const [file, re] of VERSION_SOURCES) {
  const m = (await readOr(file)).match(re);
  if (m) { version = m[1]; versionFrom = file; break; }
}

// --- table parsing ---------------------------------------------------------
function parseTable(text, idPattern) {
  const out = [];
  let header = null;
  for (const line of text.split('\n')) {
    if (!/^\s*\|/.test(line)) { header = null; continue; }
    if (/^[-\s:|]+$/.test(line.replace(/\|/g, '-'))) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (!header) { header = cells.map((c) => c.toLowerCase()); continue; }
    if (idPattern && !idPattern.test(cells[0] ?? '')) continue;
    out.push({ cells, header });
  }
  return out;
}
const col = (row, ...names) => {
  for (const n of names) {
    const i = row.header.findIndex((h) => h.includes(n));
    if (i >= 0) return (row.cells[i] ?? '').trim();
  }
  return '';
};

// --- level -----------------------------------------------------------------
const authority = await readOr('product/README.md');
const level = authority.match(/\bL([0-3])\b/)?.[1] ?? null;
const promoteBy = authority.match(/(?:升级|promote)[^\n|]*?(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;

// --- risks -----------------------------------------------------------------
const riskRows = parseTable(await readOr('product/risks.md'), /^R-\d+/);
const open = riskRows.filter((r) => {
  const s = col(r, '状态', 'status').toLowerCase();
  return s !== 'closed' && s !== '已关闭';
});
const bySev = (s) => open.filter((r) => col(r, '严重', 'sever').toUpperCase().includes(s));
const s1 = bySev('S1');

// --- waivers ---------------------------------------------------------------
const waiverRows = parseTable(await readOr('product/waivers.md'), /^[A-Z]+-\d+$/);
const liveWaivers = waiverRows.filter((r) => {
  const s = col(r, '状态', 'status').toLowerCase();
  return s !== 'closed' && s !== '已关闭';
});
const expired = liveWaivers.filter((r) => {
  const due = col(r, '到期', 'due').match(/\d{4}-\d{2}-\d{2}/)?.[0];
  return due && due < today;
});

// --- acceptance checklists -------------------------------------------------
// Counts [ ] / [x] across product/ so "0 of 33 checked" cannot hide.
async function walk(dir, acc = []) {
  if (!(await exists(ROOT, dir))) return acc;
  for (const e of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) await walk(rel, acc);
    else if (e.name.endsWith('.md')) acc.push(rel);
  }
  return acc;
}
let boxTotal = 0;
let boxDone = 0;
for (const f of await walk('product')) {
  const text = await readOr(f);
  boxTotal += (text.match(/^\s*[-*]\s\[[ xX]\]/gm) ?? []).length;
  boxDone += (text.match(/^\s*[-*]\s\[[xX]\]/gm) ?? []).length;
}

// --- verdict ---------------------------------------------------------------
const blockers = [];
if (s1.length) blockers.push(`${s1.length} 个打开的 S1`);
if (expired.length) blockers.push(`${expired.length} 条过期豁免`);
if (promoteBy && promoteBy < today) blockers.push(`成熟度升级已过期（${promoteBy}）`);
const channel = blockers.length ? 'beta / 内测' : liveWaivers.length ? 'beta（有在期豁免）' : 'release';

const row = (r, ...names) => names.map((n) => col(r, n)).find(Boolean) ?? '';
const riskTable = open.length
  ? [
      '| id | 严重 | 事实 | 状态 |',
      '|----|------|------|------|',
      ...open.map((r) => `| ${r.cells[0]} | ${row(r, '严重', 'sever')} | ${row(r, '事实', '描述', 'fact', 'what')} | ${row(r, '状态', 'status')} |`),
    ].join('\n')
  : '_没有打开的风险。_';

const waiverTable = liveWaivers.length
  ? [
      '| 门禁 | 到期 | owner |',
      '|------|------|-------|',
      ...liveWaivers.map((r) => `| ${r.cells[0]} | ${row(r, '到期', 'due')} | ${row(r, 'owner', '负责')} |`),
    ].join('\n')
  : '_没有在期豁免。_';

const out = `# STATUS

> 由 \`scripts/render-status.mjs\` 生成。不要手改 —— 改 \`product/\` 下的源文件，然后重新生成。
> 生成时间即提交时间，见 git log。

| | |
|---|---|
| 版本 | ${version ? `\`${version}\`（来自 ${versionFrom}）` : '未识别，请在 VERSION_SOURCES 里加你的版本文件'} |
| 成熟度 | ${level ? `**L${level}**` : '**未声明** — 违反 DOC-1'}${promoteBy ? ` · 升级到期日 ${promoteBy}${promoteBy < today ? ' **（已过期）**' : ''}` : ' · **没有升级到期日**'} |
| 发布通道 | **${channel}** |
| 打开的风险 | S1 ${s1.length} · 全部 ${open.length} |
| 在期豁免 | ${liveWaivers.length}${expired.length ? ` （${expired.length} 条已过期）` : ''} |
| 验收清单 | ${boxDone} / ${boxTotal} 已勾 |

## 现在坏在哪

${blockers.length ? blockers.map((b) => `- ${b}`).join('\n') : '- 没有阻断项。'}

## 打开的风险

${riskTable}

## 在期豁免

${waiverTable}

## 怎么用

- 这一页是生成的。数字不对，就是 \`product/\` 下的源文件不对。
- 门禁判定跑 \`node scripts/quality-gate.mjs\`。
- 门禁 id 的含义见 [ship-standard](https://github.com/miounet11/ship-standard)。
`;

await writeFile(join(ROOT, 'STATUS.md'), out);
console.log(`wrote STATUS.md (level ${level ? `L${level}` : '?'}, ${open.length} open risk, channel ${channel})`);
