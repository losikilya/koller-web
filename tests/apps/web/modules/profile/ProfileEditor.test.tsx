import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { ProfileEditor } from '@/modules/profile/ProfileEditor'
import en from '@/shared/i18n/messages/en.json'
import ru from '@/shared/i18n/messages/ru.json'
const profile = {
  userId: '11111111-1111-4111-8111-111111111111',
  username: 'dancer',
  displayName: 'Owner',
  bio: 'original',
  avatarUrl: null,
  completed: true,
  revision: '1',
  updatedAt: '2026-10-27T00:00:00Z',
  privacy: {
    visibility: 'public' as const,
    discoverable: false,
    showActivity: false as const,
    revision: '1',
  },
}
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
const feature = await loadFeature('tests/bdd/profile/management.feature')
describeFeature(
  feature,
  ({ Scenario }) => {
    Scenario('SC-418 Preserve drafts and reload deliberately', ({ Then }) => {
      Then(
        'failed edits retain drafts and reload is explicit with owned cancellation',
        async () => {
          const fetcher = vi
            .fn()
            .mockResolvedValueOnce(
              new Response(
                JSON.stringify({ error: { code: 'revision_conflict' } }),
                {
                  status: 412,
                }
              )
            )
            .mockResolvedValueOnce(
              new Response(
                JSON.stringify({
                  profile: { ...profile, bio: 'remote', revision: '2' },
                }),
                { headers: { ETag: '"profile-2"' } }
              )
            )
          vi.stubGlobal('fetch', fetcher)
          const user = userEvent.setup()
          const view = render(
            <NextIntlClientProvider locale="en" messages={en}>
              <ProfileEditor
                initialProfile={profile}
                initialEtag={'"profile-1"'}
              />
            </NextIntlClientProvider>
          )
          await user.clear(screen.getByLabelText('Bio'))
          await user.type(screen.getByLabelText('Bio'), 'my draft')
          await user.click(screen.getByRole('button', { name: 'Save profile' }))
          expect(await screen.findByRole('alert')).toHaveTextContent('changed')
          expect(screen.getByLabelText('Bio')).toHaveValue('my draft')
          expect(fetcher).toHaveBeenCalledTimes(1)
          await user.click(
            screen.getByRole('button', { name: 'Reload current profile' })
          )
          expect(screen.getByLabelText('Bio')).toHaveValue('remote')
          expect(fetcher.mock.calls[0][1].headers['If-Match']).toBe(
            '"profile-1"'
          )
          let signal: AbortSignal | undefined
          fetcher.mockImplementation((_url: string, init: RequestInit) => {
            signal = init.signal as AbortSignal
            return new Promise(() => {})
          })
          await user.click(screen.getByRole('button', { name: 'Save profile' }))
          await user.click(screen.getByRole('button', { name: 'Save profile' }))
          expect(fetcher).toHaveBeenCalledTimes(3)
          view.unmount()
          expect(signal?.aborted).toBe(true)
        }
      )
    })
  },
  { includeTags: ['SC-418'] }
)
test('SC-419 Use localized owner routes', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          profile: { ...profile, displayName: 'Танцор', revision: '2' },
        }),
        { headers: { ETag: '"profile-2"' } }
      )
    )
  )
  const user = userEvent.setup()
  render(
    <NextIntlClientProvider locale="ru" messages={ru}>
      <ProfileEditor initialProfile={profile} initialEtag={'"profile-1"'} />
    </NextIntlClientProvider>
  )
  const name = screen.getByLabelText('Отображаемое имя')
  await user.clear(name)
  await user.type(name, 'Танцор')
  await user.click(screen.getByRole('button', { name: 'Сохранить профиль' }))
  expect(await screen.findByRole('status')).toHaveTextContent('сохранён')
  expect(name).toHaveValue('Танцор')
})
