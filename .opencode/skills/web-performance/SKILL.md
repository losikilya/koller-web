---
name: web-performance
description: Diagnose and improve measured web performance using Core Web Vitals, browser traces, bundle and runtime evidence; use for slow loading, responsiveness, layout shift, bundle growth or a suspected performance regression
---

# Evidence-led web performance

Performance work follows `baseline → hypothesis → focused change → equivalent measurement`. Do not optimize from style preference or Lighthouse score alone.

## 1. Define the target

Record:

- representative URL, state and user journey;
- device, viewport, browser, network/CPU conditions and build mode;
- target metric and budget;
- whether evidence is field data, reproducible lab data or a source hypothesis.

Use field p75 Core Web Vitals for user-impact prioritization when available. Use lab traces to diagnose. Never present a single local run as real-user evidence.

## 2. Localize before editing

- LCP: server/HTML delay, request discovery, hero resource, render blocking or client rendering.
- INP/responsiveness: long tasks, excessive JavaScript, expensive handlers, large synchronous renders.
- CLS: unsized media, late content, fonts, animations or unstable placeholders.
- Loading: request waterfalls, oversized/duplicate dependencies, non-critical eager imports and cache behavior.
- React: broad subscriptions, unstable identities, repeated computation and unnecessarily large render subtrees.

For Vite, inspect the production build and chunk graph before changing imports. Prefer route/feature boundaries that match actual usage. Do not split tiny modules mechanically.

## 3. Change the bottleneck only

- Make the smallest change tied to the hypothesis.
- Preserve behavior and accessibility.
- Do not add `memo`, `useMemo` or `useCallback` unless it removes measured work or stabilizes a required dependency.
- Do not trade correctness, maintainability or initial load for an unmeasured micro-optimization.

## 4. Re-measure

Repeat equivalent conditions and report before/after, run variance, trade-offs and pending field validation. If the result is neutral or worse, revert the added complexity.

Return an evidence table plus findings ordered by expected user impact and confidence. A performance recommendation without a metric, trace signal or reproducible observation is a hypothesis, not a defect.
