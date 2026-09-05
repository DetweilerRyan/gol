import { describe, expect, it } from 'vitest'
import { APPEARANCE_STORAGE_KEY, parseAppearancePreference, resolveAppearance } from './appearance'

describe('resolveAppearance', () => {
  it.each([
    { preference: 'light', system: 'dark', expected: 'light' },
    { preference: 'light', system: 'light', expected: 'light' },
    { preference: 'dark', system: 'light', expected: 'dark' },
    { preference: 'dark', system: 'dark', expected: 'dark' },
  ] as const)(
    'a fixed preference of $preference wins over a system appearance of $system',
    ({ preference, system, expected }) => {
      expect(resolveAppearance(preference, system)).toBe(expected)
    },
  )

  it.each([
    { system: 'dark', expected: 'dark' },
    { system: 'light', expected: 'light' },
  ] as const)('following the system resolves to whatever the system is, here $system', ({ system, expected }) => {
    expect(resolveAppearance('system', system)).toBe(expected)
  })
})

describe('parseAppearancePreference', () => {
  it.each(['light', 'dark', 'system'] as const)('reads back its own written value %s unchanged', (value) => {
    expect(parseAppearancePreference(value)).toBe(value)
  })

  it.each([
    { raw: null, label: 'no key has ever been written' },
    { raw: '', label: 'the empty string' },
    { raw: 'Light', label: 'a value differing only in case' },
    { raw: 'sepia', label: 'a value this app never wrote' },
    { raw: '{"broken":true}', label: 'corrupted JSON-shaped storage' },
  ])('falls back to system for $label', ({ raw }) => {
    expect(parseAppearancePreference(raw)).toBe('system')
  })
})

// Persisted preferences outlive a deploy; a key rename orphans every visitor
// who already chose light or dark, silently reverting them to system. Pinned
// as a value rather than left to whatever the constant currently says.
it('persists under a fixed, stable storage key', () => {
  expect(APPEARANCE_STORAGE_KEY).toBe('appearance-preference')
})
