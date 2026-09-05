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

describe('useAppearance', () => {
  it('defaults to following the system when nothing has been persisted', () => {
    matchMedia = stubMatchMedia(true)
    const { result } = renderHook(() => useAppearance())
    expect(result.current.preference).toBe('system')
    expect(result.current.appearance).toBe('dark')
  })

  it('reads a persisted preference back on mount, overriding the system', () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, 'light')
    matchMedia = stubMatchMedia(true)
    const { result } = renderHook(() => useAppearance())
    expect(result.current.preference).toBe('light')
    expect(result.current.appearance).toBe('light')
  })

  it('falls back to system for a corrupted persisted value', () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, 'sepia')
    matchMedia = stubMatchMedia(false)
    const { result } = renderHook(() => useAppearance())
    expect(result.current.preference).toBe('system')
  })

  it('resolved appearance follows a live system change while preference is system', () => {
    matchMedia = stubMatchMedia(false)
    const { result } = renderHook(() => useAppearance())
    expect(result.current.appearance).toBe('light')

    matchMedia.changeTo(true)
    expect(result.current.appearance).toBe('dark')
  })

  it('choosePreference updates the resolved appearance and stops following the system', () => {
    matchMedia = stubMatchMedia(true)
    const { result } = renderHook(() => useAppearance())

    act(() => result.current.choosePreference('light'))
    expect(result.current.preference).toBe('light')
    expect(result.current.appearance).toBe('light')

    matchMedia.changeTo(false)
    expect(result.current.appearance).toBe('light')
  })

  it('choosePreference persists the choice under the storage key', () => {
    matchMedia = stubMatchMedia(false)
    const { result } = renderHook(() => useAppearance())

    act(() => result.current.choosePreference('dark'))
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('dark')
  })

  it('choosing system after a fixed choice hands the decision back to the live system value', () => {
    matchMedia = stubMatchMedia(true)
    const { result } = renderHook(() => useAppearance())

    act(() => result.current.choosePreference('light'))
    expect(result.current.appearance).toBe('light')

    act(() => result.current.choosePreference('system'))
    expect(result.current.preference).toBe('system')
    expect(result.current.appearance).toBe('dark')
  })

  it('toggles the dark class on <html> to match the resolved appearance, and removes it for light', () => {
    matchMedia = stubMatchMedia(true)
    const { result } = renderHook(() => useAppearance())
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => result.current.choosePreference('light'))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
