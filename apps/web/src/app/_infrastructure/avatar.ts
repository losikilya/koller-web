import 'server-only'
import { createHash } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import {
  AVATAR_MAX_FILE_BYTES,
  AVATAR_MAX_REQUEST_BYTES,
  avatarOperationSchema,
} from '@dance/contracts'
import { readVerifiedUser } from '@/shared/supabase/verifiedUser'
import {
  ProfileFailure,
  parseProfileEtag,
  saveAvatar,
  removeAvatar,
} from '@/modules/profile'
import { authOrigin, responseContext } from './requestContext'
import { createAvatarRuntime, readAvatarImage } from './avatarRuntime'
async function boundedBody(request: NextRequest) {
  const declared = request.headers.get('content-length')
  if (
    declared &&
    (!/^[0-9]+$/.test(declared) || Number(declared) > AVATAR_MAX_REQUEST_BYTES)
  )
    throw new ProfileFailure('payload_too_large', 413)
  const reader = request.body?.getReader()
  if (!reader) throw new ProfileFailure('invalid_request', 400)
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > AVATAR_MAX_REQUEST_BYTES) {
        await reader.cancel()
        throw new ProfileFailure('payload_too_large', 413)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const result = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}
function decorate(response: NextResponse, requestId: string) {
  response.headers.set('X-Request-Id', requestId)
  response.headers.set(
    'Cache-Control',
    'private, no-store, max-age=0, must-revalidate'
  )
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  return response
}
export async function handleAvatarRequest(
  request: NextRequest,
  operation: 'upload' | 'remove'
) {
  const requestId = crypto.randomUUID()
  let context: ReturnType<typeof responseContext> | undefined
  const finish = (response: NextResponse) => {
    decorate(response, requestId)
    return context ? context.finish(response) : response
  }
  try {
    if (request.headers.get('origin') !== authOrigin())
      throw new ProfileFailure('forbidden', 403)
    if (request.nextUrl.search) throw new ProfileFailure('invalid_request', 400)
    context = responseContext(request)
    const user = await readVerifiedUser(context.client)
    if (!user?.email_confirmed_at)
      throw new ProfileFailure('unauthenticated', 401)
    const revision = parseProfileEtag(request.headers.get('if-match'))
    const parsedId = avatarOperationSchema.safeParse(
      request.headers.get('x-avatar-operation')
    )
    if (!parsedId.success) throw new ProfileFailure('invalid_request', 400)
    const id = parsedId.data.toLowerCase()
    if (operation === 'remove') {
      if (request.body && (await boundedBody(request)).byteLength !== 0)
        throw new ProfileFailure('invalid_request', 400)
      const result = await removeAvatar(
        createAvatarRuntime(context.client, user.id),
        id,
        revision
      )
      return finish(
        NextResponse.json(
          { profile: result.profile },
          { headers: { ETag: result.etag } }
        )
      )
    }
    if (
      !request.headers
        .get('content-type')
        ?.toLowerCase()
        .startsWith('multipart/form-data;')
    )
      throw new ProfileFailure('invalid_request', 415)
    const body = await boundedBody(request)
    let form: FormData
    try {
      form = await new Request(request.url, {
        method: 'POST',
        headers: { 'Content-Type': request.headers.get('content-type')! },
        body,
      }).formData()
    } catch {
      throw new ProfileFailure('invalid_request', 400)
    }
    const keys = Array.from(form.keys()),
      file = form.get('file')
    if (keys.length !== 1 || keys[0] !== 'file' || !(file instanceof File))
      throw new ProfileFailure('invalid_request', 400)
    if (file.size > AVATAR_MAX_FILE_BYTES)
      throw new ProfileFailure('payload_too_large', 413)
    const bytes = new Uint8Array(await file.arrayBuffer()),
      mime = file.type.toLowerCase()
    const fingerprint = createHash('sha256')
      .update(mime)
      .update('\0')
      .update(bytes)
      .digest('hex')
    const result = await saveAvatar(
      createAvatarRuntime(context.client, user.id),
      { id, revision, bytes, mime, fingerprint }
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
export async function handleAvatarImage(request: NextRequest, id: string) {
  const requestId = crypto.randomUUID()
  let context: ReturnType<typeof responseContext> | undefined
  const finish = (response: NextResponse) => {
    decorate(response, requestId)
    return context ? context.finish(response) : response
  }
  try {
    if (!avatarOperationSchema.safeParse(id).success || request.nextUrl.search)
      return finish(new NextResponse(null, { status: 404 }))
    context = responseContext(request)
    const user = await readVerifiedUser(context.client)
    const bytes = await readAvatarImage(
      id,
      user?.email_confirmed_at ? user.id : null
    )
    return finish(
      bytes
        ? new NextResponse(new Uint8Array(bytes), {
            headers: {
              'Content-Type': 'image/webp',
              'Content-Security-Policy': "default-src 'none'; sandbox",
            },
          })
        : new NextResponse(null, { status: 404 })
    )
  } catch {
    return finish(new NextResponse(null, { status: 503 }))
  }
}
