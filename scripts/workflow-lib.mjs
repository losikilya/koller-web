import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, relative, isAbsolute, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { Parser, AstBuilder, GherkinClassicTokenMatcher } from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';

export const hash = (data) => createHash('sha256').update(data).digest('hex');
export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
export function ensure(condition, message) { if (!condition) throw new Error(message); }
export function safePath(root, path) {
  ensure(typeof path === 'string' && path.length > 0, 'Missing path');
  const resolved = resolve(root, path);
  const rel = relative(resolve(root), resolved);
  ensure(!isAbsolute(rel) && !/^\.\.(?:[\\/]|$)/.test(rel), 'Path outside project');
  return resolved;
}
export function files(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root).sort().flatMap((name) => {
    const path = resolve(root, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}
export const TDD_PHASES = ['red', 'green', 'refactor', 'baseline'];
// Input is `git status --porcelain -- src`; test drivers are not production code.
export function dirtyProductionFiles(porcelain) {
  return porcelain.split(/\r?\n/).filter(Boolean)
    .flatMap((line) => line.slice(3).split(' -> ').map((path) => path.replace(/^"|"$/g, '')))
    .filter((path) => !/\.(test|steps)\.[jt]sx?$/.test(path));
}
export function validateRun(report, exitCode, phase, scenario) {
  ensure(TDD_PHASES.includes(phase), 'Invalid TDD phase');
  ensure(/^SC-\d{3,}$/.test(scenario), 'Invalid scenario ID');
  const assertions = (report.testResults ?? []).flatMap((r) => r.assertionResults ?? []);
  const match = new RegExp(`\\b${scenario}\\b`);
  const selected = assertions.filter((a) => match.test(a.fullName));
  ensure(selected.length > 0, `No runnable assertion for ${scenario}; loader failures are not RED`);
  const passed = exitCode === 0 && report.success === true && selected.every((a) => a.status === 'passed');
  if (phase === 'red') {
    // A passing RED is the fork between a weak assertion and behavior the code already has.
    ensure(!passed, `${scenario} passed at RED: the behavior already exists or the assertion is too weak. `
      + 'Strengthen the assertion and rerun red, or, if this is existing behavior the change must keep, '
      + 'set "cycle": "baseline" with "baselineReason" in test-plan.json and run baseline.');
    ensure(exitCode !== 0 && selected.some((a) => a.status === 'failed'), 'RED requires a failed behavior assertion');
  } else {
    ensure(passed, `${phase.toUpperCase()} requires all selected assertions to pass`);
  }
}
const sameTest = (cycle) => cycle.every((e) => e.testFile === cycle[0].testFile && e.testHash === cycle[0].testHash);
const ordered = (cycle) => cycle.every((e, i) => i === 0 || cycle[i - 1].sequence < e.sequence);
export function checkEvidence(events, scenario, cycleKind = 'tdd') {
  const selected = events.filter((e) => e.scenario === scenario);
  if (cycleKind === 'baseline') {
    ensure(selected.every((e) => ['baseline', 'refactor'].includes(e.phase)), `${scenario}: planned as baseline but has RED/GREEN evidence`);
    const start = selected.findLastIndex((e) => e.phase === 'baseline');
    ensure(start >= 0, `${scenario}: missing BASELINE`);
    const cycle = selected.slice(start);
    ensure(sameTest(cycle), `${scenario}: test changed after BASELINE`);
    ensure(ordered(cycle), `${scenario}: invalid event sequence`);
    // Baseline evidence shows the test passed against committed production code, before any GREEN of the change.
    ensure(cycle[0].productionClean === true, `${scenario}: BASELINE ran with uncommitted production code under src`);
    const firstGreen = events.find((e) => e.phase === 'green');
    ensure(!firstGreen || cycle[0].sequence < firstGreen.sequence,
      `${scenario}: BASELINE must be recorded before the first GREEN of the change; new behavior needs RED`);
    return;
  }
  ensure(selected.every((e) => e.phase !== 'baseline'), `${scenario}: planned as a RED cycle but has BASELINE evidence`);
  const start = selected.findLastIndex((e) => e.phase === 'red');
  const cycle = selected.slice(start);
  ensure(start >= 0 && cycle.length >= 3, `${scenario}: missing RED/GREEN/REFACTOR`);
  ensure(cycle[0].phase === 'red' && cycle[1].phase === 'green' && cycle[2].phase === 'refactor', `${scenario}: invalid phase order`);
  ensure(sameTest(cycle.slice(0, 3)), `${scenario}: test changed within the cycle`);
  ensure(ordered(cycle.slice(0, 3)), `${scenario}: invalid event sequence`);
}
function scenariosIn(path) {
  const parser = new Parser(new AstBuilder(IdGenerator.uuid()), new GherkinClassicTokenMatcher());
  const feature = parser.parse(readFileSync(path, 'utf8')).feature;
  ensure(feature, `Missing Feature in ${path}`);
  const visit = (children, inherited) => children.flatMap((child) => {
    if (child.rule) return visit(child.rule.children, [...inherited, ...child.rule.tags]);
    if (!child.scenario) return [];
    return [{ ...child.scenario, tags: [...inherited, ...child.scenario.tags].map((t) => t.name) }];
  });
  return visit(feature.children, feature.tags);
}
export function checkChange(root, change, ready = false, directory) {
  ensure(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(change), 'Change name must be kebab-case');
  const dir = safePath(root, directory ?? `openspec/changes/${change}`);
  for (const name of ['proposal.md', 'design.md', 'bdd.md', 'test-plan.json', 'tasks.md']) {
    ensure(existsSync(resolve(dir, name)) && readFileSync(resolve(dir, name), 'utf8').trim().length > 10, `Missing or empty ${name}`);
  }
  const specs = files(resolve(dir, 'specs')).filter((p) => basename(p) === 'spec.md');
  ensure(specs.length > 0, 'A behavior change needs delta specs');
  const specText = specs.map((p) => readFileSync(p, 'utf8')).join('\n');
  const proposal = readFileSync(resolve(dir, 'proposal.md'), 'utf8');
  const requirementIds = [...new Set([...proposal.matchAll(/\b(?:FR|NFR|UX)-\d{3,}\b/g)].map((m) => m[0]))];
  const plan = readJson(resolve(dir, 'test-plan.json'));
  ensure(plan.version === 1 && Array.isArray(plan.scenarios) && plan.scenarios.length > 0, 'Invalid or empty test plan');
  ensure(requirementIds.length > 0, 'Proposal has no requirement IDs');
  const seen = new Set();
  for (const item of plan.scenarios) {
    ensure(/^SC-\d{3,}$/.test(item.id) && !seen.has(item.id), `Invalid or duplicate scenario ${item.id}`);
    seen.add(item.id);
    ensure(requirementIds.includes(item.requirement) && specText.includes(item.requirement), `${item.id}: requirement absent in proposal/specs`);
    ensure(['unit', 'browser'].includes(item.layer), `${item.id}: invalid test layer`);
    ensure(item.cycle === undefined || ['tdd', 'baseline'].includes(item.cycle), `${item.id}: invalid cycle (tdd or baseline)`);
    ensure(item.cycle !== 'baseline' || (typeof item.baselineReason === 'string' && item.baselineReason.trim().length >= 10),
      `${item.id}: a baseline scenario needs baselineReason naming the existing behavior it protects`);
    const featurePath = safePath(root, item.feature);
    const tests = scenariosIn(featurePath);
    const scenario = tests.find((s) => s.tags.includes(`@${item.id}`));
    ensure(scenario && scenario.tags.includes(`@${change}`) && scenario.tags.includes(`@${item.requirement}`), `${item.id}: missing Gherkin traceability`);
    const testFile = safePath(root, item.testFile);
    ensure(/\.(test|steps)\.(ts|tsx)$/.test(testFile) && existsSync(testFile), `${item.id}: missing TDD test file`);
    ensure(readFileSync(testFile, 'utf8').includes(item.id), `${item.id}: test does not reference scenario`);
  }
  ensure(plan.scenarios.some((s) => s.cycle !== 'baseline'),
    'A behavior change needs at least one RED scenario; tests-only coverage of existing code uses /test-module without OpenSpec');
  for (const id of requirementIds) ensure(plan.scenarios.some((s) => s.requirement === id), `Uncovered requirement ${id}`);
  // A feature scenario tagged for this change must not disappear from the mapping.
  for (const path of files(resolve(root, 'tests')).filter((p) => p.endsWith('.feature'))) {
    for (const s of scenariosIn(path).filter((s) => s.tags.includes(`@${change}`))) {
      const ids = s.tags.filter((t) => /^@SC-\d{3,}$/.test(t));
      ensure(ids.length === 1 && seen.has(ids[0].slice(1)), `Unmapped scenario in ${path}: ${s.name}`);
    }
  }
  if (ready) {
    const tasks = readFileSync(resolve(dir, 'tasks.md'), 'utf8');
    ensure(/^- \[x\]/m.test(tasks) && !/^- \[ \]/m.test(tasks), 'Incomplete or missing tasks');
    const ledger = readJson(resolve(dir, 'evidence/ledger.json'));
    for (const event of ledger.events) {
      const reportPath = safePath(dir, event.report);
      const data = readFileSync(reportPath);
      ensure(hash(data) === event.reportHash, 'Evidence report hash mismatch');
      validateRun(JSON.parse(data), event.exitCode, event.phase, event.scenario);
    }
    for (const item of plan.scenarios) {
      const events = ledger.events.filter((event) => event.scenario === item.id);
      ensure(events.every((event) => event.testFile === item.testFile), `${item.id}: evidence belongs to another test`);
      checkEvidence(ledger.events, item.id, item.cycle ?? 'tdd');
    }
    const review = readFileSync(resolve(dir, 'review.md'), 'utf8');
    ensure(/^Verdict: PASS$/m.test(review), 'Missing PASS review');
  }
  return { change, scenarios: plan.scenarios.length, ready };
}
