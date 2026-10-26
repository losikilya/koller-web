import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const base = 'openspec/changes/phase-three-a-identity-foundation'
const change = 'phase-three-a-identity-foundation'
export const fixtureFiles = new Map()
const put = (path, text) => fixtureFiles.set(path, text)
const json = (path, value) => put(path, JSON.stringify(value))
const hash = (text) => createHash('sha256').update(text).digest('hex')
const ref = (path) => {
  const text = fixtureFiles.get(path)
  return { path, bytes: Buffer.byteLength(text), sha256: hash(text) }
}

// All data is synthetic. No historical reports, approvals or application files are read.
const scenarios = [201, 202, 203, 204, 205].map((id) => ({
  id: `SC-${id}`,
  requirement: `FR-${id}`,
  layer: 'unit',
  feature: 'tests/synthetic.feature',
  testFile:
    id === 205
      ? 'tests/database/foundation.test.ts'
      : 'tests/synthetic.steps.ts',
}))
put(
  `${base}/proposal.md`,
  `Synthetic proposal: ${scenarios.map((s) => s.requirement).join(' ')}`
)
put(
  `${base}/specs/identity-foundation/spec.md`,
  `Synthetic specs: ${scenarios.map((s) => s.requirement).join(' ')}`
)
put(`${base}/design.md`, 'Synthetic fixture design.')
put(`${base}/bdd.md`, 'Synthetic executable scenario mapping.')
json(`${base}/test-plan.json`, { version: 1, scenarios })
put(
  'tests/synthetic.feature',
  `@${change}\nFeature: Synthetic exception policy\n${scenarios
    .map(
      (s) =>
        `  @${s.requirement} @${s.id}\n  Scenario: Synthetic ${s.id}\n    Given synthetic evidence`
    )
    .join('\n')}\n`
)
put('tests/synthetic.steps.ts', '// Synthetic SC-201 SC-202 SC-203 SC-204')
put('tests/database/foundation.test.ts', '// Synthetic SC-205')
const types = 'apps/web/src/shared/supabase/database.types.ts'
put(
  types,
  '// Synthetic database types\nexport type Database = { synthetic: true };\n'
)
put(
  `${base}/evidence/exception/owner-authorization.txt`,
  'Synthetic owner authorization; never production approval.'
)
put(
  'docs/web-platform/phase-3a/workflow-exception-proposal.md',
  'Synthetic Phase 3A exception proposal.'
)

const events = []
const reports = []
for (const scenario of scenarios.slice(0, 4)) {
  for (const phase of ['red', 'green', 'refactor']) {
    const sequence = events.length + 1
    const report = `evidence/${String(sequence).padStart(3, '0')}-${
      scenario.id
    }-${phase}.json`
    json(`${base}/${report}`, {
      success: phase !== 'red',
      testResults: [
        {
          assertionResults: [
            {
              fullName: `${scenario.id} synthetic assertion`,
              status: phase === 'red' ? 'failed' : 'passed',
            },
          ],
        },
      ],
    })
    reports.push(`${base}/${report}`)
    events.push({
      scenario: scenario.id,
      phase,
      sequence,
      testFile: scenario.testFile,
      testHash: hash(fixtureFiles.get(scenario.testFile)),
      report,
      reportHash: ref(`${base}/${report}`).sha256,
      exitCode: phase === 'red' ? 1 : 0,
    })
  }
}
json(`${base}/evidence/ledger.json`, { events })
const historical = [`${base}/evidence/ledger.json`, ...reports, types]
for (let i = 0; i < 6; i++) {
  const path = `${base}/evidence/synthetic-history-${i}.txt`
  put(path, `Synthetic historical artifact ${i}`)
  historical.push(path)
}
json(`${base}/evidence/history-manifest.json`, {
  version: 1,
  references: historical.map(ref),
})
const prior = []
for (let i = 0; i < 16; i++) {
  const path = `${base}/evidence/final-recovery/synthetic-${i}.txt`
  put(path, `Synthetic prior acceptance artifact ${i}`)
  prior.push(ref(path))
}
json(`${base}/evidence/final-recovery/manifest.json`, {
  version: 1,
  references: prior,
})
export const fixtureAnchors = Object.fromEntries(
  Object.entries({
    authorization: `${base}/evidence/exception/owner-authorization.txt`,
    proposal: 'docs/web-platform/phase-3a/workflow-exception-proposal.md',
    historical: `${base}/evidence/history-manifest.json`,
    priorAcceptance: `${base}/evidence/final-recovery/manifest.json`,
  }).map(([name, path]) => [name, [path, ref(path).sha256]])
)

// Load private test module instances with only the trust-anchor constant substituted.
// Production has no injection option, fallback, environment switch or synthetic imports.
export async function syntheticValidators() {
  const moduleUrl = (source) =>
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  const source = readFileSync(
    new URL('../../scripts/phase3a-exception.mjs', import.meta.url),
    'utf8'
  )
  const anchorDeclaration = /const ANCHORS = \{[\s\S]*?\n\};/g
  assert.equal(
    [...source.matchAll(anchorDeclaration)].length,
    1,
    'Test seam must replace exactly one anchor declaration'
  )
  const validatorUrl = moduleUrl(
    source.replace(
      anchorDeclaration,
      `const ANCHORS = ${JSON.stringify(fixtureAnchors)};`
    )
  )
  let workflow = readFileSync(
    new URL('../../scripts/workflow-lib.mjs', import.meta.url),
    'utf8'
  )
  for (const specifier of ['@cucumber/gherkin', '@cucumber/messages']) {
    workflow = workflow.replace(
      `from '${specifier}'`,
      `from '${import.meta.resolve(specifier)}'`
    )
  }
  assert.equal(workflow.split("from './phase3a-exception.mjs'").length, 2)
  workflow = workflow.replace(
    "from './phase3a-exception.mjs'",
    `from '${validatorUrl}'`
  )
  return {
    ...(await import(validatorUrl)),
    ...(await import(moduleUrl(workflow))),
  }
}
