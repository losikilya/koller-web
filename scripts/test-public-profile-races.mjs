import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'
import {createClient} from '@supabase/supabase-js'
const cli=createRequire(import.meta.url).resolve('supabase/dist/supabase.js')
const status=spawnSync(process.execPath,[cli,'status','-o','json'],{encoding:'utf8',timeout:30000});assert.equal(status.status,0)
const local=JSON.parse(status.stdout);assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(local.API_URL).hostname))
const options={auth:{persistSession:false,autoRefreshToken:false}}
const admin=createClient(local.API_URL,local.SECRET_KEY??local.SERVICE_ROLE_KEY,options),guest=createClient(local.API_URL,local.PUBLISHABLE_KEY??local.ANON_KEY,options)
const email='public-race-'+randomUUID()+'@example.test',password='Local-'+randomUUID()+'!'
const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.equal(created.error,null)
const name='r'+randomUUID().replaceAll('-','').slice(0,18),next='s'+randomUUID().replaceAll('-','').slice(0,18)
async function lookup(handle){const result=await guest.rpc('get_public_profile_by_username',{p_username:handle});assert.equal(result.error,null);for(const row of result.data){assert.equal(row.username,handle);assert.ok(row.display_name.trim());assert.deepEqual(Object.keys(row).sort(),['bio','display_name','user_id','username'])}return result.data}
try{
 const client=createClient(local.API_URL,local.PUBLISHABLE_KEY??local.ANON_KEY,options);assert.equal((await client.auth.signInWithPassword({email,password})).error,null);assert.equal((await client.rpc('ensure_profile')).error,null)
 const initial=await Promise.all([
  client.rpc('complete_own_profile',{p_patch:{username:name,displayName:'Owner'},p_expected_profile_revision:'1',p_expected_privacy_revision:'1'}),
  client.rpc('update_own_profile',{p_patch:{bio:'draft'},p_expected_revision:'1'}),
  lookup(name),lookup(name),
 ])
 assert.equal(initial.slice(0,2).filter(result=>!result.error).length,1);assert.equal(initial.slice(0,2).find(result=>result.error)?.error.code,'40001')
 let row=(await client.from('profiles').select('revision::text,completed_at').single()).data
 if(!row.completed_at)assert.equal((await client.rpc('complete_own_profile',{p_patch:{username:name,displayName:'Owner'},p_expected_profile_revision:row.revision,p_expected_privacy_revision:'1'})).error,null)
 row=(await client.from('profiles').select('revision::text,completed_at').single()).data
 const rename=await Promise.all([client.rpc('update_own_profile',{p_patch:{username:next},p_expected_revision:row.revision}),lookup(name),lookup(next),lookup(name),lookup(next)])
 assert.equal(rename[0].error,null);assert.equal((await lookup(name)).length,0);assert.equal((await lookup(next)).length,1)
 row=(await client.from('profiles').select('revision::text,completed_at').single()).data
 const fields=await Promise.all([client.rpc('update_own_profile',{p_patch:{displayName:'\t\u00a0'},p_expected_revision:row.revision}),client.rpc('update_own_profile',{p_patch:{bio:'valid'},p_expected_revision:row.revision}),lookup(next)])
 assert.ok(['23514','40001'].includes(fields[0].error?.code));assert.equal(fields[1].error,null);assert.equal((await lookup(next)).length,1)
 console.log('PASS: real completion/edit and rename/public-read races expose no partial or invalid presentation')
}finally{assert.equal((await admin.auth.admin.deleteUser(created.data.user.id)).error,null)}
