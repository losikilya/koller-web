import { expect } from 'vitest'
import { readSupabaseConfig } from '@/shared/supabase/config'

function legacyKey(role: string) {
  return `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ role }))}.signature`
}
export function assertPublicConfiguration() {
  const config = {
    url: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_example',
  }
  expect(readSupabaseConfig(config)).toEqual(config)
  expect(readSupabaseConfig({})).toBeNull()
  expect(() => readSupabaseConfig({ url: config.url })).toThrow(
    'Invalid Supabase public configuration'
  )
  expect(
    readSupabaseConfig({
      url: 'http://127.0.0.1:54321',
      publishableKey: legacyKey('anon'),
    })
  ).toBeTruthy()
  for (const publishableKey of [
    'sb_secret_do-not-log',
    legacyKey('service_role'),
    legacyKey('anon'),
    'unknown-key',
  ]) {
    expect(() => readSupabaseConfig({ ...config, publishableKey })).toThrow(
      'Invalid Supabase public configuration'
    )
    try {
      readSupabaseConfig({ ...config, publishableKey })
    } catch (error) {
      expect(String(error)).not.toContain(publishableKey)
    }
  }
  for (const url of [
    'http://remote.test',
    'https://user:password@project.supabase.co',
    'file:///secret',
    'http://localhost.attacker.test:54321',
  ]) {
    expect(() => readSupabaseConfig({ ...config, url })).toThrow(
      'Invalid Supabase public configuration'
    )
  }
}
