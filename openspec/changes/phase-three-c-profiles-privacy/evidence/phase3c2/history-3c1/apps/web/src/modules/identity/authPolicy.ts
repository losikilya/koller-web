import { localizedPath } from '@/shared/i18n/routes'
import type { Locale } from '@/shared/i18n/routes'
export function safeAuthReturn(value: unknown, locale: Locale): string {
  const allowed = [
    '/',
    '/account',
    '/account/profile',
    '/playground',
    '/playground/practice-timer',
  ] as const
  return typeof value === 'string' &&
    allowed.some((path) => localizedPath(locale, path) === value)
    ? value
    : localizedPath(locale, '/account')
}
export function authErrorKey(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? error.code
      : undefined
  if (
    code === 'invalid_credentials' ||
    code === 'email_not_confirmed' ||
    code === 'user_not_found'
  )
    return 'credentials'
  if (
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit'
  )
    return 'rateLimit'
  if (code === 'weak_password' || code === 'same_password')
    return 'passwordPolicy'
  return 'unavailable'
}
