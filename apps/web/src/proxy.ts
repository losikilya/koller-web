import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './shared/i18n/routing'
const handleI18n = createMiddleware(routing)
export default function proxy(request: NextRequest) {
  const first = request.nextUrl.pathname.split('/')[1]
  if (first && !routing.locales.some((locale) => locale === first))
    return NextResponse.next()
  return handleI18n(request)
}
export const config = { matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'] }
