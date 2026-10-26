import type { Page } from '@playwright/test'

export async function openStoryForAudit(page: Page, story: string) {
  // This page's current-state WCAG audit belongs to Playwright. Normal stories keep addon automation.
  await page.goto(
    `/iframe.html?id=design-system-primitives--${story}&viewMode=story&globals=a11y.manual:!true`
  )
}
