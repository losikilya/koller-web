import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { checkChange, checkEvidence, hash } from './workflow-lib.mjs';
import { checkApprovedException, exceptionWorkspaceHash, exceptionSubjectHash } from './phase3a-exception.mjs';

const change = 'phase-three-a-identity-foundation';
const base = `openspec/changes/${change}`;
const evidence = `${base}/evidence/exception`;
const recordPath = `${base}/historical-exception.json`;
const repo = process.cwd();

// Synthetic acceptance/review fixtures exercise policy, never claim real DB or review results.
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'phase3a-exception-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (path, content) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  };
  const json = (path, value) => put(path, JSON.stringify(value));
  const copy = (path) => put(path, readFileSync(join(repo, path)));
  const ref = (path) => {
    const bytes = readFileSync(join(root, path));
    return { path, bytes: bytes.length, sha256: hash(bytes) };
  };
  for (const manifest of ['history-manifest.json', 'final-recovery/manifest.json']) {
    const path = `${base}/evidence/${manifest}`;
    copy(path);
    for (const item of JSON.parse(readFileSync(join(root, path))).references) copy(item.path);
  }
  for (const path of ['proposal.md', 'design.md', 'bdd.md', 'test-plan.json', 'specs/identity-foundation/spec.md']) copy(`${base}/${path}`);
  const plan = JSON.parse(readFileSync(join(root, `${base}/test-plan.json`)));
  for (const s of plan.scenarios) { copy(s.feature); copy(s.testFile); }
  copy(`${evidence}/owner-authorization.txt`);
  copy('docs/web-platform/phase-3a/workflow-exception-proposal.md');
  const taskText = readFileSync(join(repo, `${base}/tasks.md`), 'utf8')
    .replace(/^- \[ \] 4\.2 /m, '- [x] 4.2 ');
  put(`${base}/tasks.md`, taskText);
  put(`${base}/review.md`, 'Verdict: PASS\nSynthetic fixture final review.');
  const verifyLog = `${evidence}/fixture-verify.log`;
  put(verifyLog, ['Synthetic verify fixture', ...[
    'agents:check', 'test:workflow', 'lint', 'boundaries', 'typecheck', 'format', 'test',
    'test:ci', 'build', 'storybook:build', 'test:e2e', 'test:storybook', 'spec:validate',
  ].map((s) => `> ${s}`), '# fail 0', 'Tests  40 passed (40)', '17 passed', '7 passed',
  'Totals: 3 passed, 0 failed (3 items)'].join('\n'));
  const databaseLog = `${evidence}/fixture-database.log`;
  put(databaseLog, 'Synthetic DB fixture\nTests=70\nResult: PASS\nReal local PostgreSQL, anonymous, owner and non-owner REST assertions: PASS');
  const databaseReport = `${evidence}/fixture-database.json`;
  json(databaseReport, { success: true, numTotalTests: 1, numPassedTests: 1, numFailedTests: 0,
    numPendingTests: 0, numTodoTests: 0, testResults: [{ assertionResults: [{
      fullName: 'SC-205 Real database contexts enforce privacy', status: 'passed',
    }] }] });
  const types = 'apps/web/src/shared/supabase/database.types.ts';
  const typesOutput = `${evidence}/fixture-types.ts`;
  put(typesOutput, readFileSync(join(root, types)));
  const acceptancePath = `${evidence}/current-acceptance.json`;
  const acceptance = { version: 1, change, workspaceHash: exceptionWorkspaceHash(root),
    verify: { command: ['pnpm', 'verify'], exitCode: 0, log: ref(verifyLog) },
    database: { command: ['pnpm', 'db:test'], exitCode: 0, log: ref(databaseLog), report: ref(databaseReport) },
    types: { command: ['supabase', 'gen', 'types', 'typescript', '--local', '--schema', 'public'],
      exitCode: 0, generated: ref(typesOutput), checkedIn: ref(types) } };
  json(acceptancePath, acceptance);
  const record = { version: 1, type: 'phase3a_historical_evidence', change,
    status: 'accepted_by_approved_exception', gaps: [
      { task: '1.1', gap: 'original_full_preimplementation_green' },
      { task: '3.2', requirement: 'FR-205', scenario: 'SC-205', gap: 'original_red_green_refactor' },
    ], ownerApproval: { source: 'user-provided-attachment', authorization: ref(`${evidence}/owner-authorization.txt`),
      proposal: ref('docs/web-platform/phase-3a/workflow-exception-proposal.md') },
    historical: ref(`${base}/evidence/history-manifest.json`),
    priorAcceptance: ref(`${base}/evidence/final-recovery/manifest.json`),
    currentAcceptance: ref(acceptancePath), reviewerApproval: null };
  const approve = () => {
    const path = `${evidence}/fixture-review.md`;
    put(path, `Verdict: PASS\nException: phase3a_historical_evidence\nSubject-SHA256: ${exceptionSubjectHash(record)}\nPolicy and evidence integrity: PASS\nValidator and negative tests: PASS\nSynthetic fixture, not an actual independent review.\n`);
    record.reviewerApproval = { source: 'collaboration-readonly-reviewer', report: ref(path) };
    json(recordPath, record);
  };
  approve();
  return { root, put, json, ref, record, acceptance, approve, acceptancePath,
    saveAcceptance() { json(acceptancePath, acceptance); record.currentAcceptance = ref(acceptancePath); approve(); } };
}

