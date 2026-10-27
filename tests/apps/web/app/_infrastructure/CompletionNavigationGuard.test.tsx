import { afterEach, expect, test, vi } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { CompletionNavigationGuard } from '@/app/_infrastructure/CompletionNavigationGuard'
import en from '@/shared/i18n/messages/en.json'
vi.mock('next/navigation', () => ({ usePathname: () => '/en' }))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
test('background completion revalidation preserves existing main DOM and keyboard focus for guests', async () => {
  let resolve: (value: Response) => void = () => {}
  vi.stubGlobal(
    'fetch',
    vi.fn(
      () =>
        new Promise<Response>((accept) => {
          resolve = accept
        })
    )
  )
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CompletionNavigationGuard enabled>
        <main tabIndex={-1}>
          <h1>Guest content</h1>
        </main>
      </CompletionNavigationGuard>
    </NextIntlClientProvider>
  )
  const main = screen.getByRole('main')
  main.focus()
  expect(main).toHaveFocus()
  await act(async () => {
    resolve(
      new Response(JSON.stringify({ authenticated: false, completed: false }))
    )
  })
  expect(screen.getByRole('main')).toBe(main)
  expect(main).toHaveFocus()
})
