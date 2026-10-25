import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, vi } from 'vitest'
import { Button } from '@dance/ui'
import { MobileNavigation } from '@/shell/MobileNavigation'
const feature = await loadFeature('tests/bdd/foundation/controls.feature')
describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(cleanup)
  Scenario(
    'Mobile navigation can be operated with a keyboard',
    ({ Given, When, Then }) => {
      Given('the compact navigation is closed', () => {
        render(
          <MobileNavigation label="Menu">
            <a href="/en/playground">Playground</a>
          </MobileNavigation>
        )
        expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
          'aria-expanded',
          'false'
        )
      })
      When('a visitor opens it and presses Escape', async () => {
        const user = userEvent.setup()
        screen.getByRole('button', { name: 'Menu' }).focus()
        await user.keyboard('{Enter}')
        expect(screen.getByRole('link')).toBeVisible()
        await user.keyboard('{Escape}')
      })
      Then('the navigation closes and focus returns to its toggle', () => {
        expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
          'aria-expanded',
          'false'
        )
        expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus()
      })
    }
  )
  Scenario(
    'Shared buttons preserve native behavior',
    ({ Given, When, Then }) => {
      const onClick = vi.fn()
      Given('an enabled shared button', () => {
        render(<Button onClick={onClick}>Continue</Button>)
      })
      When('a visitor activates it with the keyboard', async () => {
        screen.getByRole('button').focus()
        await userEvent.setup().keyboard('{Enter}')
      })
      Then(
        'its action runs once and disabling it prevents further activation',
        async () => {
          expect(onClick).toHaveBeenCalledTimes(1)
          screen.getByRole('button').setAttribute('disabled', '')
          await userEvent.setup().click(screen.getByRole('button'))
          expect(onClick).toHaveBeenCalledTimes(1)
        }
      )
    }
  )
})
