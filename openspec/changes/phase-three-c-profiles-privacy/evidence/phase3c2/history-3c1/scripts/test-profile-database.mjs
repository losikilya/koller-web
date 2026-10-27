import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { createClient } from '@supabase/supabase-js'

const cli = createRequire(import.meta.url).resolve('supabase/dist/supabase.js')
const status = spawnSync(process.execPath, [cli, 'status', '-o', 'json'], { encoding: 'utf8', timeout: 30000 })
assert.equal(status.status, 0, 'Real local Supabase is required')
const local = JSON.parse(status.stdout)
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(local.API_URL).hostname))
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(local.API_URL, local.SECRET_KEY ?? local.SERVICE_ROLE_KEY, options)
const ids = []
async function owner() {
  const email = `profile-${randomUUID()}@example.test`
  const password = `Local-${randomUUID()}!`
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  assert.equal(created.error, null)
  ids.push(created.data.user.id)
  const client = createClient(local.API_URL, local.PUBLISHABLE_KEY ?? local.ANON_KEY, options)
  assert.equal((await client.auth.signInWithPassword({ email, password })).error, null)
  assert.equal((await client.rpc('ensure_profile')).error, null)
  return { client, id: created.data.user.id }
}
try {
  const a = await owner(), b = await owner()
  const name = 'p' + randomUUID().replaceAll('-', '').slice(0, 20)
  const claims = await Promise.all([a, b].map(({ client }) => client.rpc('update_own_profile', { p_patch: { username: name }, p_expected_revision: '1' })))
  assert.equal(claims.filter((r) => !r.error).length, 1)
  assert.equal(claims.find((r) => r.error)?.error.code, '23505')
  const winner = claims[0].error ? b : a
  const loser = winner === a ? b : a
  const edits = await Promise.all(['one', 'two'].map((bio) => winner.client.rpc('update_own_profile', { p_patch: { bio }, p_expected_revision: '2' })))
  assert.equal(edits.filter((r) => !r.error).length, 1)
  assert.equal(edits.find((r) => r.error)?.error.code, '40001')
  assert.equal((await winner.client.rpc('update_own_profile', { p_patch: { username: null }, p_expected_revision: '3' })).error, null)
  assert.equal((await loser.client.rpc('update_own_profile', { p_patch: { username: name }, p_expected_revision: '1' })).error, null, 'old handle is immediately reusable')
  assert.equal((await loser.client.from('profiles').select('user_id').eq('user_id', winner.id)).data.length, 0)
  assert.equal((await loser.client.rpc('update_own_profile', { p_patch: { userId: winner.id }, p_expected_revision: '2' })).error.code, '22023')
  const publication = await Promise.all([
    winner.client.rpc('set_own_privacy', { p_visibility: 'public', p_discoverable: false, p_expected_revision: '1' }),
    winner.client.rpc('update_own_profile', { p_patch: { displayName: '' }, p_expected_revision: '4' }),
  ])
  assert.ok(publication[0].error, 'blank profile cannot publish under a concurrent edit')
  const anonymous = createClient(local.API_URL, local.PUBLISHABLE_KEY ?? local.ANON_KEY, options)
  assert.ok((await anonymous.from('profiles').select('user_id')).error)
  assert.ok((await anonymous.rpc('update_own_profile', { p_patch: { bio: 'forged' }, p_expected_revision: '1' })).error)
  assert.equal((await winner.client.from('profile_privacy').select('visibility,discoverable,revision::text').single()).data.revision, '1')
  // Fixture-only session setting avoids changing schema/triggers or resetting the database.
  assert.match(winner.id, /^[a-f0-9-]{36}$/)
  const setRevision = spawnSync('docker', ['exec', 'supabase_db_dance-platform', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', `begin; set local session_replication_role=replica; update public.profiles set revision=9007199254740993 where user_id='${winner.id}'; commit;`], { encoding: 'utf8', timeout: 30000 })
  assert.equal(setRevision.status, 0, 'fixture revision setup must succeed')
  const row = await winner.client.from('profiles').select('revision::text').single()
  assert.equal(row.data.revision, '9007199254740993')
  assert.equal((await winner.client.rpc('update_own_profile', { p_patch: { bio: 'large revision' }, p_expected_revision: row.data.revision })).error, null)
  assert.equal((await winner.client.from('profiles').select('revision::text').single()).data.revision, '9007199254740994')
  assert.equal((await winner.client.rpc('update_own_profile', { p_patch: { bio: 'stale' }, p_expected_revision: row.data.revision })).error.code, '40001')
  console.log('PASS: real owner/anon/RLS, simultaneous claims/edits, immediate reuse, publication guard and lossless bigint RPC')
} finally {
  for (const id of ids) assert.equal((await admin.auth.admin.deleteUser(id)).error, null)
}
