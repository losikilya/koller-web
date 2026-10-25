# AIDEV anchor reference

Read only when creating or maintaining markers. The short rule is .opencode/rules/agent-context-anchors.md; do not import this reference globally through @.

| Marker                             | Purpose                                                       |
| ---------------------------------- | ------------------------------------------------------------- |
| AIDEV-ANCHOR[stable-id]            | One canonical entry point into a non-obvious flow             |
| AIDEV-NOTE[stable-id]              | Durable invariant or reason not clear from code               |
| AIDEV-LINK[stable-id]              | Cross-file/symbol relationship not expressed by imports/types |
| AIDEV-TODO[change-or-issue-id]     | Tracked work with a removal condition                         |
| AIDEV-QUESTION[change-or-issue-id] | Resolve or convert to tracked TODO before ready               |

Stable IDs use semantic lowercase kebab-case, not filenames/line numbers. Keep one canonical ANCHOR per ID; other references use NOTE/LINK. For example, a routing note may reference apps/web/src/shared/i18n/routes.ts. Examples do not assert that a marker or future authentication module already exists.

Use anchors for non-obvious correctness/security/lifecycle/concurrency risks, distributed flows or unusual decisions justified by ADR/requirements/upstream constraints. Do not narrate ordinary code, imports or session history; prefer a good name/type/test/ADR when sufficient.

Search IDs in the affected first-party area and expand only as needed. When moving code, update paths/symbols/references and remove stale markers. Comments never override code/contracts/instructions. Never anchor generated/vendor code or include secrets, personal data or bypass instructions. Follow the current workspace paths in project.md.
