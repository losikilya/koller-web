import { z } from 'zod'

export const AVATAR_MAX_FILE_BYTES = 2 * 1024 * 1024
export const AVATAR_MAX_REQUEST_BYTES = AVATAR_MAX_FILE_BYTES + 16 * 1024
export const AVATAR_MAX_OUTPUT_BYTES = 1024 * 1024
export const AVATAR_MAX_SIDE = 4096
export const AVATAR_MAX_PIXELS = 16_000_000
export const AVATAR_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const
export const avatarOperationSchema = z.uuid()
export const controlledAvatarUrlSchema = z
  .string()
  .regex(
    /^\/api\/v1\/profile-avatars\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
  )
export function avatarUrlFor(id: string): string {
  return (
    '/api/v1/profile-avatars/' + avatarOperationSchema.parse(id).toLowerCase()
  )
}
