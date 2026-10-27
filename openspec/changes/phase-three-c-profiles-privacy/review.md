# Independent review

Historical Phase 3C.1 verdict: PASS

Implementation review pass 1 (read-only): one HIGH and two MEDIUM findings. The canonical unit feature was only mapped by IDs rather than loaded by its drivers; SDK status-zero errors and Cancel could bypass reload-required after an uncertain save; publication/name-clear race started with an already blank name and did not test the dangerous eligible transition.

The reviewer directly inspected actual tracked/untracked source, contracts/tests, OpenSpec, ADR, original baseline, ledger and RED causes. It confirmed initial RED failures represented missing behavior rather than setup failure, and SC-420 was an existing SQL baseline. Test execution belongs to the main session. The second full verify was still running at that inspection; its subsequent exit 0 does not resolve review findings by itself.

Main-session corrections: drivers now load/execute the canonical Gherkin steps without changing scenario/file mappings or historical evidence; new untagged SDK-shaped/Cancel regressions failed 2/2 before correction then passed unchanged 2/2; a separate ordinary real PostgreSQL race starts from a valid nonblank name, asserts one rejected transition and the final public-name invariant. Original baseline script/event/report bytes remain intact. Current focused Gherkin/SQL acceptance passed 7 tests in 4 files.

## Final correction review — pass 2

Actual read-only reviewer verdict: **PASS**, all three findings resolved and no new actionable findings. The [actual response](evidence/review-pass2.txt) is retained in its original language. The reviewer directly inspected corrected source, executable drivers, ordinary regressions and actual RED/GREEN/focused/full verification logs. Main-session execution and hash checks remain distinct from reviewer inspection; the reviewer did not execute scripts/tests or recalculate hashes.

Fresh final `pnpm verify`: exit 0, evidence/final-verify-reviewed-formatted.txt. It includes 64 tests plus coverage, real PostgreSQL/Auth/profile races, 22 application browser checks, seven Storybook checks and strict specs 6/6. The acceptance manifest records actual command results and current source/test digests. Scope of this PASS is Phase 3C.1 only; the change stays active and future privacy/public/Storage stages remain deferred.

## Revised Phase 3C.2 independent review

Verdict: PASS

The Phase 3C.1 review above is historical. Historical exact artifact bytes are preserved in evidence/phase3c2/history-3c1. Revised 3C.2 received its own two read-only review passes; no earlier PASS is reused.

Pass 1 returned BLOCKED: Auth provider failures could be treated as guest by proxy/SSR, and POST auth could lose refreshed cookies after successful sign-in followed by completion lookup failure. The [actual response](evidence/phase3c2/review-pass1.txt) is retained. Ordinary regressions reproduced both behaviors before correction. Provider verification now distinguishes absent/invalid sessions from unavailable verification across proxy, SSR and owner/completion-state HTTP; essential recovery and guests remain usable. POST auth retains response context on its safe error path. Two older transport fixtures were adapted to provide the real provider boundary, with every assertion unchanged; original evidence remains intact.

Correction review pass 2 returned **PASS**, both findings resolved and no new actionable findings. The [actual response](evidence/phase3c2/review-pass2.txt) records its scope and limitations. The reviewer directly inspected corrected source, assertions and real RED/GREEN/full logs; tests and complete historical hash verification were executed by the main session.

Fresh final `pnpm verify` exited 0: [verify-review-final.txt](evidence/phase3c2/verify-review-final.txt), SHA-256 `ff1d6a9e37449e87f3166eef52e6adc119d278fe09d2769ca8a5471b77be36db`. It includes 79 tests with coverage, real PostgreSQL/RLS/Auth/races, 23 application browser checks, seven Storybook checks and strict specs 6/6. Current-source/log binding is recorded separately in the 3C.2 acceptance manifest. This PASS covers revised 3C.2 only; avatars/Storage and combined 3C.4 acceptance remain deferred. The change remains active and unarchived.
