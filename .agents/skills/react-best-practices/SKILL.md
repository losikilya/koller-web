---
name: react-best-practices
description: Review and improve client-side React performance and scalability; use for render churn, request waterfalls, bundle work, expensive components or performance-sensitive React refactors, not for every ordinary component edit
---

# React client best practices

This is the Dance Platform Next.js App Router profile. Read docs/agent-reference/project.md. Distinguish server work from client rendering and measure the relevant boundary; Server Components remain the default. Vite is test tooling here.

## Priority order

1. Eliminate avoidable request waterfalls and duplicate requests.
2. Reduce critical bundle cost and delay non-critical features at real usage boundaries.
3. Keep state local to the smallest owner; derive values instead of synchronizing duplicate state.
4. Narrow subscriptions and render ownership before adding memoization.
5. Move expensive deterministic work out of repeated hot paths or behind an evidence-backed cache.

## Review questions

- Can independent async work start together? Is cancellation/stale response behavior correct?
- Is a heavy dependency imported for a small capability? Does the actual Next.js production build eliminate unused code?
- Does route or feature code load before the user can need it?
- Does global state or context make unrelated subtrees rerender?
- Is an effect mirroring props/state that can be derived during render?
- Is an unstable object/function causing material child work or effect repetition?
- Are large lists bounded or virtualized only when measurements justify it?

Prefer structural fixes: better ownership, smaller render boundaries, selectors and request orchestration. Use memoization last and verify it with React Profiler or a focused benchmark.

For an ordinary behavior change, use `react-behavior`. For page-level evidence and Core Web Vitals, also load `web-performance`.
