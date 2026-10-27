import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { verifiedIdentity } from '@/modules/identity'
import {
  readOwnProfile,
  saveOwnProfile,
  createProfileRepository,
  ProfileFailure,
  parseProfileEtag,
} from '@/modules/profile'
import { authOrigin, responseContext } from './requestContext'
async function readJson(request: NextRequest): Promise<unknown> {
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    throw new ProfileFailure('invalid_request', 415)
  const reader = request.body?.getReader()
  if (!reader) throw new ProfileFailure('invalid_json', 400)
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 16384) {
        await reader.cancel()
        throw new ProfileFailure('payload_too_large', 413)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    throw new ProfileFailure('invalid_json', 400)
  }
}
export async function handleProfileRequest(
  request: NextRequest,
  operation: 'read' | 'write'
) {
  const requestId = crypto.randomUUID()
  let context: ReturnType<typeof responseContext> | undefined
  const finish = (response: NextResponse) => {
    response.headers.set('X-Request-Id', requestId)
    response.headers.set(
      'Cache-Control',
      'private, no-store, max-age=0, must-revalidate'
    )
    response.headers.set('Referrer-Policy', 'no-referrer')
    return context ? context.finish(response) : response
  }
  try {
    if (operation === 'write' && request.headers.get('origin') !== authOrigin())
      throw new ProfileFailure('forbidden', 403)
    if (request.nextUrl.search) throw new ProfileFailure('invalid_request', 400)
    context = responseContext(request)
    const identity = await verifiedIdentity(context.client)
    if (!identity) throw new ProfileFailure('unauthenticated', 401)
    const repository = createProfileRepository(context.client)
    const result =
      operation === 'read'
        ? await readOwnProfile(repository, identity.id)
        : await saveOwnProfile(
            repository,
            identity.id,
            await readJson(request),
            parseProfileEtag(request.headers.get('if-match'))
          )
    return finish(
      NextResponse.json(
        { profile: result.profile },
        { headers: { ETag: result.etag } }
      )
    )
  } catch (error) {
    const failure =
      error instanceof ProfileFailure
        ? error
        : new ProfileFailure('service_unavailable', 503)
    return finish(
      NextResponse.json(
        { error: { code: failure.code, requestId } },
        { status: failure.status }
      )
    )
  }
}
