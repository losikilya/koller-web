import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './shared/i18n/routing'
import { refreshSession } from './shared/supabase/refreshSession'
import {
  readCompletion,
  readPublicProfile,
  createPublicProfileReader,
} from '@/modules/profile'
import { classifyNavigationRoute, localizedPath } from './shared/i18n/routes'
import en from './shared/i18n/messages/en.json'
import ru from './shared/i18n/messages/ru.json'
const handleI18n = createMiddleware(routing)
export default function proxy(request: NextRequest) {
  return refreshSession(request, async (currentRequest, context) => {
    const first = currentRequest.nextUrl.pathname.split('/')[1]
    if (first && !routing.locales.some((locale) => locale === first))
      return NextResponse.next()
    const pathname = currentRequest.nextUrl.pathname
    const publicMatch = /^\/(en|ru)\/u\/([a-z][a-z0-9_]{2,29})\/?$/i.exec(
      pathname
    )
    let response
    try {
      const recovery =
        currentRequest.nextUrl.searchParams.get('bootstrap') === 'retry'
      const route = classifyNavigationRoute(pathname)
      const needsGate =
        route &&
        route.kind !== 'accountFlow' &&
        !(route.kind === 'account' && recovery)
      if (context?.unavailable && (needsGate || publicMatch))
        throw new Error('Identity verification unavailable')
      if (context?.user?.email_confirmed_at && needsGate) {
        if (!(await readCompletion(context.client, context.user.id)))
          return NextResponse.redirect(
            new URL(
              localizedPath(route.locale, '/account/profile'),
              currentRequest.url
            ),
            {
              headers: {
                'Cache-Control': 'private, no-store',
                'X-Robots-Tag': 'noindex, nofollow',
              },
            }
          )
      }
      if (publicMatch) {
        if (!context) throw new Error('Profile dependency unavailable')
        await readPublicProfile(
          createPublicProfileReader(context.client),
          publicMatch[2]
        )
      }
      response = handleI18n(currentRequest)
    } catch {
      const labels = first === 'ru' ? ru.profile : en.profile
      return new NextResponse(
        '<!doctype html><html lang="' +
          (first === 'ru' ? 'ru' : 'en') +
          '"><head><meta name="robots" content="noindex,nofollow"><title>' +
          labels.publicUnavailable +
          '</title></head><body><main><h1>' +
          labels.publicServiceUnavailable +
          '</h1></main></body></html>',
        {
          status: 503,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'private, no-store',
            'X-Robots-Tag': 'noindex, nofollow',
          },
        }
      )
    }
    if (
      classifyNavigationRoute(pathname) ||
      /^\/(en|ru)\/(?:account|u)(?:\/|$)/.test(pathname)
    ) {
      response.headers.set(
        'Cache-Control',
        'private, no-store, max-age=0, must-revalidate'
      )
      if (/^\/(en|ru)\/(?:account|u)(?:\/|$)/.test(pathname))
        response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    }
    return response
  })
}
export const config = { matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'] }
