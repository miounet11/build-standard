#!/usr/bin/env node
// Refreshes checks/gates.pinned.json from ship-standard.
//
// This repo references 30-odd gate ids. Without a pin, a rename upstream leaves
// every reference here green and wrong. With a pin, it shows up as a diff in a
// PR — which is the only place a human will actually look.
//
// Usage: node checks/pin-gates.mjs [path-or-url-to-gates.json]
// Default source order: sibling checkout, then GitHub raw.

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const UPSTREAM = 'https://raw.githubusercontent.com/miounet11/ship-standard/main/gates.json';

async function load() {
  const arg = process.argv[2];
  const candidates = arg ? [arg] : [resolve(ROOT, '../ship-standard/gates.json'), UPSTREAM];
  for (const c of candidates) {
    try {
      if (/^https?:/.test(c)) {
        const res = await fetch(c);
        if (!res.ok) continue;
        return { from: c, doc: await res.json() };
      }
      return { from: c, doc: JSON.parse(await readFile(c, 'utf8')) };
    } catch { /* try the next source */ }
  }
  throw new Error(`could not read gates.json from any of: ${candidates.join(', ')}`);
}

const { from, doc } = await load();
const pinned = {
  $comment:
    'PINNED COPY of ship-standard/gates.json. Do not edit by hand; run npm run pin to refresh. '
    + 'It exists so this repo can validate every gate id it references offline, and so a rename '
    + 'upstream shows up as a diff here instead of silently rotting.',
  version: doc.version,
  levels: doc.levels,
  applies: doc.applies,
  nonWaivable: doc.nonWaivable,
  gates: doc.gates.map((g) => ({
    id: g.id,
    dimension: g.dimension,
    stage: g.stage,
    severity: g.severity,
    ...(g.deprecated ? { deprecated: true, supersededBy: g.supersededBy } : {}),
  })),
};
await writeFile(join(ROOT, 'checks/gates.pinned.json'), `${JSON.stringify(pinned, null, 2)}\n`);
console.log(`pinned ship-standard ${pinned.version} (${pinned.gates.length} gates) from ${from}`);
