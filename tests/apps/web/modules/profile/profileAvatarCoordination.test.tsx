import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { ProfileEditor } from '@/modules/profile/ProfileEditor'
import en from '@/shared/i18n/messages/en.json'
const id = '11111111-1111-4111-8111-111111111111'
const profile = {
  userId: id,
  username: 'dancer',
  displayName: 'Owner',
  bio: '',
  avatarUrl: null,
  completed: true,
  revision: '3',
  updatedAt: '2026-10-27T00:00:00Z',
  privacy: {
    visibility: 'public' as const,
    discoverable: false,
    showActivity: false as const,
    revision: '2',
  },
}
const descriptors = {
  create: Object.getOwnPropertyDescriptor(URL, 'createObjectURL'),
  revoke: Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL'),
}
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  for (const [key, descriptor] of [
    ['createObjectURL', descriptors.create],
    ['revokeObjectURL', descriptors.revoke],
  ] as const) {
    if (descriptor) Object.defineProperty(URL, key, descriptor)
    else Reflect.deleteProperty(URL, key)
  }
})
function setup() {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: () => 'blob:coordination',
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  })
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ProfileEditor initialProfile={profile} initialEtag={'"profile-3"'} />
    </NextIntlClientProvider>
  )
  return userEvent.setup()
}
function response(revision = '4') {
  return new Response(
    JSON.stringify({
      profile: {
        ...profile,
        avatarUrl: '/api/v1/profile-avatars/' + id,
        revision,
      },
    }),
    { headers: { ETag: '"profile-' + revision + '"' } }
  )
}
test('avatar write preserves text draft and advances the next text-write condition', async () => {
  const network = vi
    .fn()
    .mockResolvedValueOnce(response())
    .mockResolvedValueOnce(response('5'))
  vi.stubGlobal('fetch', network)
  const user = setup()
  await user.type(screen.getByLabelText('Bio', { exact: true }), 'Unsaved text')
  await user.upload(
    screen.getByLabelText('Profile photo'),
    new File([new Uint8Array([1])], 'photo.png', { type: 'image/png' })
  )
  await user.click(screen.getByRole('button', { name: 'Upload photo' }))
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Photo saved')
  )
  expect(screen.getByLabelText('Bio', { exact: true })).toHaveValue(
    'Unsaved text'
  )
  await user.click(screen.getByRole('button', { name: 'Save profile' }))
  await waitFor(() => expect(network).toHaveBeenCalledTimes(2))
  const options = network.mock.calls[1][1] as RequestInit
  expect(new Headers(options.headers).get('If-Match')).toBe('"profile-4"')
  expect(JSON.parse(String(options.body)).bio).toBe('Unsaved text')
})
test('uncertain avatar write blocks both editors through cancel until an explicit current reload', async () => {
  const network = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: 'outcome_unknown' } }), {
        status: 503,
      })
    )
    .mockResolvedValueOnce(response())
  vi.stubGlobal('fetch', network)
  const user = setup()
  await user.type(
    screen.getByLabelText('Bio', { exact: true }),
    'Keep this draft'
  )
  await user.upload(
    screen.getByLabelText('Profile photo'),
    new File([new Uint8Array([1])], 'photo.png', { type: 'image/png' })
  )
  await user.click(screen.getByRole('button', { name: 'Upload photo' }))
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Reload current profile'
    )
  )
  expect(screen.getByLabelText('Bio', { exact: true })).toHaveValue(
    'Keep this draft'
  )
  expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled()
  await user.click(
    screen.getByRole('button', { name: 'Cancel photo selection' })
  )
  expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled()
  await user.click(
    screen.getByRole('button', { name: 'Reload current profile' })
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeEnabled()
  )
  expect(
    screen.getByRole('img', { name: 'Current profile photo' })
  ).toBeVisible()
})

test('avatar reload-current cannot silently rebase a text draft over concurrent server edits', async () => {
  const updated = {
    ...profile,
    bio: 'Other device text',
    revision: '5',
    avatarUrl: '/api/v1/profile-avatars/' + id,
  }
  const result = () =>
    new Response(JSON.stringify({ profile: updated }), {
      headers: { ETag: '"profile-5"' },
    })
  const network = vi.fn().mockImplementation(result)
  vi.stubGlobal('fetch', network)
  const user = setup()
  await user.type(screen.getByLabelText('Bio', { exact: true }), 'Local draft')
  await user.upload(
    screen.getByLabelText('Profile photo'),
    new File([new Uint8Array([1])], 'photo.png', { type: 'image/png' })
  )
  await user.click(screen.getByRole('button', { name: 'Upload photo' }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled()
  )
  expect(screen.getByLabelText('Bio', { exact: true })).toHaveValue(
    'Local draft'
  )
  expect(screen.getByRole('alert')).toHaveTextContent(
    en.profile.revision_conflict
  )
  await user.click(screen.getByRole('button', { name: 'Cancel edits' }))
  expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled()
  expect(screen.getByRole('alert')).toHaveTextContent(
    en.profile.revision_conflict
  )
  await user.click(
    screen.getByRole('button', { name: 'Reload current profile' })
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeEnabled()
  )
  expect(screen.getByLabelText('Bio', { exact: true })).toHaveValue(
    'Other device text'
  )
})
