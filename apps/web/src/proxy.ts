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
    return handleI18n(currentRequest)
  })
}
export const config = { matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'] }
