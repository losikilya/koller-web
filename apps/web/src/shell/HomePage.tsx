import { getTranslations } from 'next-intl/server'
import { Container, buttonClassName } from '@dance/ui'
import { Link } from '@/shared/i18n/navigation'
import styles from '@/shared/styles/Pages.module.scss'
export async function HomePage() {
  const t = await getTranslations('home')
  return (
    <Container>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{t('eyebrow')}</p>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.description}>{t('description')}</p>
          <Link className={buttonClassName()} href="/playground">
            {t('action')} <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className={styles.art} aria-hidden="true" />
      </section>
      <section className={styles.section}>
        <h2>{t('section')}</h2>
        <p className={styles.description}>{t('sectionDescription')}</p>
        <div className={styles.grid}>
          {(['practice', 'connect', 'grow'] as const).map((key) => (
            <article key={key}>
              <h3>{t(key)}</h3>
              <p>{t(key + 'Description')}</p>
            </article>
          ))}
        </div>
      </section>
    </Container>
  )
}
