import type { SupabaseClient } from '@supabase/supabase-js'
import {
  registrationSchema,
  loginSchema,
  recoverySchema,
  resetPasswordSchema,
} from '@dance/contracts'
import type { Database } from '@/shared/supabase/database'
import { ensureProfile } from './ensureProfile'
import { authErrorKey } from './authPolicy'
export type AuthClient = SupabaseClient<Database>
export type AuthResult = {
  status: 'success' | 'pending' | 'error'
  error?: string
  bootstrap?: 'ready' | 'retry'
  url?: string
}
const failure = (error = 'unavailable'): AuthResult => ({
  status: 'error',
  error,
})
export async function verifiedIdentity(client: AuthClient) {
  const { data, error } = await client.auth.getUser()
  return !error && data.user?.email_confirmed_at
    ? { id: data.user.id, email: data.user.email }
    : null
}
export async function bootstrapAccount(
  client: AuthClient
): Promise<AuthResult> {
  try {
    if (!(await verifiedIdentity(client))) return failure('credentials')
    try {
      await ensureProfile(client)
      return { status: 'success', bootstrap: 'ready' }
    } catch {
      return { status: 'success', bootstrap: 'retry' }
    }
  } catch {
    return failure()
  }
}
export async function registerAccount(
  client: AuthClient,
  input: unknown,
  redirect: string
): Promise<AuthResult> {
  const parsed = registrationSchema.safeParse(input)
  if (!parsed.success) return failure('validation')
  try {
    const { email, password } = parsed.data
    const { error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirect },
    })
    // Suppress account-existence differences; confirmation remains required.
    if (error && error.code !== 'user_already_exists')
      return failure(authErrorKey(error))
    return { status: 'pending' }
  } catch {
    return failure()
  }
}
export async function loginAccount(
  client: AuthClient,
  input: unknown
): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) return failure('validation')
  try {
    const { error } = await client.auth.signInWithPassword(parsed.data)
    return error ? failure(authErrorKey(error)) : await bootstrapAccount(client)
  } catch {
    return failure()
  }
}
export async function recoverPassword(
  client: AuthClient,
  input: unknown,
  redirect: string
): Promise<AuthResult> {
  const parsed = recoverySchema.safeParse(input)
  if (!parsed.success) return failure('validation')
  try {
    await client.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: redirect,
    })
  } catch {
    // Delivery failures and per-address limits must not reveal account existence.
  }
  return { status: 'pending' }
}
export async function resetPassword(
  client: AuthClient,
  input: unknown
): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) return failure('validation')
  try {
    if (!(await verifiedIdentity(client))) return failure('invalidLink')
    const { error } = await client.auth.updateUser({
      password: parsed.data.password,
    })
    return error ? failure(authErrorKey(error)) : { status: 'success' }
  } catch {
    return failure()
  }
}
export async function logoutAccount(client: AuthClient): Promise<AuthResult> {
  try {
    const { error } = await client.auth.signOut({ scope: 'local' })
    return error ? failure() : { status: 'success' }
  } catch {
    return failure()
  }
}
export async function verifyEmail(
  client: AuthClient,
  hash: string,
  type: 'signup' | 'recovery'
): Promise<AuthResult> {
  if (!hash || hash.length > 2048) return failure('invalidLink')
  try {
    const { error } = await client.auth.verifyOtp({ token_hash: hash, type })
    return error ? failure('invalidLink') : await bootstrapAccount(client)
  } catch {
    return failure('invalidLink')
  }
}
export async function completeOAuth(
  client: AuthClient,
  code: string
): Promise<AuthResult> {
  if (!code || code.length > 2048) return failure('invalidLink')
  try {
    const { error } = await client.auth.exchangeCodeForSession(code)
    return error ? failure('invalidLink') : await bootstrapAccount(client)
  } catch {
    return failure('invalidLink')
  }
}
export async function startGoogle(
  client: AuthClient,
  redirect: string
): Promise<AuthResult> {
  try {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirect, skipBrowserRedirect: true },
    })
    return error || !data.url ? failure() : { status: 'success', url: data.url }
  } catch {
    return failure()
  }
}
