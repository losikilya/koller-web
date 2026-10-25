import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkChange, ensure, readJson } from './workflow-lib.mjs';
import { readFileSync } from 'node:fs';
import { readyChange } from './architecture-refactor-workflow.mjs';

try {
  const root = process.cwd();
  const base = process.argv[2];
  let changed = [];
  if (base) {
    ensure(/^[a-f0-9]{40}$/.test(base), 'Supply the PR base commit SHA');
    const diff = spawnSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' });
    ensure(diff.status === 0, 'Could not read PR diff');
    changed = diff.stdout.trim().split('\n').filter(Boolean);
  }
  const directories = new Set();
  for (const path of changed) {
    const match = path.match(/^(openspec\/changes\/(?:archive\/)?[^/]+)\//);
    if (match && (existsSync(resolve(root, match[1], 'test-plan.json')) || existsSync(resolve(root, match[1], 'verification-plan.json')))) directories.add(match[1]);
  }
  if (!base) {
    for (const name of readdirSync('openspec/changes')) {
      if (name !== 'archive') directories.add(`openspec/changes/${name}`);
    }
  }
  const covered = new Set();
  for (const directory of directories) {
    const folder = directory.split('/').at(-1);
    const change = folder.replace(/^\d{4}-\d{2}-\d{2}-/, '');
    const metadata = readFileSync(resolve(directory, '.openspec.yaml'), 'utf8');
    if (/^schema:\s*frontend-maintenance\s*$/m.test(metadata)) {
      readyChange(root, change, directory, base ? changed : undefined);
      continue;
    }
    checkChange(root, change, true, directory);
    const plan = readJson(resolve(directory, 'test-plan.json'));
    for (const path of plan.implementationFiles ?? []) covered.add(path);
  }
  const production = changed.filter((p) => /^(?:src\/|apps\/[^/]+\/src\/|packages\/[^/]+\/src\/)/.test(p) && !/\.(test|steps)\./.test(p));
  for (const path of production) ensure(covered.has(path), `Source file is not covered by a changed OpenSpec test plan: ${path}`);
  console.log(`Workflow CI passed (${directories.size} change packages inspected)`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
