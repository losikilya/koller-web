import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { RULE_PATHS, ruleAdapter, sync } from './sync-claude.mjs'

test('Claude rule adapters retain bodies and add explicit path scopes', () => {
  for (const [name, paths] of Object.entries(RULE_PATHS)) {
    const body = `# ${name}\n\nCanonical rule body.\n`
    const adapted = ruleAdapter(name, body)
    assert.equal(adapted.slice(adapted.indexOf('\n---\n') + 5), body)
    for (const path of paths)
      assert.ok(adapted.includes(`  - ${JSON.stringify(path)}\n`))
    assert.equal(ruleAdapter(name, adapted), adapted)
  }
  assert.equal(ruleAdapter('new-rule.md', '# New\n'), '# New\n')
})

test('sync is stable across CRLF, preserves skills, and detects lost paths', () => {
  const root = mkdtempSync(join(tmpdir(), 'starter-sync-'))
  const put = (path, text) => {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, text)
  }
  try {
    put(
      '.opencode/skills/example/SKILL.md',
      '---\r\nname: example\r\n---\r\nBody\r\n'
    )
    put('.opencode/rules/naming-code-style.md', '# Naming\r\nBody\r\n')
    put(
      '.opencode/agents/reviewer.md',
      '---\nmode: subagent\ndescription: Review\nsteps: 4\n---\nRead only.\n'
    )
    put(
      '.opencode/commands/review.md',
      '---\ndescription: Review\nagent: orchestrator\n---\nReview $ARGUMENTS\n'
    )
    assert.equal(sync(root).changed.length, 4)
    assert.deepEqual(sync(root, { check: true }).changed, [])
    assert.match(
      readFileSync(join(root, '.claude/agents/reviewer.md'), 'utf8'),
      /tools: Read, Glob, Grep, Skill/
    )
    assert.equal(
      readFileSync(join(root, '.claude/skills/example/SKILL.md'), 'utf8'),
      '---\nname: example\n---\nBody\n'
    )
    put('.claude/rules/naming-code-style.md', '# Naming\nBody\n')
    assert.deepEqual(sync(root, { check: true }).changed, [
      '.claude/rules/naming-code-style.md',
    ])
    sync(root)
    assert.deepEqual(sync(root, { check: true }).changed, [])
    put('.claude/rules/stale.md', '# Stale\n')
    assert.deepEqual(sync(root, { check: true }).stale, [
      '.claude/rules/stale.md',
    ])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
