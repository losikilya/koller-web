import { notFound, redirect } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container, Card } from '@dance/ui'
import { routing } from '@/shared/i18n/routing'
import { publicProfilePath } from '@/shared/i18n/routes'
import { normalizedPublicUsername } from '@/modules/profile'
import { Shell } from '@/app/_infrastructure/shell'
import { requirePageCompletion } from '@/app/_infrastructure/completion'
import {
  loadPublicProfile,
  buildPublicMetadata,
} from '@/app/_infrastructure/publicProfile'
import { authOrigin } from '@/app/_infrastructure/requestContext'
import styles from '@/shared/styles/Pages.module.scss'
export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ locale: string; username: string }> }
async function context(params: Props['params']) {
  const { locale, username } = await params
  if (
    !hasLocale(routing.locales, locale) ||
    !normalizedPublicUsername(username)
  )
    notFound()
  await requirePageCompletion(
    locale,
    publicProfilePath(normalizedPublicUsername(username)!)
  )
  return { locale, username }
}
export async function generateMetadata({ params }: Props) {
  const { locale, username } = await context(params)
  const t = await getTranslations({ locale, namespace: 'profile' })
  const profile = await loadPublicProfile(username)
  return profile
    ? buildPublicMetadata(locale, profile, authOrigin(), {
        title: t('publicTitle'),
        unavailable: t('publicUnavailable'),
      })
    : { title: t('publicUnavailable'), robots: { index: false, follow: false } }
}
export default async function Page({ params }: Props) {
  const { locale, username } = await context(params)
  setRequestLocale(locale)
  const profile = await loadPublicProfile(username)
  if (!profile?.username) notFound()
  if (username !== profile.username)
    redirect('/' + locale + publicProfilePath(profile.username))
  return (
    <Shell path={publicProfilePath(profile.username)}>
      <Container className={styles.page}>
        <Card>
          <h1 className={styles.breakText}>{profile.displayName}</h1>
          {profile.avatarUrl && (
            <img
              src={profile.avatarUrl}
              alt=""
              width={96}
              height={96}
              style={{ objectFit: 'cover', borderRadius: '50%' }}
            />
          )}
          <p>@{profile.username}</p>
          {profile.bio && (
            <p className={styles.breakText} style={{ whiteSpace: 'pre-wrap' }}>
              {profile.bio}
            </p>
          )}
        </Card>
      </Container>
    </Shell>
  )
}
