import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { MobileNavigation } from '@/shell/MobileNavigation'

it('SC-003 allows keyboard users to disclose and close mobile navigation', async () => {
  const user = userEvent.setup()
  render(
    <MobileNavigation label="Menu">
      <a href="/en/playground">Playground</a>
    </MobileNavigation>
  )
  const toggle = screen.getByRole('button', { name: 'Menu' })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  toggle.focus()
  await user.keyboard('{Enter}')
  expect(screen.getByRole('link', { name: 'Playground' })).toBeVisible()
  await user.keyboard('{Escape}')
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(toggle).toHaveFocus()
})
