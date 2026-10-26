import { getTranslations, getLocale } from 'next-intl/server'
import { Container } from '@dance/ui'
import { AuthForm } from '@/modules/identity'
import type { Locale } from '@/shared/i18n/routes'
import styles from '@/shared/styles/Pages.module.scss'
export async function IdentityPage({
  kind,
  next,
  error,
}: {
  kind: 'login' | 'register' | 'forgot-password' | 'reset-password'
  next?: string
  error?: string
}) {
  const t = await getTranslations('identity')
  const locale = (await getLocale()) as Locale
  const prefix =
    kind === 'forgot-password'
      ? 'forgot'
      : kind === 'reset-password'
      ? 'reset'
      : kind
  return (
    <Container className={styles.page}>
      <p className={styles.eyebrow}>{t('eyebrow')}</p>
      <h1>{t(prefix + 'Title')}</h1>
      <p className={styles.description}>{t(prefix + 'Description')}</p>
      {error && (
        <p role="alert">
          {t(error === 'invalidLink' ? 'invalidLink' : 'unavailable')}
        </p>
      )}
      <AuthForm kind={kind} locale={locale} next={next} />
    </Container>
  )
}
