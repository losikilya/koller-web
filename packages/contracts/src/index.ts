export type PlaygroundAppId = 'practice-timer'
export {
  profileRevisionSchema,
  profileFormPatchSchema,
  ownProfileSchema,
  profileCompletionSchema,
} from './profile'
export type { OwnProfile } from './profile'
export {
  profilePatchSchema,
  privacySchema,
  preferencesSchema,
  playgroundDataSchema,
  publicProfileSchema,
} from './identity'
export type {
  ProfilePatch,
  ProfilePrivacy,
  UserPreferences,
  PlaygroundDataWrite,
  PublicProfileDto,
} from './identity'

export {
  emailSchema,
  passwordSchema,
  loginSchema,
  registrationSchema,
  resetPasswordSchema,
  recoverySchema,
} from './auth'
export {
  AVATAR_MAX_FILE_BYTES,
  AVATAR_MAX_REQUEST_BYTES,
  AVATAR_MAX_OUTPUT_BYTES,
  AVATAR_MAX_SIDE,
  AVATAR_MAX_PIXELS,
  AVATAR_MIME_TYPES,
  avatarOperationSchema,
  controlledAvatarUrlSchema,
  avatarUrlFor,
} from './avatar'
