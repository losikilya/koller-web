import { getTranslations } from 'next-intl/server'
import { Badge, Card, Container, buttonClassName } from '@dance/ui'
import { Link } from '@/shared/i18n/navigation'
import { practiceTimer } from './catalog'
import styles from '@/shared/styles/Pages.module.scss'
export async function PlaygroundPage() {
  const t = await getTranslations('playground')
  return (
    <Container className={styles.page}>
      <p className={styles.eyebrow}>{t('eyebrow')}</p>
      <h1>{t('title')}</h1>
      <p className={styles.description}>{t('description')}</p>
      <Card className={styles.card}>
        <Badge>{t('status')}</Badge>
        <h2>{t('tool')}</h2>
        <p>{t('toolDescription')}</p>
        <Link href={practiceTimer.path} className={buttonClassName()}>
          {t('open')}
        </Link>
      </Card>
    </Container>
  )
}
export async function PracticeTimerPage() {
  const t = await getTranslations('practiceTimer')
  return (
    <Container className={styles.page}>
      <p className={styles.eyebrow}>{t('eyebrow')}</p>
      <h1>{t('description')}</h1>
      <h2>{t('title')}</h2>
      <p>
        <Badge>{t('status')}</Badge>
      </p>
      <p className={styles.description}>{t('notice')}</p>
      <Link href="/playground" className={buttonClassName()}>
        {t('back')}
      </Link>
    </Container>
  )
}
