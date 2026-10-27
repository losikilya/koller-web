import { expect, test, vi } from 'vitest'
import { saveOwnProfile } from '@/modules/profile'
test('a lost RPC response requires reload rather than replaying an uncertain write', async () => {
  const repository = {
    read: vi.fn(),
    write: vi
      .fn()
      .mockRejectedValue(new Error('connection lost after request')),
  }
  await expect(
    saveOwnProfile(
      repository,
      '11111111-1111-4111-8111-111111111111',
      { bio: 'draft' },
      '1'
    )
  ).rejects.toMatchObject({ code: 'outcome_unknown', status: 503 })
  expect(repository.write).toHaveBeenCalledTimes(1)
})
