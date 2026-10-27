import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const cli = createRequire(import.meta.url).resolve('supabase/dist/supabase.js')
function run(args, capture = false) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit', timeout: 90000 })
  if (result.error || result.status !== 0) throw new Error(`Local Supabase ${args.slice(0, 2).join(' ')} failed (exit ${result.status ?? 'unavailable'}). Inspect command output for the actual cause.`)
  return result.stdout
}

// Never load cloud URLs or application env files. CLI status is the local project's authority.
const status = JSON.parse(run(['status', '-o', 'json'], true))
const url = status.API_URL
assert.ok(url && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Database tests require a loopback Supabase URL')
const publicKey = status.PUBLISHABLE_KEY || status.ANON_KEY
const adminKey = status.SECRET_KEY || status.SERVICE_ROLE_KEY
assert.ok(publicKey && adminKey, 'Local CLI public and admin keys are required only for integration fixtures')
run(['test', 'db', '--local'])

async function request(path, { token, admin = false, method = 'GET', body } = {}) {
  const key = admin ? adminKey : publicKey
  const headers = { apikey: key, 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  else if (admin && key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`
  const response = await fetch(`${url}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000) })
  const text = await response.text()
  return { status: response.status, data: text ? JSON.parse(text) : null }
}
const fixtures = []
async function createUser() {
  const email = `phase3a-${randomUUID()}@example.test`
  const password = `A1!${randomUUID()}`
  const created = await request('/auth/v1/admin/users', { admin: true, method: 'POST', body: { email, password, email_confirm: true, user_metadata: { username: 'admin', visibility: 'public' } } })
  assert.equal(created.status, 200, 'Local integration fixture must be a real Auth user')
  const id = created.data.id
  fixtures.push(id)
  const signedIn = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } })
  assert.equal(signedIn.status, 200, 'Local fixture must receive an actual signed JWT')
  return { id, token: signedIn.data.access_token }
}
async function rpc(name, token, body = {}) {
  return request(`/rest/v1/rpc/${name}`, { token, method: 'POST', body })
}
async function ownerRows(table, user) {
  const response = await request(`/rest/v1/${table}?user_id=eq.${user.id}`, { token: user.token })
  assert.equal(response.status, 200)
  return response.data
}

