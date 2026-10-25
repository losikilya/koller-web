# Acceptance mapping

Canonical browser scenarios: tests/e2e/foundation/smoke.feature (SC-001, SC-002). Vitest drivers test routing contracts directly; Playwright separately proves actual navigation and localized rendering.

Canonical control scenarios: tests/bdd/foundation/controls.feature (SC-003, SC-004). Mirrored RTL drivers exercise real native keyboard interactions. There are no baseline scenarios: no existing application behavior was supplied. Additional browser specs cover root/404, metadata, all pages, compact layout, skip focus and console/hydration errors.
