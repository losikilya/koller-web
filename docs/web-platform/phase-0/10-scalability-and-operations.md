# Scalability and Operations

Confirmed growth target: up to 100,000 registered users, not 100,000 concurrent users. No current traffic, budget, hosting region or capacity benchmark is known. The following is an incremental proposed strategy, not a capacity guarantee.

## Workload and early infrastructure

Timer runs locally; sampling never calls the server. Server load comes from authentication, public profiles/catalog and occasional preset operations. Model active sessions, request rates, peak bursts, payload sizes and read/write mix separately from total registered accounts. For example 1,000 active users saving once per minute implies roughly 17 saves/second on average, not a promise about burst capacity or database performance.

Low-traffic MVP: one web deployment, managed Supabase project, separate environments, CDN for public static assets/catalog and server-side privacy-aware data access. Use region proximity and provider-supported connection pooling; bound connections and function concurrency according to measured limits. No Redis, standalone API, worker fleet or microfrontends by default. A durable restricted account-deletion retry ledger is justified for failure recovery; its processing can begin with a platform scheduler before a queue is needed.

As registrations grow, measure storage/index size, email/OAuth usage, cost per active user and deletion workload. As concurrency grows, measure SSR/route saturation, database connections, p95/p99 latency and lock contention. Optimize the actual limiting resource; accounts alone are not the trigger to rewrite architecture.

## Scaling signals and actions

| Measured trigger | Investigation and action | Extraction gate |
| --- | --- | --- |
| Sustained route p95 beyond agreed SLO, CPU saturation, timeouts | Profile route/query spans; optimize adapters, request bounds, cache only privacy-safe assets | Separate NestJS only if BFF runtime/deployment limits or independent clients materially require it |
| Slow queries/scan growth, connection pool waits, row-lock contention | EXPLAIN plans, index/selectivity review, bounded pagination, per-user quota-lock behavior, pooling | DB plan/resource change after representative benchmark; no arbitrary account threshold |
| Long-running/retried tasks exceed request budget or deletion backlog age | Durable jobs, idempotency, retry/backoff and dead-letter handling | Queue/worker when scheduled ledger processing cannot meet recovery objectives |
| High egress/storage/abuse cost | Rate limits, body/file limits, retention, per-account quota review | Dedicated infrastructure only with cost/control requirements and an operational owner |
| Client bundle/route performance budget fails due to unrelated modules | Lazy loading, dependency removal, bundle tracing | Independent route app only with team/deployment/operational evidence |
| Release contention or divergent availability requirements | Measure failed deploy coupling and ownership | Backend/app extraction after stable contracts and rollback plan |

Initial proposed SLO candidates for review: preset API p95 <500ms excluding provider outages; unexpected 5xx <1% over a defined window; guest core available without auth/data network. Do not present these as proven achievable. Establish representative staged load tests and browser performance budgets before production launch. Record environment, workload, RLS enabled, connection limits and costs with every benchmark.

## Diagnostics and security

Structured server logs: requestId, operation/appId, outcome/error code, duration; owner IDs minimized or pseudonymized according to retention policy. Metrics: auth success/failure, OAuth callback errors, profile reads, private-read denials, preset conflicts, quota rejections, latency, retries, pool utilization, slow queries, deletion backlog and client timer recovery. Client telemetry must be optional/privacy-reviewed and never include preset names, credentials or complete profiles. Trace transport/use-case/database boundaries; audio/local-storage failures should be distinguishable from API outages.

Security review gates: direct-RPC RLS and grants, definer function privileges/search_path, auth redirect/CSRF/session caching, dependencies/CSP, storage access and metadata, provider linking, deletion restore behavior and rate limiting. Use shared provider/edge counters rather than per-process memory for production abuse limits. Distinguish NAT/shared users from attacks; throttle reads/writes/auth separately. Proposed budgets are adjusted using measured rejection/abuse rates.

## Environments, secrets and delivery

Development/staging/production have separate Supabase projects, OAuth client configuration, data and secrets. Local fixtures contain no production PII. Staging mirrors privacy/auth settings and supports deterministic E2E test users. Production credentials never enter preview builds. Browser publishable key is deliberately public; admin key, SMTP and OAuth secrets are restricted deployment secrets. Use server-only modules, secret scanning, rotation/revocation procedures and narrow admin adapters. Exact hosting vendor/region is unresolved.

CI proposal: dependency lock verification; strict typecheck; lint/import graph; unit/integration/BDD; build; OpenAPI compatibility; isolated database RLS/RPC tests; Playwright and accessibility; reviewed migration diff. Production release uses migration sequencing and an application rollback artifact. Database expand/contract changes support the previous application version; avoid destructive down migrations as routine rollback. Feature flags can disable cloud preset writes/publication without removing guest tools. No CI/config is modified here.

## Backups, restore and retention

Choose provider backup/PITR coverage after plan/region selection; storage objects and provider auth configuration may need separate procedures. Proposed objectives to confirm: RPO <=24h initially, RTO <=8h, tighter if business impact warrants. These are targets, not purchased capabilities. Encrypt/restrict backups, retain them under a reviewed policy, and rehearse restoration to an isolated project. Verify auth/profile FK alignment, RLS/grants/functions, storage and versions before reopening traffic.

Deletion tombstones/ledger must be replayed after restore to avoid republishing deleted users. Confirm hard-delete aging from backups, legal/security log retention, profile search removal and object cleanup with product/legal owner. Avoid indefinite raw analytics and PII logs. Document incident ownership, rollback/runbooks, provider-outage messaging and stale cache revocation. Guest browser data cannot be centrally backed up or deleted from remote devices; explain local persistence limits in policy UX.
