'use client'
import { useRouter } from 'next/navigation'
import type { OwnProfile } from '@dance/contracts'
import { ProfileEditor } from '@/modules/profile'
export function ProfileForm({
  profile,
  etag,
}: {
  profile: OwnProfile
  etag: string
}) {
  const router = useRouter()
  return (
    <ProfileEditor
      initialProfile={profile}
      initialEtag={etag}
      onCompleted={() => router.refresh()}
    />
  )
}
