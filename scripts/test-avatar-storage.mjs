import assert from 'node:assert/strict'
import { randomUUID, createHash } from 'node:crypto'
import { spawnSync, execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { localAuthEnvironment } from './local-auth-environment.mjs'
import { runAvatarCleanup } from './avatar-cleanup-worker.mjs'
import { avatarImage } from '../tests/helpers/avatarFixtures.mjs'
const env = localAuthEnvironment(),
  url = env.NEXT_PUBLIC_SUPABASE_URL
assert.ok(
  ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname),
  'Loopback fixtures only'
)
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const service = createClient(url, env.AUTH_TEST_ADMIN_KEY, options),
  anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options)
const bucket = service.storage.from('profile-avatars'),
  ids = [],
  operations = []
const project = readFileSync('supabase/config.toml', 'utf8').match(
  /^project_id\s*=\s*"([A-Za-z0-9_-]+)"/m
)?.[1]
const db = execFileSync('docker', ['ps', '--format', '{{.Names}}'], {
  encoding: 'utf8',
})
  .trim()
  .split(/\r?\n/)
  .find((name) => name === 'supabase_db_' + project)
assert.ok(db, 'Current local DB required')
function sql(text) {
  const r = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      db,
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-At',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { input: text, encoding: 'utf8' }
  )
  if (r.status !== 0) {
    const message =
      r.stderr.split(/\r?\n/).find((line) => line.startsWith('ERROR:')) ??
      'unknown local fixture error'
    throw new Error(
      'Fixture SQL: ' +
        message.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/gi, '[fixture UUID]')
    )
  }
  return r.stdout.trim()
}
async function ok(client, name, input) {
  const r = await client.rpc(name, input)
  assert.equal(r.error?.code ?? null, null, 'RPC ' + name)
  return r.data
}
async function denied(client, name, input, code = '42501') {
  const r = await client.rpc(name, input)
  assert.equal(r.error?.code, code, 'Denied ' + name)
}
async function fixture() {
  const email = 'avatar-' + randomUUID() + '@example.test',
    password = 'Local-' + randomUUID() + '!'
  const r = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  assert.equal(!!r.error, false, 'Fixture account')
  const id = r.data.user.id
  ids.push(id)
  const client = createClient(
    url,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    options
  )
  assert.equal(
    !!(await client.auth.signInWithPassword({ email, password })).error,
    false,
    'Fixture login'
  )
  await ok(client, 'ensure_profile')
  return { id, client }
}
const bytes = await avatarImage(8, 8, 'webp'),
  fingerprint = createHash('sha256').update(bytes).digest('hex')
const path = (owner, object) => owner + '/' + object + '.webp'
const row = (owner) =>
  JSON.parse(
    sql(
      `select row_to_json(p) from (select avatar_id,revision::text from public.profiles where user_id='${owner.id}') p;`
    )
  )
const operation = (id) =>
  JSON.parse(
    sql(
      `select row_to_json(o) from (select state,attempts,deleted_at,lease_token,lease_until,object_id from app_private.avatar_operations where id='${id}') o;`
    ) || 'null'
  )
