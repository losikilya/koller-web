import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import { createSupabaseRequestClient } from '@/shared/supabase/server'

export function authOrigin() {
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
export function responseContext(request: NextRequest) {
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
