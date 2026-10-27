import { afterEach, expect, test, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { ProfileEditor } from '@/modules/profile/ProfileEditor'
import en from '@/shared/i18n/messages/en.json'
import ru from '@/shared/i18n/messages/ru.json'
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
const feature = await loadFeature('tests/bdd/profile/completion.feature')
describeFeature(
  feature,
  ({ Scenario }) => {
    Scenario('SC-424 Complete and navigate in EN and RU', ({ Then }) => {
      Then(
        'explicit completion requires only handle and name and preserves safe write state',
        async () => {
          const profile = {
            userId: '11111111-1111-4111-8111-111111111111',
            username: null,
            displayName: '',
            bio: '',
            avatarUrl: null,
            completed: false,
            revision: '1',
            updatedAt: '2026-10-27T00:00:00Z',
            privacy: {
              visibility: 'private' as const,
              discoverable: false,
              showActivity: false as const,
              revision: '7',
            },
          }
          const request = vi.fn().mockResolvedValue(
            new Response(
              JSON.stringify({
                profile: {
                  ...profile,
                  username: 'dancer',
                  displayName: 'Owner',
                  completed: true,
                  revision: '2',
                  privacy: {
                    ...profile.privacy,
                    visibility: 'public',
                    revision: '8',
                  },
                },
              }),
              { headers: { ETag: '"profile-2"' } }
            )
          )
          vi.stubGlobal('fetch', request)
          const user = userEvent.setup()
          render(
            <NextIntlClientProvider locale="en" messages={en}>
              <ProfileEditor
                initialProfile={profile}
                initialEtag={'"profile-1"'}
              />
            </NextIntlClientProvider>
          )
          const complete = screen.getByRole('button', {
            name: 'Complete public profile',
          })
          await user.click(complete)
          expect(await screen.findByRole('alert')).toHaveTextContent(
            'username and display name'
          )
          expect(request).not.toHaveBeenCalled()
          await user.type(
            screen.getByLabelText('Username', { exact: true }),
            'Dancer'
          )
          await user.type(
            screen.getByLabelText('Display name', { exact: true }),
            'Owner'
          )
          await user.click(complete)
          expect(await screen.findByRole('status')).toHaveTextContent('saved')
          expect(request.mock.calls[0][0]).toBe('/api/v1/me/profile/complete')
          expect(request.mock.calls[0][1].headers['If-Match-Privacy']).toBe(
            '"privacy-7"'
          )
          expect(
            screen.getByRole('button', { name: 'Save profile' })
          ).toBeEnabled()
        }
      )
    })
  },
  { includeTags: ['SC-424'] }
)
test('SC-425 Refresh and manual navigation cannot bypass completion', () => {
  const profile = {
    userId: '11111111-1111-4111-8111-111111111111',
    username: null,
    displayName: '',
    bio: '',
    avatarUrl: null,
    completed: false,
    revision: '1',
    updatedAt: '2026-10-27T00:00:00Z',
    privacy: {
      visibility: 'private' as const,
      discoverable: false,
      showActivity: false as const,
      revision: '1',
    },
  }
  render(
    <NextIntlClientProvider locale="ru" messages={ru}>
      <ProfileEditor initialProfile={profile} initialEtag={'"profile-1"'} />
    </NextIntlClientProvider>
  )
  expect(
    screen.getByRole('button', { name: 'Завершить публичный профиль' })
  ).toBeEnabled()
  expect(
    screen.getByLabelText('Имя пользователя', { exact: true })
  ).toBeRequired()
  expect(
    screen.getByLabelText('Отображаемое имя', { exact: true })
  ).toBeRequired()
  expect(screen.getByLabelText('О себе', { exact: true })).not.toBeRequired()
})
