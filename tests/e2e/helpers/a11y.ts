import axe from 'axe-core'
import { expect, type Page } from '@playwright/test'
declare global {
  interface Window {
    axe: typeof axe
  }
}
export async function expectAccessible(page: Page) {
  await page.addScriptTag({ content: axe.source })
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
      },
    })
    return result.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    }))
  })
  expect(violations).toEqual([])
}
