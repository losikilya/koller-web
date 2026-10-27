import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
export function localAuthEnvironment() {
  const cli = createRequire(import.meta.url).resolve(
    'supabase/dist/supabase.js'
  )
  const result = spawnSync(process.execPath, [cli, 'status', '-o', 'json'], {
    encoding: 'utf8',
    timeout: 30000,
  })
  if (result.status !== 0)
    throw new Error('Local Supabase must be running; use pnpm db:start')
  const status = JSON.parse(result.stdout)
  for (const value of [
    status.API_URL,
    status.MAILPIT_URL ?? status.INBUCKET_URL,
  ]) {
    if (
      !value ||
      !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(value).hostname)
    )
      throw new Error('Auth acceptance requires loopback services')
  }
  return {
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      status.PUBLISHABLE_KEY ?? status.ANON_KEY,
    AUTH_SITE_URL: 'http://127.0.0.1:4310',
    AUTH_GOOGLE_ENABLED: 'false',
    LOCAL_AVATAR_SERVICE_KEY: status.SECRET_KEY ?? status.SERVICE_ROLE_KEY,
    AUTH_TEST_MAILPIT_URL: status.MAILPIT_URL ?? status.INBUCKET_URL,
    AUTH_TEST_ADMIN_KEY: status.SECRET_KEY ?? status.SERVICE_ROLE_KEY,
    AUTH_TEST_JWT_SECRET: status.JWT_SECRET,
  }
}
