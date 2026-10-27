import { createRequire } from 'node:module'
const require = createRequire(process.cwd() + '/apps/web/package.json')
const sharp = createRequire(require.resolve('next/package.json'))('sharp')
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
  return image[format]().toBuffer()
}
export async function animatedAvatar() {
  const first = await avatarImage()
  const second = await sharp({
    create: { width: 2, height: 2, channels: 3, background: '#e02020' },
  })
    .png()
    .toBuffer()
  return sharp([first, second], { join: { animated: true } })
    .webp({ loop: 0 })
    .toBuffer()
}
export function imageMetadata(bytes) {
  return sharp(bytes).metadata()
}
export function paddedAvatar(bytes, size) {
  const output = Buffer.alloc(size)
  bytes.copy(output)
  return output
}
