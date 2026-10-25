// Mirrors the canonical OpenCode starter-kit (.opencode) into Claude Code (.claude).
// Skills are copies. Rules get Claude-only paths; agents/commands get Claude
// frontmatter. Canonical bodies stay in .opencode. Usage: ... [--check]
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SOURCE = '.opencode';
const TARGET = '.claude';
// OpenCode read-only permission (read/glob/grep/list/lsp/skill) in Claude tool names.
const READ_ONLY_TOOLS = 'Read, Glob, Grep, Skill';

// OpenCode loads rules explicitly through AGENTS.md; paths are a Claude feature.
// Keep this map here, so re-sync cannot silently erase conditional loading.
export const RULE_PATHS = {
  'agent-context-anchors.md': ['src/**/*', 'apps/*/src/**/*', 'packages/*/src/**/*', 'tests/**/*', 'scripts/**/*'],
  'architecture-fsd.md': ['src/**/*', 'apps/*/src/**/*', 'packages/*/src/**/*', 'docs/adr/**/*.md', 'openspec/changes/**/design.md'],
  'frontend-quality.md': ['src/**/*.{js,jsx,ts,tsx,scss,css}', 'apps/*/src/**/*.{js,jsx,ts,tsx,scss,css}', 'packages/*/src/**/*.{js,jsx,ts,tsx,scss,css}'],
  'naming-code-style.md': ['src/**/*.{js,jsx,ts,tsx,scss,css}', 'apps/*/src/**/*.{js,jsx,ts,tsx,scss,css}', 'packages/*/src/**/*.{js,jsx,ts,tsx,scss,css}', 'tests/**/*.{js,jsx,ts,tsx}'],
  'testing-integrity.md': ['tests/**/*', 'openspec/**/*', 'src/**/*.{js,jsx,ts,tsx}', 'apps/*/src/**/*.{js,jsx,ts,tsx}', 'packages/*/src/**/*.{js,jsx,ts,tsx}', 'scripts/*workflow*.mjs', 'scripts/tdd.mjs', 'vitest.config.*', 'playwright*.config.*'],
};

// Git stores these files with LF, but core.autocrlf=true checks them out with CRLF on Windows.
// Mirrors are generated and compared in LF so the check does not depend on the checkout EOL.
const toLf = (text) => text.replace(/\r\n/g, '\n');

const splitFrontmatter = (text) => {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  return match ? { frontmatter: match[1], body: text.slice(match[0].length) } : { frontmatter: '', body: text };
};
const field = (frontmatter, key) => frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();
const markdownFiles = (dir) => (existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith('.md')).sort() : []);

function agentAdapter(name, text) {
  const { frontmatter, body } = splitFrontmatter(text);
  const description = field(frontmatter, 'description');
  const lines = ['---', `name: ${name}`];
  if (field(frontmatter, 'mode') === 'primary') {
    lines.push(`description: ${description}. Primary orchestrator (OpenCode mode: primary); run as the main-thread agent with \`claude --agent ${name}\`, never delegate to it as a subagent`);
  } else {
    lines.push(`description: ${description}`, `tools: ${READ_ONLY_TOOLS}`);
  }
  lines.push('model: inherit');
  const steps = field(frontmatter, 'steps');
  if (steps) lines.push(`maxTurns: ${steps}`);
  lines.push('---');
  return `${lines.join('\n')}\n${body}`;
}

function commandAdapter(text) {
  const { frontmatter, body } = splitFrontmatter(text);
  const lines = ['---', `description: ${field(frontmatter, 'description')}`];
  if (body.includes('$ARGUMENTS')) lines.push('argument-hint: "[arguments]"');
  lines.push('---');
  return `${lines.join('\n')}\n${body}`;
}

export function ruleAdapter(name, text) {
  const paths = RULE_PATHS[name];
  // A newly added, unclassified rule remains global rather than silently omitted.
  if (!paths) return text;
  const { body } = splitFrontmatter(text);
  return `---\npaths:\n${paths.map((path) => `  - ${JSON.stringify(path)}`).join('\n')}\n---\n${body}`;
}

/** Returns the expected `.claude` files as a map of relative path → content. */
export function expectedFiles(root) {
  const files = new Map();
  const read = (path) => toLf(readFileSync(join(root, path), 'utf8'));
  for (const skill of readdirSync(join(root, SOURCE, 'skills')).sort()) {
    const path = `skills/${skill}/SKILL.md`;
    if (existsSync(join(root, SOURCE, path))) files.set(`${TARGET}/${path}`, read(`${SOURCE}/${path}`));
  }
  for (const name of markdownFiles(join(root, SOURCE, 'rules'))) {
    files.set(`${TARGET}/rules/${name}`, ruleAdapter(name, read(`${SOURCE}/rules/${name}`)));
  }
  for (const name of markdownFiles(join(root, SOURCE, 'agents'))) {
    files.set(`${TARGET}/agents/${name}`, agentAdapter(name.replace(/\.md$/, ''), read(`${SOURCE}/agents/${name}`)));
  }
  for (const name of markdownFiles(join(root, SOURCE, 'commands'))) {
    files.set(`${TARGET}/commands/${name}`, commandAdapter(read(`${SOURCE}/commands/${name}`)));
  }
  return files;
}

/** Mirrored `.claude` files that no longer have a canonical source. */
export function staleFiles(root, expected) {
  const stale = [];
  const skillsDir = join(root, TARGET, 'skills');
  if (existsSync(skillsDir)) {
    for (const skill of readdirSync(skillsDir)) {
      const path = `${TARGET}/skills/${skill}/SKILL.md`;
      if (existsSync(join(root, path)) && !expected.has(path)) stale.push(path);
    }
  }
  for (const kind of ['rules', 'agents', 'commands']) {
    for (const name of markdownFiles(join(root, TARGET, kind))) {
      const path = `${TARGET}/${kind}/${name}`;
      if (!expected.has(path)) stale.push(path);
    }
  }
  return stale.sort();
}

export function sync(root, { check = false } = {}) {
  const expected = expectedFiles(root);
  const changed = [];
  for (const [path, content] of expected) {
    const target = join(root, path);
    if (existsSync(target) && toLf(readFileSync(target, 'utf8')) === content) continue;
    changed.push(path);
    if (!check) {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    }
  }
  return { changed, stale: staleFiles(root, expected), total: expected.size };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const check = process.argv.includes('--check');
  const { changed, stale, total } = sync(process.cwd(), { check });
  for (const path of changed) console.log(`${check ? 'out of sync' : 'updated'}: ${path}`);
  // Stale mirrors are reported, never deleted automatically.
  for (const path of stale) console.log(`stale (no source in ${SOURCE}, remove manually): ${path}`);
  console.log(`${total} mirrored files, ${changed.length} ${check ? 'out of sync' : 'updated'}, ${stale.length} stale`);
  if (check && (changed.length > 0 || stale.length > 0)) process.exitCode = 1;
}
