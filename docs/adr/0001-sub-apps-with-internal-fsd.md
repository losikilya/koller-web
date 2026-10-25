# ADR-0001: Sub-apps with internal Feature-Sliced Design
Status: Accepted
Date: 2026-10-08
## Context
The portal covers many independent banking domains. Large domains (`issues`, `credit`, `gold`) already live as self-contained sub-apps with their own `app/{App,providers,router,layout}` mounted under a root route; `deposit` follows the same layering but its pages are wired in the root router. Newer code in the host and inside sub-apps follows FSD layers, while legacy folders (`components`, `ui`, `layouts`, `functions`, `utils`, `actions`, `reducers`) remain. Sub-apps currently do not import each other.
## Decision
The architecture profile is a host shell plus sub-apps, with FSD layering (`app → pages → widgets → features → entities → shared`) inside the host and inside each sub-app. A sub-app owns a route subtree and exposes a public `index.ts`; sub-apps never import each other; shared code is promoted to host layers or `packages`. Rules: `.opencode/rules/architecture-fsd.md`.
## Alternatives
- Single flat FSD tree for the whole portal: rejected, it would mix unrelated domains in shared layers and require a large migration.
- Independent micro-frontends: rejected, the domains share one store, session state, runtime config and router.
## Consequences
- New domain code is placed in the owning sub-app's FSD layers; host layers hold code reused by several sub-apps.
- Existing deep imports into sub-apps (root reducers, routes, deposit pages) and legacy folders stay until a dedicated change migrates them.
- Creating, splitting or merging a sub-app requires architect review and a new ADR.
## Related changes
- Captured from the existing structure while adopting the agent starter-kit; no code moved.
