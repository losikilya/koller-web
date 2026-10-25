import { test, expect } from '@playwright/test'
import { expectAccessible } from '../helpers/a11y'
for (const story of ['states', 'keyboard-tabs', 'modal']) {
  test(`${story} passes automated WCAG checks at compact and desktop widths`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(
        `/iframe.html?id=design-system-primitives--${story}&viewMode=story`
      )
      await expect(
        page.getByRole('button').or(page.getByRole('tab')).first()
      ).toBeVisible()
      if (story === 'modal')
        await page.getByRole('button', { name: 'Open dialog' }).click()
      await expectAccessible(page)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true)
      await page.screenshot({
        path: test.info().outputPath(`${story}-${width}.png`),
        fullPage: true,
      })
    }
    expect(errors).toEqual([])
  })
}
test('reduced motion keeps loading feedback readable without animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(
    '/iframe.html?id=design-system-primitives--states&viewMode=story'
  )
  const status = page.getByRole('status')
  await expect(status).toHaveText('Loading tools')
  await expect(status.locator('[aria-hidden]')).toHaveCSS(
    'animation-name',
    'none'
  )
})
