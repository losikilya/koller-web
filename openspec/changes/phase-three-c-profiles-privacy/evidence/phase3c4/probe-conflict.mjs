import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { localAuthEnvironment } from '../../../../../scripts/local-auth-environment.mjs';
const env=localAuthEnvironment(), options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.AUTH_TEST_ADMIN_KEY,options), client=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,options);
const email='conflict-probe-'+randomUUID()+'@example.test', password='Local-'+randomUUID()+'!';
const user=await admin.auth.admin.createUser({email,password,email_confirm:true});
if(user.error||!user.data.user)throw Error('Local fixture failed');
try {
 if((await client.auth.signInWithPassword({email,password})).error)throw Error('Fixture sign-in failed');
 if((await client.rpc('ensure_profile')).error)throw Error('Fixture bootstrap failed');
 if((await client.rpc('update_own_profile',{p_patch:{bio:'First'},p_expected_revision:'1'})).error)throw Error('Fixture initial write failed');
 const result=await client.rpc('update_own_profile',{p_patch:{bio:'Stale'},p_expected_revision:'1'});
 console.log(JSON.stringify({source:'Actual local PostgREST through installed Supabase SDK',httpStatus:result.status,sqlCode:result.error?.code,expectedRevision:'1',currentRevision:'2'}));
 if(result.status!==500||result.error?.code!=='40001')throw Error('Unexpected actual transport');
} finally {if((await admin.auth.admin.deleteUser(user.data.user.id)).error)throw Error('Local fixture cleanup failed');}