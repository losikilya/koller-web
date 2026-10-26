import { spawnSync } from 'node:child_process'
import { localAuthEnvironment } from './local-auth-environment.mjs'
const mode=process.argv[2]
const commands={verify:['run','verify:checks'],integration:['exec','vitest','run','tests/database/authentication.test.ts'],e2e:['run','test:e2e']}
if(!commands[mode])throw new Error('Use verify, integration or e2e')
if(!process.env.npm_execpath)throw new Error('Run through pnpm scripts')
const env={...process.env,...localAuthEnvironment()}
// Fixture admin credentials belong only to integration/browser test subprocesses.
if(mode==='verify'){delete env.AUTH_TEST_ADMIN_KEY;delete env.AUTH_TEST_JWT_SECRET}
const result=spawnSync(process.execPath,[process.env.npm_execpath,...commands[mode]],{stdio:'inherit',env})
if(result.error)throw new Error('Local auth runner failed to start')
process.exitCode=result.status??1

