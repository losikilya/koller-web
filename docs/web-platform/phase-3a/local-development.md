# Local development

Use the existing pnpm 8.15.4 and supported Node version. Docker Desktop must run Linux containers. No cloud project, paid account, OAuth configuration or Supabase login/link is required. First startup downloads local images and uses disk/memory for PostgreSQL/Auth/API/Studio/SMTP.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm db:start
pnpm exec supabase status
pnpm db:reset
pnpm db:test
pnpm db:types
pnpm exec prettier --write apps/web/src/shared/supabase/database.types.ts
pnpm typecheck
pnpm dev
```

`db:reset` destroys only the disposable local project's database and reapplies migrations; do not use it for data you need to keep. `db:test` is an explicit integration gate: it runs transactional pgTAP and real REST clients using distinct locally issued JWTs. It creates temporary local Auth fixtures and deletes them in finally. It fails when the stack is unavailable; it never silently skips or falls back to mocks. CLI local status supplies test-only privileged credentials in memory. Nothing writes keys to tracked files or prints fixture tokens.

On this checkout the installed dependencies use `.pnpm-store`: append `--store-dir .pnpm-store` to install commands if pnpm reports an unexpected store. Do not change global pnpm configuration. PowerShell may require `pnpm.cmd` due to execution policy.

Copy `apps/web/.env.example` to ignored `apps/web/.env.local`. Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from local CLI output. Next reads the app directory env file. The example contains a loopback URL and a placeholder, no working credential. Unconfigured guest pages and static builds remain usable. A partially configured environment fails with a generic diagnostic; keys are never interpolated into errors. Restart/rebuild Next after changing public env because Next inlines public variables.

Prefer the supported `sb_publishable_...` key. If a local stack exposes only the legacy anon JWT, the same PUBLISHABLE_KEY variable accepts it only for exact localhost/127.0.0.1/[::1] URLs and only with the anon role. This decoding classifies the public configuration and cannot verify identity. Remote legacy JWTs and all sb_secret/service-role keys are rejected. Application infrastructure has no privileged credential variable. Tests obtain admin credentials only from local CLI status.

Local ports: API 54321, PostgreSQL 54322, shadow DB 54320, Studio 54323, test SMTP 54324. Auth email confirmation stays enabled; REST integration fixtures use the local admin API with explicit email confirmation. Storage/realtime/edge runtime/analytics are disabled because 3A does not use them. No application seeds or fake sessions are added.

The recovery run successfully started/reset the local stack, passed pgTAP/REST acceptance and generated schema types. Recheck with the following commands; use the normal TDD wrapper for actual behavioral defects only. A missing daemon or an already-passing acceptance test is not RED:

```sh
pnpm workflow check phase-three-a-identity-foundation
pnpm db:test
pnpm verify
pnpm agents:sync
pnpm agents:check
```

SC-205 has no valid preimplementation RED in the historical evidence. Existing SQL must not be represented as having a completed TDD cycle; real database acceptance is now recorded separately, but the historical workflow gap still requires resolution before ready/archive. Do not fabricate evidence by treating connection errors as RED or removing implemented security to manufacture a failure.

Stop the local stack when finished:

```sh
pnpm db:stop
```

Supported guidance consulted: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [local development](https://supabase.com/docs/guides/local-development), [database testing](https://supabase.com/docs/guides/database/testing).
