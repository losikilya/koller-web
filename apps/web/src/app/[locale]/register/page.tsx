import { setRequestLocale, getTranslations } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { routing } from '@/shared/i18n/routing'
import { Shell } from '@/app/_infrastructure/shell'
import { IdentityPage } from '@/shell/IdentityPage'
import { createSupabaseServerClient } from '@/app/_infrastructure/supabase'
import { getSupabaseConfig } from '@/shared/supabase/config'
import { verifiedIdentity, safeAuthReturn } from '@/modules/identity'
type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string; error?: string }>
}
export const dynamic = 'force-dynamic'
export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'identity' })
  return {
    title: t('registerMeta'),
    description: t('metaDescription'),
  }
}
export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const query = await searchParams
  const identity = getSupabaseConfig()
    ? await verifiedIdentity(await createSupabaseServerClient()).catch(
        () => null
      )
    : null
  if (identity && !query.error) redirect(safeAuthReturn(query.next, locale))
  return (
    <Shell path="/register">
      <IdentityPage
        kind="register"
        next={safeAuthReturn(query.next, locale)}
        error={query.error}
      />
    </Shell>
  )
}
