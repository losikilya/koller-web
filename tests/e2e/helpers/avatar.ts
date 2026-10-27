import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
const cli = createRequire(process.cwd() + '/package.json').resolve(
  'supabase/dist/supabase.js'
)
const status = spawnSync(process.execPath, [cli, 'status', '-o', 'json'], {
  encoding: 'utf8',
  timeout: 30000,
})
if (status.status !== 0)
  throw new Error('Avatar browser fixtures require local Supabase')
const local = JSON.parse(status.stdout)
if (
  !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(local.API_URL).hostname)
)
  throw new Error('Loopback avatar fixtures only')
const options = { auth: { persistSession: false, autoRefreshToken: false } }
export const avatarTestAdmin = createClient(
  local.API_URL,
  local.SECRET_KEY ?? local.SERVICE_ROLE_KEY,
  options
)
export function avatarTestClient() {
  return createClient(
    local.API_URL,
    local.PUBLISHABLE_KEY ?? local.ANON_KEY,
    options
  )
}
type FixturePipeline = {
  png(): FixturePipeline
  jpeg(): FixturePipeline
  webp(): FixturePipeline
  withMetadata(value: unknown): FixturePipeline
  toBuffer(): Promise<Buffer>
  metadata(): Promise<{
    width?: number
    height?: number
    exif?: Buffer
    icc?: Buffer
  }>
}
const sharp = createRequire(process.cwd() + '/apps/web/package.json')(
  'sharp'
) as (source: unknown) => FixturePipeline
export async function avatarImage(
  width = 2,
  height = 2,
  format = 'png',
  metadata = false
) {
  let image = sharp({
    create: { width, height, channels: 3, background: '#285a8a' },
  })
  if (metadata)
    image = image.withMetadata({
      exif: { IFD0: { Artist: 'Private fixture metadata' } },
    })
  return (
    format === 'jpeg'
      ? image.jpeg()
      : format === 'webp'
      ? image.webp()
      : image.png()
  ).toBuffer()
}
export function paddedAvatar(bytes: Buffer, size: number) {
  const result = Buffer.alloc(size)
  bytes.copy(result)
  return result
}
export function imageMetadata(bytes: Buffer) {
  return sharp(bytes).metadata()
}
export function localAvatarCleanup() {
  const result = spawnSync(
    process.execPath,
    ['scripts/avatar-cleanup-worker.mjs', '--once'],
    { encoding: 'utf8', timeout: 60000 }
  )
  if (result.status !== 0)
    throw new Error('Local fixture avatar cleanup failed')
}
