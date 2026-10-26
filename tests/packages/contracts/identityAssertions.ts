import { expect } from 'vitest'
import {
  profilePatchSchema,
  privacySchema,
  preferencesSchema,
  playgroundDataSchema,
  publicProfileSchema,
} from '@dance/contracts'

export function assertIdentityContracts() {
  expect(
    profilePatchSchema.parse({ displayName: 'Танцор', bio: 'Привет' })
  ).toEqual({ displayName: 'Танцор', bio: 'Привет' })
  for (const username of [
    'ab',
    'Uppercase',
    '1dancer',
    'танцор',
    'admin',
    'a'.repeat(31),
  ]) {
    expect(profilePatchSchema.safeParse({ username }).success).toBe(false)
  }
  expect(profilePatchSchema.parse({ username: 'dancer_01' }).username).toBe(
    'dancer_01'
  )
  expect(profilePatchSchema.safeParse({}).success).toBe(false)
  expect(
    profilePatchSchema.safeParse({ userId: 'forged', bio: 'text' }).success
  ).toBe(false)
  expect(
    profilePatchSchema.safeParse({ avatarPath: 'another/private.png' }).success
  ).toBe(false)
  expect(profilePatchSchema.safeParse({ bio: 'я'.repeat(501) }).success).toBe(
    false
  )
  expect(
    profilePatchSchema.safeParse({ displayName: '😀'.repeat(80) }).success
  ).toBe(true)
  expect(
    privacySchema.safeParse({
      visibility: 'private',
      discoverable: true,
      showActivity: false,
    }).success
  ).toBe(false)
  expect(
    privacySchema.safeParse({
      visibility: 'public',
      discoverable: false,
      showActivity: true,
    }).success
  ).toBe(false)
  expect(
    privacySchema.parse({
      visibility: 'private',
      discoverable: false,
      showActivity: false,
    }).visibility
  ).toBe('private')
  expect(
    preferencesSchema.parse({ locale: 'ru', theme: 'system' }).locale
  ).toBe('ru')
  expect(
    preferencesSchema.safeParse({ locale: 'de', theme: 'dark' }).success
  ).toBe(false)
  const data = {
    appKey: 'practice-timer',
    dataKey: 'default',
    schemaVersion: 1,
    payload: {},
  }
  expect(playgroundDataSchema.safeParse(data).success).toBe(true)
  for (const invalid of [
    { ...data, schemaVersion: 2 },
    { ...data, payload: [] },
    { ...data, payload: { timer: 'not-yet-supported' } },
    { ...data, payload: { value: 'я'.repeat(17000) } },
    { ...data, appKey: 'battles' },
  ]) {
    expect(playgroundDataSchema.safeParse(invalid).success).toBe(false)
  }
  expect(
    publicProfileSchema.safeParse({
      userId: '11111111-1111-4111-8111-111111111111',
      username: null,
      displayName: 'Танцор',
      bio: '',
      avatarUrl: null,
    }).success
  ).toBe(true)
  expect(
    publicProfileSchema.safeParse({
      userId: '11111111-1111-4111-8111-111111111111',
      username: null,
      displayName: 'Танцор',
      bio: '',
      avatarUrl: null,
      avatarPath: 'private',
    }).success
  ).toBe(false)
}
