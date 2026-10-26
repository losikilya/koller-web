export type SupabasePublicConfig = { url: string; publishableKey: string }

export function readSupabaseConfig(source: {
  url?: string
  publishableKey?: string
}): SupabasePublicConfig | null {
  if (!source.url && !source.publishableKey) return null
  const invalid = () => new Error('Invalid Supabase public configuration')
  if (!source.url || !source.publishableKey) throw invalid()
  let url: URL
  try {
    url = new URL(source.url)
  } catch {
    throw invalid()
  }
  const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (
    (url.protocol !== 'https:' && !(isLoopback && url.protocol === 'http:')) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw invalid()
  const key = source.publishableKey
  let isLocalAnon = false
  if (isLoopback && /^eyJ[^.]+\.[^.]+\.[^.]+$/.test(key)) {
    try {
      const claims: unknown = JSON.parse(
        atob(key.split('.')[1].replaceAll('-', '+').replaceAll('_', '/'))
      )
      isLocalAnon =
        typeof claims === 'object' &&
        claims !== null &&
        'role' in claims &&
        claims.role === 'anon'
    } catch {
      /* Invalid key classification; never an authorization check. */
    }
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key) && !isLocalAnon)
    throw invalid()
  return { url: source.url, publishableKey: key }
}

export function getSupabaseConfig() {
  return readSupabaseConfig({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })
}

export function requireSupabaseConfig() {
  const config = getSupabaseConfig()
  if (!config) throw new Error('Supabase is not configured')
  return config
}
