// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  boundaryViolation,
  checkBoundaries,
  importSpecifiers,
  validateGraph,
} from '../../scripts/check-boundaries.mjs'
describe('architecture enforcement', () => {
  it('accepts the implemented graph', () =>
    expect(checkBoundaries()).toEqual([]))
  it.each([
    ['packages/ui/src/index.tsx', 'apps/web/src/shell/Shell.tsx'],
    ['packages/contracts/src/index.ts', 'packages/ui/src/index.tsx'],
    ['apps/web/src/shared/example.ts', 'apps/web/src/shell/Shell.tsx'],
    [
      'apps/web/src/modules/playground/catalog.ts',
      'apps/web/src/shell/Shell.tsx',
    ],
    [
      'apps/web/src/shell/Shell.tsx',
      'apps/web/src/modules/playground/catalog.ts',
    ],
    ['apps/web/src/shell/Shell.tsx', 'apps/web/src/app/en/page.tsx'],
  ])('rejects forbidden edge %s → %s', (from, to) =>
    expect(boundaryViolation(from, to)).toBeTruthy()
  )
  it('allows public module consumption', () =>
    expect(
      boundaryViolation(
        'apps/web/src/shell/Shell.tsx',
        'apps/web/src/modules/playground/index.ts'
      )
    ).toBeNull())
  it('finds static, re-export and dynamic dependencies', () =>
    expect(
      importSpecifiers(
        "import x from './x'; export {y} from './y'; import('./z'); require('./r')",
        'fixture.ts'
      )
    ).toEqual(['./x', './y', './z', './r']))
  it('rejects circular dependencies', () =>
    expect(
      validateGraph(
        new Map([
          ['a', ['b']],
          ['b', ['a']],
        ])
      )
    ).toEqual(['Circular import: a']))
})
