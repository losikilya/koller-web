import {
  AVATAR_MAX_FILE_BYTES,
  avatarOperationSchema,
  profileRevisionSchema,
} from '@dance/contracts'
import type { OwnProfile } from '@dance/contracts'
import { ProfileFailure } from './profileService'
export type AvatarResult = { profile: OwnProfile; etag: string }
export type AvatarDependencies = {
  reserve(
    id: string,
    fingerprint: string
  ): Promise<'pending' | 'ready' | 'committed'>
  process(bytes: Uint8Array, mime: string): Promise<Uint8Array>
  upload(id: string, bytes: Uint8Array): Promise<void>
  ready(id: string): Promise<void>
  attach(id: string, revision: string): Promise<void>
  abandon(id: string): Promise<void>
  read(): Promise<AvatarResult>
}
export type AvatarInput = {
  id: string
  fingerprint: string
  bytes: Uint8Array
  mime: string
  revision: string
}
function validateOperation(id: string, revision: string) {
  if (
    !avatarOperationSchema.safeParse(id).success ||
    !profileRevisionSchema.safeParse(revision).success
  )
    throw new ProfileFailure('invalid_request', 400)
}
export async function saveAvatar(
  deps: AvatarDependencies,
  input: AvatarInput
): Promise<AvatarResult> {
  validateOperation(input.id, input.revision)
  if (input.bytes.byteLength > AVATAR_MAX_FILE_BYTES)
    throw new ProfileFailure('payload_too_large', 413)
  if (!/^[0-9a-f]{64}$/.test(input.fingerprint))
    throw new ProfileFailure('invalid_request', 400)
  let state: 'pending' | 'ready' | 'committed'
  try {
    state = await deps.reserve(input.id, input.fingerprint)
  } catch (error) {
    throw error instanceof ProfileFailure
      ? error
      : new ProfileFailure('service_unavailable', 503)
  }
  if (state === 'pending') {
    try {
      const bytes = await deps.process(input.bytes, input.mime)
      await deps.upload(input.id, bytes)
      await deps.ready(input.id)
    } catch (error) {
      await deps.abandon(input.id).catch(() => {})
      throw error instanceof ProfileFailure
        ? error
        : new ProfileFailure('service_unavailable', 503)
    }
  }
  if (state !== 'committed') {
    try {
      await deps.attach(input.id, input.revision)
    } catch (error) {
      if (error instanceof ProfileFailure && error.status < 500) {
        await deps.abandon(input.id).catch(() => {})
        throw error
      }
      throw new ProfileFailure('outcome_unknown', 503)
    }
  }
  try {
    return await deps.read()
  } catch {
    throw new ProfileFailure('outcome_unknown', 503)
  }
}
export async function removeAvatar(
  deps: {
    remove(id: string, revision: string): Promise<void>
    read(): Promise<AvatarResult>
  },
  id: string,
  revision: string
): Promise<AvatarResult> {
  validateOperation(id, revision)
  try {
    await deps.remove(id, revision)
  } catch (error) {
    throw error instanceof ProfileFailure && error.status < 500
      ? error
      : new ProfileFailure('outcome_unknown', 503)
  }
  try {
    return await deps.read()
  } catch {
    throw new ProfileFailure('outcome_unknown', 503)
  }
}
