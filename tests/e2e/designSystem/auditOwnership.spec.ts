import { test, expect } from '@playwright/test'
import { expectAccessible } from '../helpers/a11y'
import { installAuditProbe } from '../helpers/auditProbe'
import { openStoryForAudit } from '../helpers/storybook'

test('one accessibility audit owner covers the current state and still rejects violations', async ({
  page,
}) => {
  await installAuditProbe(page)
  await openStoryForAudit(page, 'states')
  await expect(page.getByRole('button').first()).toBeVisible()
  try {
    await expectAccessible(page)
    await page.evaluate(() => {
      const unnamed = document.createElement('button')
      unnamed.id = 'audit-negative-control'
      document.body.append(unnamed)
    })
    await expect(expectAccessible(page)).rejects.toThrow('button-name')
    await page
      .locator('#audit-negative-control')
      .evaluate((element) => element.remove())
    await expectAccessible(page)
  } finally {
    const probe = await page.evaluate(() => window.axeAuditProbe)
    const info = test.info()
    await info.attach('audit-ownership.json', {
      body: JSON.stringify(probe, null, 2),
      contentType: 'application/json',
    })
    expect(probe.active).toBe(0)
    expect(probe.maximumActive).toBe(1)
    expect(new Set(probe.runs.map(({ engine }) => engine)).size).toBe(1)
    expect(probe.runs).toHaveLength(3)
  }
})
