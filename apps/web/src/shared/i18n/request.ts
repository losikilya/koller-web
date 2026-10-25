import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

const messages = {
  en: () => import('./messages/en.json'),
  ru: () => import('./messages/ru.json'),
}
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale
  return {
    locale,
    messages: (await messages[locale]()).default,
  }
})
