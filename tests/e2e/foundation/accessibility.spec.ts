import { test, expect } from '@playwright/test'
import { expectAccessible } from '../helpers/a11y'
for (const width of [320, 768, 1280]) {
  test(`localized pages reflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const locale of ['en', 'ru']) {
      for (const path of [
        '',
        '/playground',
        '/playground/practice-timer',
        '/login',
        '/register',
      ]) {
        await page.goto('/' + locale + path)
        await expect(page.getByRole('main')).toBeVisible()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          ),
          locale + path
        ).toBe(true)
        await expect(
          page
            .getByRole('navigation')
            .getByRole('link', {
              name: locale === 'en' ? 'Playground' : 'Плейграунд',
              exact: true,
              includeHidden: true,
            })
            .first()
        ).toBeVisible({ visible: width >= 768 })
        await expect(
          page
            .getByRole('navigation')
            .getByRole('button', { includeHidden: true })
        ).toBeVisible({ visible: width < 768 })
      }
    }
    if (width === 768)
      await page.screenshot({
        path: test.info().outputPath('tablet-shell.png'),
        fullPage: true,
      })
  })
}
test('default locale is deterministic and invalid routes return 404', async ({
  page,
}) => {
  await page.context().setExtraHTTPHeaders({ 'Accept-Language': 'ru' })
  await page.goto('/')
  await expect(page).toHaveURL(/\/en$/)
  for (const route of ['/de', '/de/playground', '/en/missing', '/ru/missing']) {
    const response = await page.goto(route)
    expect(response?.status(), route).toBe(404)
  }
})
for (const locale of ['en', 'ru'])
  for (const path of [
    '',
    '/playground',
    '/playground/practice-timer',
    '/login',
    '/register',
  ])
    test(`${locale}${path} has accessible shell and localized metadata`, async ({
      page,
    }) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })
      const response = await page.goto('/' + locale + path)
      expect(response?.status()).toBe(200)
      await expect(page.locator('html')).toHaveAttribute('lang', locale)
      await expect(page.getByRole('banner')).toBeVisible()
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page.getByRole('contentinfo')).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(page).toHaveTitle(/Dance Platform/)
      expect(
        await page.locator('meta[name="description"]').getAttribute('content')
      ).toBeTruthy()
      await page.keyboard.press('Tab')
      const skip = page.getByRole('link', {
        name: locale === 'en' ? 'Skip to content' : 'Перейти к содержимому',
      })
      await expect(skip).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page.getByRole('main')).toBeFocused()
      expect(errors).toEqual([])
      await expectAccessible(page)
      if (locale === 'en' && path === '') {
        await page.screenshot({
          path: test.info().outputPath('desktop-shell.png'),
          fullPage: true,
        })
      }
    })
test('compact navigation, locale continuity and reflow at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/en/playground')
  const menu = page.getByRole('button', { name: 'Menu', exact: true })
  await menu.focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('link', { name: 'Register', exact: true })
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  await expect(menu).toBeFocused()
  await menu.click()
  await page.getByRole('link', { name: 'Language: Русский' }).click()
  await expect(page).toHaveURL(/\/ru\/playground$/)
  await expect(
    page.getByRole('button', { name: 'Меню', exact: true })
  ).toHaveAttribute('aria-expanded', 'false')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  await page.screenshot({
    path: test.info().outputPath('mobile-shell.png'),
    fullPage: true,
  })
  await page.setViewportSize({ width: 768, height: 1024 })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
})
