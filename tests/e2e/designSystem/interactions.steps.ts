import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
const { Given, When, Then } = createBdd()
Given('the modal component example is open', async ({ page }) => {
  await page.goto(
    '/iframe.html?id=design-system-primitives--modal&viewMode=story'
  )
  await expect(page.getByRole('button', { name: 'Open dialog' })).toBeVisible()
})
When('I open the dialog and navigate its controls', async ({ page }) => {
  await page.getByRole('button', { name: 'Open dialog' }).click()
  const dialog = page.getByRole('dialog', { name: 'Preferences' })
  await expect(dialog).toBeVisible()
  const close = dialog.getByRole('button', { name: 'Close dialog' })
  await expect(close).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('textbox', { name: 'Name' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Done' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(close).toBeFocused()
  // Native modal makes background content inert; browser chrome remains reachable.
  await page
    .getByRole('button', { name: 'Open dialog' })
    .evaluate((element) => element.focus())
  await expect(close).toBeFocused()
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
})
Then(
  'Escape closes the dialog and restores trigger focus',
  async ({ page }) => {
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Open dialog' })
    ).toBeFocused()
    await page.getByRole('button', { name: 'Open dialog' }).click()
    await page.getByRole('button', { name: 'Close dialog' }).click()
    await expect(
      page.getByRole('button', { name: 'Open dialog' })
    ).toBeFocused()
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
  }
)
Given('the keyboard tabs example is open', async ({ page }) => {
  await page.goto(
    '/iframe.html?id=design-system-primitives--keyboard-tabs&viewMode=story'
  )
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible()
})
When('I navigate enabled tabs with the keyboard', async ({ page }) => {
  await page.getByRole('tab', { name: 'Overview' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Details' })).toBeFocused()
  await expect(page.getByRole('tab', { name: 'Details' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeFocused()
  await page.keyboard.press('End')
})
Then('only the selected panel is exposed', async ({ page }) => {
  await expect(page.getByRole('tabpanel')).toHaveCount(1)
  await expect(page.getByRole('tabpanel')).toHaveText('Details panel')
  await page.keyboard.press('Home')
  await expect(page.getByRole('tabpanel')).toHaveText('Overview panel')
})
