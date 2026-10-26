import { afterEach, expect, test, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { AuthForm } from '@/modules/identity/AuthForm'
import en from '@/shared/i18n/messages/en.json'
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
test('pending login disables duplicate submissions and unmount aborts the owned request', async () => {
  const request = vi.fn(
    (_url: unknown, options?: RequestInit) =>
      new Promise((_resolve, reject) =>
        options?.signal?.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError'))
        )
      )
  )
  vi.stubGlobal('fetch', request)
  const user = userEvent.setup()
  const view = render(
    <NextIntlClientProvider locale="en" messages={en}>
      <AuthForm kind="login" locale="en" />
    </NextIntlClientProvider>
  )
  await user.type(screen.getByLabelText('Email'), 'dancer@example.test')
  await user.type(
    screen.getByLabelText('Password', { exact: true }),
    'Dance-local-123!'
  )
  await user.click(screen.getByRole('button', { name: 'Log in' }))
  await user.click(screen.getByRole('button', { name: 'Log in' }))
  expect(request).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('Please wait')
  const signal = request.mock.calls[0][1]?.signal
  view.unmount()
  expect(signal?.aborted).toBe(true)
})
test('Google start never sends the typed password', async () => {
  const request = vi.fn().mockResolvedValue({
    json: async () => ({ status: 'error', error: 'unavailable' }),
  })
  vi.stubGlobal('fetch', request)
  const user = userEvent.setup()
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <AuthForm kind="login" locale="en" />
    </NextIntlClientProvider>
  )
  await user.type(
    screen.getByLabelText('Password', { exact: true }),
    'Dance-local-123!'
  )
  await user.click(screen.getByRole('button', { name: 'Continue with Google' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'temporarily unavailable'
  )
  expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({ locale: 'en' })
})