async function reserve(owner, id = randomUUID()) {
  await ok(owner.client, 'begin_own_avatar_upload', {
    p_id: id,
    p_fingerprint: fingerprint,
  })
  operations.push({ owner: owner.id, id })
  return id
}
async function prepared(owner, id = undefined) {
  id = await reserve(owner, id)
  const object = await ok(service, 'avatar_service_upload_object', {
    p_owner: owner.id,
    p_id: id,
  })
  assert.equal(
    !!(
      await bucket.upload(path(owner.id, object), bytes, {
        contentType: 'image/webp',
        upsert: false,
      })
    ).error,
    false,
    'Trusted immutable Storage upload'
  )
  await ok(service, 'avatar_service_ready', { p_owner: owner.id, p_id: id })
  return { id, object }
}
async function abandon(owner, id) {
  await ok(service, 'avatar_service_abandon', { p_owner: owner.id, p_id: id })
}
async function workerRestart() {
  const r = spawnSync(
    process.execPath,
    ['scripts/avatar-cleanup-worker.mjs', '--once'],
    { encoding: 'utf8', timeout: 60000 }
  )
  assert.equal(r.status, 0, 'Authenticated local worker restart')
  assert.ok(
    Number.isInteger(JSON.parse(r.stdout).claimed),
    'Worker prints counts only'
  )
}
try {
  const [a, b, c, d] = await Promise.all([
    fixture(),
    fixture(),
    fixture(),
    fixture(),
  ])
  const first = await prepared(a)
  assert.equal(
    (await bucket.download(path(a.id, first.object))).error,
    null,
    'Stored fixture exists'
  )
  for (const caller of [anon, a.client, b.client]) {
    assert.ok(
      (
        await caller.storage
          .from('profile-avatars')
          .download(path(a.id, first.object))
      ).error,
      'Raw reads denied'
    )
    assert.ok(
      (
        await caller.storage
          .from('profile-avatars')
          .createSignedUrl(path(a.id, first.object), 60)
      ).error,
      'Signed URLs denied'
    )
    assert.ok(
      (
        await caller.storage
          .from('profile-avatars')
          .upload(path(a.id, randomUUID()), bytes, {
            contentType: 'image/webp',
          })
      ).error,
      'Raw writes denied'
    )
    assert.ok(
      (
        await caller.storage
          .from('profile-avatars')
          .update(path(a.id, first.object), bytes, {
            contentType: 'image/webp',
          })
      ).error,
      'Raw replacement denied'
    )
    await caller.storage
      .from('profile-avatars')
      .remove([path(a.id, first.object)])
    assert.equal(
      !!(await bucket.download(path(a.id, first.object))).error,
      false,
      'Raw delete cannot remove object'
    )
  }
  assert.equal(
    (
      await fetch(
        url +
          '/storage/v1/object/public/profile-avatars/' +
          path(a.id, first.object)
      )
    ).ok,
    false,
    'Private bucket has no public URL'
  )
  await denied(a.client, 'avatar_service_ready', {
    p_owner: a.id,
    p_id: first.id,
  })
  await denied(anon, 'attach_own_avatar', {
    p_id: first.id,
    p_expected_revision: '1',
  })
  await denied(b.client, 'attach_own_avatar', {
    p_id: first.id,
    p_expected_revision: '1',
  })
  await ok(a.client, 'attach_own_avatar', {
    p_id: first.id,
    p_expected_revision: '1',
  })
  assert.equal(
    row(a).avatar_id === first.object,
    true,
    'Pointer uses server object UUID'
  )
  assert.notEqual(
    first.object,
    first.id,
    'Client operation is not image identity'
  )
  assert.equal(
    (await ok(service, 'avatar_service_resolve', { p_id: first.object }))
      .length,
    0,
    'Incomplete avatar is not public'
  )
  assert.equal(
    (
      await ok(service, 'avatar_service_resolve', {
        p_id: first.object,
        p_viewer: a.id,
      })
    ).length,
    1,
    'Verified owner can view incomplete avatar'
  )
  assert.equal(
    (
      await ok(service, 'avatar_service_resolve', {
        p_id: first.object,
        p_viewer: b.id,
      })
    ).length,
    0,
    'Other account has no preview'
  )
  await ok(a.client, 'complete_own_profile', {
    p_patch: {
      username: 'a' + randomUUID().replaceAll('-', '').slice(0, 18),
      displayName: 'Avatar owner',
    },
    p_expected_profile_revision: row(a).revision,
    p_expected_privacy_revision: '1',
  })
  assert.equal(
    await ok(anon, 'get_public_avatar_id', { p_user_id: a.id }),
    first.object,
    'Eligible opaque ID is public'
  )
  const publicRow = await ok(anon, 'get_public_profile', { p_user_id: a.id })
  assert.deepEqual(
    Object.keys(publicRow[0]).sort(),
    ['bio', 'display_name', 'user_id', 'username'],
    'Four-column whitelist unchanged'
  )
  const next = await prepared(a),
    revision = row(a).revision,
    removal = randomUUID()
  const race = await Promise.all([
    a.client.rpc('attach_own_avatar', {
      p_id: next.id,
      p_expected_revision: revision,
    }),
    a.client.rpc('remove_own_avatar', {
      p_id: removal,
      p_expected_revision: revision,
    }),
  ])
  assert.equal(
    race.filter((r) => !r.error).length,
    1,
    'Concurrent replace/remove has one winner'
  )
  assert.equal(
    race.find((r) => r.error).error.code,
    '40001',
    'Loser is specifically revision conflict'
  )
  if (race[0].error) await abandon(a, next.id)
  else {
    const removeAgain = randomUUID()
    await ok(a.client, 'remove_own_avatar', {
      p_id: removeAgain,
      p_expected_revision: row(a).revision,
    })
  }
  const latest = row(a)
  const winner = race[0].error ? 'remove_own_avatar' : 'attach_own_avatar',
    winnerId = race[0].error ? removal : next.id
  await ok(a.client, winner, { p_id: winnerId, p_expected_revision: revision })
  assert.deepEqual(row(a), latest, 'Replay never restores old object')
  assert.equal(
    (await ok(service, 'avatar_service_resolve', { p_id: first.object }))
      .length,
    0,
    'Stale URL revoked before physical cleanup'
  )
  assert.equal(
    !!(await bucket.download(path(a.id, first.object))).error,
    false,
    'Old bytes may await durable cleanup'
  )

  const pending = []
  for (let i = 0; i < 3; i++) pending.push(await reserve(b))
  await denied(
    b.client,
    'begin_own_avatar_upload',
    { p_id: randomUUID(), p_fingerprint: fingerprint },
    '54000'
  )
  await ok(b.client, 'begin_own_avatar_upload', {
    p_id: pending[0],
    p_fingerprint: fingerprint,
  })
  assert.equal(
    Number(
      sql(
        `select count(*) from app_private.avatar_operations where owner_id='${b.id}';`
      )
    ),
    3,
    'Replay consumes no new attempt'
  )
  await denied(b.client, 'begin_own_avatar_upload', {
    p_id: pending[0],
    p_fingerprint: 'b'.repeat(64),
  })
  await abandon(b, pending[0])
  const fourth = await reserve(b)
  await abandon(b, fourth)
  await abandon(b, pending[1])
  const fifth = await reserve(b)
  await abandon(b, fifth)
  await denied(
    b.client,
    'begin_own_avatar_upload',
    { p_id: randomUUID(), p_fingerprint: fingerprint },
    '54000'
  )
  await abandon(b, pending[2])
  sql(
    `update app_private.avatar_operations set reserved_at=clock_timestamp()-interval '2 minutes' where owner_id='${b.id}';`
  )
  for (let i = 0; i < 15; i++) {
    const id = await reserve(b)
    await abandon(b, id)
    sql(
      `update app_private.avatar_operations set reserved_at=clock_timestamp()-interval '2 minutes' where owner_id='${b.id}';`
    )
  }
  await denied(
    b.client,
    'begin_own_avatar_upload',
    { p_id: randomUUID(), p_fingerprint: fingerprint },
    '54000'
  )

  await denied(
    b.client,
    'remove_own_avatar',
    { p_id: randomUUID(), p_expected_revision: row(b).revision },
    '54000'
  )
  const e = await fixture(),
    left = await prepared(e),
    right = await prepared(e)
  const attaches = await Promise.all([
    e.client.rpc('attach_own_avatar', {
      p_id: left.id,
      p_expected_revision: '1',
    }),
    e.client.rpc('attach_own_avatar', {
      p_id: right.id,
      p_expected_revision: '1',
    }),
  ])
  assert.equal(
    attaches.filter((result) => !result.error).length,
    1,
    'Concurrent attach has one winner'
  )
  assert.equal(attaches.find((result) => result.error).error.code, '40001')
  await abandon(e, attaches[0].error ? left.id : right.id)

  const crashId = await reserve(c),
    crashObject = await ok(service, 'avatar_service_upload_object', {
      p_owner: c.id,
      p_id: crashId,
    })
  assert.equal(
    !!(
      await bucket.upload(path(c.id, crashObject), bytes, {
        contentType: 'image/webp',
      })
    ).error,
    false
  )
  sql(
    `update app_private.avatar_operations set created_at=clock_timestamp()-interval '23 hours 59 minutes' where id='${crashId}';`
  )
  await workerRestart()
  assert.equal(
    operation(crashId).state,
    'pending',
    'No premature one-hour expiry'
  )
  sql(
    `update app_private.avatar_operations set created_at=clock_timestamp()-interval '24 hours' where id='${crashId}';`
  )
  await workerRestart()
  assert.equal(
    operation(crashId).state,
    'deleted',
    '24-hour crash orphan reclaimed after restart'
  )
  await denied(
    service,
    'avatar_service_ready',
    { p_owner: c.id, p_id: crashId },
    '22023'
  )
  await denied(
    c.client,
    'attach_own_avatar',
    { p_id: crashId, p_expected_revision: row(c).revision },
    '22023'
  )
  assert.equal(
    !!(
      await bucket.upload(path(c.id, crashObject), bytes, {
        contentType: 'image/webp',
      })
    ).error,
    false,
    'Simulated late provider write'
  )
  await workerRestart()
  assert.equal(
    operation(crashId).state,
    'deleted',
    'Late object re-deleted without resurrection'
  )
  assert.ok((await bucket.download(path(c.id, crashObject))).error)
  sql(
    `update app_private.avatar_operations set deleted_at=clock_timestamp()-interval '6 days 23 hours 59 minutes' where id='${crashId}';`
  )
  await ok(service, 'avatar_service_reconcile')
  assert.equal(
    operation(crashId).state,
    'deleted',
    'Keep successful cleanup for seven days'
  )
  sql(
    `update app_private.avatar_operations set deleted_at=clock_timestamp()-interval '7 days' where id='${crashId}';`
  )
  await ok(service, 'avatar_service_reconcile')
  assert.equal(
    operation(crashId),
    null,
    'Prune only confirmed successful old cleanup'
  )
  const fresh = await prepared(c, crashId)
  assert.notEqual(
    fresh.object,
    crashObject,
    'Operation reuse never revives image URL'
  )
  await ok(c.client, 'attach_own_avatar', {
    p_id: fresh.id,
    p_expected_revision: row(c).revision,
  })
  assert.equal(
    (
      await ok(service, 'avatar_service_resolve', {
        p_id: crashObject,
        p_viewer: c.id,
      })
    ).length,
    0
  )

  const large = await prepared(d)
  sql(
    `begin;set local session_replication_role=replica;update public.profiles set revision=9007199254740993 where user_id='${d.id}';commit;`
  )
  await ok(d.client, 'attach_own_avatar', {
    p_id: large.id,
    p_expected_revision: '9007199254740993',
  })
  assert.equal(
    row(d).revision,
    '9007199254740994',
    'Avatar CAS preserves bigint exactly'
  )
  const forgedLease = randomUUID()
  sql(
    `update app_private.avatar_operations set state='cleanup',lease_token='${forgedLease}',lease_until=clock_timestamp()+interval '2 minutes' where id='${large.id}';`
  )
  assert.equal(
    await ok(service, 'avatar_service_cleanup_authorized', {
      p_id: large.id,
      p_lease: forgedLease,
    }),
    false,
    'Even a stale queued job cannot delete current object'
  )
  assert.equal(
    await ok(service, 'avatar_service_finish_cleanup', {
      p_id: large.id,
      p_lease: forgedLease,
      p_success: true,
    }),
    false,
    'Current pointer defeats stale acknowledgment'
  )
  sql(
    `update app_private.avatar_operations set state='attached',lease_token=null,lease_until=null where id='${large.id}';`
  )
  await denied(
    d.client,
    'remove_own_avatar',
    { p_id: randomUUID(), p_expected_revision: '9007199254740993' },
    '40001'
  )
  await ok(d.client, 'remove_own_avatar', {
    p_id: randomUUID(),
    p_expected_revision: '9007199254740994',
  })
  const claims = await Promise.all([
    ok(service, 'avatar_service_claim_cleanup', { p_limit: 50 }),
    ok(service, 'avatar_service_claim_cleanup', { p_limit: 50 }),
  ])
  assert.equal(
    claims[0].some((firstJob) =>
      claims[1].some((secondJob) => secondJob.id === firstJob.id)
    ),
    false,
    'Concurrent workers receive disjoint fenced jobs'
  )
  const job = claims.flat().find((value) => value.id === large.id)
  assert.ok(job, 'Removed image is durably queued')
  await ok(service, 'avatar_service_finish_cleanup', {
    p_id: large.id,
    p_lease: job.lease_token,
    p_success: false,
  })
  assert.ok(
    operation(large.id).attempts > 0,
    'Failed deletion persists with retries'
  )
  sql(
    `update app_private.avatar_operations set created_at=clock_timestamp()-interval '30 days',next_attempt_at=clock_timestamp()-interval '1 second' where id='${large.id}';`
  )
  await ok(service, 'avatar_service_reconcile')
  assert.equal(
    operation(large.id).state,
    'cleanup',
    'Failure never expires after seven days'
  )
  assert.equal(
    await ok(service, 'avatar_service_finish_cleanup', {
      p_id: large.id,
      p_lease: null,
      p_success: true,
    }),
    false,
    'Null lease cannot acknowledge'
  )
  assert.equal(
    await ok(service, 'avatar_service_finish_cleanup', {
      p_id: large.id,
      p_lease: job.lease_token,
      p_success: true,
    }),
    false,
    'Released old lease cannot acknowledge'
  )
  const again = (
    await ok(service, 'avatar_service_claim_cleanup', { p_limit: 50 })
  ).find((value) => value.id === large.id)
  assert.ok(again)
  assert.equal(
    await ok(service, 'avatar_service_finish_cleanup', {
      p_id: large.id,
      p_lease: again.lease_token,
      p_success: true,
    }),
    false,
    'Existing bytes cannot be reported as confirmed deletion'
  )
  sql(
    `update app_private.avatar_operations set next_attempt_at=clock_timestamp()-interval '1 second',lease_token=null,lease_until=null where id='${large.id}';`
  )
  await workerRestart()
  assert.equal(
    operation(large.id).state,
    'deleted',
    'Fresh worker resolves retained failed work'
  )

  const late = randomUUID(),
    orphanOwner = randomUUID()
  assert.equal(
    !!(
      await bucket.upload(path(orphanOwner, late), bytes, {
        contentType: 'image/webp',
      })
    ).error,
    false
  )
  await workerRestart()
  assert.ok(
    (await bucket.download(path(orphanOwner, late))).error,
    'Unregistered generated orphan reconciled through Storage API'
  )
  console.log(
    'PASS: real private Storage/raw grants, ownership, completion eligibility, immutable IDs, revision races/bigints, DB rate limits, 24h/7d cleanup, fencing, crash/restart and orphan reconciliation'
  )
} finally {
  for (const { owner, id } of operations)
    await service.rpc('avatar_service_abandon', { p_owner: owner, p_id: id })
  for (const id of ids)
    assert.equal(
      !!(await service.auth.admin.deleteUser(id)).error,
      false,
      'Fixture cleanup only'
    )
  if (ids.length)
    sql(
      `update app_private.avatar_operations set next_attempt_at=clock_timestamp()-interval '1 second',lease_token=null,lease_until=null where owner_id in (${ids
        .map((id) => "'" + id + "'")
        .join(',')}) and state='cleanup';`
    )
  for (let i = 0; i < 4; i++) await runAvatarCleanup(service)
}
