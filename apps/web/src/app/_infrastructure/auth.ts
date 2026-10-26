import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import { createSupabaseRequestClient } from '@/shared/supabase/server'
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

function authOrigin() {
  const url = new URL(process.env.AUTH_SITE_URL ?? 'http://127.0.0.1:3000')
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/' ||
    (url.protocol !== 'https:' &&
      !(
        url.protocol === 'http:' &&
        ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
      ))
  )
    throw new Error('Invalid application origin')
  return url.origin
}
function responseContext(request: NextRequest) {
  const writes = new Map<string, { value: string; options: CookieOptions }>()
  const providerHeaders = new Headers()
  const client = createSupabaseRequestClient({
    getAll: () => request.cookies.getAll(),
    setAll(cookies, headers) {
      for (const { name, value, options } of cookies) {
        request.cookies.set(name, value)
        writes.set(name, { value, options })
      }
      for (const [name, value] of Object.entries(headers))
        providerHeaders.set(name, value)
    },
  })
  function finish(response: NextResponse) {
    for (const [name, { value, options }] of writes)
      response.cookies.set(name, value, options)
    providerHeaders.forEach((value, name) => response.headers.set(name, value))
    response.headers.set(
      'Cache-Control',
      'private, no-store, max-age=0, must-revalidate'
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Referrer-Policy', 'no-referrer')
    return response
  }
  return { client, finish }
}
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
    const { client, finish } = responseContext(request)
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
              : next
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
            '/' +
            locale +
            '/account' +
            (result.bootstrap === 'retry' ? '?bootstrap=retry' : '')
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
    return secureJson({ status: 'error', error: 'unavailable' })
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
          : safeAuthReturn(query.get('next'), locale)
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
