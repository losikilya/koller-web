---
name: react-behavior
description: Implement or change React TypeScript and SCSS behavior using the active architecture profile, accessible interaction and meaningful tests; use for ordinary component, hook and state changes
---

Read nearby components, public slice APIs and tests before changing props or state ownership. Keep domain transformations independent of React when practical. Use type-only imports, explicit async states and cleanup for subscriptions or requests. Follow the active architecture profile and Next.js server/client guidance in docs/agent-reference/project.md, SCSS Modules and project tokens.

Keep state minimal: derive values during render, use events for user actions and reserve effects for synchronization with external systems. Model mutually exclusive async states explicitly. Do not introduce context, global state, memoization or generic abstractions without a current need.

Reuse the explicit `@dance/ui` primitives. Do not wrap or replace them merely to anticipate a future design system; adapt this skill when the design-system contract is accepted.
Drive changes through the spec-bdd-tdd process. RTL checks observable outcomes and accessible roles. MSW v2 is the preferred HTTP boundary when the existing project has network behavior. Use browser BDD for focus, layout, navigation and browser integrations; jsdom cannot prove layout. Avoid duplicating every domain edge case in browser tests.
