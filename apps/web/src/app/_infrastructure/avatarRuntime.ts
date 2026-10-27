import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  avatarOperationSchema,
  AVATAR_MAX_OUTPUT_BYTES,
} from '@dance/contracts'
import type { Database } from '@/shared/supabase/database'
import { requireSupabaseConfig } from '@/shared/supabase/config'
import {
  ProfileFailure,
  readOwnProfile,
  createProfileRepository,
} from '@/modules/profile'
import type { AvatarDependencies } from '@/modules/profile'
import { processAvatar } from './avatarProcessing'
function localCapability() {
  const { url } = requireSupabaseConfig()
  const key = process.env.LOCAL_AVATAR_SERVICE_KEY
  if (
    !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname) ||
    !key
  )
    throw new ProfileFailure('service_unavailable', 503)
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: 'no-store',
          signal: init?.signal
            ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)])
            : AbortSignal.timeout(15000),
        }),
    },
  })
}
function rpcFailure(
  error: { code?: string } | null,
  status: number,
  mutation = false
) {
  if (!error) return
  const failures: Record<string, [string, number]> = {
    '40001': ['revision_conflict', 412],
    '42501': ['account_unavailable', 403],
    '54000': ['rate_limited', 429],
    '22023': ['invalid_request', 422],
    '23514': ['invalid_request', 422],
    '23505': ['operation_conflict', 409],
  }
  if (error.code && failures[error.code]) {
    const [code, http] = failures[error.code]
    throw new ProfileFailure(code, http)
  }
  throw new ProfileFailure(
    mutation && (status === 0 || status >= 500 || !error.code)
      ? 'outcome_unknown'
      : 'service_unavailable',
    503
  )
}
export function createAvatarRuntime(
  client: SupabaseClient<Database>,
  owner: string
): AvatarDependencies & {
  remove(id: string, revision: string): Promise<void>
} {
  avatarOperationSchema.parse(owner)
  const service = localCapability(),
    bucket = service.storage.from('profile-avatars')
  return {
    async reserve(id, fingerprint) {
      const r = await client.rpc('begin_own_avatar_upload', {
        p_id: id,
        p_fingerprint: fingerprint,
      })
      rpcFailure(r.error, r.status)
      if (!['pending', 'ready', 'committed'].includes(r.data ?? ''))
        throw new ProfileFailure('service_unavailable', 503)
      return r.data as 'pending' | 'ready' | 'committed'
    },
    process: processAvatar,
    async upload(id, bytes) {
      const lookup = await service.rpc('avatar_service_upload_object', {
        p_owner: owner,
        p_id: id,
      })
      rpcFailure(lookup.error, lookup.status)
      const object = avatarOperationSchema.parse(lookup.data),
        path = owner + '/' + object + '.webp'
      const stored = await bucket.upload(path, bytes, {
        contentType: 'image/webp',
        upsert: false,
        cacheControl: '0',
      })
      if (stored.error) {
        const previous = await bucket.download(path)
        if (
          previous.error ||
          !previous.data ||
          previous.data.size > AVATAR_MAX_OUTPUT_BYTES ||
          !Buffer.from(await previous.data.arrayBuffer()).equals(
            Buffer.from(bytes)
          )
        )
          throw new ProfileFailure('service_unavailable', 503)
      }
    },
    async ready(id) {
      const r = await service.rpc('avatar_service_ready', {
        p_owner: owner,
        p_id: id,
      })
      rpcFailure(r.error, r.status)
    },
    async attach(id, revision) {
      const r = await client.rpc('attach_own_avatar', {
        p_id: id,
        p_expected_revision: revision,
      })
      rpcFailure(r.error, r.status, true)
    },
    async abandon(id) {
      const r = await service.rpc('avatar_service_abandon', {
        p_owner: owner,
        p_id: id,
      })
      rpcFailure(r.error, r.status)
    },
    async remove(id, revision) {
      const r = await client.rpc('remove_own_avatar', {
        p_id: id,
        p_expected_revision: revision,
      })
      rpcFailure(r.error, r.status, true)
    },
    read: () => readOwnProfile(createProfileRepository(client), owner),
  }
}
export async function readAvatarImage(
  id: string,
  viewer: string | null
): Promise<Uint8Array | null> {
  const service = localCapability()
  const resolve = async () => {
    const r = await service.rpc('avatar_service_resolve', {
      p_id: id,
      ...(viewer ? { p_viewer: viewer } : {}),
    })
    rpcFailure(r.error, r.status)
    if (!r.data || r.data.length > 1)
      throw new ProfileFailure('service_unavailable', 503)
    return r.data[0] ?? null
  }
  const first = await resolve()
  if (!first) return null
  const owner = avatarOperationSchema.parse(first.owner_id),
    object = avatarOperationSchema.parse(first.object_id)
  const stored = await service.storage
    .from('profile-avatars')
    .download(owner + '/' + object + '.webp')
  if (stored.error || !stored.data) {
    if (
      String(stored.error?.status) === '404' ||
      String(stored.error?.statusCode) === '404'
    )
      return null
    throw new ProfileFailure('service_unavailable', 503)
  }
  if (stored.data.size > AVATAR_MAX_OUTPUT_BYTES)
    throw new ProfileFailure('service_unavailable', 503)
  const bytes = new Uint8Array(await stored.data.arrayBuffer())
  const final = await resolve()
  if (!final || final.owner_id !== owner || final.object_id !== object)
    return null
  if (
    Buffer.from(bytes).toString('ascii', 0, 4) !== 'RIFF' ||
    Buffer.from(bytes).toString('ascii', 8, 12) !== 'WEBP'
  )
    throw new ProfileFailure('service_unavailable', 503)
  return bytes
}
