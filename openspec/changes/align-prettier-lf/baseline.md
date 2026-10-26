# Baseline

## Observable contract

Design token values, rendered styles, routes, authentication and database security remain unchanged. Formatting gates retain all non-EOL conventions. No archived or historical evidence is rewritten.

Observed before cleanup: tokens.css HEAD/index contains 109 LF and zero CRLF (3225 bytes); worktree contains 109 CRLF (3334 bytes). Effective Prettier 2.8.4 endOfLine is crlf, with no .editorconfig or .gitattributes. System Git core.autocrlf is true. HEAD fails prettier.check with the effective config and passes when only endOfLine becomes lf; the working copy gives the opposite results.

Record the actual existing GREEN using the shared verification-plan.json before applying policy changes. Evidence/architecture-refactor contains runner reports, command logs and exit codes; no product RED is claimed for this maintenance.
