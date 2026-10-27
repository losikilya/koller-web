import { z } from 'zod'
import {
  profilePatchSchema,
  publicProfileSchema,
  privacySchema,
} from './identity'
export const profileRevisionSchema = z
  .string()
  .regex(/^[1-9][0-9]{0,18}$/)
  .refine(
    (value) => value.length < 19 || value <= '9223372036854775807',
    'Invalid revision'
  )
const trimSpaces = (value: string) => value.replace(/^ +| +$/g, '')
export const profileFormPatchSchema = z
  .strictObject({
    username: z
      .string()
      .nullable()
      .transform((value) => {
        if (value === null) return null
        const handle = trimSpaces(value).replace(/[A-Z]/g, (letter) =>
          letter.toLowerCase()
        )
        return handle === '' ? null : handle
      })
      .optional(),
    displayName: z.string().transform(trimSpaces).optional(),
    bio: z
      .string()
      .transform((value) => value.replaceAll('\r\n', '\n'))
      .optional(),
  })
  .pipe(profilePatchSchema)
export const ownProfileSchema = publicProfileSchema.extend({
  revision: profileRevisionSchema,
  updatedAt: z.iso.datetime({ offset: true }),
  privacy: privacySchema.extend({ revision: profileRevisionSchema }),
})
export type OwnProfile = z.infer<typeof ownProfileSchema>
