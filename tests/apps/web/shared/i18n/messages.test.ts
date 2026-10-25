import { expect, it } from 'vitest'
import en from '@/shared/i18n/messages/en.json'
import ru from '@/shared/i18n/messages/ru.json'
function keys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, item]) =>
    typeof item === 'object' && item !== null
      ? keys(item as Record<string, unknown>, prefix + key + '.')
      : [prefix + key]
  )
}
it('provides every English namespace key in Russian with nonempty messages', () => {
  expect(keys(ru).sort()).toEqual(keys(en).sort())
  for (const messages of [en, ru])
    for (const namespace of Object.values(messages))
      for (const message of Object.values(namespace))
        expect(message.trim().length).toBeGreaterThan(0)
})
