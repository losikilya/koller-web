import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { createClient } from '@supabase/supabase-js'
const cli = createRequire(import.meta.url).resolve('supabase/dist/supabase.js')
const status = spawnSync(process.execPath, [cli, 'status', '-o', 'json'], { encoding: 'utf8', timeout: 30000 })
assert.equal(status.status, 0, 'Real local Supabase required')
const local = JSON.parse(status.stdout)
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(local.API_URL).hostname))
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(local.API_URL, local.SECRET_KEY ?? local.SERVICE_ROLE_KEY, options)
const anonymous = createClient(local.API_URL, local.PUBLISHABLE_KEY ?? local.ANON_KEY, options)
const ids = []
async function owner() {
  const email = 'completion-' + randomUUID() + '@example.test', password = 'Local-' + randomUUID() + '!'
  const result = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  assert.equal(result.error, null);ids.push(result.data.user.id)
  const client = createClient(local.API_URL, local.PUBLISHABLE_KEY ?? local.ANON_KEY, options)
  assert.equal((await client.auth.signInWithPassword({ email, password })).error, null)
  assert.equal((await client.rpc('ensure_profile')).error, null)
  return { client, id: result.data.user.id }
}
const handle = () => 'c' + randomUUID().replaceAll('-', '').slice(0,18)
async function revisions(user) {
  const p = await user.client.from('profiles').select('revision::text,completed_at,username,display_name').single()
  const v = await user.client.from('profile_privacy').select('revision::text,visibility,discoverable').single()
  assert.equal(p.error,null);assert.equal(v.error,null)
  return { profile:p.data,privacy:v.data }
}
async function complete(user, username, revision='1', privacy='1', displayName='Танцор') {
  return user.client.rpc('complete_own_profile', { p_patch:{ username, displayName }, p_expected_profile_revision:revision, p_expected_privacy_revision:privacy })
}
try {
  const a=await owner(), b=await owner(), c=await owner()
  const aName=handle()
  assert.equal((await a.client.rpc('update_own_profile',{p_patch:{username:aName,displayName:'Legacy draft'},p_expected_revision:'1'})).error,null)
  const premature=await a.client.rpc('set_own_privacy',{p_visibility:'public',p_discoverable:false,p_expected_revision:'1'})
  assert.equal(premature.error?.code,'23514','An incomplete profile with valid fields must not publish without explicit completion')
  assert.equal((await revisions(a)).profile.completed_at,null)
  assert.equal((await anonymous.rpc('get_public_profile',{p_user_id:a.id})).data.length,0)
  assert.equal((await a.client.rpc('put_own_playground_data',{p_app_key:'practice-timer',p_data_key:'blocked',p_payload:{},p_schema_version:1})).error?.code,'42501')
  assert.equal((await a.client.rpc('delete_own_playground_data',{p_app_key:'practice-timer',p_data_key:'blocked',p_expected_revision:'1'})).error?.code,'42501')
  assert.ok((await anonymous.rpc('complete_own_profile',{p_patch:{username:handle(),displayName:'Owner'},p_expected_profile_revision:'1',p_expected_privacy_revision:'1'})).error)
  for (const patch of [{username:null,displayName:'Owner'},{username:handle(),displayName:'\t\u00a0\u2003'},{username:handle(),displayName:'Owner',userId:a.id}]) {
    assert.ok((await b.client.rpc('complete_own_profile',{p_patch:patch,p_expected_profile_revision:'1',p_expected_privacy_revision:'1'})).error)
    assert.equal((await revisions(b)).profile.completed_at,null)
  }
  const claimed=handle()
  const claims=await Promise.all([complete(b,claimed),complete(c,claimed)])
  assert.equal(claims.filter(x=>!x.error).length,1)
  assert.equal(claims.find(x=>x.error)?.error.code,'23505')
  const winner=claims[0].error?c:b, loser=winner===b?c:b
  const w=await revisions(winner)
  assert.ok(w.profile.completed_at);assert.equal(w.privacy.visibility,'public');assert.equal(w.privacy.discoverable,false)
  for (const caller of [anonymous,a.client,winner.client]) {
    const direct=await caller.rpc('get_public_profile_by_username',{p_username:claimed})
    assert.equal(direct.error,null);assert.equal(direct.data.length,1)
    assert.deepEqual(Object.keys(direct.data[0]).sort(),['bio','display_name','user_id','username'])
    assert.equal((await caller.rpc('get_public_profile_by_username',{p_username:aName})).data.length,0)
  }
  assert.equal((await anonymous.rpc('list_public_profiles')).data.some(row=>row.user_id===winner.id),false)
  assert.equal((await winner.client.rpc('set_own_privacy',{p_visibility:'private',p_discoverable:false,p_expected_revision:w.privacy.revision})).error?.code,'23514')
  for (const patch of [{username:null},{displayName:''},{displayName:'\t\u00a0'}]) assert.equal((await winner.client.rpc('update_own_profile',{p_patch:patch,p_expected_revision:w.profile.revision})).error?.code,'23514')
  assert.equal((await complete(winner,claimed,'1','1')).error?.code,'40001')
  const renamed=handle()
  const race=await Promise.all([
    winner.client.rpc('update_own_profile',{p_patch:{username:renamed},p_expected_revision:w.profile.revision}),
    winner.client.rpc('update_own_profile',{p_patch:{bio:'concurrent'},p_expected_revision:w.profile.revision}),
  ])
  assert.equal(race.filter(x=>!x.error).length,1);assert.equal(race.find(x=>x.error)?.error.code,'40001')
  let current=await revisions(winner)
  if(current.profile.username!==renamed) assert.equal((await winner.client.rpc('update_own_profile',{p_patch:{username:renamed},p_expected_revision:current.profile.revision})).error,null)
  assert.equal((await anonymous.rpc('get_public_profile_by_username',{p_username:claimed})).data.length,0)
  assert.equal((await complete(loser,claimed)).error,null,'old handle immediately reusable after rename')
  assert.equal((await anonymous.rpc('get_public_profile_by_username',{p_username:renamed})).data[0].user_id,winner.id)
  const aRevs=await revisions(a)
  const finish=await Promise.all([complete(a,aName,aRevs.profile.revision,aRevs.privacy.revision),complete(a,aName,aRevs.profile.revision,aRevs.privacy.revision)])
  assert.equal(finish.filter(x=>!x.error).length,1);assert.equal(finish.find(x=>x.error)?.error.code,'40001')
  assert.equal((await a.client.from('profiles').select('user_id').eq('user_id',winner.id)).data.length,0)
  assert.ok((await admin.from('profile_privacy').update({visibility:'private'}).eq('user_id',winner.id)).error,'database path cannot hide completed profile')
  assert.equal((await admin.from('profile_privacy').delete().eq('user_id',winner.id)).error,null)
  assert.equal((await anonymous.rpc('get_public_profile_by_username',{p_username:renamed})).data.length,0,'missing privacy fails closed')
  assert.equal((await winner.client.rpc('ensure_profile')).error,null,'completed bootstrap repairs public privacy only after explicit completion')
  assert.equal((await revisions(winner)).privacy.visibility,'public')
  assert.equal((await admin.from('profiles').update({deletion_requested_at:new Date().toISOString()}).eq('user_id',winner.id)).error,null)
  assert.equal((await anonymous.rpc('get_public_profile_by_username',{p_username:renamed})).data.length,0)
  console.log('PASS: real explicit completion, required fields, ownership, direct bypasses, uniqueness/revision races, rename reuse, public whitelist/missing-privacy/deletion and domain gate')
} finally { for(const id of ids) assert.equal((await admin.auth.admin.deleteUser(id)).error,null) }
