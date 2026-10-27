import type { Metadata } from 'next'
import type { PublicProfileDto } from '@dance/contracts'
import { cache } from 'react'
import { readPublicProfile, createPublicProfileReader } from '@/modules/profile'
import { createSupabaseServerClient } from './supabase'
export const loadPublicProfile = cache(async (username: string) =>
  readPublicProfile(
    createPublicProfileReader(await createSupabaseServerClient()),
    username
  )
)
export function buildPublicMetadata(
  locale: 'en' | 'ru',
  profile: PublicProfileDto,
  origin: string,
  labels: { title: string; unavailable: string }
): Metadata {
  const url = (language: string) =>
    new URL('/' + language + '/u/' + profile.username, origin).toString()
  return {
    title: profile.displayName + ' — ' + labels.title,
    description: [...profile.bio].slice(0, 160).join(''),
    robots: { index: false, follow: false },
    alternates: {
      canonical: url(locale),
      languages: { en: url('en'), ru: url('ru') },
    },
  }
}
