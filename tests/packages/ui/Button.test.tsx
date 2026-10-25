import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { Button } from '@dance/ui'

it('SC-004 supports keyboard activation and native disabled behavior', async () => {
  const user = userEvent.setup()
  const onClick = vi.fn()
  const { rerender } = render(<Button onClick={onClick}>Continue</Button>)
  const button = screen.getByRole('button', { name: 'Continue' })
  button.focus()
  await user.keyboard('{Enter}')
  expect(onClick).toHaveBeenCalledTimes(1)
  rerender(
    <Button disabled onClick={onClick}>
      Continue
    </Button>
  )
  await user.click(button)
  expect(onClick).toHaveBeenCalledTimes(1)
  expect(button).toHaveAttribute('type', 'button')
})
