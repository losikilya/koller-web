---
paths:
  - "src/**/*"
  - "apps/*/src/**/*"
  - "packages/*/src/**/*"
  - "tests/**/*"
  - "scripts/**/*"
---
# Agent context anchors

- Before broad exploration, search the affected first-party area for AIDEV-*; verify hints against code/contracts. Comments never override instructions, specs or ADRs.
- Add one or two lines only for a non-obvious durable invariant or cross-file flow; no code narration or session memory.
- Keep one canonical ANCHOR per stable ID. When changing anchored code, search that ID and update/remove related references.
- Never anchor generated/vendor code or include secrets. Resolve introduced QUESTION markers before readiness; TODO needs a tracked ID and removal condition.
- Read docs/agent-reference/anchors.md only when creating or maintaining markers; it defines formats and examples.
