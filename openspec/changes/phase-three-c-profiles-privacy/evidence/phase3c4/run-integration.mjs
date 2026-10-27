import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { localAuthEnvironment } from '../../../../../scripts/local-auth-environment.mjs';
const env = {...process.env,...localAuthEnvironment()};
const cli = createRequire(process.cwd() + '/package.json').resolve('@playwright/test/cli');
const result = spawnSync(process.execPath,[cli,'test','-c','playwright.bdd.config.ts','--grep','optional avatar follows|Another editor cannot'],{stdio:'inherit',env});
process.exitCode = result.status ?? 1;
