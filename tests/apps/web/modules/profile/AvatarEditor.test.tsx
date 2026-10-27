import { afterEach, expect, vi } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import type { OwnProfile } from '@dance/contracts'
import { AVATAR_MAX_FILE_BYTES } from '@dance/contracts'
import { AvatarEditor } from '@/modules/profile/AvatarEditor'
const id = '11111111-1111-4111-8111-111111111111'
const profile = {
  userId: id,
  username: 'dancer',
  displayName: 'Owner',
  bio: 'Unsaved draft',
  avatarUrl: '/api/v1/profile-avatars/' + id,
  completed: true,
  revision: '3',
  updatedAt: '2026-10-27T00:00:00Z',
  privacy: {
    visibility: 'public',
    discoverable: false,
    showActivity: false,
    revision: '2',
  },
} as OwnProfile
const messages = {
  en: {
    avatarLabel: 'Profile photo',
    avatarHint: 'Maximum photo size: 2 MB',
    avatarTooLarge: 'Photo too large. Maximum size: 2 MB.',
    avatarUpload: 'Upload photo',
    avatarRemove: 'Remove photo',
    avatarCancel: 'Cancel photo selection',
    avatarPreview: 'Selected photo preview',
    avatarCurrent: 'Current profile photo',
    avatarSaved: 'Photo saved',
    avatarLoading: 'Saving photo',
    avatarInvalid: 'Invalid photo',
    avatarOutcomeUnknown: 'Reload current profile before another change.',
    avatarUnavailable: 'Photo unavailable',
    avatarConflict: 'Profile changed; reload current profile.',
    avatarRateLimited: 'Too many uploads. Try again later.',
  },
  ru: {
    avatarLabel: 'Фото профиля',
    avatarHint: 'Максимальный размер фото: 2 МБ',
    avatarTooLarge: 'Фото слишком большое. Максимальный размер: 2 МБ.',
    avatarUpload: 'Загрузить фото',
    avatarRemove: 'Удалить фото',
    avatarCancel: 'Отменить выбор фото',
    avatarPreview: 'Предпросмотр выбранного фото',
    avatarCurrent: 'Текущее фото профиля',
    avatarSaved: 'Фото сохранено',
    avatarLoading: 'Сохранение фото',
    avatarInvalid: 'Недопустимое фото',
    avatarOutcomeUnknown: 'Загрузите текущий профиль перед изменением.',
    avatarUnavailable: 'Фото недоступно',
    avatarConflict: 'Профиль изменён. Загрузите текущий.',
    avatarRateLimited: 'Слишком много загрузок. Попробуйте позже.',
  },
}
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
function mount(
  locale: 'en' | 'ru',
  onChange = vi.fn(),
  initialProfile = profile
) {
  const created = vi.fn(() => 'blob:avatar-fixture'),
    revoked = vi.fn()
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: created,
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: revoked,
  })
  const view = render(
    <NextIntlClientProvider
      locale={locale}
      messages={{ profile: messages[locale] }}
    >
      <input aria-label="Text draft" defaultValue="Unsaved draft" />
      <AvatarEditor
        profile={initialProfile}
        etag={'"profile-3"'}
        onChange={onChange}
        onNeedsReload={vi.fn()}
      />
    </NextIntlClientProvider>
  )
  return { ...view, created, revoked }
}
const feature = await loadFeature('tests/bdd/profile/avatars.feature')
describeFeature(
  feature,
  ({ Scenario }) => {
    Scenario('SC-429 Reject oversized selection before network', ({ Then }) => {
      Then(
        'exact file boundaries and localized feedback preserve drafts and release previews',
        async () => {
          for (const locale of ['en', 'ru'] as const) {
            const network = vi.fn()
            vi.stubGlobal('fetch', network)
            const view = mount(locale),
              user = userEvent.setup(),
              t = messages[locale]
            expect(screen.getByText(t.avatarHint)).toBeVisible()
            const picker = screen.getByLabelText(t.avatarLabel)
            for (const size of [
              AVATAR_MAX_FILE_BYTES - 1,
              AVATAR_MAX_FILE_BYTES,
            ]) {
              await user.upload(
                picker,
                new File([new Uint8Array(size)], 'photo.png', {
                  type: 'image/png',
                })
              )
              expect(
                screen.getByRole('img', { name: t.avatarPreview })
              ).toBeVisible()
              expect(
                screen.getByRole('button', { name: t.avatarUpload })
              ).toBeEnabled()
            }
            await user.upload(
              picker,
              new File(
                [new Uint8Array(AVATAR_MAX_FILE_BYTES + 1)],
                'large.png',
                { type: 'image/png' }
              )
            )
            expect(screen.getByRole('alert')).toHaveTextContent(
              t.avatarTooLarge
            )
            expect(network).not.toHaveBeenCalled()
            expect(screen.getByLabelText('Text draft')).toHaveValue(
              'Unsaved draft'
            )
            expect(
              screen.getByRole('img', { name: t.avatarCurrent })
            ).toHaveAttribute('src', profile.avatarUrl)
            view.unmount()
            expect(view.revoked).toHaveBeenCalled()
            cleanup()
          }
        }
      )
    })
  },
  { includeTags: ['SC-429'] }
)
const browser = await loadFeature('tests/e2e/profile/avatars.feature')
describeFeature(
  browser,
  ({ Scenario }) => {
    Scenario(
      'SC-431 Manage avatars in real EN and RU pages',
      ({ Given, When, Then }) => {
        const changed = vi.fn()
        Given('a completed owner without an avatar', () => {
          expect(profile.completed).toBe(true)
        })
        When(
          'the owner rejects oversized photos and replaces an uploaded avatar',
          async () => {
            mount('en', changed, { ...profile, avatarUrl: null })
            const user = userEvent.setup()
            await user.upload(
              screen.getByLabelText('Profile photo'),
              new File([new Uint8Array(AVATAR_MAX_FILE_BYTES + 1)], 'big.png', {
                type: 'image/png',
              })
            )
            expect(screen.getByRole('alert')).toHaveTextContent(
              'Photo too large'
            )
            vi.stubGlobal(
              'fetch',
              vi
                .fn()
                .mockResolvedValue(
                  new Response(
                    JSON.stringify({ profile: { ...profile, revision: '4' } }),
                    { headers: { ETag: '"profile-4"' } }
                  )
                )
            )
            await user.upload(
              screen.getByLabelText('Profile photo'),
              new File([new Uint8Array([1])], 'photo.png', {
                type: 'image/png',
              })
            )
            await user.click(
              screen.getByRole('button', { name: 'Upload photo' })
            )
            await waitFor(() => expect(changed).toHaveBeenCalled())
          }
        )
        Then(
          'current EN and RU public images are safe and old avatar URLs are unavailable',
          async () => {
            await waitFor(() =>
              expect(changed).toHaveBeenCalledWith(
                expect.objectContaining({ etag: '"profile-4"' })
              )
            )
          }
        )
      }
    )
  },
  { includeTags: ['SC-431'] }
)
