// @vitest-environment node
import { expect, vi } from 'vitest'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { NextRequest } from 'next/server'
import { completionRedirect } from '@/app/_infrastructure/completionPolicy'
import { handleAuthPost, handleAuthCallback } from '@/app/_infrastructure/auth'
const state = vi.hoisted(() => ({ completed: false }))
vi.mock('@/modules/profile/completionService', () => ({
  readCompletion: async () => state.completed,
}))
vi.mock('@/shared/supabase/server', () => ({
  createSupabaseRequestClient: () => ({
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: '11111111-1111-4111-8111-111111111111',
            email_confirmed_at: 'confirmed',
          },
        },
      }),
      signInWithPassword: async () => ({ error: null }),
      exchangeCodeForSession: async () => ({ error: null }),
      verifyOtp: async () => ({ error: null }),
    },
    rpc: async () => ({ error: null }),
  }),
}))
const feature = await loadFeature('tests/bdd/profile/completion.feature')
describeFeature(
  feature,
  ({ Scenario }) => {
    Scenario('SC-422 Gate routes and safe auth returns', ({ Then }) => {
      Then(
        'incomplete routing and auth returns preserve the completion and recovery matrix',
        async () => {
          vi.stubEnv('AUTH_SITE_URL', 'http://127.0.0.1:4310')
          for (const path of [
            '/ru',
            '/ru/account',
            '/ru/playground',
            '/ru/playground/practice-timer',
            '/ru/u/dancer',
          ])
            expect(completionRedirect(path, false)).toBe('/ru/account/profile')
          for (const path of [
            '/ru/account/profile',
            '/ru/login',
            '/ru/register',
            '/ru/forgot-password',
            '/ru/reset-password',
            '/ru/auth/confirm',
            '/api/auth/logout',
            '/_next/static/file.js',
            '/ru/unknown',
            '/de/playground',
          ])
            expect(completionRedirect(path, false)).toBeNull()
          expect(completionRedirect('/en/playground', true)).toBeNull()
          expect(completionRedirect('/ru/account', false, true)).toBeNull()
          const login = await handleAuthPost(
            new NextRequest('http://127.0.0.1:4310/api/auth/login', {
              method: 'POST',
              headers: {
                Origin: 'http://127.0.0.1:4310',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: 'owner@example.test',
                password: 'Local-password1!',
                locale: 'ru',
                next: '/ru/playground',
              }),
            }),
            'login'
          )
          expect((await login.json()).url).toBe('/ru/account/profile')
          const callback = await handleAuthCallback(
            new NextRequest(
              'http://127.0.0.1:4310/ru/auth/callback?code=valid&next=https://evil.test'
            ),
            'ru',
            'callback'
          )
          expect(callback.headers.get('location')).toBe(
            'http://127.0.0.1:4310/ru/account/profile'
          )
          const recovery = await handleAuthCallback(
            new NextRequest(
              'http://127.0.0.1:4310/ru/auth/confirm?type=recovery&token_hash=valid'
            ),
            'ru',
            'confirm'
          )
          expect(recovery.headers.get('location')).toBe(
            'http://127.0.0.1:4310/ru/reset-password'
          )
          state.completed = true
          const completeCallback = await handleAuthCallback(
            new NextRequest(
              'http://127.0.0.1:4310/en/auth/callback?code=valid&next=/en/playground'
            ),
            'en',
            'callback'
          )
          expect(completeCallback.headers.get('location')).toBe(
            'http://127.0.0.1:4310/en/playground'
          )
        }
      )
    })
  },
  { includeTags: ['SC-422'] }
)
