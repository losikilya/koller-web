# Design

## ADR impact

COMPATIBLE with ADR-0002: formatting policy only; no module, runtime, token or database changes.

Use LF in Prettier and explicit Git attributes scoped to files covered by current formatting gates. Do not use a repository-wide wildcard or renormalize the index. Existing tracked source is already LF. Preserve other style settings. Archived change documents and the frozen Phase 3A exception proposal keep their existing EOL via endOfLine auto; every other formatting check still applies. Archive/evidence paths are excluded from attribute conversion.

Serialized verification plans also keep their exact original bytes: the maintenance runner hashes their raw content. Use endOfLine auto and disable Git text conversion for these specific plan artifacts, retaining the already recorded baseline hash through this EOL-policy transition. Do not change the runner's hashing or rewrite existing evidence.

The maintenance allowlist currently omits these two root configuration files. Add only their exact names and test accepted/rejected neighbors before changing that guard. No wildcard expansion or quality gate changes.

Allowed edits are enumerated in proposal.md. Normalize only nonhistorical working copies that fail the new EOL setting, after asserting their content is otherwise already formatted. Require unchanged bytes modulo EOL and an empty product/source Git diff. Rollback restores only the new policy/guard edits; never reset user work or historical files.

Use isolated tracked exports with core.autocrlf=false and true plus the explicit patch, reusing installed dependencies but no generated reports. Verify both Git checkout attributes and clean tracked formatting. Full verification uses Chrome, matching CI. Review independently before readiness.
