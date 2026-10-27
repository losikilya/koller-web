import 'server-only'
import sharp from 'sharp'
import {
  AVATAR_MAX_FILE_BYTES,
  AVATAR_MAX_OUTPUT_BYTES,
  AVATAR_MAX_PIXELS,
  AVATAR_MAX_SIDE,
} from '@dance/contracts'
import { ProfileFailure } from '@/modules/profile'
export async function processAvatar(
  bytes: Uint8Array,
  mime: string
): Promise<Uint8Array> {
  if (bytes.byteLength > AVATAR_MAX_FILE_BYTES)
    throw new ProfileFailure('payload_too_large', 413)
  const invalid = () => new ProfileFailure('invalid_image', 422)
  const input = Buffer.from(bytes)
  const format = input
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ? 'png'
    : input[0] === 255 && input[1] === 216 && input[2] === 255
    ? 'jpeg'
    : input.toString('ascii', 0, 4) === 'RIFF' &&
      input.toString('ascii', 8, 12) === 'WEBP'
    ? 'webp'
    : null
  if (!format || mime !== 'image/' + format) throw invalid()
  // APNG may otherwise be decoded as a static first frame.
  if (format === 'png') {
    for (let offset = 8; offset + 12 <= input.length; ) {
      const length = input.readUInt32BE(offset)
      if (length > input.length - offset - 12) throw invalid()
      const kind = input.toString('ascii', offset + 4, offset + 8)
      if (['acTL', 'fcTL', 'fdAT'].includes(kind)) throw invalid()
      offset += length + 12
      if (kind === 'IEND') break
    }
  }
  try {
    const image = sharp(input, {
      limitInputPixels: AVATAR_MAX_PIXELS,
      failOn: 'warning',
      animated: true,
    }).timeout({ seconds: 10 })
    const info = await image.metadata()
    if (
      info.format !== format ||
      !info.width ||
      !info.height ||
      info.width > AVATAR_MAX_SIDE ||
      info.height > AVATAR_MAX_SIDE ||
      info.width * info.height > AVATAR_MAX_PIXELS ||
      (info.pages ?? 1) !== 1
    )
      throw invalid()
    const output = await image
      .rotate()
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer()
    if (!output.length || output.length > AVATAR_MAX_OUTPUT_BYTES)
      throw invalid()
    return output
  } catch {
    throw invalid()
  }
}
