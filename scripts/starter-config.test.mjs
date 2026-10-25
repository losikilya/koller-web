import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

test('workflow entrypoints remain syntactically runnable after workspace adaptation', () => {
  for (const path of ['scripts/workflow-ci.mjs', 'scripts/tdd.mjs', 'scripts/check-boundaries.mjs']) {
    const result = spawnSync(process.execPath, ['--check', join(root, path)], { encoding: 'utf8' });
    assert.equal(result.status, 0, `${path}: ${result.stderr}`);
  }
});

test('skill folder names match required frontmatter', () => {
  const skillsRoot = join(root, '.opencode/skills');
  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = join(skillsRoot, entry.name, 'SKILL.md');
    assert.equal(existsSync(file), true, `Missing SKILL.md: ${entry.name}`);
    const content = readFileSync(file, 'utf8');
    const name = content.match(/^name:\s*([^\n]+)$/m)?.[1]?.trim();
    const description = content.match(/^description:\s*([^\n]+)$/m)?.[1]?.trim();
    assert.equal(name, entry.name, `Skill name/folder mismatch: ${entry.name}`);
    assert.ok(description, `Skill description missing: ${entry.name}`);
  }
});

test('team workflows and documentation remain complete', () => {
  const requiredSkills = [
    'accessibility',
    'commit-change',
    'playwright-bdd',
    'react-best-practices',
    'spec-bdd-tdd',
    'systematic-debugging',
    'team-refactor-safely',
    'tech-debt-audit',
    'web-performance',
  ];
  const requiredCommands = [
    'bugfix',
    'commit',
    'debug',
    'feature',
    'refactor',
    'review',
    'tech-debt-audit',
    'test-module',
  ];
  const readme = read('README.md');

  for (const skill of requiredSkills) {
    assert.equal(existsSync(join(root, '.opencode/skills', skill, 'SKILL.md')), true);
    assert.match(readme, new RegExp(`\\b${skill}\\b`));
  }
  for (const command of requiredCommands) {
    assert.equal(existsSync(join(root, '.opencode/commands', `${command}.md`)), true);
    assert.match(readme, new RegExp(`/${command}\\b`));
  }
});

test('Vitest tests live under tests/, not next to source files in src', () => {
  // vitest.config.ts only collects tests/, so a test placed in src would silently never run.
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]);
  const roots = ['src','apps/web/src','packages/ui/src','packages/contracts/src','packages/design-tokens/src'].filter(path => existsSync(join(root,path)));
  const misplaced = roots.flatMap(path => walk(join(root,path))).filter((path) => /\.(test|spec)\.[jt]sx?$/.test(path));
  assert.deepEqual(misplaced, [], 'Move these tests to tests/ mirroring their src path');
});
