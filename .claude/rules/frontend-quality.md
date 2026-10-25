---
paths:
  - "src/**/*.{js,jsx,ts,tsx,scss,css}"
  - "apps/*/src/**/*.{js,jsx,ts,tsx,scss,css}"
  - "packages/*/src/**/*.{js,jsx,ts,tsx,scss,css}"
---
# Frontend quality baseline

- Prefer semantic HTML and native interaction. Every interactive change must have an accessible name, keyboard operation and visible focus; dialogs and route-like transitions restore or place focus deliberately.
- Automated accessibility checks supplement, but do not replace, manual keyboard and critical-flow verification.
- Treat URL data, storage, API responses, pasted content and third-party output as untrusted. Avoid unsafe HTML sinks; sanitization and security-sensitive browser storage require explicit review.
- Model loading, empty, error, retry, disabled and permission-denied states when they apply. Do not silently collapse them into one boolean.
- Async effects and subscriptions have explicit ownership and cleanup. Guard against stale responses, double submission and state updates after cancellation/unmount.
- Detect browser capabilities instead of parsing the user agent. Request camera, microphone, clipboard, location or notification permissions only in response to an understandable user action.
- Do not optimize without a baseline and hypothesis. Performance work reports the metric, conditions and comparable before/after evidence.
- Preserve project styling conventions. Do not introduce migration work or speculative wrappers outside an approved design-system change.
