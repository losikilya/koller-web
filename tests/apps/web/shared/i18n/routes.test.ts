import { describe, expect, it } from 'vitest'
import { localizedPath, supportedPaths } from '@/shared/i18n/routes'

describe('locale routes', () => {
  it('SC-001 exposes the public and authenticated route catalog through locale-aware navigation', () => {
    expect(supportedPaths).toEqual([
      '/',
      '/playground',
      '/playground/practice-timer',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/account',
    ])
    expect(localizedPath('en', '/playground')).toBe('/en/playground')
  })
  it('SC-002 preserves the equivalent supported route in Russian', () => {
    expect(localizedPath('ru', '/playground/practice-timer')).toBe(
      '/ru/playground/practice-timer'
    )
    expect(localizedPath('en', '/')).toBe('/en')
    expect(() => localizedPath('de', '/')).toThrow('Unsupported locale')
  })
})
