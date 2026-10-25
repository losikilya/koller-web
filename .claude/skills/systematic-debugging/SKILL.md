---
name: systematic-debugging
description: Diagnose build failures, test failures, runtime bugs, flaky behavior and performance regressions through evidence, reproduction, hypotheses and regression tests; use when something is broken or unexpectedly slow
---

# Systematic debugging

Stop unrelated implementation and preserve the original evidence. Do not guess-fix a symptom.

## Choose a mode

- QUICK: deterministic build/test failure introduced by the current change; reproduce, compare the failing boundary, fix root cause, add/confirm regression coverage, verify.
- DEEP: intermittent, environment-specific, cross-layer, production-only or performance issue; follow every phase below.

## Phase 1: Build a red-capable feedback loop

Prefer, in order: focused failing test; browser scenario; small CLI/HTTP reproduction; captured payload/event replay; isolated harness; controlled stress loop; automated bisection.

The loop must exercise the reported path and detect the exact symptom. Make it as fast and deterministic as practical. Redact credentials, tokens, personal data and authenticated artifacts before showing output.

If reproduction is impossible, list attempts and request the missing environment, redacted artifact or permission for temporary instrumentation. Do not present an untested theory as root cause.

## Phase 2: Minimize and compare

Remove unrelated inputs, state and steps while preserving the failure. Compare working and failing cases across code, data, browser/Node versions, timing and environment.

## Phase 3: Hypothesize and instrument

- Produce 3–5 ranked falsifiable hypotheses for DEEP mode.
- State the observation that would support or reject each one.
- Change one variable at a time.
- Prefer debugger/profiler and targeted boundary logs. Prefix temporary logs with a unique `DEBUG-<id>` marker.
- For performance, establish a timing/trace baseline before changing code.

## Phase 4: Fix through TDD

Convert the minimized reproduction into a failing regression test at the seam where the real bug occurs. Confirm RED, implement the smallest root-cause fix, confirm GREEN, then rerun the original unminimized reproduction.

If no correct test seam exists, document that architectural constraint and request architect input after containing the defect. Do not add a shallow test that cannot catch the bug.

## Phase 5: Clean up and report

- Remove all temporary instrumentation and harness artifacts not intentionally retained.
- Run focused and required regression verification.
- Report symptom, root cause, evidence, regression test, fix, checks and remaining uncertainty.
