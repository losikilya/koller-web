import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import { expect, it, vi } from 'vitest'
import { Button, IconButton, Input, Tabs } from '@dance/ui'

it('preserves form submission, React refs and named icon actions', async () => {
  const ref = createRef<HTMLButtonElement>()
  const submit = vi.fn((event) => event.preventDefault())
  render(
    <form onSubmit={submit}>
      <Button ref={ref}>Safe action</Button>
      <Button type="submit">Submit</Button>
      <IconButton aria-label="Add item">+</IconButton>
    </form>
  )
  expect(ref.current).toBe(screen.getByRole('button', { name: 'Safe action' }))
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Safe action' }))
  expect(submit).not.toHaveBeenCalled()
  await userEvent.setup().click(screen.getByRole('button', { name: 'Submit' }))
  expect(submit).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: 'Add item' })).toBeEnabled()
})
it('keeps controlled inputs editable and removes obsolete error relationships', async () => {
  function Field() {
    const [value, setValue] = useState('')
    return (
      <Input
        id="controlled"
        label="Name"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        error={value ? undefined : 'Required'}
      />
    )
  }
  render(<Field />)
  const input = screen.getByRole('textbox', { name: 'Name' })
  expect(input).toHaveAccessibleDescription('Required')
  await userEvent.setup().type(input, 'Dancer')
  expect(input).toHaveValue('Dancer')
  expect(input).not.toHaveAttribute('aria-invalid')
  expect(input).not.toHaveAttribute('aria-describedby')
})
it('leaves controlled tab selection with the owner and reports changes', async () => {
  const onChange = vi.fn()
  const items = [
    { id: 'a', label: 'Alpha', content: 'A panel' },
    { id: 'b', label: 'Beta', content: 'B panel' },
  ]
  const { rerender } = render(
    <Tabs label="Views" items={items} value="a" onValueChange={onChange} />
  )
  await userEvent.setup().click(screen.getByRole('tab', { name: 'Beta' }))
  expect(onChange).toHaveBeenCalledWith('b')
  expect(screen.getByRole('tabpanel')).toHaveTextContent('A panel')
  rerender(
    <Tabs label="Views" items={items} value="b" onValueChange={onChange} />
  )
  expect(screen.getByRole('tabpanel')).toHaveTextContent('B panel')
  screen.getByRole('tab', { name: 'Beta' }).focus()
  await userEvent.setup().keyboard('{ArrowLeft}')
  expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus()
  expect(onChange).toHaveBeenLastCalledWith('a')
})
it('falls back to an enabled tab when choices change and handles an empty list', () => {
  const { rerender } = render(
    <Tabs
      label="Views"
      defaultValue="b"
      items={[
        { id: 'a', label: 'Alpha', content: 'A panel' },
        { id: 'b', label: 'Beta', content: 'B panel' },
      ]}
    />
  )
  expect(screen.getByRole('tabpanel')).toHaveTextContent('B panel')
  rerender(
    <Tabs
      label="Views"
      items={[{ id: 'a', label: 'Alpha', content: 'A panel' }]}
    />
  )
  expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute(
    'tabindex',
    '0'
  )
  rerender(<Tabs label="Views" items={[]} />)
  expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument()
})
