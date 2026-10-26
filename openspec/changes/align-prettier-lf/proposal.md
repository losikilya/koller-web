# Cross-platform formatting

Change kind: maintenance
Behavior contract: unchanged

## Scope and evidence

UPDATE the root Prettier EOL setting and scoped Git attributes for current formatting inputs. HEAD/index tokens.css is LF; the Windows worktree is CRLF under core.autocrlf=true. Prettier currently requires CRLF, so clean Linux contents fail solely on EOL.

UPDATE the maintenance guard's exact config allowlist and its regression tests, permitting only the two formatting policy files. KEEP all other formatting rules, commands, thresholds and product bytes after EOL normalization. KEEP archived changes and historical evidence bytes unchanged; their existing EOL is preserved through narrow Prettier overrides. REMOVE nothing. DEFER any repository-wide renormalization and historical evidence repair.

Allowed edits: .prettierrc.json, .gitattributes, scripts/architecture-refactor-workflow.mjs, scripts/architecture-refactor-workflow.test.mjs and this maintenance change. Worktree-only normalization is limited to current formatting inputs, verified against original bytes modulo CRLF/LF; do not stage or rewrite source or archives.
