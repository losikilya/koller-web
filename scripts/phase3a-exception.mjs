import { readFileSync, readdirSync, existsSync, realpathSync, lstatSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';

const CHANGE = 'phase-three-a-identity-foundation';
const BASE = `openspec/changes/${CHANGE}`;
const TYPE = 'phase3a_historical_evidence';
const STATUS = 'accepted_by_approved_exception';
const GAPS = [
  { task: '1.1', gap: 'original_full_preimplementation_green' },
  { task: '3.2', requirement: 'FR-205', scenario: 'SC-205', gap: 'original_red_green_refactor' },
];
// Trust anchors are the exact owner-supplied decision and the already reviewed proposal/manifests.
const ANCHORS = {
  authorization: [`${BASE}/evidence/exception/owner-authorization.txt`, '704da611a6f5ad6af579db5036bb68a0a5ab20c413235c112c0875c9e339d9c2'],
  proposal: ['docs/web-platform/phase-3a/workflow-exception-proposal.md', '96c9de270d85b011ef035ada20bfb2172a5e0ec3e10cf5921bfdceab95a919ce'],
  historical: [`${BASE}/evidence/history-manifest.json`, 'fb26b51ada142432e7c0296fc9516daf27ceb2df2e188d663d6990451e6908ff'],
  priorAcceptance: [`${BASE}/evidence/final-recovery/manifest.json`, 'eecc05ba9bcab407779da383aa826e2b3b4c5cbfb47653b8cc016e245837d1a4'],
};
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const ensure = (condition, message) => { if (!condition) throw new Error(message); };
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function keys(value, expected) {
  ensure(value && typeof value === 'object' && !Array.isArray(value)
    && equal(Object.keys(value).sort(), [...expected].sort()), `Invalid schema: ${expected.join(', ')}`);
}
// Resolve immutable logical references without rewriting signed-off artifact bytes on native archive.
export function phase3aEvidencePath(root, path) {
  if (path !== BASE && !path.startsWith(`${BASE}/`)) return resolve(root, path);
  const archive = resolve(root, 'openspec/changes/archive');
  const locations = [
    ...(existsSync(resolve(root, BASE)) ? [resolve(root, BASE)] : []),
    ...(existsSync(archive) ? readdirSync(archive)
      .filter((name) => /^\d{4}-\d{2}-\d{2}-phase-three-a-identity-foundation$/.test(name))
      .map((name) => resolve(archive, name)) : []),
  ];
  ensure(locations.length === 1, 'Ambiguous Phase 3A location or missing original artifacts');
  return resolve(locations[0], path === BASE ? '.' : path.slice(BASE.length + 1));
}
function within(root, path) {
  ensure(typeof path === 'string' && path.length > 0 && !path.includes('\\') && !isAbsolute(path), 'Invalid relative evidence path');
  const file = phase3aEvidencePath(root, path);
  const rel = relative(realpathSync(root), realpathSync(file));
  ensure(!isAbsolute(rel) && !/^\.\.(?:[\\/]|$)/.test(rel), 'Evidence outside project');
  return file;
}
function content(root, ref) {
  keys(ref, ['path', 'bytes', 'sha256']);
  ensure(Number.isSafeInteger(ref.bytes) && ref.bytes > 0 && /^[a-f0-9]{64}$/.test(ref.sha256), 'Invalid content reference');
  const bytes = readFileSync(within(root, ref.path));
  ensure(bytes.length === ref.bytes && digest(bytes) === ref.sha256, `Evidence integrity mismatch: ${ref.path}`);
  return bytes;
}
function pinned(root, ref, anchor) {
  ensure(ref?.path === anchor[0] && ref?.sha256 === anchor[1], 'Invalid approval provenance or historical trust anchor');
  return content(root, ref);
}
function manifest(root, ref, anchor, count) {
  const value = JSON.parse(pinned(root, ref, anchor));
  ensure(value.version === 1 && value.references?.length === count, 'Invalid historical manifest');
  for (const item of value.references) content(root, item);
}

// Only mutable implementation/config inputs; evidence and final review must not create a hash cycle.
export function exceptionWorkspaceHash(root) {
  const entries = [];
  const walk = (path) => {
    const file = resolve(root, path);
    if (!existsSync(file)) return;
    const stat = lstatSync(file);
    ensure(!stat.isSymbolicLink(), 'Symlink in acceptance workspace');
    if (stat.isDirectory()) {
      for (const name of readdirSync(file).sort()) {
        if (!['node_modules', '.next', 'dist', '.turbo'].includes(name)
          && !(path === 'supabase' && ['.temp', '.branches'].includes(name))) walk(`${path}/${name}`);
      }
    } else if (!path.endsWith('.tsbuildinfo') && !path.endsWith('/next-env.d.ts')) {
      entries.push(`${path}\0${digest(readFileSync(file))}`);
    }
  };
  for (const path of ['apps', 'packages', 'tests', 'scripts', 'supabase', '.storybook', '.github', '.opencode/rules',
    'docs/PROCESS.md', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'turbo.json', 'tsconfig.json',
    'vitest.config.ts', 'playwright.bdd.config.ts', 'playwright.storybook.config.ts', '.eslintrc.cjs',
    '.prettierignore', '.prettierrc.json', '.npmrc']) walk(path);
  return digest(entries.sort().join('\n'));
}
export function exceptionSubjectHash(record) {
  return digest(JSON.stringify({ ...record, reviewerApproval: null }));
}
function acceptance(root, ref) {
  const value = JSON.parse(content(root, ref));
  keys(value, ['version', 'change', 'workspaceHash', 'verify', 'database', 'types']);
  ensure(value.version === 1 && value.change === CHANGE, 'Invalid current acceptance scope');
  ensure(value.workspaceHash === exceptionWorkspaceHash(root), 'Stale current acceptance: workspace changed');
  keys(value.verify, ['command', 'exitCode', 'log']);
  keys(value.database, ['command', 'exitCode', 'log', 'report']);
  keys(value.types, ['command', 'exitCode', 'generated', 'checkedIn']);
  ensure(equal(value.verify.command, ['pnpm', 'verify']) && value.verify.exitCode === 0, 'Failed current verification');
  const log = content(root, value.verify.log).toString('utf8').replace(/\x1b\[[0-9;]*m/g, '');
  for (const stage of ['agents:check', 'test:workflow', 'lint', 'boundaries', 'typecheck', 'format', 'test',
    'test:ci', 'build', 'storybook:build', 'test:e2e', 'test:storybook', 'spec:validate']) {
    ensure(new RegExp(`^> (?:dance-platform@\\S+ )?${stage}(?:\\s|$)`, 'm').test(log), `Missing current gate: ${stage}`);
  }
  ensure(/fail 0\b/.test(log) && /Tests\s+(?:[4-9]\d|\d{3,}) passed/.test(log)
    && /^\s*17 passed\b/m.test(log) && /^\s*7 passed\b/m.test(log)
    && /Totals: 3 passed, 0 failed/.test(log), 'Missing mandatory current test results');
  ensure(equal(value.database.command, ['pnpm', 'db:test']) && value.database.exitCode === 0, 'Failed current database acceptance');
  const dbLog = content(root, value.database.log).toString('utf8');
  ensure(/Tests=70\b/.test(dbLog) && /Result: PASS/.test(dbLog), 'Failed SQL security acceptance');
  ensure(dbLog.includes('Real local PostgreSQL, anonymous, owner and non-owner REST assertions: PASS'), 'Failed REST security acceptance');
  const db = JSON.parse(content(root, value.database.report));
  const assertions = (db.testResults ?? []).flatMap((r) => r.assertionResults ?? []);
  ensure(db.success === true && db.numTotalTests === 1 && db.numPassedTests === 1 && db.numFailedTests === 0
    && db.numPendingTests === 0 && db.numTodoTests === 0 && assertions.length === 1
    && assertions[0].fullName.includes('SC-205 Real database contexts enforce privacy')
    && assertions[0].status === 'passed', 'Invalid current database runner result');
  ensure(equal(value.types.command, ['supabase', 'gen', 'types', 'typescript', '--local', '--schema', 'public'])
    && value.types.exitCode === 0 && value.types.checkedIn.path === 'apps/web/src/shared/supabase/database.types.ts', 'Invalid local type generation');
  ensure(content(root, value.types.generated).equals(content(root, value.types.checkedIn)), 'Generated database types differ');
}

export function checkApprovedException(root, change, directory) {
  const path = resolve(directory, 'historical-exception.json');
  if (!existsSync(path)) return undefined;
  try {
    const record = JSON.parse(readFileSync(path, 'utf8'));
    keys(record, ['version', 'type', 'change', 'status', 'gaps', 'ownerApproval', 'historical', 'priorAcceptance', 'currentAcceptance', 'reviewerApproval']);
    ensure(change === CHANGE && record.change === CHANGE && record.version === 1 && record.type === TYPE
      && record.status === STATUS && equal(record.gaps, GAPS), 'Unapproved exception scope/type');
    keys(record.ownerApproval, ['source', 'authorization', 'proposal']);
    ensure(record.ownerApproval.source === 'user-provided-attachment', 'Invalid owner approval provenance');
    pinned(root, record.ownerApproval.authorization, ANCHORS.authorization);
    pinned(root, record.ownerApproval.proposal, ANCHORS.proposal);
    manifest(root, record.historical, ANCHORS.historical, 20);
    manifest(root, record.priorAcceptance, ANCHORS.priorAcceptance, 16);
    const ledger = JSON.parse(readFileSync(resolve(directory, 'evidence/ledger.json'), 'utf8'));
    ensure(!ledger.events.some((e) => e.scenario === 'SC-205'), 'Fabricated historical SC-205 lifecycle');
    acceptance(root, record.currentAcceptance);
    keys(record.reviewerApproval, ['source', 'report']);
    ensure(record.reviewerApproval.source === 'collaboration-readonly-reviewer', 'Invalid independent reviewer provenance');
    const review = content(root, record.reviewerApproval.report).toString('utf8');
    for (const line of ['Verdict: PASS', `Exception: ${TYPE}`, `Subject-SHA256: ${exceptionSubjectHash(record)}`,
      'Policy and evidence integrity: PASS', 'Validator and negative tests: PASS']) {
      ensure(review.split(/\r?\n/).includes(line), `Missing independent exception approval: ${line}`);
    }
    ensure([...review.matchAll(/^Verdict: (\w+)$/gm)].at(-1)?.[1] === 'PASS', 'Latest exception review is not PASS');
    return { status: STATUS, scenario: 'SC-205', tasks: ['1.1', '3.2'] };
  } catch (error) { throw new Error(`Historical exception: ${error.message}`); }
}
