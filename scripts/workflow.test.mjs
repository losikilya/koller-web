import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateRun, checkEvidence, checkChange, hash, dirtyProductionFiles } from './workflow-lib.mjs';

const report = (status) => ({
  success: status === 'passed', numTotalTests: 1,
  testResults: [{ assertionResults: [{ fullName: '[SC-001] visible results', status }] }],
});
test('RED accepts a failed behavior assertion and rejects a broken test loader', () => {
  assert.doesNotThrow(() => validateRun(report('failed'), 1, 'red', 'SC-001'));
  assert.throws(() => validateRun({ testResults: [] }, 1, 'red', 'SC-001'));
  assert.throws(() => validateRun(report('passed'), 0, 'red', 'SC-001'));
  assert.throws(() => validateRun(report('failed'), 1, 'red', 'SC-999'));
});
test('GREEN cannot hide skipped or failed tests', () => {
  assert.doesNotThrow(() => validateRun(report('passed'), 0, 'green', 'SC-001'));
  assert.throws(() => validateRun(report('pending'), 0, 'green', 'SC-001'));
  assert.throws(() => validateRun(report('failed'), 0, 'green', 'SC-001'));
});
test('evidence requires ordered RED GREEN REFACTOR for the same test', () => {
  const event = (phase, n) => ({ phase, sequence: n, testFile: 'a.test.ts', testHash: 'aaa', scenario: 'SC-001' });
  const events = ['red', 'green', 'refactor'].map(event);
  assert.doesNotThrow(() => checkEvidence(events, 'SC-001'));
  assert.throws(() => checkEvidence(events.slice(1), 'SC-001'));
  assert.throws(() => checkEvidence([events[1], events[0], events[2]], 'SC-001'));
  assert.throws(() => checkEvidence([events[0], { ...events[1], testHash: 'bbb' }, events[2]], 'SC-001'));
});
test('change readiness rejects absent artifacts rather than silently skipping a change', () => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-'));
  try {
    mkdirSync(join(root, 'openspec/changes/example'), { recursive: true });
    writeFileSync(join(root, 'openspec/changes/example/proposal.md'), '# Example');
    assert.throws(() => checkChange(root, 'example', false));
    assert.throws(() => checkChange(root, '../escape', false));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('a complete fixture passes, but report tampering and wrong mapping are blocked', () => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-complete-'));
  const put = (path, content) => {
    const target = join(root, path);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, content);
  };
  const dir = 'openspec/changes/example';
  try {
    put(`${dir}/proposal.md`, '# Example requirement FR-001');
    put(`${dir}/design.md`, '# Use the existing module boundary');
    put(`${dir}/bdd.md`, '# Scenarios refer to tests/example.feature');
    put(`${dir}/tasks.md`, '- [x] 1.1 Behavior and verification done');
    put(`${dir}/specs/example/spec.md`, '### Requirement: FR-001: Example');
    put('tests/example.feature', '@example\nFeature: Example\n  @FR-001 @SC-001\n  Scenario: Synthetic fixture\n    Given a fixture\n    When checked\n    Then it is valid\n');
    put('src/example.test.ts', '// SC-001: synthetic test fixture');
    const plan = { version: 1, scenarios: [{ id: 'SC-001', requirement: 'FR-001', feature: 'tests/example.feature', layer: 'unit', testFile: 'src/example.test.ts' }] };
    const originalPlan = JSON.stringify(plan);
    put(`${dir}/test-plan.json`, originalPlan);
    // Every report/review here is synthetic, inside an isolated gate-test fixture.
    const events = ['red', 'green', 'refactor'].map((phase, sequence) => {
      const content = JSON.stringify(report(phase === 'red' ? 'failed' : 'passed'));
      put(`${dir}/evidence/${phase}.json`, content);
      return { phase, sequence, scenario: 'SC-001', testFile: 'src/example.test.ts',
        testHash: 'fixture', report: `evidence/${phase}.json`, reportHash: hash(content), exitCode: phase === 'red' ? 1 : 0 };
    });
    put(`${dir}/evidence/ledger.json`, JSON.stringify({ events }));
    put(`${dir}/review.md`, 'Verdict: PASS\nSynthetic fixture.');
    assert.equal(checkChange(root, 'example', true).scenarios, 1);
    put('src/another.test.ts', '// SC-001: different synthetic test');
    plan.scenarios[0].testFile = 'src/another.test.ts';
    put(`${dir}/test-plan.json`, JSON.stringify(plan));
    assert.throws(() => checkChange(root, 'example', true), /another test/);
    put(`${dir}/test-plan.json`, originalPlan);
    put(`${dir}/evidence/red.json`, '{}');
    assert.throws(() => checkChange(root, 'example', true), /hash mismatch/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('BASELINE accepts only a passing run of the selected scenario', () => {
  assert.doesNotThrow(() => validateRun(report('passed'), 0, 'baseline', 'SC-001'));
  assert.throws(() => validateRun(report('failed'), 1, 'baseline', 'SC-001'));
  assert.throws(() => validateRun({ testResults: [] }, 0, 'baseline', 'SC-001'));
});
test('a RED run that passes explains the baseline fork instead of a generic failure', () => {
  assert.throws(() => validateRun(report('passed'), 0, 'red', 'SC-001'), /already exists[\s\S]*"cycle": "baseline"/);
});
test('baseline evidence is checked separately from the RED/GREEN/REFACTOR cycle', () => {
  const event = (phase, sequence, extra = {}) => ({ phase, sequence, testFile: 'a.test.ts', testHash: 'aaa', scenario: 'SC-002', ...(phase === 'baseline' ? { productionClean: true } : {}), ...extra });
  assert.doesNotThrow(() => checkEvidence([event('baseline', 1)], 'SC-002', 'baseline'));
  assert.doesNotThrow(() => checkEvidence([event('baseline', 1), event('refactor', 2)], 'SC-002', 'baseline'));
  assert.throws(() => checkEvidence([], 'SC-002', 'baseline'), /missing BASELINE/);
  assert.throws(() => checkEvidence([event('baseline', 1), event('refactor', 2, { testHash: 'bbb' })], 'SC-002', 'baseline'), /test changed/);
  assert.throws(() => checkEvidence([event('red', 1), event('green', 2), event('refactor', 3)], 'SC-002', 'baseline'), /planned as baseline/);
  assert.throws(() => checkEvidence([event('baseline', 1)], 'SC-002'), /planned as a RED cycle/);
  assert.throws(() => checkEvidence([event('baseline', 1, { productionClean: undefined })], 'SC-002', 'baseline'), /uncommitted production code/);
});
test('baseline must be recorded before the first GREEN of the change', () => {
  const events = [
    { phase: 'red', sequence: 1, scenario: 'SC-001', testFile: 'a.test.ts', testHash: 'a' },
    { phase: 'green', sequence: 2, scenario: 'SC-001', testFile: 'a.test.ts', testHash: 'a' },
    { phase: 'baseline', sequence: 3, scenario: 'SC-002', testFile: 'b.test.ts', testHash: 'b', productionClean: true },
  ];
  assert.throws(() => checkEvidence(events, 'SC-002', 'baseline'), /before the first GREEN/);
});

test('the planning gate validates baseline declarations and still requires one RED scenario', () => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-baseline-'));
  const put = (path, content) => {
    const target = join(root, path);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, content);
  };
  const dir = 'openspec/changes/example';
  try {
    put(`${dir}/proposal.md`, '# Example requirements FR-001 FR-002');
    put(`${dir}/design.md`, '# Use the existing module boundary');
    put(`${dir}/bdd.md`, '# Scenarios refer to tests/example.feature');
    put(`${dir}/tasks.md`, '- [ ] 1.1 Behavior and verification');
    put(`${dir}/specs/example/spec.md`, '### Requirement: FR-001\n### Requirement: FR-002');
    put('tests/example.feature', '@example\nFeature: Example\n  @FR-001 @SC-001\n  Scenario: New\n    Given a fixture\n  @FR-002 @SC-002\n  Scenario: Existing\n    Given a fixture\n');
    put('src/example.test.ts', '// SC-001 SC-002: synthetic test fixture');
    const scenario = (id, requirement, extra = {}) => ({ id, requirement, feature: 'tests/example.feature', layer: 'unit', testFile: 'src/example.test.ts', ...extra });
    const plan = (...scenarios) => put(`${dir}/test-plan.json`, JSON.stringify({ version: 1, scenarios }));
    const reason = { cycle: 'baseline', baselineReason: 'Existing amount formatting must survive the fix' };

    plan(scenario('SC-001', 'FR-001'), scenario('SC-002', 'FR-002', reason));
    assert.equal(checkChange(root, 'example').scenarios, 2);
    plan(scenario('SC-001', 'FR-001'), scenario('SC-002', 'FR-002', { cycle: 'baseline' }));
    assert.throws(() => checkChange(root, 'example'), /baselineReason/);
    plan(scenario('SC-001', 'FR-001'), scenario('SC-002', 'FR-002', { cycle: 'skip' }));
    assert.throws(() => checkChange(root, 'example'), /invalid cycle/);
    plan(scenario('SC-001', 'FR-001', reason), scenario('SC-002', 'FR-002', reason));
    assert.throws(() => checkChange(root, 'example'), /at least one RED scenario/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('baseline is allowed only while production code under src has no uncommitted edits', () => {
  assert.deepEqual(dirtyProductionFiles(''), []);
  assert.deepEqual(dirtyProductionFiles('?? src/a.test.ts\n M src/b.steps.ts\n?? src/features/x/x.test.tsx\n'), []);
  assert.deepEqual(dirtyProductionFiles(' M src/format.ts\n?? src/new.ts\nR  src/old.js -> src/renamed.ts\n'),
    ['src/format.ts', 'src/new.ts', 'src/old.js', 'src/renamed.ts']);
  assert.deepEqual(dirtyProductionFiles(' M src/a.test.ts\r\n D src/gone.js\r\n'), ['src/gone.js']);
  assert.deepEqual(dirtyProductionFiles('R  src/old.js -> src/old.test.ts\n'), ['src/old.js']);
});

test('a ready change may mix a RED cycle with a clean baseline scenario', () => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-ready-baseline-'));
  const put = (path, content) => {
    const target = join(root, path);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, content);
  };
  const dir = 'openspec/changes/example';
  try {
    put(`${dir}/proposal.md`, '# Example requirements FR-001 FR-002');
    put(`${dir}/design.md`, '# Use the existing module boundary');
    put(`${dir}/bdd.md`, '# Scenarios refer to tests/example.feature');
    put(`${dir}/tasks.md`, '- [x] 1.1 Behavior and verification done');
    put(`${dir}/specs/example/spec.md`, '### Requirement: FR-001\n### Requirement: FR-002');
    put('tests/example.feature', '@example\nFeature: Example\n  @FR-001 @SC-001\n  Scenario: New\n    Given a fixture\n  @FR-002 @SC-002\n  Scenario: Existing\n    Given a fixture\n');
    put('src/example.test.ts', '// SC-001 SC-002: synthetic test fixture');
    const scenario = (id, requirement, extra = {}) => ({ id, requirement, feature: 'tests/example.feature', layer: 'unit', testFile: 'src/example.test.ts', ...extra });
    put(`${dir}/test-plan.json`, JSON.stringify({ version: 1, scenarios: [scenario('SC-001', 'FR-001'),
      scenario('SC-002', 'FR-002', { cycle: 'baseline', baselineReason: 'Existing amount formatting must survive the fix' })] }));
    // Every report/review here is synthetic, inside an isolated gate-test fixture.
    const record = (scenarioId, phase, sequence, extra = {}) => {
      const status = phase === 'red' ? 'failed' : 'passed';
      const content = JSON.stringify({ success: status === 'passed', numTotalTests: 1,
        testResults: [{ assertionResults: [{ fullName: `[${scenarioId}] visible results`, status }] }] });
      put(`${dir}/evidence/${sequence}.json`, content);
      return { phase, sequence, scenario: scenarioId, testFile: 'src/example.test.ts', testHash: 'fixture',
        report: `evidence/${sequence}.json`, reportHash: hash(content), exitCode: phase === 'red' ? 1 : 0, ...extra };
    };
    const events = [record('SC-002', 'baseline', 1, { productionClean: true }), record('SC-001', 'red', 2),
      record('SC-001', 'green', 3), record('SC-001', 'refactor', 4), record('SC-002', 'refactor', 5)];
    put(`${dir}/evidence/ledger.json`, JSON.stringify({ events }));
    put(`${dir}/review.md`, 'Verdict: PASS\nSynthetic fixture.');
    assert.equal(checkChange(root, 'example', true).scenarios, 2);
    events[0].productionClean = false;
    put(`${dir}/evidence/ledger.json`, JSON.stringify({ events }));
    assert.throws(() => checkChange(root, 'example', true), /uncommitted production code/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
