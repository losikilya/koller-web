import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, afterAll, expect } from 'vitest'
// vitest-cucumber runs each step as a test; its scenario hook owns cleanup.
afterEach(() => {
  if (
    !expect.getState().testPath?.replaceAll('\\', '/').includes('/tests/bdd/')
  )
    cleanup()
})
afterAll(cleanup)
