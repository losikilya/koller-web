import { expect, vi } from 'vitest'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { readPublicProfile } from '@/modules/profile/publicProfile'
import { buildPublicMetadata } from '@/app/_infrastructure/publicProfile'
const feature = await loadFeature('tests/bdd/profile/completion.feature')
describeFeature(
  feature,
  ({ Scenario }) => {
    Scenario('SC-423 Safe public projection and metadata', ({ Then }) => {
      Then(
        'public lookup and metadata expose only safe unindexed current-handle content',
        async () => {
          const port = {
            readByUsername: vi.fn().mockResolvedValue({
              user_id: '11111111-1111-4111-8111-111111111111',
              username: 'dancer',
              display_name: 'Танцор',
              bio: '<script>literal</script>',
              email: 'secret',
              completed_at: 'secret',
              avatar_path: 'secret',
            }),
          }
          const profile = await readPublicProfile(port, 'Dancer')
          expect(profile).toEqual({
            userId: '11111111-1111-4111-8111-111111111111',
            username: 'dancer',
            displayName: 'Танцор',
            bio: '<script>literal</script>',
            avatarUrl: null,
          })
          expect(port.readByUsername).toHaveBeenCalledWith('dancer')
          const metadata = buildPublicMetadata(
            'ru',
            profile!,
            'https://example.test',
            { title: 'Profile', unavailable: 'Unavailable' }
          )
          expect(metadata.robots).toEqual({ index: false, follow: false })
          expect(metadata.alternates).toEqual({
            canonical: 'https://example.test/ru/u/dancer',
            languages: {
              en: 'https://example.test/en/u/dancer',
              ru: 'https://example.test/ru/u/dancer',
            },
          })
          port.readByUsername.mockResolvedValue(null)
          expect(await readPublicProfile(port, 'missing')).toBeNull()
          expect(await readPublicProfile(port, 'invalid%20handle')).toBeNull()
          port.readByUsername.mockRejectedValue(new Error('private SQL detail'))
          await expect(readPublicProfile(port, 'dancer')).rejects.toMatchObject(
            { code: 'service_unavailable' }
          )
        }
      )
    })
  },
  { includeTags: ['SC-423'] }
)
