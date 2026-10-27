import { expect, vi } from 'vitest'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { saveAvatar } from '@/modules/profile/avatarService'
import type {
  AvatarDependencies,
  AvatarResult,
} from '@/modules/profile/avatarService'
import { ProfileFailure } from '@/modules/profile/profileService'
const feature = await loadFeature('tests/bdd/profile/avatars.feature')
describeFeature(
  feature,
  ({ Scenario }) => {
    Scenario(
      'SC-427 Associate and compensate revisioned avatars',
      ({ Then }) => {
        Then(
          'avatar association preserves the current pointer across conflicts and uncertain outcomes',
          async () => {
            const id = '11111111-1111-4111-8111-111111111111'
            let profile = {
              userId: id,
              username: 'dancer',
              displayName: 'Owner',
              bio: 'Draft',
              avatarUrl: null as string | null,
              completed: true,
              revision: '9007199254740993',
              updatedAt: '2026-10-27T00:00:00Z',
              privacy: {
                visibility: 'public' as const,
                discoverable: false,
                showActivity: false as const,
                revision: '3',
              },
            }
            let mode = 'success'
            const abandon = vi.fn(async () => {})
            const attach = vi.fn(async () => {
              if (mode === 'conflict')
                throw new ProfileFailure('revision_conflict', 412)
              if (mode === 'unknown')
                throw new ProfileFailure('outcome_unknown', 503)
              profile = {
                ...profile,
                avatarUrl: '/api/v1/profile-avatars/' + id,
                revision: '9007199254740994',
              }
            })
            const process = vi.fn(async (bytes: Uint8Array) => bytes)
            const deps = {
              reserve: async () =>
                mode === 'replay'
                  ? ('committed' as const)
                  : ('pending' as const),
              process,
              upload: async () => {},
              ready: async () => {},
              attach,
              abandon,
              read: async () =>
                ({
                  profile,
                  etag: '"profile-' + profile.revision + '"',
                } as AvatarResult),
            } satisfies AvatarDependencies
            const input = {
              id,
              fingerprint: 'a'.repeat(64),
              bytes: new Uint8Array([1, 2]),
              mime: 'image/png',
              revision: '9007199254740993',
            }
            const result = await saveAvatar(deps, input)
            expect(result.profile.avatarUrl).toBe(
              '/api/v1/profile-avatars/' + id
            )
            expect(result.profile.revision).toBe('9007199254740994')
            const current = profile
            mode = 'conflict'
            await expect(saveAvatar(deps, input)).rejects.toMatchObject({
              code: 'revision_conflict',
              status: 412,
            })
            expect(profile).toBe(current)
            expect(abandon).toHaveBeenCalledWith(id)
            abandon.mockClear()
            mode = 'unknown'
            await expect(saveAvatar(deps, input)).rejects.toMatchObject({
              code: 'outcome_unknown',
            })
            expect(profile).toBe(current)
            expect(abandon).not.toHaveBeenCalled()
            mode = 'replay'
            attach.mockClear()
            process.mockClear()
            expect((await saveAvatar(deps, input)).profile).toBe(current)
            expect(attach).not.toHaveBeenCalled()
            expect(process).not.toHaveBeenCalled()
          }
        )
      }
    )
  },
  { includeTags: ['SC-427'] }
)
