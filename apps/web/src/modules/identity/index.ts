export { ensureProfile } from './ensureProfile'

export { AuthForm } from './AuthForm'
export { safeAuthReturn, authErrorKey } from './authPolicy'
export {
  registerAccount,
  loginAccount,
  recoverPassword,
  resetPassword,
  logoutAccount,
  verifyEmail,
  completeOAuth,
  startGoogle,
  bootstrapAccount,
  verifiedIdentity,
} from './authService'
export type { AuthClient, AuthResult } from './authService'
