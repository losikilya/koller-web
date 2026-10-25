import type { ReactNode } from 'react'
import { getLocale, getTranslations } from 'next-intl/server'
import { Container } from '@dance/ui'
import { Link } from '@/shared/i18n/navigation'
import type { SupportedPath } from '@/shared/i18n/routes'
import { MobileNavigation } from './MobileNavigation'
import { navigation } from './navigation'
import styles from './Shell.module.scss'
export async function Shell({
  path,
  children,
}: {
  path: SupportedPath
  children: ReactNode
}) {
  const t = await getTranslations('shell')
  const locale = await getLocale()
  const links = (
    <>
      {navigation.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          aria-current={path === item.path ? 'page' : undefined}
        >
          {t(item.label)}
        </Link>
      ))}
      <Link
        href={path}
        locale={locale === 'en' ? 'ru' : 'en'}
        hrefLang={locale === 'en' ? 'ru' : 'en'}
        aria-label={t('language') + ': ' + t('switchLanguage')}
      >
        {t('switchLanguage')}
      </Link>
    </>
  )
  return (
    <>
      <a className={styles.skip} href="#main">
        {t('skip')}
      </a>
      <header className={styles.header}>
        <Container className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <span aria-hidden="true" className={styles.mark}>
              d<span>p</span>
            </span>
            {t('brand')}
          </Link>
          <nav aria-label={t('navigation')}>
            <div className={styles.desktop}>{links}</div>
            <MobileNavigation key={locale + path} label={t('menu')}>
              {links}
            </MobileNavigation>
          </nav>
        </Container>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className={styles.footer}>
        <Container className={styles.footerInner}>
          <div>
            <strong>{t('brand')}</strong>
            <p>{t('footer')}</p>
          </div>
          <p>{t('copyright')}</p>
        </Container>
      </footer>
    </>
  )
}