test('exact approved exception resolves only the two historical gaps, without TDD events', (t) => {
  const f = fixture(t);
  const result = checkApprovedException(f.root, change, join(f.root, base));
  assert.equal(result?.status, 'accepted_by_approved_exception');
  assert.deepEqual(result.tasks, ['1.1', '3.2']);
  const ready = checkChange(f.root, change, true);
  assert.equal(ready.ready, true);
  assert.equal(ready.historicalException.status, 'accepted_by_approved_exception');
  const ledger = JSON.parse(readFileSync(join(f.root, `${base}/evidence/ledger.json`)));
  assert.throws(() => checkEvidence(ledger.events, 'SC-205'), /missing RED\/GREEN\/REFACTOR/);
});

const invalidRecords = [
  ['missing owner approval', (f) => { delete f.record.ownerApproval; }],
  ['missing reviewer approval', (f) => { f.record.reviewerApproval = null; }],
  ['wrong change', (f) => { f.record.change = 'another-change'; }],
  ['wrong scenario', (f) => { f.record.gaps[1].scenario = 'SC-204'; }],
  ['wrong requirement', (f) => { f.record.gaps[1].requirement = 'FR-204'; }],
  ['wrong baseline gap', (f) => { f.record.gaps[0].gap = 'current_green'; }],
  ['additional exception', (f) => { f.record.gaps.push({ task: '2.1', gap: 'original_red_green_refactor' }); }],
  ['unsupported type', (f) => { f.record.type = 'skip_tdd'; }],
  ['unknown schema field', (f) => { f.record.skipSecurity = true; }],
  ['invalid owner provenance', (f) => { f.record.ownerApproval.source = 'assumed'; }],
  ['invalid reviewer provenance', (f) => { f.record.reviewerApproval.source = 'owner'; }],
  ['owner authorization substitution', (f) => {
    f.put(f.record.ownerApproval.authorization.path, 'Approved by an invented owner');
    f.record.ownerApproval.authorization = f.ref(f.record.ownerApproval.authorization.path);
  }],
  ['stale reviewer subject', (f) => { f.record.currentAcceptance.sha256 = '0'.repeat(64); }],
];
for (const [name, mutate] of invalidRecords) test(`rejects ${name}`, (t) => {
  const f = fixture(t); mutate(f); f.json(recordPath, f.record);
  assert.throws(() => checkApprovedException(f.root, change, join(f.root, base)), /Historical exception:/);
});

