import { createClient } from '@supabase/supabase-js'
import { pathToFileURL } from 'node:url'
import { localAuthEnvironment } from './local-auth-environment.mjs'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
export async function runAvatarCleanup(client) {
  const call = async (name, input) => {
    const result = await client.rpc(name, input)
    if (result.error) throw new Error('Local avatar cleanup unavailable')
    return result.data
  }
  await call('avatar_service_reconcile')
  const jobs = await call('avatar_service_claim_cleanup', { p_limit: 20 })
  if (!Array.isArray(jobs)) throw new Error('Invalid cleanup response')
  const summary = { claimed: jobs.length, deleted: 0, failed: 0 }
  for (const job of jobs) {
    if (
      ![job.id, job.owner_id, job.object_id, job.lease_token].every(
        (value) => typeof value === 'string' && uuid.test(value)
      )
    )
      throw new Error('Invalid cleanup work identity')
    if (
      !(await call('avatar_service_cleanup_authorized', {
        p_id: job.id,
        p_lease: job.lease_token,
      }))
    ) {
      summary.failed++
      continue
    }
    let success = false
    try {
      const result = await client.storage
        .from('profile-avatars')
        .remove([job.owner_id + '/' + job.object_id + '.webp'])
      success = !result.error
    } catch {
      success = false
    }
    const acknowledged = await call('avatar_service_finish_cleanup', {
      p_id: job.id,
      p_lease: job.lease_token,
      p_success: success,
    })
    if (success && acknowledged === true) summary.deleted++
    else summary.failed++
  }
  return summary
}
async function main() {
  if (process.argv.slice(2).some((value) => value !== '--once'))
    throw new Error('Use pnpm avatars:cleanup --once')
  const config = localAuthEnvironment(),
    url = config.NEXT_PUBLIC_SUPABASE_URL
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname))
    throw new Error('Cleanup requires loopback services')
  const client = createClient(url, config.AUTH_TEST_ADMIN_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: 'no-store',
          signal: init?.signal
            ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)])
            : AbortSignal.timeout(15000),
        }),
    },
  })
  const summary = await runAvatarCleanup(client)
  console.log(JSON.stringify(summary))
  if (summary.failed > 0) process.exitCode = 1
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch(() => {
    console.error(
      'Local avatar cleanup failed; rerun after checking local services. No credentials or locators logged.'
    )
    process.exitCode = 1
  })
