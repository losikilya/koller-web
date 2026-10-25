import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
const { Given, When, Then } = createBdd()
Given('a visitor opens the English homepage', async ({ page }) => {
  await page.goto('/en')
})
When('they navigate to Playground', async ({ page }) => {
  await page
    .getByRole('link', { name: 'Explore Playground', exact: true })
    .click()
  await expect(page).toHaveURL(/\/en\/playground$/)
})
Then('they can open the Practice Timer placeholder', async ({ page }) => {
  await page.getByRole('link', { name: 'Explore Practice Timer' }).click()
  await expect(page).toHaveURL(/\/en\/playground\/practice-timer$/)
  await expect(
    page.getByRole('heading', { name: 'Practice Timer', exact: true })
  ).toBeVisible()
  await expect(
    page.getByText('Placeholder · Not interactive yet')
  ).toBeVisible()
})
Given(
  'a visitor is viewing the English Practice Timer route',
  async ({ page }) => {
    await page.goto('/en/playground/practice-timer')
  }
)
When('they switch to Russian', async ({ page }) => {
  await page.getByRole('link', { name: 'Language: Русский' }).click()
})
Then('the equivalent route opens with Russian content', async ({ page }) => {
  await expect(page).toHaveURL(/\/ru\/playground\/practice-timer$/)
  await expect(
    page.getByRole('heading', { name: 'Таймер практики', exact: true })
  ).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
})
