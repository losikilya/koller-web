import { notFound, redirect } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container, EmptyState } from '@dance/ui'
import { routing } from '@/shared/i18n/routing'
import { Link } from '@/shared/i18n/navigation'
import { verifiedIdentity, bootstrapAccount } from '@/modules/identity'
import { readOwnProfile, createProfileRepository } from '@/modules/profile'
import { ProfileForm } from '@/app/_infrastructure/ProfileForm'
import { getSupabaseConfig } from '@/shared/supabase/config'
import { createSupabaseServerClient } from '@/app/_infrastructure/supabase'
import { Shell } from '@/app/_infrastructure/shell'
import styles from '@/shared/styles/Pages.module.scss'
export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ locale: string }> }
export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'profile' })
  return {
    title: t('title') + ' — Dance Platform',
    description: t('description'),
    robots: { index: false, follow: false },
  }
}
export default async function Page({ params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const login =
    '/' +
    locale +
    '/login?next=' +
    encodeURIComponent('/' + locale + '/account/profile')
  if (!getSupabaseConfig()) redirect(login)
  const client = await createSupabaseServerClient()
  const principal = await verifiedIdentity(client).catch(() => null)
  if (!principal) redirect(login)
  const bootstrap = await bootstrapAccount(client)
  if (bootstrap.bootstrap !== 'ready')
    redirect('/' + locale + '/account?bootstrap=retry')
  const t = await getTranslations('profile')
  const result = await readOwnProfile(
    createProfileRepository(client),
    principal.id
  ).catch(() => null)
  return (
    <Shell path="/account/profile">
      <Container className={styles.page}>
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
        {result ? (
          <ProfileForm profile={result.profile} etag={result.etag} />
        ) : (
          <EmptyState
            title={t('service_unavailable')}
            action={<Link href="/account">{t('account')}</Link>}
          />
        )}
        <p>
          <Link href="/account">{t('account')}</Link>
        </p>
      </Container>
    </Shell>
  )
}