test('rejects an exception on any other change even if its record claims the eligible change', (t) => {
  const f = fixture(t);
  assert.throws(() => checkApprovedException(f.root, 'another-change', join(f.root, base)), /Historical exception:/);
});

for (const name of ['altered historical artifact', 'missing original artifact', 'fabricated SC-205 phases', 'changed current source']) {
  test(`rejects ${name}`, (t) => {
    const f = fixture(t);
    const original = `${base}/evidence/001-SC-201-red.json`;
    if (name === 'altered historical artifact') f.put(original, '{}');
    if (name === 'missing original artifact') rmSync(join(f.root, original));
    if (name === 'fabricated SC-205 phases') {
      const path = `${base}/evidence/ledger.json`;
      const ledger = JSON.parse(readFileSync(join(f.root, path)));
      ledger.events.push({ scenario: 'SC-205', phase: 'red' }); f.json(path, ledger);
    }
    if (name === 'changed current source') f.put('apps/web/src/injected.ts', 'export const changed = true');
    assert.throws(() => checkApprovedException(f.root, change, join(f.root, base)), /Historical exception:/);
  });
}

for (const name of ['failed verify', 'missing browser gate', 'failed database', 'failed SQL security', 'failed REST security', 'pending DB assertion', 'changed generated types']) {
  test(`rejects ${name} even with matching hashes and a fixture approval`, (t) => {
    const f = fixture(t);
    if (name === 'failed verify') f.acceptance.verify.exitCode = 1;
    if (name === 'missing browser gate') {
      const p = f.acceptance.verify.log.path;
      f.put(p, readFileSync(join(f.root, p), 'utf8').replace('> test:storybook', '> omitted'));
      f.acceptance.verify.log = f.ref(p);
    }
    if (name === 'failed database') f.acceptance.database.exitCode = 1;
    if (['failed SQL security', 'failed REST security'].includes(name)) {
      const p = f.acceptance.database.log.path;
      f.put(p, readFileSync(join(f.root, p), 'utf8').replace(name.includes('SQL') ? 'Result: PASS' : 'REST assertions: PASS', 'FAIL'));
      f.acceptance.database.log = f.ref(p);
    }
    if (name === 'pending DB assertion') {
      const p = f.acceptance.database.report.path;
      const r = JSON.parse(readFileSync(join(f.root, p))); r.testResults[0].assertionResults[0].status = 'pending';
      f.json(p, r); f.acceptance.database.report = f.ref(p);
    }
    if (name === 'changed generated types') {
      f.put(f.acceptance.types.generated.path, '// different type');
      f.acceptance.types.generated = f.ref(f.acceptance.types.generated.path);
    }
    f.saveAcceptance();
    assert.throws(() => checkApprovedException(f.root, change, join(f.root, base)), /Historical exception:/);
  });
}

test('task exceptions cannot resolve unrelated work or be relabelled TDD complete', (t) => {
  const f = fixture(t);
  const path = `${base}/tasks.md`;
  const original = readFileSync(join(f.root, path), 'utf8');
  f.put(path, original.replace('- [x] 2.1', '- [ ] 2.1'));
  assert.throws(() => checkChange(f.root, change, true), /Incomplete/);
  f.put(path, original.replace('- [ ] 1.1', '- [x] 1.1'));
  assert.throws(() => checkChange(f.root, change, true), /historical|Historical/);
});

test('absent record preserves normal validation and missing SC-205 still fails', (t) => {
  const f = fixture(t);
  rmSync(join(f.root, recordPath));
  assert.equal(checkApprovedException(f.root, change, join(f.root, base)), undefined);
  assert.throws(() => checkChange(f.root, change, true), /Incomplete/);
  assert.equal(existsSync(join(f.root, recordPath)), false);
});
