// @vitest-environment node
import { expect } from 'vitest'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { AVATAR_MAX_FILE_BYTES } from '@dance/contracts'
import { processAvatar } from '@/app/_infrastructure/avatarProcessing'
import {
  avatarImage,
  animatedAvatar,
  imageMetadata,
  paddedAvatar,
} from '../../../../helpers/avatarFixtures.mjs'
const feature = await loadFeature('tests/bdd/profile/avatars.feature')
describeFeature(
  feature,
  ({ Scenario }) => {
    Scenario(
      'SC-426 Validate exact file and decoder boundaries',
      ({ Then }) => {
        Then(
          'bounded static images become metadata-free WebP and invalid content is rejected',
          async () => {
            expect(AVATAR_MAX_FILE_BYTES).toBe(2 * 1024 * 1024)
            const png = await avatarImage(800, 600, 'png', true)
            for (const size of [
              AVATAR_MAX_FILE_BYTES - 1,
              AVATAR_MAX_FILE_BYTES,
            ]) {
              const output = await processAvatar(
                paddedAvatar(png, size),
                'image/png'
              )
              expect(output.byteLength).toBeLessThanOrEqual(1024 * 1024)
              const info = await imageMetadata(output)
              expect(info.format).toBe('webp')
              expect(info.width).toBeLessThanOrEqual(512)
              expect(info.height).toBeLessThanOrEqual(512)
              expect(info.exif).toBeUndefined()
              expect(info.icc).toBeUndefined()
            }
            await expect(
              processAvatar(
                paddedAvatar(png, AVATAR_MAX_FILE_BYTES + 1),
                'image/png'
              )
            ).rejects.toMatchObject({ code: 'payload_too_large' })
            for (const format of ['jpeg', 'webp']) {
              expect(
                (
                  await processAvatar(
                    await avatarImage(2, 2, format),
                    'image/' + format
                  )
                ).byteLength
              ).toBeGreaterThan(0)
            }
            for (const [bytes, mime] of [
              [png, 'image/jpeg'],
              [
                new TextEncoder().encode(
                  '<svg xmlns="http://www.w3.org/2000/svg"/>'
                ),
                'image/png',
              ],
              [new Uint8Array(), 'image/png'],
              [await animatedAvatar(), 'image/webp'],
              [await avatarImage(4097, 1), 'image/png'],
              [await avatarImage(4001, 4000), 'image/png'],
            ] as const)
              await expect(processAvatar(bytes, mime)).rejects.toMatchObject({
                code: 'invalid_image',
              })
            expect(
              (await processAvatar(await avatarImage(4000, 4000), 'image/png'))
                .byteLength
            ).toBeGreaterThan(0)
          }
        )
      }
    )
  },
  { includeTags: ['SC-426'] }
)
