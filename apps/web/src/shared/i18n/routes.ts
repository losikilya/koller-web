export const locales = ['en', 'ru'] as const
export type Locale = (typeof locales)[number]
export type SupportedPath =
  | '/'
  | '/playground'
  | '/playground/practice-timer'
  | '/login'
  | '/register'
  | '/forgot-password'
  | '/reset-password'
  | '/account'
  | '/account/profile'
  | `/u/${string}`
export const supportedPaths: readonly SupportedPath[] = [
  '/',
  '/playground',
  '/playground/practice-timer',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/account',
  '/account/profile',
]
export function localizedPath(locale: string, path: SupportedPath): string {
  if (!locales.some((value) => value === locale))
    throw new Error('Unsupported locale')
  return '/' + locale + (path === '/' ? '' : path)
}
export function publicProfilePath(username: string): `/u/${string}` {
  if (!/^[a-z][a-z0-9_]{2,29}$/.test(username))
    throw new Error('Invalid public username')
  return `/u/${username}`
}
export function classifyNavigationRoute(
  pathname: string
): { locale: Locale; kind: 'application' | 'account' | 'accountFlow' } | null {
  if (pathname === '/') return { locale: 'en', kind: 'application' }
  const match = /^\/(en|ru)(\/.*)?$/.exec(pathname)
  if (!match) return null
  const locale = match[1] as Locale,
    path = (match[2] ?? '').replace(/\/$/, '')
  if (path === '/account') return { locale, kind: 'account' }
  if (
    [
      '/account/profile',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/auth/confirm',
      '/auth/callback',
    ].includes(path)
  )
    return { locale, kind: 'accountFlow' }
  if (
    ['', '/playground', '/playground/practice-timer'].includes(path) ||
    /^\/u\/[a-z][a-z0-9_]{2,29}$/i.test(path)
  )
    return { locale, kind: 'application' }
  return null
}
