# Playground Architecture

Confirmed: guest-first, first app Practice Timer, local guest persistence, optional authenticated cloud persistence, independently maintained modules. The current mobile app has no verified Playground module. All structures below are proposals.

## Manifest and routes

```typescript
type MicroAppManifest = {
  appId: 'practice-timer'; // permanent, never localized
  manifestVersion: 1;
  routeSegment: 'practice-timer';
  titleKey: 'practiceTimer.title';
  descriptionKey: 'practiceTimer.description';
  translationNamespace: 'practiceTimer';
  publicAccess: true;
  capabilities: ('local-presets' | 'cloud-presets' | 'audio')[];
  supportedDataVersions: readonly [1];
  seo: { titleKey: string; descriptionKey: string; indexable: boolean };
};
```

An explicit static registry associates manifests with lazy loaders and server-side payload validators. Do not embed executable remote URLs or client tokens in metadata. A stable appId is storage/contract identity; routeSegment may later have aliases without moving data. /{locale}/playground is shell catalog; /{locale}/playground/{routeSegment} is module route. Shell supplies locale, narrow persistence adapter, and optional account display state. The app owns controls, engine and preset workflow. Catalog uses projected manifest data, not private loader/import paths.

Capabilities describe UI features, not security grants. Server app allowlist, authenticated principal, record ownership, quotas and schema validation authorize requests. A forged manifest cannot unlock storage access, cross-app writes or privileged functions.

## Execution and isolation

SSR renders catalog and localized tool metadata. Lazy import the selected client UI/engine; avoid eagerly bundling all future apps. Client error boundary contains render errors; async/audio/storage failures use explicit result handling because React boundaries do not catch all async failures. Timers clean up subscribers/schedulers on unmount. No app installs global listeners without cleanup or exports mutable singleton state shared across app instances. Reload/retry recovers only the failed module.

Use packages/ui and design-tokens for controls, dialogs, typography and focus; app-local styling handles its actual workspace. Internal apps cannot import one another's core/store files. Reusable timing code becomes shared only after a second real use case justifies it. Timer does not import qualification timer, battle events or local session stores.

## Persistence access

Guest adapter stores versioned validated presets under a namespaced key (proposed koller.playground.practice-timer.presets.v1). Guest identity is the browser origin/storage, not Supabase anonymous auth. Authenticated adapter uses /api/v1/playground/practice-timer/data and never receives provider secret keys. Cloud lists are account-scoped and cleared on logout/account switch. Storage port expresses list/get/create/update/delete with revision/concurrency metadata; error types distinguish unavailable, corrupt, quota and conflict.

Local storage is synchronous, small and fallible; read/write only on client, catch security/quota exceptions, validate before use, and never store access tokens there as part of presets. Propose a 50-preset guest limit and 16KiB per preset, configurable and consistent with cloud import review. Running timer state is not persisted in MVP. Authenticated users can continue core functionality during network failure; owner cloud draft data must not silently become shared guest data. Pending drafts are account-scoped, identified as unsaved, and retry only for the same account.

Guest import is opt-in after sign-in, not automatic; validate/deduplicate, preview counts/conflicts/quota and create distinct cloud UUID records unless a previous import mapping proves the same record. Never overwrite cloud by name. Keep guest originals until user chooses deletion. Detailed behavior is in [09](09-practice-timer-specification.md).

## Localization, metadata and test boundary

Namespaces shell/playground/practiceTimer expose English/Russian messages for every control, validation error, status and import conflict. English default; route locale drives rendered content and document lang. UI translates numeric units/plural rounds; persistence stores numeric durations and stable app IDs, not localized labels. SEO localized title/description, canonical locale URLs and hreflang; noindex account/private state, no tokens or personal data in metadata. Public tool page shows the actual usable app, not a registration landing gate.

Future tests: pure engine unit tests, persistence contract tests for both adapters, manifest registry/route validation, component accessibility and localization, logged-out/owner E2E workflows, async failure recovery and lazy bundle checks. BDD/TDD applies to implementation, not additions to this mobile checkout.

## Extraction criteria

Keep app internal when one team/deployment can maintain it with acceptable bundle size, performance and release cadence. Route-based independent deployment is justified by measured release contention, materially different runtime needs, a distinct accountable team, or confirmed resource/security isolation requirements. A complex feature alone or registered-user count does not justify extraction.

Before extraction, stabilize appId/routes/preset contract, shared design package releases and locale resources. Define same-origin routing or reverse proxy, session trust and CORS/CSRF policy, deployment ownership, observability and rollback. Each app owns its client bundle and data validation while platform identity remains canonical. Do not share session cookies across arbitrary sibling domains by default. Avoid Module Federation initially; packages + route contracts provide the migration path.
