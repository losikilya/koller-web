import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'

const cli = createRequire(import.meta.url).resolve('supabase/dist/supabase.js')
const result = spawnSync(process.execPath, [cli, 'gen', 'types', 'typescript', '--local', '--schema', 'public'], { encoding: 'utf8' })
if (result.error || result.status !== 0 || !result.stdout.includes('export type Database')) {
  process.stderr.write('Local database type generation failed; existing types were preserved. Start Supabase and apply migrations first.\n')
  process.exitCode = result.status || 1
} else {
  writeFileSync('apps/web/src/shared/supabase/database.types.ts', result.stdout)
}
