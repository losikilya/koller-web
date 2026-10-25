import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, isAbsolute, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SCHEMA = 'frontend-architecture-refactor';
const MAX_OUTPUT = 20 * 1024 * 1024;

export const hash = (value) => createHash('sha256').update(value).digest('hex');
export function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function safePath(root, path) {
  ensure(typeof path === 'string' && path.length > 0, 'Missing path');
  const result = resolve(root, path);
  const rel = relative(resolve(root), result);
  ensure(!isAbsolute(rel) && !/^\.\.(?:[\\/]|$)/.test(rel), `Path outside project: ${path}`);
  return result;
}

function read(path) {
  return readFileSync(path, 'utf8');
}

function readJson(path) {
  return JSON.parse(read(path));
}

function files(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root).sort().flatMap((name) => {
    const path = resolve(root, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

function isWorkspaceEvidence(path, root, change) {
  const rel = relative(root, path).replaceAll('\\', '/');
  return rel.startsWith(`openspec/changes/${change}/`) ||
    rel === '.architecture-refactor-running' ||
    rel.startsWith('node_modules/') ||
    rel.startsWith('dist/') ||
    rel.startsWith('.features-gen/') ||
    rel.startsWith('playwright-report/') ||
    rel.startsWith('test-results/') ||
    rel.startsWith('.git/');
}

function workspaceHash(root, change) {
  const git = spawnSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: MAX_OUTPUT,
  });
  const candidates = git.status === 0
    ? git.stdout.split('\0').filter(Boolean).map((path) => safePath(root, path))
    : files(root);
  const state = candidates
    .filter((path) => !isWorkspaceEvidence(path, root, change))
    .sort()
    .map((path) => {
      const rel = relative(root, path).replaceAll('\\', '/');
      return existsSync(path) ? `${rel}\0${hash(readFileSync(path))}` : `${rel}\0DELETED`;
    })
    .join('\n');
  return hash(state);
}

function changeDirectory(root, change) {
  ensure(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(change), 'Change name must be kebab-case');
  return safePath(root, `openspec/changes/${change}`);
}

export function inspectChange(root, change) {
  const directory = changeDirectory(root, change);
  const required = ['.openspec.yaml', 'proposal.md', 'design.md', 'baseline.md', 'verification-plan.json', 'tasks.md'];
  for (const name of required) {
    const path = resolve(directory, name);
    ensure(existsSync(path) && read(path).trim().length > 10, `Missing or empty ${name}`);
  }
  ensure(new RegExp(`^schema:\\s*${SCHEMA}\\s*$`, 'm').test(read(resolve(directory, '.openspec.yaml'))), `Change must use ${SCHEMA}`);
  const proposal = read(resolve(directory, 'proposal.md'));
  ensure(/^Change kind:\s*architecture-refactor\s*$/m.test(proposal), 'proposal.md must declare architecture-refactor');
  ensure(/^Behavior contract:\s*unchanged\s*$/m.test(proposal), 'proposal.md must declare unchanged behavior');
  ensure(/^## ADR impact\s*$/m.test(read(resolve(directory, 'design.md'))), 'design.md must include ADR impact');
  ensure(/^## Observable contract\s*$/m.test(read(resolve(directory, 'baseline.md'))), 'baseline.md must define observable contract');

  const planPath = resolve(directory, 'verification-plan.json');
  const planText = read(planPath);
  const plan = JSON.parse(planText);
  ensure(plan.version === 1 && Array.isArray(plan.commands) && plan.commands.length > 0, 'Invalid or empty verification plan');
  const ids = new Set();
  for (const item of plan.commands) {
    ensure(item && typeof item === 'object', 'Invalid verification command');
    ensure(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(item.id) && !ids.has(item.id), `Invalid or duplicate command id: ${item.id}`);
    ids.add(item.id);
    ensure(typeof item.command === 'string' && item.command.trim().length > 0, `${item.id}: command is empty`);
    ensure(!/[\r\n]/.test(item.command), `${item.id}: command must be one line`);
  }
  return { change, directory, plan, planHash: hash(planText) };
}

function readLedger(directory) {
  const path = resolve(directory, 'evidence/architecture-refactor/ledger.json');
  return existsSync(path) ? readJson(path) : { version: 1, events: [] };
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function validateEvent(directory, event, requireSuccess = true) {
  const reportPath = safePath(directory, event.report);
  ensure(existsSync(reportPath), `Missing evidence report: ${event.report}`);
  const data = readFileSync(reportPath);
  ensure(hash(data) === event.reportHash, `Evidence report hash mismatch: ${event.report}`);
  const report = JSON.parse(data);
  if (requireSuccess) ensure(report.success === true, `${event.phase} evidence is not successful`);
  ensure(report.planHash === event.planHash, `${event.phase} evidence plan hash mismatch`);
  return report;
}

export function recordPhase(root, change, phase) {
  ensure(['baseline', 'final'].includes(phase), 'Phase must be baseline or final');
  const state = inspectChange(root, change);
  const lockPath = resolve(root, '.architecture-refactor-running');
  let lock;
  try {
    lock = openSync(lockPath, 'wx');
    const evidenceDirectory = resolve(state.directory, 'evidence/architecture-refactor');
    mkdirSync(evidenceDirectory, { recursive: true });
    const ledger = readLedger(state.directory);
    if (phase === 'final') {
      const baseline = [...ledger.events].reverse().find((event) => event.phase === 'baseline' && event.success);
      ensure(baseline && baseline.planHash === state.planHash, 'Record a successful baseline with the current plan before final evidence');
      validateEvent(state.directory, baseline);
    }

    const results = [];
    for (const item of state.plan.commands) {
      const startedAt = new Date().toISOString();
      const started = Date.now();
      const result = spawnSync(item.command, {
        cwd: root,
        shell: true,
        encoding: 'utf8',
        env: { ...process.env, NO_COLOR: '1' },
        maxBuffer: MAX_OUTPUT,
      });
      const exitCode = result.status ?? 1;
      results.push({
        id: item.id,
        command: item.command,
        startedAt,
        durationMs: Date.now() - started,
        exitCode,
        stdout: result.stdout ?? '',
        stderr: `${result.stderr ?? ''}${result.error ? `\n${result.error.message}` : ''}`.trimStart(),
      });
      if (exitCode !== 0) break;
    }

    const success = results.length === state.plan.commands.length && results.every((item) => item.exitCode === 0);
    const sequence = (ledger.events.at(-1)?.sequence ?? 0) + 1;
    const report = {
      version: 1,
      change,
      phase,
      sequence,
      recordedAt: new Date().toISOString(),
      planHash: state.planHash,
      success,
      commands: results,
      workspaceHash: workspaceHash(root, change),
    };
    const reportName = `${String(sequence).padStart(3, '0')}-${phase}.json`;
    const reportPath = resolve(evidenceDirectory, reportName);
    writeJson(reportPath, report);
    const reportData = readFileSync(reportPath);
    ledger.events.push({
      sequence,
      phase,
      success,
      planHash: state.planHash,
      report: `evidence/architecture-refactor/${reportName}`,
      reportHash: hash(reportData),
    });
    writeJson(resolve(evidenceDirectory, 'ledger.json'), ledger);
    ensure(success, `${phase} verification failed at ${results.find((item) => item.exitCode !== 0)?.id ?? 'unknown command'}`);
    return report;
  } finally {
    if (lock !== undefined) {
      closeSync(lock);
      if (existsSync(lockPath)) unlinkSync(lockPath);
    }
  }
}

export function readyChange(root, change) {
  const state = inspectChange(root, change);
  const tasks = read(resolve(state.directory, 'tasks.md'));
  ensure(/^- \[[xX]\]/m.test(tasks), 'No completed tasks');
  ensure(!/^- \[ \]/m.test(tasks), 'Incomplete tasks');
  const reviewPath = resolve(state.directory, 'review.md');
  ensure(existsSync(reviewPath) && /^Verdict:\s*PASS\s*$/m.test(read(reviewPath)), 'Missing reviewer PASS');

  const ledger = readLedger(state.directory);
  for (const event of ledger.events) validateEvent(state.directory, event, false);
  const final = [...ledger.events].reverse().find((event) => event.phase === 'final' && event.success && event.planHash === state.planHash);
  ensure(final, 'Missing successful final evidence for the current plan');
  const baseline = [...ledger.events].reverse().find((event) => event.sequence < final.sequence && event.phase === 'baseline' && event.success && event.planHash === state.planHash);
  ensure(baseline, 'Missing successful baseline before final evidence');
  const finalReport = validateEvent(state.directory, final);
  ensure(finalReport.workspaceHash === workspaceHash(root, change), 'Implementation workspace changed after final evidence');
  return { change, ready: true, planHash: state.planHash, baseline: baseline.report, final: final.report };
}

export function runCli(root, args) {
  const [command, change] = args;
  ensure(['check', 'baseline', 'final', 'ready'].includes(command) && change, 'Usage: node scripts/architecture-refactor-workflow.mjs check|baseline|final|ready <change>');
  if (command === 'check') return { ...inspectChange(root, change), directory: undefined, plan: undefined };
  if (command === 'ready') return readyChange(root, change);
  return recordPhase(root, change, command);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    console.log(JSON.stringify(runCli(process.cwd(), process.argv.slice(2)), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
