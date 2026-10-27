import { classifyNavigationRoute, localizedPath } from '@/shared/i18n/routes'
export function completionRedirect(
  pathname: string,
  completed: boolean,
  bootstrapRecovery = false
): string | null {
  if (completed) return null
  const route = classifyNavigationRoute(pathname)
  if (
    !route ||
    route.kind === 'accountFlow' ||
    (route.kind === 'account' && bootstrapRecovery)
  )
    return null
  return localizedPath(route.locale, '/account/profile')
}
