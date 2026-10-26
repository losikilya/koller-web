// @vitest-environment node
import { expect, vi } from 'vitest'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import {
  recoverPassword,
  type AuthClient,
} from '@/modules/identity/authService'

const feature = await loadFeature('tests/bdd/identity/recovery.feature')

describeFeature(feature, ({ Scenario }) => {
  Scenario(
    'SC-309 Repeated recovery has identical public feedback',
    ({ Then }) => {
      Then(
        'repeated recovery and provider failures do not disclose account existence',
        async () => {
          const redirect = 'http://127.0.0.1:4310/ru/auth/confirm'
          const known = 'registered@example.test'
          const absent = 'absent@example.test'
          const attempts = new Map<string, number>()
          const resetPasswordForEmail = vi.fn(async (email: string) => {
            const count = (attempts.get(email) ?? 0) + 1
            attempts.set(email, count)
            return {
              error:
                email === known && count > 1
                  ? { code: 'over_email_send_rate_limit' }
                  : null,
            }
          })
          const client = {
            auth: { resetPasswordForEmail },
          } as unknown as AuthClient
          for (const email of [known, absent, known, absent]) {
            expect(await recoverPassword(client, { email }, redirect)).toEqual({
              status: 'pending',
            })
          }
          expect(attempts.get(known)).toBe(2)
          expect(attempts.get(absent)).toBe(2)
          expect(resetPasswordForEmail).toHaveBeenCalledWith(known, {
            redirectTo: redirect,
          })

          for (const code of [
            'user_not_found',
            'over_email_send_rate_limit',
            'over_request_rate_limit',
            'unexpected_failure',
          ]) {
            resetPasswordForEmail.mockResolvedValueOnce({ error: { code } })
            expect(
              await recoverPassword(client, { email: known }, redirect)
            ).toEqual({ status: 'pending' })
          }
          resetPasswordForEmail.mockRejectedValueOnce(
            new Error('provider delivery failure')
          )
          expect(
            await recoverPassword(client, { email: known }, redirect)
          ).toEqual({ status: 'pending' })
          expect(resetPasswordForEmail).toHaveBeenCalledTimes(9)

          expect(
            await recoverPassword(
              client,
              { email: '  REGISTERED@EXAMPLE.TEST  ' },
              redirect
            )
          ).toEqual({ status: 'pending' })
          expect(resetPasswordForEmail).toHaveBeenLastCalledWith(known, {
            redirectTo: redirect,
          })
          resetPasswordForEmail.mockClear()
          for (const input of [{ email: 'invalid' }, { email: '' }, {}, null]) {
            expect(await recoverPassword(client, input, redirect)).toEqual({
              status: 'error',
              error: 'validation',
            })
          }
          expect(resetPasswordForEmail).not.toHaveBeenCalled()
        }
      )
    }
  )
})
