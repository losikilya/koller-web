import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { inspectChange, readyChange, recordPhase } from './architecture-refactor-workflow.mjs';

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
