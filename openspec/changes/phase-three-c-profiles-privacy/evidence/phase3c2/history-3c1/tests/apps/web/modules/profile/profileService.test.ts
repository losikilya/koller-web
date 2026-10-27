import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect, vi } from 'vitest'
import { profileFormPatchSchema, profileRevisionSchema } from '@dance/contracts'
import { readOwnProfile, saveOwnProfile } from '@/modules/profile'
export const ownerId = '11111111-1111-4111-8111-111111111111'
const record = {
  userId: ownerId,
  username: null,
  displayName: '',
  bio: '',
  revision: '9007199254740993',
  updatedAt: '2026-10-27T00:00:00Z',
  privacy: {
    visibility: 'private' as const,
    discoverable: false,
    showActivity: false as const,
    revision: '7',
  },
}
const feature = await loadFeature('tests/bdd/profile/management.feature')
describeFeature(
  feature,
  ({ Scenario }) => {
    Scenario('SC-401 Read the owner projection', ({ Then }) => {
      Then(
        'only the active owner presentation and lossless revisions are returned',
        async () => {
          const port = {
            read: vi.fn().mockResolvedValue({
              ...record,
              email: 'secret',
              avatar_path: 'secret',
            }),
            write: vi.fn(),
          }
          expect(await readOwnProfile(port, ownerId)).toEqual({
            profile: { ...record, avatarUrl: null },
            etag: '"profile-9007199254740993"',
          })
          expect(port.read).toHaveBeenCalledWith(ownerId)
          port.read.mockResolvedValue(null)
          await expect(readOwnProfile(port, ownerId)).rejects.toMatchObject({
            code: 'bootstrap_incomplete',
          })
          expect(
            profileRevisionSchema.safeParse('9223372036854775808').success
          ).toBe(false)
          expect(profileRevisionSchema.safeParse('01').success).toBe(false)
        }
      )
    })
    Scenario('SC-402 Save canonical presentation', ({ Then }) => {
      Then(
        'normalized patches save and invalid or conflicting changes fail safely',
        async () => {
          const port = {
            read: vi.fn().mockResolvedValue(record),
            write: vi.fn().mockResolvedValue(null),
          }
          const patch = {
            username: ' Dancer_A ',
            displayName: ' Танцор ',
            bio: 'Hello\r\nМир',
          }
          await saveOwnProfile(port, ownerId, patch, '9007199254740993')
          expect(port.write).toHaveBeenCalledWith(
            ownerId,
            { username: 'dancer_a', displayName: 'Танцор', bio: 'Hello\nМир' },
            '9007199254740993'
          )
          expect(profileFormPatchSchema.parse({ username: '' })).toEqual({
            username: null,
          })
          for (const value of [
            {},
            { username: 'Admin' },
            { userId: ownerId },
            { bio: 'я'.repeat(501) },
            { displayName: '😀'.repeat(81) },
          ])
            expect(profileFormPatchSchema.safeParse(value).success).toBe(false)
          expect(
            profileFormPatchSchema.safeParse({
              displayName: '😀'.repeat(80),
              bio: 'я'.repeat(500),
            }).success
          ).toBe(true)
          for (const [dbCode, code] of [
            ['23505', 'username_unavailable'],
            ['40001', 'revision_conflict'],
            ['42501', 'account_unavailable'],
            ['23514', 'validation_failed'],
            ['XX000', 'service_unavailable'],
          ]) {
            port.write.mockResolvedValue({ code: dbCode })
            await expect(
              saveOwnProfile(port, ownerId, { bio: 'draft' }, '1')
            ).rejects.toMatchObject({ code })
          }
          port.write.mockResolvedValue(null)
          port.read.mockRejectedValue(new Error('private database detail'))
          await expect(
            saveOwnProfile(port, ownerId, { bio: 'saved' }, '1')
          ).rejects.toMatchObject({ code: 'outcome_unknown' })
        }
      )
    })
  },
  { includeTags: ['SC-401', 'SC-402'] }
)
