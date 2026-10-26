import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
const databaseRun = process.argv.some((argument) =>
  argument.replaceAll('\\', '/').includes('tests/database/')
)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web/src'),
      'server-only': path.resolve(__dirname, 'tests/helpers/serverOnly.ts'),
    },
  },
  test: {
    env: { RTL_SKIP_AUTO_CLEANUP: 'true' },
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'tests/bdd/**/*.steps.{ts,tsx}'],
    exclude: [
      'tests/e2e/**',
      ...(databaseRun ? [] : ['tests/database/**']),
      'node_modules/**',
      '.features-gen/**',
    ],
    maxWorkers: 1,
    fileParallelism: false,
    allowOnly: false,
    coverage: {
      provider: 'v8',
      include: ['apps/web/src/**/*.{ts,tsx}', 'packages/*/src/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts'],
      reporter: ['text-summary', 'html', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
})
