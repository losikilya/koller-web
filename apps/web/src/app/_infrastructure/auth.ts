import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { authOrigin, responseContext } from './requestContext'
import {
  registerAccount,
  loginAccount,
  recoverPassword,
  resetPassword,
  logoutAccount,
  bootstrapAccount,
  startGoogle,
  verifyEmail,
  completeOAuth,
  safeAuthReturn,
} from '@/modules/identity'
import type { AuthResult } from '@/modules/identity'
import { locales, type Locale } from '@/shared/i18n/routes'
import { authCompletionDestination } from './completion'

function secureJson(result: AuthResult, status = 200) {
  return NextResponse.json(result, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
    },
  })
}
export async function handleAuthPost(request: NextRequest, action: string) {
  let context: ReturnType<typeof responseContext> | undefined
  try {
    if (request.headers.get('origin') !== authOrigin())
      return secureJson({ status: 'error', error: 'unavailable' }, 403)
    const json = request.headers
      .get('content-type')
      ?.includes('application/json')
    if (Number(request.headers.get('content-length') ?? 0) > 16384)
      return secureJson({ status: 'error', error: 'validation' }, 413)
    const text = await request.text()
    if (text.length > 16384)
      return secureJson({ status: 'error', error: 'validation' }, 413)
    const input: Record<string, unknown> = json
      ? JSON.parse(text)
      : Object.fromEntries(new URLSearchParams(text))
    if (
      !input ||
      typeof input !== 'object' ||
      !locales.includes(input.locale as Locale)
    )
      return secureJson({ status: 'error', error: 'validation' }, 400)
    const locale = input.locale as Locale
    context = responseContext(request)
    const { client, finish } = context
    const next = safeAuthReturn(input.next, locale)
    let result: AuthResult
    switch (action) {
      case 'register':
        result = await registerAccount(
          client,
          input,
          authOrigin() + '/' + locale + '/auth/confirm'
        )
        break
      case 'login':
        result = await loginAccount(client, input)
        if (result.status === 'success')
          result.url =
            result.bootstrap === 'retry'
              ? '/' + locale + '/account?bootstrap=retry'
              : await authCompletionDestination(client, locale, next)
        break
      case 'recover':
        result = await recoverPassword(
          client,
          input,
          authOrigin() + '/' + locale + '/auth/confirm'
        )
        break
      case 'reset':
        result = await resetPassword(client, input)
        break
      case 'logout':
        result = await logoutAccount(client)
        if (result.status === 'success') result.url = '/' + locale
        break
      case 'bootstrap':
        result = await bootstrapAccount(client)
        if (result.status === 'success')
          result.url =
            result.bootstrap === 'retry'
              ? '/' + locale + '/account?bootstrap=retry'
              : await authCompletionDestination(
                  client,
                  locale,
                  '/' + locale + '/account'
                )
        break
      case 'google':
        if (process.env.AUTH_GOOGLE_ENABLED !== 'true') {
          result = { status: 'error', error: 'unavailable' }
          break
        }
        result = await startGoogle(
          client,
          authOrigin() +
            '/' +
            locale +
            '/auth/callback?next=' +
            encodeURIComponent(next)
        )
        break
      default:
        return finish(secureJson({ status: 'error', error: 'validation' }, 404))
    }
    if (!json) {
      const destination =
        result.status === 'success' && result.url
          ? result.url
          : '/' + locale + '/account?error=unavailable'
      return finish(
        NextResponse.redirect(new URL(destination, authOrigin()), 303)
      )
    }
    return finish(secureJson(result))
  } catch {
    const response = secureJson({ status: 'error', error: 'unavailable' })
    return context ? context.finish(response) : response
  }
}
export async function handleAuthCallback(
  request: NextRequest,
  localeValue: string,
  kind: 'confirm' | 'callback'
) {
  if (!locales.includes(localeValue as Locale))
    return new NextResponse(null, { status: 404 })
  const locale = localeValue as Locale
  let context: ReturnType<typeof responseContext> | undefined
  try {
    context = responseContext(request)
    const query = request.nextUrl.searchParams
    let result: AuthResult = { status: 'error', error: 'invalidLink' }
    const type = query.get('type')
    if (!query.has('error')) {
      if (kind === 'confirm' && (type === 'signup' || type === 'recovery'))
        result = await verifyEmail(
          context.client,
          query.get('token_hash') ?? '',
          type
        )
      if (kind === 'callback')
        result = await completeOAuth(context.client, query.get('code') ?? '')
    }
    let destination = '/' + locale + '/login?error=invalidLink'
    if (result.status === 'success') {
      destination =
        kind === 'confirm' && type === 'recovery'
          ? '/' + locale + '/reset-password'
          : result.bootstrap === 'retry'
          ? '/' + locale + '/account?bootstrap=retry'
          : await authCompletionDestination(
              context.client,
              locale,
              safeAuthReturn(query.get('next'), locale)
            )
    }
    return context.finish(
      NextResponse.redirect(new URL(destination, authOrigin()), 303)
    )
  } catch {
    const response = NextResponse.redirect(
      new URL('/' + locale + '/login?error=unavailable', authOrigin()),
      303
    )
    return context ? context.finish(response) : response
  }
}
