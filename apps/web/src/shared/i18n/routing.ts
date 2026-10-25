import { defineRouting } from 'next-intl/routing'
import { locales } from './routes'
export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
  localeDetection: false,
})
