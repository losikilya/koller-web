import type { SupportedPath } from '@/shared/i18n/routes'
export const navigation = [
  { path: '/', label: 'home' },
  { path: '/playground', label: 'playground' },
  { path: '/login', label: 'login' },
  { path: '/register', label: 'register' },
] as const satisfies readonly { path: SupportedPath; label: string }[]
