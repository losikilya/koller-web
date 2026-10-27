import 'server-only'
import type { CookieOptions } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'
import { getSupabaseConfig } from './config'
import { createSupabaseRequestClient } from './server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from './database'
import { readVerifiedUser } from './verifiedUser'
export type VerifiedRequestContext = {
  client: SupabaseClient<Database>
  user: User | null
  unavailable?: boolean
}

export async function refreshSession(
  request: NextRequest,
  respond: (
    request: NextRequest,
    context?: VerifiedRequestContext
  ) => NextResponse | Promise<NextResponse>
) {
  if (!getSupabaseConfig()) return respond(request)
  const writes = new Map<string, { value: string; options: CookieOptions }>()
  const cacheHeaders = new Headers()
  const hadSessionCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith('sb-'))
  const client = createSupabaseRequestClient({
    getAll: () => request.cookies.getAll(),
    setAll(cookies, headers) {
      for (const { name, value, options } of cookies) {
        request.cookies.set(name, value)
        writes.set(name, { value, options })
      }
      for (const [name, value] of Object.entries(headers))
        cacheHeaders.set(name, value)
    },
  })
  let user: User | null = null
  let unavailable = false
  try {
    user = await readVerifiedUser(client)
  } catch {
    unavailable = true
  }
  const response = await respond(request, { client, user, unavailable })
  for (const [name, { value, options }] of writes)
    response.cookies.set(name, value, options)
  if (writes.size) {
    // Preserve next-intl's forwarded locale while forwarding refreshed request cookies.
    const overrides = new Set(
      (response.headers.get('x-middleware-override-headers') ?? '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
    )
    overrides.add('cookie')
    response.headers.set(
      'x-middleware-request-cookie',
      request.headers.get('cookie') ?? ''
    )
    response.headers.set(
      'x-middleware-override-headers',
      [...overrides].join(',')
    )
  }
  cacheHeaders.forEach((value, name) => response.headers.set(name, value))
  if (hadSessionCookie || user || unavailable || writes.size) {
    response.headers.set(
      'Cache-Control',
      'private, no-store, max-age=0, must-revalidate'
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }
  return response
}
