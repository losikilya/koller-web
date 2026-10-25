import { getTranslations } from 'next-intl/server'
import { Container, buttonClassName } from '@dance/ui'
import { Link } from '@/shared/i18n/navigation'
import styles from '@/shared/styles/Pages.module.scss'
export async function IdentityPage({ kind }: { kind: 'login' | 'register' }) {
  const t = await getTranslations('identity')
  return (
    <Container className={styles.page}>
      <p className={styles.eyebrow}>{t('eyebrow')}</p>
      <h1>{t(kind + 'Title')}</h1>
      <p className={styles.description}>{t(kind + 'Description')}</p>
      <Link href="/playground" className={buttonClassName()}>
        {t('action')}
      </Link>
    </Container>
  )
}
