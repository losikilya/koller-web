import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
const cli=createRequire(import.meta.url).resolve('supabase/dist/supabase.js')
const result=spawnSync(process.execPath,[cli,'start'],{encoding:'utf8',timeout:300000})
// CLI stdout contains local fixture keys. Do not publish it to CI logs.
if(result.status!==0){process.stderr.write(result.stderr??'');process.exitCode=result.status??1}
else console.log('Local Supabase started; fixture credentials retained only in process memory.')

