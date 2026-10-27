import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './shared/i18n/routing'
import { refreshSession } from './shared/supabase/refreshSession'
const handleI18n = createMiddleware(routing)
export default function proxy(request: NextRequest) {
  return refreshSession(request, (currentRequest) => {
    const first = currentRequest.nextUrl.pathname.split('/')[1]
    if (first && !routing.locales.some((locale) => locale === first))
      return NextResponse.next()
    const response = handleI18n(currentRequest)
    if (/^\/(en|ru)\/account(?:\/|$)/.test(currentRequest.nextUrl.pathname)) {
      response.headers.set(
        'Cache-Control',
        'private, no-store, max-age=0, must-revalidate'
      )
      response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    }
    return response
  })
}
export const config = { matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'] }
