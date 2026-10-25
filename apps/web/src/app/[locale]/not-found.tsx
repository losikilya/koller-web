import { getTranslations } from 'next-intl/server'
import { Link } from '@/shared/i18n/navigation'
import { Container } from '@dance/ui'
export default async function NotFound() {
  const t = await getTranslations('shell')
  return (
    <Container>
      <h1>{t('notFound')}</h1>
      <p>{t('notFoundDescription')}</p>
      <Link href="/">{t('home')}</Link>
    </Container>
  )
}
