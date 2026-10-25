import { defineConfig } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'
import foundation from './playwright.bdd.config'
const testDir = defineBddConfig({
  features: 'tests/e2e/designSystem/**/*.feature',
  steps: 'tests/e2e/designSystem/**/*.steps.ts',
  outputDir: '.features-gen-storybook',
})
export default defineConfig({
  ...foundation,
  outputDir: 'test-results-storybook',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-storybook-report' }],
  ],
  use: { baseURL: 'http://127.0.0.1:6006', trace: 'retain-on-failure' },
  projects: [
    { name: 'storybook', testDir, use: foundation.projects?.[0].use },
    {
      name: 'storybook-a11y',
      testDir: 'tests/e2e/designSystem',
      testMatch: '**/*.spec.ts',
      use: foundation.projects?.[0].use,
    },
  ],
  webServer: {
    command:
      'pnpm exec vite preview --outDir storybook-static --port 6006 --host 127.0.0.1 --strictPort',
    url: 'http://127.0.0.1:6006',
    reuseExistingServer: false,
  },
})
