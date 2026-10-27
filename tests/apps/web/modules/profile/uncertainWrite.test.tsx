import { afterEach, expect, test, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import type { Database } from '@/shared/supabase/database'
import {
  createProfileRepository,
  saveOwnProfile,
  ProfileEditor,
} from '@/modules/profile'
import en from '@/shared/i18n/messages/en.json'
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
test('SDK status-zero and empty-code errors require reload at the repository seam', async () => {
  const client = {
    rpc: vi.fn().mockResolvedValue({
      status: 0,
      error: { code: '', message: 'network failed' },
    }),
  } as unknown as SupabaseClient<Database>
  await expect(
    saveOwnProfile(
      createProfileRepository(client),
      '11111111-1111-4111-8111-111111111111',
      { bio: 'draft' },
      '1'
    )
  ).rejects.toMatchObject({ code: 'outcome_unknown' })
})
test('Cancel cannot enable another save after an uncertain result before a successful reload', async () => {
  const profile = {
    userId: '11111111-1111-4111-8111-111111111111',
    username: null,
    displayName: '',
    bio: '',
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
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: 'outcome_unknown' } }), {
        status: 503,
      })
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ profile }), {
        headers: { ETag: '"profile-1"' },
      })
    )
  vi.stubGlobal('fetch', fetcher)
  const user = userEvent.setup()
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ProfileEditor initialProfile={profile} initialEtag={'"profile-1"'} />
    </NextIntlClientProvider>
  )
  await user.click(screen.getByRole('button', { name: 'Save profile' }))
  await screen.findByRole('alert')
  await user.click(screen.getByRole('button', { name: 'Cancel edits' }))
  const save = screen.getByRole('button', { name: 'Save profile' })
  expect(save).toBeDisabled()
  await user.click(save)
  expect(fetcher).toHaveBeenCalledTimes(1)
  await user.click(
    screen.getByRole('button', { name: 'Reload current profile' })
  )
  expect(save).toBeEnabled()
})
