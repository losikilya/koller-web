import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const change = 'openspec/changes/phase-three-c-profiles-privacy'
const home = `${change}/evidence/phase3c3`
const normalize = (path) => path.replaceAll('\\', '/')
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
const json = (path) => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''))
const describe = (path) => {
  path = normalize(path)
  const bytes = readFileSync(path)
  return { path, bytes: bytes.length, sha256: digest(bytes) }
}
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
const historical = json(`${home}/history-manifest.json`)
const mutable = new Map(historical.snapshots.map((item) => [normalize(item.path), item]))
for (const item of historical.files) {
  const snapshot = mutable.get(normalize(item.path))
  const actual = describe(snapshot ? snapshot.snapshot : item.path)
  if (actual.sha256 !== item.sha256 || actual.bytes !== item.bytes) throw new Error(`Historical mismatch: ${item.path}`)
}
for (const item of historical.snapshots) {
  const actual = describe(item.snapshot)
  if (actual.sha256 !== item.sha256 || actual.bytes !== item.bytes) throw new Error(`Snapshot mismatch: ${item.snapshot}`)
}
const oldLedger = json(`${home}/history-3c2/evidence/ledger.json`)
const ledger = json(`${change}/evidence/ledger.json`)
if (JSON.stringify(oldLedger.events) !== JSON.stringify(ledger.events.slice(0, oldLedger.events.length))) throw new Error('Historical ledger prefix changed')
for (const event of ledger.events) {
  if (describe(`${change}/${event.report}`).sha256 !== event.reportHash) throw new Error(`Report mismatch: ${event.sequence}`)
}
const oldSource = json(`${change}/evidence/phase3c2/acceptance-manifest.json`).currentSourceFiles
const inventory = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean)
const selected = inventory.filter((path) => /^(apps|packages|tests|scripts|supabase|\.storybook|\.github)\//.test(path) || /^[^/]+\.(json|ya?ml|[cm]?js|ts)$/.test(path))
const paths = [...new Set([...oldSource.map((item) => normalize(item.path)), ...selected])].filter(existsSync).sort()
const currentSourceFiles = paths.map(describe)
const sourcePin = `${home}/current-source-pin.json`
if (process.argv.includes('--pin-source')) {
  save(sourcePin, { capturedAt: new Date().toISOString(), currentSourceFiles })
  console.log(JSON.stringify({ sourceFiles: paths.length, historicalFiles: historical.files.length, snapshots: mutable.size, originalEvents: oldLedger.events.length, verifiedReportHashes: ledger.events.length }))
} else {
  if (JSON.stringify(json(sourcePin).currentSourceFiles) !== JSON.stringify(currentSourceFiles)) throw new Error('Current source changed since pin; run fresh final verification and repin')
  const finalLog = process.argv[2]
  const finalExit = process.argv[3]
  if (!finalLog || !finalExit || !/VerifyExitCode=0/.test(readFileSync(finalExit, 'utf8'))) throw new Error('A successful actual final verification result is required')
  const walk = (directory) => readdirSync(directory).flatMap((name) => {
    const path = `${directory}/${name}`
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
  const logs = walk(home).filter((path) => !path.endsWith('/acceptance-manifest.json')).map(describe)
  save(`${home}/acceptance-manifest.json`, {
    version: 1, scope: 'Local Phase 3C.3 only; active, unarchived; no 3C.4 or production acceptance', capturedAt: new Date().toISOString(),
    head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    provenance: 'Main-session raw byte hashes and actual command outputs; no signatures or remote CI claim. Historical failures remain. Final source equals the pinned source verified by the final command.',
    finalCommand: 'PLAYWRIGHT_BROWSER_CHANNEL=msedge pnpm verify', finalExitCode: 0,
    finalLog: describe(finalLog), finalExit: describe(finalExit), currentSourceFiles,
    history: { checkedFiles: historical.files.length, snapshots: mutable.size, originalEventsUnchanged: oldLedger.events.length, verifiedReportHashes: ledger.events.length, originalManifest: describe(`${home}/history-manifest.json`) },
    evidenceFiles: logs,
    planningFiles: [
      `${change}/.openspec.yaml`, `${change}/proposal.md`, `${change}/design.md`,
      `${change}/bdd.md`, `${change}/test-plan.json`, `${change}/specs/user-profile/spec.md`,
      'docs/web-platform/phase-3c/06-avatar-local-policy.md', 'docs/adr/0006-local-profile-avatars.md',
    ].map(describe),
    report: describe('docs/web-platform/phase-3c/PHASE-3C3-IMPLEMENTATION-REPORT.md'),
    review: describe(`${change}/review.md`), tasks: describe(`${change}/tasks.md`),
  })
  console.log(JSON.stringify({ sourceFiles: paths.length, historicalFiles: historical.files.length, originalEvents: oldLedger.events.length, reportHashes: ledger.events.length, finalExitCode: 0 }))
}
