import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { createClient } from '@supabase/supabase-js'
const cli = createRequire(import.meta.url).resolve('supabase/dist/supabase.js')
const status = spawnSync(process.execPath, [cli, 'status', '-o', 'json'], { encoding: 'utf8', timeout: 30000 })
assert.equal(status.status, 0)
const local = JSON.parse(status.stdout)
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(local.API_URL).hostname))
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(local.API_URL, local.SECRET_KEY ?? local.SERVICE_ROLE_KEY, options)
const email = 'publication-race-' + randomUUID() + '@example.test'
const password = 'Local-' + randomUUID() + '!'
const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })
assert.equal(created.error, null)
try {
  const client = createClient(local.API_URL, local.PUBLISHABLE_KEY ?? local.ANON_KEY, options)
  assert.equal((await client.auth.signInWithPassword({ email, password })).error, null)
  assert.equal((await client.rpc('ensure_profile')).error, null)
  assert.equal((await client.rpc('complete_own_profile', { p_patch: { username: 'p'+randomUUID().replaceAll('-','').slice(0,18), displayName: 'Dancer' }, p_expected_profile_revision: '1', p_expected_privacy_revision: '1' })).error, null)
  const results = await Promise.all([
    client.rpc('set_own_privacy', { p_visibility: 'public', p_discoverable: false, p_expected_revision: '2' }),
    client.rpc('update_own_profile', { p_patch: { displayName: '' }, p_expected_revision: '2' }),
  ])
  assert.equal(results.filter(result => !result.error).length, 1)
  assert.equal(results.find(result => result.error)?.error.code, '23514')
  const profile = await client.from('profiles').select('display_name').single()
  const privacy = await client.from('profile_privacy').select('visibility').single()
  assert.equal(profile.error, null); assert.equal(privacy.error, null)
  assert.ok(privacy.data.visibility !== 'public' || profile.data.display_name.trim() !== '', 'publication/name-clear race must preserve public => nonblank')
  console.log('PASS: real concurrent publish/name-clear from an eligible nonblank profile preserves invariant')
} finally { assert.equal((await admin.auth.admin.deleteUser(created.data.user.id)).error, null) }
