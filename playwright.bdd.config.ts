import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

const executablePath = process.env.PLAYWRIGHT_BROWSER_EXECUTABLE_PATH?.trim()
const requestedChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL?.trim()
const supportedChannels = ['chrome', 'msedge'] as const

if (executablePath && requestedChannel) {
  throw new Error(
    'Set only one browser override: PLAYWRIGHT_BROWSER_EXECUTABLE_PATH or PLAYWRIGHT_BROWSER_CHANNEL.'
  )
}

if (
  requestedChannel &&
  !supportedChannels.includes(
    requestedChannel as (typeof supportedChannels)[number]
  )
) {
  throw new Error(
    `Unsupported PLAYWRIGHT_BROWSER_CHANNEL=${requestedChannel}. Use chrome or msedge.`
  )
}

if (executablePath && !existsSync(executablePath)) {
  throw new Error(
    `PLAYWRIGHT_BROWSER_EXECUTABLE_PATH does not exist: ${executablePath}`
  )
}

const browserChannel = requestedChannel as
  | (typeof supportedChannels)[number]
  | undefined

const browserUse = {
  ...devices['Desktop Chrome'],
  ...(executablePath ? { launchOptions: { executablePath } } : {}),
  ...(browserChannel ? { channel: browserChannel } : {}),
}

// Generated Playwright BDD specs; regular E2E specs run from tests/e2e in their own project.
const bddTestDir = defineBddConfig({
  features: 'tests/e2e/foundation/**/*.feature',
  steps: 'tests/e2e/{foundation,identity}/**/*.steps.ts',
  outputDir: '.features-gen/foundation',
})

// Auth traces would contain disposable bearer credentials and email token hashes.
const authBddTestDir = defineBddConfig({
  features: 'tests/e2e/identity/**/*.feature',
  steps: 'tests/e2e/identity/**/*.steps.ts',
  outputDir: '.features-gen/auth',
})

// Not 4173: that default preview port is often held by other local projects.
const previewOrigin = 'http://127.0.0.1:4310'

const browserName = executablePath
  ? 'manual-chromium'
  : browserChannel ?? 'chromium'

export default defineConfig({
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: [
    ['list'],
    [
      'junit',
      {
        outputFile: 'ci-reports/junit/playwright.xml',
        stripANSIControlSequences: true,
      },
    ],

    [
      'html',
      {
        open: 'never',
        outputFolder: 'playwright-report',
      },
    ],
  ],
  use: { baseURL: previewOrigin, trace: 'retain-on-failure' },
  projects: [
    { name: browserName, testDir: bddTestDir, use: browserUse },
    {
      name: browserName + '-auth',
      testDir: authBddTestDir,
      use: { ...browserUse, trace: 'off', video: 'off', screenshot: 'off' },
    },
    {
      name: `${browserName}-e2e`,
      testDir: 'tests/e2e',
      testMatch: '**/*.spec.ts',
      testIgnore: '**/designSystem/**',
      use: browserUse,
    },
  ],
  webServer: {
    command: 'pnpm preview',
    url: previewOrigin,
    // Never attach to a server we did not start: it may be another application.
    reuseExistingServer: false,
  },
})
