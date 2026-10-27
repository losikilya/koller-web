import { notFound, redirect } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container, Button } from '@dance/ui'
import { routing } from '@/shared/i18n/routing'
import { verifiedIdentity, bootstrapAccount } from '@/modules/identity'
import { getSupabaseConfig } from '@/shared/supabase/config'
import { createSupabaseServerClient } from '@/app/_infrastructure/supabase'
import { Shell } from '@/app/_infrastructure/shell'
import styles from '@/shared/styles/Pages.module.scss'
import { Link } from '@/shared/i18n/navigation'
export const dynamic = 'force-dynamic'
type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ bootstrap?: string; error?: string }>
}
export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'identity' })
  return {
    title: t('accountTitle') + ' — Dance Platform',
    description: t('metaDescription'),
  }
}
export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  if (!getSupabaseConfig())
    redirect(
      '/' +
        locale +
        '/login?next=' +
        encodeURIComponent('/' + locale + '/account')
    )
  const client = await createSupabaseServerClient()
  const identity = await verifiedIdentity(client).catch(() => null)
  if (!identity)
    redirect(
      '/' +
        locale +
        '/login?next=' +
        encodeURIComponent('/' + locale + '/account')
    )
  const query = await searchParams
  const result =
    query.bootstrap === 'retry'
      ? { bootstrap: 'retry' }
      : await bootstrapAccount(client)
  const t = await getTranslations('identity')
  const profileText = await getTranslations('profile')
  return (
    <Shell path="/account">
      <Container className={styles.page}>
        <h1>{t('accountTitle')}</h1>
        <p>{t('accountDescription')}</p>
        {result.bootstrap === 'ready' && (
          <p>
            <Link href="/account/profile">{profileText('title')}</Link>
          </p>
        )}
        <p className={styles.breakText}>
          {t('verifiedEmail')}: {identity.email}
        </p>
        {query.error && <p role="alert">{t('unavailable')}</p>}
        {result.bootstrap === 'ready' ? (
          <p role="status">{t('ready')}</p>
        ) : (
          <>
            <p role="alert">{t('retryDescription')}</p>
            <form action="/api/auth/bootstrap" method="post">
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit">{t('retry')}</Button>
            </form>
          </>
        )}
      </Container>
    </Shell>
  )
}
