export type ProfileClient = {
  auth: {
    getUser(): Promise<{
      data: { user: { id: string } | null }
      error: unknown
    }>
  }
  rpc(name: 'ensure_profile'): PromiseLike<{ error: unknown }>
}

export async function ensureProfile(client: ProfileClient): Promise<string> {
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) throw new Error('Unauthenticated')
  const result = await client.rpc('ensure_profile')
  if (result.error)
    throw new Error('Profile initialization failed; retry is safe')
  return data.user.id
}
