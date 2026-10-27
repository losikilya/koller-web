// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { test } from 'vitest'
test('real completion/edit and rename/public-read races preserve safe public projections', () => {
  execFileSync(process.execPath, ['scripts/test-public-profile-races.mjs'], {
    stdio: 'inherit',
    timeout: 90000,
  })
}, 95000)
