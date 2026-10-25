import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  Badge,
  Button,
  Card,
  Container,
  Dialog,
  EmptyState,
  IconButton,
  Input,
  LoadingIndicator,
  Tabs,
} from '@dance/ui'
const meta = {
  title: 'Design System/Primitives',
  component: Button,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Button>
export default meta
export const Default: StoryObj<typeof meta> = { args: { children: 'Continue' } }
export function StatesExample() {
  return (
    <Container>
      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
        <div>
          <Button>Primary</Button>{' '}
          <Button variant="secondary">Secondary</Button>{' '}
          <Button variant="ghost">Ghost</Button>
        </div>
        <div>
          <Button size="small">Small</Button>{' '}
          <Button size="medium">Medium</Button>
        </div>
        <div>
          <Button disabled>Unavailable</Button> <Button loading>Saving</Button>{' '}
          <IconButton aria-label="Add item">+</IconButton>
        </div>
        <Input
          id="display-name"
          label="Display name"
          description="Use a public name"
          error="Required"
        />
        <Input
          id="disabled-input"
          label="Unavailable field"
          disabled
          defaultValue="Disabled"
        />
        <Card>
          <h2>Shared surface</h2>
          <p>Mobile palette, web spacing.</p>
          <Badge>Preview</Badge> <Badge tone="neutral">Neutral</Badge>{' '}
          <Badge tone="danger">Error</Badge> <Badge tone="success">Ready</Badge>
        </Card>
        <LoadingIndicator label="Loading tools" />
        <EmptyState
          title="No tools"
          description="Tools will appear here."
          action={<Button variant="secondary">Explore</Button>}
        />
      </div>
    </Container>
  )
}
export const States = { render: StatesExample }
export const Disabled: StoryObj<typeof meta> = {
  args: { children: 'Unavailable', disabled: true },
}
export const Loading: StoryObj<typeof meta> = {
  args: { children: 'Saving', loading: true },
}
export function DialogExample() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Preferences"
        closeLabel="Close dialog"
      >
        <Input id="dialog-name" label="Name" />
        <Button onClick={() => setOpen(false)}>Done</Button>
      </Dialog>
    </>
  )
}
export const Modal = { render: DialogExample }
export const KeyboardTabs = {
  render: () => (
    <Tabs
      label="Tool views"
      items={[
        { id: 'overview', label: 'Overview', content: <p>Overview panel</p> },
        {
          id: 'unavailable',
          label: 'Unavailable',
          content: 'Unavailable panel',
          disabled: true,
        },
        { id: 'details', label: 'Details', content: <p>Details panel</p> },
      ]}
    />
  ),
}
export function ControlledTabsExample() {
  const [value, setValue] = useState('overview')
  return (
    <Tabs
      label="Controlled views"
      value={value}
      onValueChange={setValue}
      items={[
        { id: 'overview', label: 'Overview', content: 'Overview' },
        { id: 'details', label: 'Details', content: 'Details' },
      ]}
    />
  )
}
export const ControlledTabs = { render: ControlledTabsExample }
export const Focus = {
  render: () => (
    <>
      <p>
        Use Tab to inspect focus, Enter/Space to activate, arrows/Home/End in
        tabs, Escape in dialogs.
      </p>
      <StatesExample />
      <DialogExample />
    </>
  ),
}
