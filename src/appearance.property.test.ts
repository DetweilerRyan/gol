import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { parseAppearancePreference, resolveAppearance, type Appearance, type AppearancePreference } from './appearance'

const appearance: fc.Arbitrary<Appearance> = fc.constantFrom('light', 'dark')
const fixedPreference: fc.Arbitrary<AppearancePreference> = fc.constantFrom('light', 'dark')

describe('resolveAppearance (property)', () => {
  it.prop([fixedPreference, appearance])(
    'a fixed preference wins outright, whatever the system is reporting',
    (preference, systemAppearance) => {
      expect(resolveAppearance(preference, systemAppearance)).toBe(preference)
    },
  )

  it.prop([appearance])("'system' always defers to whatever the system is currently reporting", (systemAppearance) => {
    expect(resolveAppearance('system', systemAppearance)).toBe(systemAppearance)
  })
})

// parseAppearancePreference's two fixed values are already exhaustively
// pinned by appearance.test.ts's it.each -- the domain there is a closed
// 3-value union with nothing left for a property to explore. What a property
// adds is the one claim over a genuinely unbounded domain: every string that
// ISN'T one of the two fixed values, not just the handful of degenerate ones
// (empty, wrong case, corrupted JSON) appearance.test.ts pins individually.
describe('parseAppearancePreference (property)', () => {
  it.prop([fc.string().filter((raw) => raw !== 'light' && raw !== 'dark')])(
    'anything other than the two fixed values resolves to system',
    (raw) => {
      expect(parseAppearancePreference(raw)).toBe('system')
    },
  )
})
