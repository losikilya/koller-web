import { readFileSync, writeFileSync, mkdirSync, existsSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { TDD_PHASES, checkChange, dirtyProductionFiles, ensure, hash, readJson, safePath, validateRun } from './workflow-lib.mjs';
let lock;
const root = process.cwd();
const lockPath = resolve(root, '.workflow-running');
try {
  const [change, scenario, phase] = process.argv.slice(2);
  checkChange(root, change);
  ensure(TDD_PHASES.includes(phase), 'Usage: npm run tdd -- <change> <SC-001> red|green|refactor|baseline');
  lock = openSync(lockPath, 'wx');
  const dir = safePath(root, `openspec/changes/${change}`);
  const entry = readJson(resolve(dir, 'test-plan.json')).scenarios.find((s) => s.id === scenario);
  ensure(entry, 'Unknown scenario');
  const isBaseline = entry.cycle === 'baseline';
  ensure(isBaseline ? ['baseline', 'refactor'].includes(phase) : phase !== 'baseline',
    isBaseline ? `${scenario} is planned as baseline: run baseline, then optional refactor`
      : `${scenario} is planned as a RED cycle: declare "cycle": "baseline" with "baselineReason" in test-plan.json first`);
  const evidence = resolve(dir, 'evidence');
  mkdirSync(evidence, { recursive: true });
  const ledgerPath = resolve(evidence, 'ledger.json');
  const ledger = existsSync(ledgerPath) ? readJson(ledgerPath) : { version: 1, events: [] };
  const previous = ledger.events.filter((e) => e.scenario === scenario).at(-1);
  const testHash = hash(readFileSync(safePath(root, entry.testFile)));
  if (phase === 'baseline') {
    ensure(!ledger.events.some((e) => e.phase === 'green'), 'BASELINE must run before the first GREEN of the change; new behavior needs RED');
    const status = spawnSync('git', ['status', '--porcelain', '--untracked-files=all', '--', 'src', 'apps', 'packages'], { cwd: root, encoding: 'utf8' });
    ensure(status.status === 0, 'Could not read git status for the baseline check');
    const dirty = dirtyProductionFiles(status.stdout);
    ensure(dirty.length === 0, `BASELINE needs committed production code; uncommitted under src: ${dirty.join(', ')}. `
      + 'Record baselines before stubs or implementation, or stash them first.');
  } else if (phase !== 'red') {
    const expected = phase === 'green' ? 'red' : isBaseline ? 'baseline' : 'green';
    ensure(previous?.phase === expected, 'Previous phase is missing');
    ensure(previous.testHash === testHash, `Test changed after ${expected.toUpperCase()}: inspect and begin a new cycle`);
  }
  const sequence = ledger.events.length + 1;
  const reportPath = resolve(evidence, `${String(sequence).padStart(3, '0')}-${scenario}-${phase}.json`);
  const args = [resolve(root, 'node_modules/vitest/vitest.mjs'), 'run', entry.testFile,
    '-t', `\\b${scenario}\\b`, '--reporter=json', `--outputFile=${reportPath}`];
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 120000 });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  ensure(!result.error && result.status !== null && existsSync(reportPath), 'Test runner did not complete');
  const bytes = readFileSync(reportPath);
  // A rejected run is not evidence: drop its report so the next attempt starts clean.
  try { validateRun(JSON.parse(bytes), result.status, phase, scenario); } catch (error) { unlinkSync(reportPath); throw error; }
  const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  const diff = spawnSync('git', ['diff', '--binary', 'HEAD'], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  ledger.events.push({ sequence, scenario, phase, at: new Date().toISOString(),
    testFile: entry.testFile, testHash, exitCode: result.status,
    report: relative(dir, reportPath).replaceAll('\\', '/'), reportHash: hash(bytes),
    head: git.status === 0 ? git.stdout.trim() : null,
    trackedDiffHash: diff.status === 0 ? hash(diff.stdout) : null,
    command: ['node', 'node_modules/vitest/vitest.mjs', ...args.slice(1)],
    ...(phase === 'baseline' ? { productionClean: true } : {}),
  });
  writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
  console.log(`Recorded ${scenario} ${phase.toUpperCase()}. ${phase === 'red' ? 'Inspect the assertion failure before implementation.' : phase === 'baseline' ? 'Existing behavior recorded: this change must keep it.' : ''}`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { if (lock !== undefined) { closeSync(lock); unlinkSync(lockPath); } }
