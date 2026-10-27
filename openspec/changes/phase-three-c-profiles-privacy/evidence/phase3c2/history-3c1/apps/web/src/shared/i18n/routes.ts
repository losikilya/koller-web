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
