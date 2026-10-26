import { z } from 'zod'

const boundedText = (max: number) =>
  z.string().refine((value) => [...value].length <= max, 'Text is too long')
const usernameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]{2,29}$/)
  .refine(
    (value) => !['admin', 'support', 'system'].includes(value),
    'Reserved username'
  )
  .nullable()

export const profilePatchSchema = z
  .strictObject({
    username: usernameSchema.optional(),
    displayName: boundedText(80).optional(),
    bio: boundedText(500).optional(),
  })
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    'Empty patch'
  )

export const privacySchema = z
  .strictObject({
    visibility: z.enum(['public', 'private']),
    discoverable: z.boolean(),
    showActivity: z.literal(false),
  })
  .refine(
    (value) => value.visibility === 'public' || !value.discoverable,
    'Private profiles cannot be discoverable'
  )

export const preferencesSchema = z.strictObject({
  locale: z.enum(['en', 'ru']),
  theme: z.enum(['system', 'light', 'dark']),
})

export const playgroundDataSchema = z.strictObject({
  appKey: z.literal('practice-timer'),
  dataKey: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/),
  schemaVersion: z.literal(1),
  // No timer payload is accepted before its own versioned application contract exists.
  payload: z
    .strictObject({})
    .refine(
      (value) =>
        new TextEncoder().encode(JSON.stringify(value)).byteLength <= 16384,
      'Payload is too large'
    ),
})

export const publicProfileSchema = z.strictObject({
  userId: z.uuid(),
  username: usernameSchema,
  displayName: boundedText(80),
  bio: boundedText(500),
  avatarUrl: z.null(),
})

export type ProfilePatch = z.infer<typeof profilePatchSchema>
export type ProfilePrivacy = z.infer<typeof privacySchema>
export type UserPreferences = z.infer<typeof preferencesSchema>
export type PlaygroundDataWrite = z.infer<typeof playgroundDataSchema>
export type PublicProfileDto = z.infer<typeof publicProfileSchema>
