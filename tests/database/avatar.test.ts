// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { test, vi } from 'vitest'
vi.setConfig({ testTimeout: 180000 })
test('real local avatar Storage/database/worker acceptance', () => {
  execFileSync(process.execPath, ['scripts/test-avatar-storage.mjs'], {
    stdio: 'inherit',
    timeout: 175000,
  })
})
