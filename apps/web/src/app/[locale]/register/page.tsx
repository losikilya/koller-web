import { setRequestLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { routing } from '@/shared/i18n/routing'
import { Shell } from '@/shell/Shell'
import { IdentityPage } from '@/shell/IdentityPage'
type Props = { params: Promise<{ locale: string }> }
export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'identity' })
  return { title: t('registerMeta'), description: t('metaDescription') }
}
export default async function Page({ params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  return (
    <Shell path="/register">
      <IdentityPage kind="register" />
    </Shell>
  )
}
