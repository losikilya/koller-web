import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { registrationSchema } from '@dance/contracts'
import { safeAuthReturn, authErrorKey } from '@/modules/identity/authPolicy'
import { AuthForm } from '@/modules/identity/AuthForm'
import {
  registerAccount,
  verifyEmail,
  loginAccount,
  logoutAccount,
  recoverPassword,
  resetPassword,
  completeOAuth,
  startGoogle,
  bootstrapAccount,
  type AuthClient,
} from '@/modules/identity/authService'
import en from '@/shared/i18n/messages/en.json'
import ru from '@/shared/i18n/messages/ru.json'

const password = 'Dance-local-123!'
function fixture() {
  const auth = {
    signUp: vi.fn().mockResolvedValue({
      data: { user: { id: 'verified' }, session: null },
      error: null,
    }),
    signInWithPassword: vi
      .fn()
      .mockResolvedValue({ data: { user: { id: 'verified' } }, error: null }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'verified', email_confirmed_at: '2026-10-26' } },
      error: null,
    }),
    verifyOtp: vi
      .fn()
      .mockResolvedValue({ data: { user: { id: 'verified' } }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    updateUser: vi
      .fn()
      .mockResolvedValue({ data: { user: { id: 'verified' } }, error: null }),
    exchangeCodeForSession: vi
      .fn()
      .mockResolvedValue({ data: { user: { id: 'verified' } }, error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({
      data: { url: 'https://accounts.google.com/provider' },
      error: null,
    }),
  }
  const rpc = vi.fn().mockResolvedValue({ error: null })
  return { auth, rpc, client: { auth, rpc } as unknown as AuthClient }
}
const feature = await loadFeature('tests/bdd/identity/authentication.feature')
describeFeature(feature, ({ Scenario }) => {
  Scenario('SC-301 Registration waits for verification', ({ Then }) => {
    Then('the 301 authentication contract is enforced', async () => {
      const f = fixture()
      expect(
        registrationSchema.safeParse({
          email: 'invalid',
          password: 'short',
          confirmPassword: 'different',
        }).success
      ).toBe(false)
      const result = await registerAccount(
        f.client,
        { email: '  Dancer@Example.com ', password, confirmPassword: password },
        'http://127.0.0.1:4310/ru/auth/confirm'
      )
      expect(result.status).toBe('pending')
      expect(f.auth.signUp).toHaveBeenCalledWith({
        email: 'dancer@example.com',
        password,
        options: { emailRedirectTo: 'http://127.0.0.1:4310/ru/auth/confirm' },
      })
      expect(f.rpc).not.toHaveBeenCalled()
      expect(
        (await verifyEmail(f.client, 'single-use-hash', 'signup')).bootstrap
      ).toBe('ready')
      expect(f.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: 'single-use-hash',
        type: 'signup',
      })
      f.auth.verifyOtp.mockResolvedValueOnce({
        data: { user: null },
        error: { code: 'otp_expired' },
      })
      expect(await verifyEmail(f.client, 'used-hash', 'signup')).toEqual({
        status: 'error',
        error: 'invalidLink',
      })
    })
  })
  Scenario('SC-302 Verified login and local logout', ({ Then }) => {
    Then('the 302 authentication contract is enforced', async () => {
      const f = fixture()
      expect(
        (
          await loginAccount(f.client, {
            email: ' Dancer@example.com ',
            password,
          })
        ).bootstrap
      ).toBe('ready')
      expect(f.auth.getUser).toHaveBeenCalled()
      expect(f.rpc).toHaveBeenCalledWith('ensure_profile')
      for (const code of ['invalid_credentials', 'email_not_confirmed'])
        expect(authErrorKey({ code })).toBe('credentials')
      f.auth.signInWithPassword.mockResolvedValueOnce({
        error: { code: 'email_not_confirmed' },
      })
      expect(
        await loginAccount(f.client, { email: 'dancer@example.com', password })
      ).toEqual({ status: 'error', error: 'credentials' })
      expect((await logoutAccount(f.client)).status).toBe('success')
      expect(f.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
    })
  })
  Scenario('SC-303 Generic recovery and protected reset', ({ Then }) => {
    Then('the 303 authentication contract is enforced', async () => {
      const f = fixture()
      f.auth.resetPasswordForEmail.mockResolvedValueOnce({
        data: {},
        error: { code: 'user_not_found' },
      })
      expect(
        (
          await recoverPassword(
            f.client,
            { email: 'unknown@example.com' },
            'http://127.0.0.1:4310/en/auth/confirm'
          )
        ).status
      ).toBe('pending')
      f.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })
      expect(
        await resetPassword(f.client, { password, confirmPassword: password })
      ).toEqual({ status: 'error', error: 'invalidLink' })
      expect(f.auth.updateUser).not.toHaveBeenCalled()
      expect(
        (await verifyEmail(f.client, 'recovery-hash', 'recovery')).status
      ).toBe('success')
      expect(
        (await resetPassword(f.client, { password, confirmPassword: password }))
          .status
      ).toBe('success')
      expect(f.auth.updateUser).toHaveBeenCalledWith({ password })
    })
  })
  Scenario('SC-304 Safe OAuth callback and destinations', ({ Then }) => {
    Then('the 304 authentication contract is enforced', async () => {
      for (const value of [
        'https://evil.test',
        '//evil.test',
        '/ru/account?next=https://evil.test',
        '/ru/../en/account',
        '/ru/%61ccount',
        '/ru/\\evil',
        '/ru/account#secret',
      ])
        expect(safeAuthReturn(value, 'ru')).toBe('/ru/account')
      expect(safeAuthReturn('/ru/playground', 'ru')).toBe('/ru/playground')
      expect(safeAuthReturn('/en/account', 'ru')).toBe('/ru/account')
      const f = fixture()
      expect(
        (await startGoogle(f.client, 'http://127.0.0.1:4310/ru/auth/callback'))
          .url
      ).toBe('https://accounts.google.com/provider')
      expect(f.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://127.0.0.1:4310/ru/auth/callback',
          skipBrowserRedirect: true,
        },
      })
      f.auth.exchangeCodeForSession.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'sensitive-code' },
      })
      expect(await completeOAuth(f.client, 'bad-code')).toEqual({
        status: 'error',
        error: 'invalidLink',
      })
      expect(f.rpc).not.toHaveBeenCalled()
      expect(
        (await completeOAuth(f.client, 'valid-fixture-code')).bootstrap
      ).toBe('ready')
    })
  })
  Scenario('SC-305 Bootstrap failure preserves session', ({ Then }) => {
    Then('the 305 authentication contract is enforced', async () => {
      const f = fixture()
      f.rpc.mockResolvedValueOnce({ error: { message: 'temporary' } })
      expect(await bootstrapAccount(f.client)).toEqual({
        status: 'success',
        bootstrap: 'retry',
      })
      expect(f.auth.signOut).not.toHaveBeenCalled()
      expect(await bootstrapAccount(f.client)).toEqual({
        status: 'success',
        bootstrap: 'ready',
      })
      f.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { code: 'session_expired' },
      })
      expect((await bootstrapAccount(f.client)).status).toBe('error')
      expect(f.rpc).toHaveBeenCalledTimes(2)
    })
  })
  Scenario('SC-306 Localized accessible submission states', ({ Then }) => {
    Then('the 306 authentication contract is enforced', async () => {
      const user = userEvent.setup()
      const request = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'pending' }),
      })
      vi.stubGlobal('fetch', request)
      try {
        render(
          <NextIntlClientProvider locale="ru" messages={ru}>
            <AuthForm kind="register" locale="ru" />
          </NextIntlClientProvider>
        )
        await user.type(
          screen.getByLabelText('Электронная почта'),
          'dancer@example.com'
        )
        await user.type(
          screen.getByLabelText('Пароль', { exact: true }),
          password
        )
        await user.type(screen.getByLabelText('Подтвердите пароль'), password)
        await user.click(
          screen.getByRole('button', { name: 'Создать аккаунт' })
        )
        expect(await screen.findByRole('status')).toHaveTextContent('письмо')
        expect(request).toHaveBeenCalledTimes(1)
        expect(
          screen.getByRole('button', { name: 'Создать аккаунт' })
        ).toBeDisabled()
      } finally {
        cleanup()
        vi.unstubAllGlobals()
      }
    })
  })
  Scenario('SC-307 Guest identity routes offer real forms', ({ Then }) => {
    Then('the 307 authentication contract is enforced', async () => {
      try {
        render(
          <NextIntlClientProvider locale="en" messages={en}>
            <AuthForm kind="login" locale="en" />
          </NextIntlClientProvider>
        )
        expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
          'autocomplete',
          'email'
        )
        expect(
          screen.getByLabelText('Password', { exact: true })
        ).toHaveAttribute('autocomplete', 'current-password')
        expect(screen.getByRole('button', { name: 'Log in' })).toHaveAttribute(
          'type',
          'submit'
        )
        expect(
          screen.getByRole('button', { name: 'Continue with Google' })
        ).toBeEnabled()
      } finally {
        cleanup()
      }
    })
  })
})
