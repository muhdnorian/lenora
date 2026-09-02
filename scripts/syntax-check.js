#!/usr/bin/env node
/* syntax-check.js — run `node --check` over every JS module in the repo.
 * Mirrors the CI syntax gate so it can be run locally too.
 * Exit code is non-zero if any file fails to parse.
 */
const { execFileSync } = require('node:child_process');
const { readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');

const roots = ['js', 'tests'];
const files = [];
const seen = new Set();

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!p.endsWith('.js')) continue;
    const abs = p;
    if (seen.has(abs)) continue;
    seen.add(abs);
    files.push(abs);
  }
}

roots.forEach(r => walk(r));

let failed = 0;
for (const f of files) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: ['ignore', 'ignore', 'pipe'] });
    console.log(`OK   ${f}`);
  } catch (err) {
    failed++;
    console.error(`FAIL ${f}`);
    console.error(String(err.stderr || err.message));
  }
}

if (failed) {
  console.error(`\n${failed} file(s) failed syntax check`);
  process.exit(1);
}
console.log(`\nAll ${files.length} JS file(s) pass syntax check.`);
