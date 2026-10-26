import type { Page } from '@playwright/test'
import type axe from 'axe-core'

declare global {
  interface Window {
    axeAuditProbe: {
      active: number
      maximumActive: number
      runs: { engine: number; caller: string }[]
    }
  }
}

export async function installAuditProbe(page: Page) {
  await page.addInitScript(() => {
    const probe = {
      active: 0,
      maximumActive: 0,
      runs: [] as { engine: number; caller: string }[],
    }
    window.axeAuditProbe = probe
    let current: typeof axe
    let nextEngine = 0
    const seen = new WeakSet<object>()
    Object.defineProperty(window, 'axe', {
      configurable: true,
      get: () => current,
      set(value: typeof axe) {
        current = value
        if (seen.has(value)) return
        seen.add(value)
        const engine = ++nextEngine
        let run = value.run
        // axe publishes its global before defining run; observe that assignment as well.
        Object.defineProperty(value, 'run', {
          configurable: true,
          get: () => run,
          set(
            method: (context: unknown, options: unknown) => Promise<unknown>
          ) {
            run = ((context: unknown, options: unknown) => {
              probe.active++
              probe.maximumActive = Math.max(probe.maximumActive, probe.active)
              probe.runs.push({ engine, caller: new Error().stack ?? '' })
              try {
                return Promise.resolve(
                  method.call(value, context, options)
                ).finally(() => {
                  probe.active--
                })
              } catch (error) {
                probe.active--
                throw error
              }
            }) as typeof axe.run
          },
        })
      },
    })
  })
}
