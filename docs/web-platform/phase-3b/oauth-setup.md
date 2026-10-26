# Local Auth and Google OAuth setup

Use supported Node and pnpm from README. Docker Desktop must run Linux containers. Run pnpm install --frozen-lockfile --store-dir .pnpm-store and pnpm db:start. The start wrapper suppresses CLI stdout containing local fixture keys. pnpm exec supabase status discovers API and Mailpit URLs; never copy its privileged output into tracked files or shared reports.

For development copy apps/web/.env.example into ignored apps/web/.env.local. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from local status; AUTH_SITE_URL must exactly equal the browser origin, normally http://127.0.0.1:3000. pnpm verify supplies local test values and http://127.0.0.1:4310 only to subprocesses. Restart/rebuild after public env changes.

Confirmations are required in supabase/config.toml. Versioned local signup/recovery HTML templates use RedirectTo and TokenHash. After config changes stop/start the local stack; no reset is required. Mailpit normally listens on http://127.0.0.1:54324; discover its actual MAILPIT_URL through status. Use disposable example.test accounts only. Local mail capture performs no external delivery.

Google setup (manual, credentials are not supplied):

1. Create a Google OAuth web client in your own development project, configure consent screen/test users, and obtain client ID and secret.
2. Google authorized redirect URI is the Supabase provider callback, locally http://127.0.0.1:54321/auth/v1/callback. Authorized JavaScript origin is the chosen application origin when required by Google configuration.
3. Configure the local auth.external.google provider using enabled=true, client_id from an ignored environment variable and secret from an ignored environment variable. Do not commit working credentials. Restart local Supabase. Set the server-only application flag AUTH_GOOGLE_ENABLED=true only after provider configuration is valid, then restart Next. The default false returns a safe localized unavailable state without redirecting to a disabled provider.
4. Supabase's allowed app redirect URLs must include /en/auth/callback and /ru/auth/callback under the trusted app origin, with only supported next paths. Current local allowlist covers the 3000 development and 4310 test loopback origins. The application callback differs from Google's Supabase callback.
5. Test Continue with Google, consent cancellation, verified account/private bootstrap, an existing identity and logout in both locales. The application delegates identity linking to Supabase and does not merge accounts itself.

For a future hosted environment configure its HTTPS AUTH_SITE_URL, exact Supabase redirect allowlist, Google web client authorized origins and https://PROJECT.supabase.co/auth/v1/callback, hosted email templates, production SMTP and provider protection separately. Production SMTP should use a verified sender/domain and suitable quotas. No production project or delivery resource is configured here.

Live Google provider E2E is **unverified** until real credentials and consent are available. Controlled application callback/error tests do not establish a successful Google login.

References consulted: [Supabase SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [passwords](https://supabase.com/docs/guides/auth/passwords), [email templates](https://supabase.com/docs/guides/local-development/customizing-email-templates), [Google provider](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [password policy](https://supabase.com/docs/guides/auth/password-security).
