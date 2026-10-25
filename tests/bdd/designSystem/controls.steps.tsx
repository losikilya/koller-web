import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, vi } from 'vitest'
import {
  Button,
  Dialog,
  Tabs,
  Input,
  LoadingIndicator,
  EmptyState,
} from '@dance/ui'
import { StatesExample } from '../../../packages/ui/stories/Primitives.stories'

const feature = await loadFeature('tests/bdd/designSystem/controls.feature')
describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(cleanup)
  Scenario('SC-101 Busy action prevents repeat activation', ({ Then }) => {
    Then(
      'a busy action preserves its name and prevents activation',
      async () => {
        const onClick = vi.fn()
        render(
          <Button loading onClick={onClick}>
            Save
          </Button>
        )
        const button = screen.getByRole('button', { name: 'Save' })
        expect(button).toBeDisabled()
        expect(button).toHaveAttribute('aria-busy', 'true')
        await userEvent.setup().click(button)
        expect(onClick).not.toHaveBeenCalled()
      }
    )
  })
  Scenario('SC-102 Input explains invalid data', ({ Then }) => {
    Then('an input associates its label description and error', async () => {
      render(
        <Input
          id="name"
          label="Name"
          description="Public name"
          error="Required"
          defaultValue=""
        />
      )
      const input = screen.getByRole('textbox', { name: 'Name' })
      expect(input).toHaveAccessibleDescription('Public name Required')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      await userEvent.setup().type(input, 'Dancer')
      expect(input).toHaveValue('Dancer')
    })
  })
  Scenario('SC-103 Dialog offers explicit dismissal', ({ Then }) => {
    Then('a named dialog notifies its owner when dismissed', async () => {
      // jsdom does not implement native modality; real focus is checked in Edge.
      if (!HTMLDialogElement.prototype.showModal) {
        Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
          configurable: true,
          writable: true,
          value() {
            this.open = true
          },
        })
        Object.defineProperty(HTMLDialogElement.prototype, 'close', {
          configurable: true,
          writable: true,
          value() {
            this.open = false
          },
        })
      }
      const showModal = vi
        .spyOn(HTMLDialogElement.prototype, 'showModal')
        .mockImplementation(function (this: HTMLDialogElement) {
          this.open = true
        })
      const close = vi
        .spyOn(HTMLDialogElement.prototype, 'close')
        .mockImplementation(function (this: HTMLDialogElement) {
          this.open = false
        })
      const onClose = vi.fn()
      render(
        <Dialog open title="Settings" closeLabel="Close" onClose={onClose}>
          <p>Preferences</p>
        </Dialog>
      )
      expect(screen.getByRole('dialog', { name: 'Settings' })).toBeVisible()
      await userEvent
        .setup()
        .click(screen.getByRole('button', { name: 'Close' }))
      expect(onClose).toHaveBeenCalledTimes(1)
      cleanup()
      showModal.mockRestore()
      close.mockRestore()
    })
  })
  Scenario('SC-104 Tabs support keyboard selection', ({ Then }) => {
    Then(
      'keyboard selection skips disabled tabs and exposes one panel',
      async () => {
        render(
          <Tabs
            label="Views"
            items={[
              { id: 'one', label: 'One', content: 'First panel' },
              {
                id: 'two',
                label: 'Two',
                content: 'Second panel',
                disabled: true,
              },
              { id: 'three', label: 'Three', content: 'Third panel' },
            ]}
          />
        )
        const first = screen.getByRole('tab', { name: 'One' })
        first.focus()
        await userEvent.setup().keyboard('{ArrowRight}')
        expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus()
        expect(screen.getByRole('tabpanel')).toHaveTextContent('Third panel')
        await userEvent.setup().keyboard('{ArrowRight}{End}{Home}')
        expect(first).toHaveFocus()
        expect(first).toHaveAttribute('aria-selected', 'true')
        expect(screen.getByRole('tabpanel')).toHaveTextContent('First panel')
      }
    )
  })
  Scenario('SC-105 Feedback explains missing content', ({ Then }) => {
    Then('feedback exposes a labelled status and empty section', () => {
      render(
        <>
          <LoadingIndicator label="Loading tools" />
          <EmptyState title="No tools" />
        </>
      )
      expect(screen.getByRole('status')).toHaveTextContent('Loading tools')
      expect(screen.getByRole('region', { name: 'No tools' })).toBeVisible()
    })
  })
  Scenario('SC-106 Examples demonstrate component states', ({ Then }) => {
    Then(
      'component examples demonstrate busy disabled and error states',
      () => {
        render(<StatesExample />)
        expect(screen.getByRole('button', { name: 'Saving' })).toHaveAttribute(
          'aria-busy',
          'true'
        )
        expect(
          screen.getByRole('button', { name: 'Unavailable' })
        ).toBeDisabled()
        expect(
          screen.getByRole('textbox', { name: 'Display name' })
        ).toHaveAccessibleDescription('Use a public name Required')
      }
    )
  })
})
