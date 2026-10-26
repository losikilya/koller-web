import { expect, vi } from 'vitest'
import { ensureProfile } from '@/modules/identity'

export async function assertVerifiedInitialization() {
  const rpc = vi.fn().mockResolvedValue({ error: null })
  const getUser = vi
    .fn()
    .mockResolvedValue({ data: { user: null }, error: null })
  await expect(ensureProfile({ auth: { getUser }, rpc })).rejects.toThrow(
    'Unauthenticated'
  )
  expect(rpc).not.toHaveBeenCalled()
  getUser.mockResolvedValue({
    data: { user: { id: 'verified-user' } },
    error: null,
  })
  expect(await ensureProfile({ auth: { getUser }, rpc })).toBe('verified-user')
  expect(rpc).toHaveBeenCalledWith('ensure_profile')
  rpc.mockResolvedValueOnce({ error: { message: 'database offline' } })
  await expect(ensureProfile({ auth: { getUser }, rpc })).rejects.toThrow(
    'Profile initialization failed; retry is safe'
  )
  expect(await ensureProfile({ auth: { getUser }, rpc })).toBe('verified-user')
  getUser.mockResolvedValue({
    data: { user: { id: 'unverified' } },
    error: { message: 'invalid JWT' },
  })
  rpc.mockClear()
  await expect(ensureProfile({ auth: { getUser }, rpc })).rejects.toThrow(
    'Unauthenticated'
  )
  expect(rpc).not.toHaveBeenCalled()
}
