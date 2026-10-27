import {
  ownProfileSchema,
  profileFormPatchSchema,
  profileRevisionSchema,
  profileCompletionSchema,
} from '@dance/contracts'
import type { OwnProfile, ProfilePatch } from '@dance/contracts'
export type OwnerRecord = Omit<OwnProfile, 'avatarUrl'>
export type ProfileRepository = {
  read(userId: string): Promise<OwnerRecord | null>
  write(
    userId: string,
    patch: ProfilePatch,
    revision: string
  ): Promise<{ code: string } | null>
  complete?(
    userId: string,
    patch: ProfilePatch,
    profileRevision: string,
    privacyRevision: string
  ): Promise<{ code: string } | null>
}
export class ProfileFailure extends Error {
  readonly code: string
  readonly status: number
  constructor(code: string, status: number) {
    super(code)
    this.code = code
    this.status = status
  }
}
export function profileEtag(revision: string) {
  return '"profile-' + profileRevisionSchema.parse(revision) + '"'
}
export function parseProfileEtag(value: string | null): string {
  return parseRevisionEtag(value, 'profile')
}
export function parseRevisionEtag(
  value: string | null,
  prefix: 'profile' | 'privacy'
): string {
  if (!value) throw new ProfileFailure('precondition_required', 428)
  const match = new RegExp('^"' + prefix + '-([1-9][0-9]*)"$').exec(value)
  if (!match || !profileRevisionSchema.safeParse(match[1]).success)
    throw new ProfileFailure('invalid_request', 400)
  return match[1]
}
export async function readOwnProfile(
  repository: ProfileRepository,
  userId: string
): Promise<{ profile: OwnProfile; etag: string }> {
  const row = await repository.read(userId)
  if (!row) throw new ProfileFailure('bootstrap_incomplete', 503)
  if (row.userId !== userId)
    throw new ProfileFailure('account_unavailable', 403)
  const profile = ownProfileSchema.parse({
    userId: row.userId,
    username: row.username,
    displayName: row.displayName,
    bio: row.bio,
    avatarUrl: null,
    completed: row.completed ?? false,
    revision: row.revision,
    updatedAt: row.updatedAt,
    privacy: {
      visibility: row.privacy.visibility,
      discoverable: row.privacy.discoverable,
      showActivity: row.privacy.showActivity,
      revision: row.privacy.revision,
    },
  })
  return { profile, etag: profileEtag(profile.revision) }
}
export async function completeOwnProfile(
  repository: ProfileRepository,
  userId: string,
  input: unknown,
  profileRevision: string,
  privacyRevision: string
): Promise<{ profile: OwnProfile; etag: string }> {
  const patch = profileCompletionSchema.safeParse(input)
  if (
    !patch.success ||
    !profileRevisionSchema.safeParse(profileRevision).success ||
    !profileRevisionSchema.safeParse(privacyRevision).success
  )
    throw new ProfileFailure('completion_required', 422)
  if (!repository.complete) throw new ProfileFailure('service_unavailable', 503)
  let error: { code: string } | null
  try {
    error = await repository.complete(
      userId,
      patch.data,
      profileRevision,
      privacyRevision
    )
  } catch {
    throw new ProfileFailure('outcome_unknown', 503)
  }
  if (error) {
    const codes: Record<string, [string, number]> = {
      '23505': ['username_unavailable', 409],
      '40001': ['revision_conflict', 412],
      '42501': ['account_unavailable', 403],
      '22023': ['completion_required', 422],
      '23514': ['completion_required', 422],
    }
    const [code, status] = codes[error.code] ?? ['service_unavailable', 503]
    throw new ProfileFailure(code, status)
  }
  try {
    return await readOwnProfile(repository, userId)
  } catch {
    throw new ProfileFailure('outcome_unknown', 503)
  }
}
export async function saveOwnProfile(
  repository: ProfileRepository,
  userId: string,
  input: unknown,
  revision: string
): Promise<{ profile: OwnProfile; etag: string }> {
  const patch = profileFormPatchSchema.safeParse(input)
  if (!patch.success || !profileRevisionSchema.safeParse(revision).success)
    throw new ProfileFailure('validation_failed', 422)
  let error: { code: string } | null
  try {
    error = await repository.write(userId, patch.data, revision)
  } catch {
    throw new ProfileFailure('outcome_unknown', 503)
  }
  if (error) {
    const failures: Record<string, [string, number]> = {
      '23505': ['username_unavailable', 409],
      '40001': ['revision_conflict', 412],
      '42501': ['account_unavailable', 403],
      '22023': ['validation_failed', 422],
      '23514': ['validation_failed', 422],
    }
    const [code, status] = failures[error.code] ?? ['service_unavailable', 503]
    throw new ProfileFailure(code, status)
  }
  try {
    return await readOwnProfile(repository, userId)
  } catch {
    throw new ProfileFailure('outcome_unknown', 503)
  }
}
