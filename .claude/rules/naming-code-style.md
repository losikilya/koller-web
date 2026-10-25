---
paths:
  - "src/**/*.{js,jsx,ts,tsx,scss,css}"
  - "apps/*/src/**/*.{js,jsx,ts,tsx,scss,css}"
  - "packages/*/src/**/*.{js,jsx,ts,tsx,scss,css}"
  - "tests/**/*.{js,jsx,ts,tsx}"
---
# Naming and code style

- Prettier owns formatting; .eslintrc.cjs owns automated naming warnings. Fix touched code, not unrelated legacy names. External keys and imported/destructured names retain their contracts.
- Use precise domain names: verbs for actions, nouns for values, predicates for booleans. Callback props use onEvent, local handlers handleEvent. Uppercase constants are fixed module-level values, not runtime config.
- Files: components PascalCase.tsx, hooks useSomething.ts, other modules camelCase. Page/component folders PascalCase; slices/segments camelCase. Preserve documented local exceptions. File/directory naming is reviewed, not enforced by identifier lint.
- SCSS module classes use camelCase and explicit state names (isActive). No Stylelint was added; review manually.
- Prefer unknown plus validation over any, explicit invariants over assertions, and discriminated unions over synchronized flags. Avoid clever types that complicate callers.
- Prefer named exports except required framework/lazy boundaries. Comments explain intent; remove dead commented code and debug leftovers. Follow the separate anchor rule for AIDEV-*.
