import { setRequestLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { routing } from '@/shared/i18n/routing'
import { Shell } from '@/app/_infrastructure/shell'
import { PracticeTimerPage } from '@/modules/playground'
type Props = { params: Promise<{ locale: string }> }
export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'practiceTimer' })
  return { title: t('metaTitle'), description: t('metaDescription') }
}
export default async function Page({ params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  return (
    <Shell path="/playground/practice-timer">
      <PracticeTimerPage />
    </Shell>
  )
}
