import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { APPEARANCE_STORAGE_KEY } from '../appearance'
import { stubMatchMedia, type MatchMediaController } from '../test-support/domStubs'
import { useAppearance } from './useAppearance'

let matchMedia: MatchMediaController

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

// Every test here mounts the hook the same way (stub the system value, then
// render), so the arrange is extracted and each test body is only the part
// that differs -- three of those bodies were flagged as dry4ts duplicates at
// score 0.84 before this extraction.
function mountAppearance(systemMatches: boolean) {
  matchMedia = stubMatchMedia(systemMatches)
  return renderHook(() => useAppearance())
}

describe('useAppearance', () => {
  it('defaults to following the system when nothing has been persisted', () => {
    const { result } = mountAppearance(true)
    expect(result.current.preference).toBe('system')
    expect(result.current.appearance).toBe('dark')
  })

  it('reads a persisted preference back on mount, overriding the system', () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, 'light')
    const { result } = mountAppearance(true)
    expect(result.current.preference).toBe('light')
    expect(result.current.appearance).toBe('light')
  })

  it('falls back to system for a corrupted persisted value', () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, 'sepia')
    const { result } = mountAppearance(false)
    expect(result.current.preference).toBe('system')
  })

  it('resolved appearance follows a live system change while preference is system', () => {
    const { result } = mountAppearance(false)
    expect(result.current.appearance).toBe('light')

    matchMedia.changeTo(true)
    expect(result.current.appearance).toBe('dark')
  })

  it('choosePreference updates the resolved appearance and stops following the system', () => {
    const { result } = mountAppearance(true)

    act(() => result.current.choosePreference('light'))
    expect(result.current.preference).toBe('light')
    expect(result.current.appearance).toBe('light')

    matchMedia.changeTo(false)
    expect(result.current.appearance).toBe('light')
  })

  it('choosePreference persists the choice under the storage key', () => {
    const { result } = mountAppearance(false)

    act(() => result.current.choosePreference('dark'))
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('dark')
  })

  it('choosing system after a fixed choice hands the decision back to the live system value', () => {
    const { result } = mountAppearance(true)

    act(() => result.current.choosePreference('light'))
    expect(result.current.appearance).toBe('light')

    act(() => result.current.choosePreference('system'))
    expect(result.current.preference).toBe('system')
    expect(result.current.appearance).toBe('dark')
  })

  it('toggles the dark class on <html> to match the resolved appearance, and removes it for light', () => {
    const { result } = mountAppearance(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => result.current.choosePreference('light'))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
