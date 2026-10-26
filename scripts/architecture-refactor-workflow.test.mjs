import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { inspectChange, readyChange, recordPhase, maintenancePathAllowed, checkMaintenanceScope, workspaceHash } from './architecture-refactor-workflow.mjs';

function write(path, content) {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content);
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'architecture-refactor-'));
  const change = 'fsd-pilot-auth-error';
  const directory = join(root, 'openspec', 'changes', change);
  mkdirSync(directory, { recursive: true });
  write(join(directory, '.openspec.yaml'), 'schema: frontend-architecture-refactor\n');
  write(join(directory, 'proposal.md'), 'Change kind: architecture-refactor\nBehavior contract: unchanged\n\n## Why\nBoundaries need improvement.\n');
  write(join(directory, 'design.md'), '## Current architecture and evidence\nLegacy.\n\n## ADR impact\nCOMPATIBLE\n');
  write(join(directory, 'baseline.md'), '## Observable contract\nThe route and rendered outcome remain stable.\n');
  write(join(directory, 'verification-plan.json'), JSON.stringify({
    version: 1,
    commands: [{ id: 'node-version', command: 'node --version' }],
  }, null, 2));
  write(join(directory, 'tasks.md'), '- [ ] Record baseline\n- [ ] Move module\n- [ ] Review\n');
  write(join(root, 'src', 'example.ts'), 'export const value = 1;\n');
  return { root, change, directory };
}

test('accepts a non-behavior architecture refactor plan', () => {
  const { root, change } = fixture();
  const result = inspectChange(root, change);
  assert.equal(result.plan.commands[0].id, 'node-version');
});

test('maintenance accepts its own schema without pretending to migrate application architecture', () => {
  const { root, change, directory } = fixture();
  write(join(directory, '.openspec.yaml'), 'schema: frontend-maintenance\nskip_specs: true\n');
  write(join(directory, 'proposal.md'), 'Change kind: maintenance\nBehavior contract: unchanged\n\n## Scope\nOnly docs and tooling.\n');
  assert.equal(inspectChange(root, change).change, change);
});

test('maintenance rejects product source, tests, specs and historical records', () => {
  const change = 'align-phase-one-starter';
  for (const path of ['apps/web/src/app/page.tsx', 'packages/contracts/src/index.ts', 'tests/e2e/foundation/smoke.feature', 'openspec/specs/platform-shell/spec.md', 'docs/web-platform/phase-0/03-platform-architecture.md', 'openspec/changes/archive/2026-10-26-dance-platform-foundation/review.md', 'docs/web-platform/phase-1/phase-1-report.md', 'scripts/unrelated.mjs']) {
    assert.equal(maintenancePathAllowed(path, change), false, path);
  }
});

test('maintenance permits exact tooling/config paths and its own process artifacts', () => {
  const change = 'align-phase-one-starter';
  for (const path of ['package.json', 'pnpm-lock.yaml', 'packages/design-tokens/tsconfig.json', 'README.md', 'docs/PROCESS.md', '.opencode/skills/react-behavior/SKILL.md', '.claude/skills/react-behavior/SKILL.md', 'scripts/architecture-refactor-workflow.mjs', 'openspec/changes/align-phase-one-starter/tasks.md', 'openspec/schemas/frontend-maintenance/schema.yaml', 'docs/web-platform/phase-1/post-phase-1-cleanup.md']) {
    assert.equal(maintenancePathAllowed(path, change), true, path);
  }
});

test('maintenance scope checks PR changes even with a clean checked-out working tree', () => {
  const { root, change } = fixture();
  assert.deepEqual(checkMaintenanceScope(root, change, ['README.md', 'package.json']), ['README.md', 'package.json']);
  assert.throws(() => checkMaintenanceScope(root, change, ['apps/web/src/shell/Shell.tsx']), /Outside maintenance scope/);
  assert.equal(maintenancePathAllowed('../README.md', change), false);
});

test('maintenance permits exact EOL policy files without admitting neighboring config or product paths', () => {
  const change = 'align-prettier-lf';
  assert.deepEqual(checkMaintenanceScope(process.cwd(), change, ['.prettierrc.json', '.gitattributes']),
    ['.prettierrc.json', '.gitattributes']);
  for (const path of ['.prettierrc.yml', '.gitattributes.backup', 'apps/web/.gitattributes', 'packages/design-tokens/src/tokens.css']) {
    assert.throws(() => checkMaintenanceScope(process.cwd(), change, [path]), /Outside maintenance scope/);
  }
});

test('maintenance refuses product deltas and missing explicit non-behavior metadata', () => {
  const { root, change, directory } = fixture();
  write(join(directory, 'proposal.md'), 'Change kind: maintenance\nBehavior contract: unchanged\n\n## Scope\nOnly docs and tooling.\n');
  write(join(directory, '.openspec.yaml'), 'schema: frontend-maintenance\n');
  assert.throws(() => inspectChange(root, change), /skip_specs/);
  write(join(directory, '.openspec.yaml'), 'schema: frontend-maintenance\nskip_specs: true\n');
  write(join(directory, 'specs/example/spec.md'), 'Product behavior is not permitted.');
  assert.throws(() => inspectChange(root, change), /cannot contain product specs/);
});

test('maintenance fingerprints equivalent Windows/Linux text checkouts identically', () => {
  const { root, change } = fixture();
  write(join(root, 'README.md'), 'A line\r\nAnother line\r\n');
  const windows = workspaceHash(root, change, true);
  write(join(root, 'README.md'), 'A line\nAnother line\n');
  assert.equal(workspaceHash(root, change, true), windows);
  write(join(root, 'README.md'), 'Different content\n');
  assert.notEqual(workspaceHash(root, change, true), windows);
});

test('maintenance fingerprints deleted paths identically before and after index removal', () => {
  const { root, change } = fixture();
  execFileSync('git', ['init', '-q', root]);
  execFileSync('git', ['-C', root, 'add', 'src/example.ts']);
  unlinkSync(join(root, 'src/example.ts'));
  const deleted = workspaceHash(root, change, true);
  execFileSync('git', ['-C', root, 'update-index', '--force-remove', 'src/example.ts']);
  assert.equal(workspaceHash(root, change, true), deleted);
});

test('records matching GREEN baseline/final evidence and becomes ready', () => {
  const { root, change, directory } = fixture();
  assert.equal(recordPhase(root, change, 'baseline').success, true);
  write(join(root, 'src', 'example.ts'), 'export const value = 2;\n');
  assert.equal(recordPhase(root, change, 'final').success, true);
  write(join(directory, 'tasks.md'), '- [x] Record baseline\n- [x] Move module\n- [x] Review\n');
  write(join(directory, 'review.md'), 'Verdict: PASS\n\nReviewed architecture and regression evidence.\n');
  assert.equal(readyChange(root, change).ready, true);
});

test('rejects implementation changes made after final evidence', () => {
  const { root, change, directory } = fixture();
  recordPhase(root, change, 'baseline');
  recordPhase(root, change, 'final');
  write(join(directory, 'tasks.md'), '- [x] Complete\n');
  write(join(directory, 'review.md'), 'Verdict: PASS\n');
  write(join(root, 'src', 'example.ts'), 'export const value = 3;\n');
  assert.throws(() => readyChange(root, change), /changed after final evidence/);
});
