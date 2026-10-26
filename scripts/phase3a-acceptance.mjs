import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, existsSync, readFileSync, writeFileSync, openSync, closeSync } from 'node:fs';
import { hash } from './workflow-lib.mjs';
import { exceptionWorkspaceHash } from './phase3a-exception.mjs';

const require = createRequire(import.meta.url);
const root = process.cwd();
const change = 'phase-three-a-identity-foundation';
if (!existsSync(`openspec/changes/${change}/.openspec.yaml`)) throw new Error('Phase 3A is not active; never recreate or write archived evidence');
const pnpm = process.env.npm_execpath;
if (!pnpm || !/pnpm\.(?:c?js)$/.test(pnpm) || !existsSync(pnpm)) throw new Error('Run through pnpm phase3a:acceptance');
const parent = `openspec/changes/${change}/evidence/exception`;
let sequence = 1;
while (existsSync(`${parent}/acceptance-${sequence}`)) sequence++;
const directory = `${parent}/acceptance-${sequence}`;
mkdirSync(directory, { recursive: true });
const fingerprint = exceptionWorkspaceHash(root);
const ref = (path) => {
  const bytes = readFileSync(path);
  return { path, bytes: bytes.length, sha256: hash(bytes) };
};
function run(name, args) {
  const log = `${directory}/${name}.log`;
  const fd = openSync(log, 'wx');
  console.log(`Starting ${name}; real output: ${log}`);
  let result;
  try {
    result = spawnSync(process.execPath, [pnpm, ...args], {
      cwd: root, env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' }, stdio: ['ignore', fd, fd],
    });
  } finally { closeSync(fd); }
  const exitCode = result.status ?? 1;
  console.log(`${name}: exit ${exitCode}`);
  if (result.error) throw result.error;
  if (exitCode !== 0) throw new Error(`${name} failed; original output preserved at ${log}`);
  return { exitCode, log: ref(log) };
}
const verify = { command: ['pnpm', 'verify'], ...run('verify', ['verify']) };
const dbReport = `${directory}/database.json`;
const database = { command: ['pnpm', 'db:test'], ...run('database', ['db:test', '--reporter=json', `--outputFile=${dbReport}`]), report: ref(dbReport) };
const typeArgs = ['gen', 'types', 'typescript', '--local', '--schema', 'public'];
console.log('Generating types from the actual local public schema');
const generated = spawnSync(process.execPath, [require.resolve('supabase/dist/supabase.js'), ...typeArgs], { cwd: root, encoding: 'utf8' });
if (generated.error || generated.status !== 0 || !generated.stdout.includes('export type Database')) {
  writeFileSync(`${directory}/types-error.log`, generated.stderr ?? 'Type generation unavailable');
  throw new Error('Local type generation failed; checked-in types unchanged');
}
const formatted = require('prettier').format(generated.stdout, { parser: 'typescript', ...JSON.parse(readFileSync('.prettierrc.json', 'utf8')) });
const typePath = `${directory}/types.generated.ts`;
writeFileSync(typePath, formatted);
const checkedIn = 'apps/web/src/shared/supabase/database.types.ts';
if (!readFileSync(typePath).equals(readFileSync(checkedIn))) throw new Error('Generated types differ; checked-in types unchanged');
if (exceptionWorkspaceHash(root) !== fingerprint) throw new Error('Implementation changed during acceptance; do not reuse this run');
const report = { version: 1, change, workspaceHash: fingerprint, verify, database,
  types: { command: ['supabase', ...typeArgs], exitCode: 0, generated: ref(typePath), checkedIn: ref(checkedIn) } };
writeFileSync(`${directory}/acceptance.json`, JSON.stringify(report, null, 2) + '\n');
console.log(`Current acceptance PASS: ${directory}/acceptance.json`);
