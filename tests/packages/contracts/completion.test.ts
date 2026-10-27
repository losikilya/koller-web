import { expect, test } from 'vitest'
import { profileCompletionSchema } from '@dance/contracts'
test('completion name nonblank uses the same explicit Unicode White_Space set as SQL', () => {
  const whitespace =
    '\u0009\u000a\u000b\u000c\u000d\u0020\u0085\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000'
  expect(
    profileCompletionSchema.safeParse({
      username: 'dancer',
      displayName: whitespace,
    }).success
  ).toBe(false)
  expect(
    profileCompletionSchema.safeParse({
      username: 'Dancer',
      displayName: whitespace + 'Танцор',
      bio: '',
    }).success
  ).toBe(true)
  for (const value of [
    { displayName: 'Owner' },
    { username: 'dancer' },
    { username: null, displayName: 'Owner' },
    { username: 'dancer', displayName: '😀'.repeat(81) },
    { username: 'dancer', displayName: 'Owner', visibility: 'public' },
  ])
    expect(profileCompletionSchema.safeParse(value).success).toBe(false)
})