try {
  const a = await createUser()
  const b = await createUser()
  assert.equal((await rpc('ensure_profile', a.token)).status, 204)
  assert.equal((await rpc('ensure_profile', a.token)).status, 204)
  const bootstrapRace = await Promise.all([rpc('ensure_profile', a.token), rpc('ensure_profile', a.token)])
  assert.ok(bootstrapRace.every((response) => response.status === 204), 'concurrent bootstrap remains idempotent')
  assert.equal((await rpc('ensure_profile', b.token)).status, 204)
  const own = await ownerRows('profiles', a)
  assert.equal(own.length, 1)
  assert.equal(own[0].username, null, 'Auth metadata must never initialize usernames')
  const privacy = (await ownerRows('profile_privacy', a))[0]
  assert.equal(privacy.visibility, 'private')
  assert.equal(privacy.discoverable, false)
  assert.equal(privacy.show_activity, false)
  for (const table of ['profiles', 'profile_privacy', 'user_preferences', 'playground_user_data']) {
    assert.ok([401, 403].includes((await request(`/rest/v1/${table}?select=*`)).status), `anon must not read ${table}`)
    const other = await request(`/rest/v1/${table}?user_id=eq.${a.id}`, { token: b.token })
    assert.equal(other.status, 200)
    assert.deepEqual(other.data, [], `non-owner must not read ${table}`)
    const forgedInsert = await request(`/rest/v1/${table}`, { token: a.token, method: 'POST', body: { user_id: b.id } })
    assert.ok([401, 403].includes(forgedInsert.status), `direct INSERT with a forged owner must be denied for ${table}`)
    const forgedUpdate = await request(`/rest/v1/${table}?user_id=eq.${b.id}`, { token: a.token, method: 'PATCH', body: { user_id: a.id } })
    assert.ok([401, 403].includes(forgedUpdate.status), `direct owner reassignment must be denied for ${table}`)
    const forbiddenDelete = await request(`/rest/v1/${table}?user_id=eq.${b.id}`, { token: a.token, method: 'DELETE' })
    assert.ok([401, 403].includes(forbiddenDelete.status), `direct non-owner DELETE must be denied for ${table}`)
  }
  assert.ok([401, 403].includes((await request(`/rest/v1/profiles?user_id=eq.${a.id}`, { token: a.token, method: 'PATCH', body: { bio: 'bypass' } })).status))
  assert.equal((await rpc('update_own_profile', a.token, { p_patch: { userId: b.id }, p_expected_revision: 1 })).status, 400)
  assert.equal((await rpc('get_public_profile', undefined, { p_user_id: a.id })).data.length, 0)
  const handle = `dancer_${randomUUID().slice(0, 8)}`
  assert.equal((await rpc('update_own_profile', a.token, { p_patch: { displayName: 'Танцор', username: handle }, p_expected_revision: 1 })).status, 204)
  assert.equal((await rpc('update_own_profile', b.token, { p_patch: { username: handle }, p_expected_revision: 1 })).status, 409)
  assert.equal((await rpc('update_own_profile', b.token, { p_patch: { displayName: 'Без имени пользователя' }, p_expected_revision: 1 })).status, 204)
  assert.equal((await rpc('set_own_privacy', b.token, { p_visibility: 'public', p_discoverable: false, p_expected_revision: 1 })).status, 400, 'valid name alone cannot publish an incomplete profile')
  assert.equal((await rpc('get_public_profile', undefined, { p_user_id: b.id })).data.length, 0, 'nullable provisional handle remains nonpublic')
  assert.equal((await rpc('complete_own_profile', a.token, { p_patch: { username: handle, displayName: 'Танцор' }, p_expected_profile_revision: '2', p_expected_privacy_revision: '1' })).status, 204)
  const publicProfile = await rpc('get_public_profile', undefined, { p_user_id: a.id })
  assert.equal(publicProfile.status, 200)
  assert.deepEqual(Object.keys(publicProfile.data[0]).sort(), ['bio', 'display_name', 'user_id', 'username'])
  assert.equal((await rpc('get_public_profile', b.token, { p_user_id: a.id })).data.length, 1)
  assert.equal((await rpc('list_public_profiles', undefined)).data.some((row) => row.user_id === a.id), false)
  assert.equal((await rpc('set_own_privacy', a.token, { p_visibility: 'public', p_discoverable: true, p_expected_revision: 2 })).status, 204)
  assert.equal((await rpc('list_public_profiles', undefined)).data.some((row) => row.user_id === a.id), true)
  assert.deepEqual((await request(`/rest/v1/profiles?user_id=eq.${a.id}`, { token: b.token })).data, [], 'publication never opens base-table access')
  const write = { p_app_key: 'practice-timer', p_data_key: 'default', p_payload: {}, p_schema_version: 1 }
  const inserted = await rpc('put_own_playground_data', a.token, write)
  assert.equal(inserted.status, 200)
  assert.equal((await rpc('put_own_playground_data', a.token, { ...write, p_payload: [] })).status, 400)
  assert.equal((await rpc('put_own_playground_data', a.token, { ...write, p_payload: { value: 'я'.repeat(17000) } })).status, 400)
  assert.equal((await rpc('put_own_playground_data', a.token, { ...write, p_expected_revision: 1 })).data, inserted.data, 'update preserves stable record UUID')
  assert.equal((await rpc('complete_own_profile', b.token, { p_patch: { username: `other_${randomUUID().slice(0,8)}`, displayName: 'Other' }, p_expected_profile_revision: '2', p_expected_privacy_revision: '1' })).status, 204)
  assert.equal((await rpc('delete_own_playground_data', b.token, { p_app_key: 'practice-timer', p_data_key: 'default', p_expected_revision: 2 })).status, 204)
  assert.equal((await ownerRows('playground_user_data', a)).length, 1, 'another owner cannot delete data')
  for (let index = 0; index < 48; index++) assert.equal((await rpc('put_own_playground_data', a.token, { ...write, p_data_key: `quota-${index}` })).status, 200)
  const race = await Promise.all(['race-a', 'race-b'].map((key) => rpc('put_own_playground_data', a.token, { ...write, p_data_key: key })))
  assert.equal(race.filter((response) => response.status === 200).length, 1, 'serialized quota permits exactly one concurrent last slot')
  assert.equal(race.find((response) => response.status !== 200)?.data.code, '54000', 'the losing concurrent write must fail specifically on the enforced quota')
  assert.equal((await ownerRows('playground_user_data', a)).length, 50)
  assert.equal((await rpc('set_own_privacy', a.token, { p_visibility: 'private', p_discoverable: true, p_expected_revision: 3 })).status, 400, 'completed profiles cannot hide')
  assert.equal((await ownerRows('profile_privacy', a))[0].visibility, 'public')
  assert.equal((await rpc('get_public_profile', undefined, { p_user_id: a.id })).data.length, 1)
  assert.equal((await request(`/auth/v1/admin/users/${a.id}`, { admin: true, method: 'DELETE' })).status, 200)
  fixtures.splice(fixtures.indexOf(a.id), 1)
  assert.equal((await rpc('get_public_profile', undefined, { p_user_id: a.id })).data.length, 0, 'Auth deletion revokes public projection')
  for (const table of ['profiles', 'profile_privacy', 'user_preferences', 'playground_user_data']) {
    assert.deepEqual(await ownerRows(table, a), [], `Auth deletion must cascade ${table}, even with an unexpired signed JWT`)
  }
  assert.equal((await ownerRows('profiles', b)).length, 1, 'deleting one account preserves the other account')
  console.log('Real local PostgreSQL, anonymous, owner and non-owner REST assertions: PASS')
} finally {
  for (const id of fixtures) {
    const deleted = await request(`/auth/v1/admin/users/${id}`, { admin: true, method: 'DELETE' })
    assert.equal(deleted.status, 200, 'Local integration Auth fixture cleanup must succeed')
  }
}
