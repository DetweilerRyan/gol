import { act, fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PATTERNS, type Pattern } from '../gameOfLife'
import { armedPattern, isLibraryOpen, previewPositions, suppressesEnter } from '../patternPlacement'
import { usePatternPlacement } from './usePatternPlacement'

const GLIDER = PATTERNS.find((pattern) => pattern.name === 'Glider') as Pattern

describe('usePatternPlacement', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => usePatternPlacement())
    expect(suppressesEnter(result.current.placement)).toBe(false)
    expect(isLibraryOpen(result.current.placement)).toBe(false)
  })

  it('openOrCancelLibrary opens the library, and cancels placing instead once a pattern is armed', () => {
    const { result } = renderHook(() => usePatternPlacement())

    act(() => result.current.openOrCancelLibrary())
    expect(isLibraryOpen(result.current.placement)).toBe(true)

    act(() => result.current.selectPattern(GLIDER))
    expect(isLibraryOpen(result.current.placement)).toBe(false)
    expect(armedPattern(result.current.placement)).toBe(GLIDER)

    act(() => result.current.openOrCancelLibrary())
    expect(isLibraryOpen(result.current.placement)).toBe(false)
    expect(armedPattern(result.current.placement)).toBeNull()
  })

  it('closeLibrary returns to idle without arming anything', () => {
    const { result } = renderHook(() => usePatternPlacement())
    act(() => result.current.openOrCancelLibrary())
    act(() => result.current.closeLibrary())
    expect(isLibraryOpen(result.current.placement)).toBe(false)
    expect(suppressesEnter(result.current.placement)).toBe(false)
  })

  it('previewAt moves the armed pattern’s preview, and does nothing when nothing is armed', () => {
    const { result } = renderHook(() => usePatternPlacement())

    act(() => result.current.previewAt(3, 4))
    expect(previewPositions(result.current.placement)).toEqual([])

    act(() => result.current.selectPattern(GLIDER))
    act(() => result.current.previewAt(3, 4))
    expect(previewPositions(result.current.placement)).toHaveLength(GLIDER.cells.length)
  })

  it('disarm clears an armed pattern', () => {
    const { result } = renderHook(() => usePatternPlacement())
    act(() => result.current.selectPattern(GLIDER))
    act(() => result.current.disarm())
    expect(armedPattern(result.current.placement)).toBeNull()
  })

  it('Escape cancels placing', () => {
    const { result } = renderHook(() => usePatternPlacement())
    act(() => result.current.selectPattern(GLIDER))
    act(() => result.current.previewAt(1, 1))

    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' })
    })

    expect(armedPattern(result.current.placement)).toBeNull()
    expect(previewPositions(result.current.placement)).toEqual([])
  })

  it('a non-Escape key leaves placing untouched', () => {
    const { result } = renderHook(() => usePatternPlacement())
    act(() => result.current.selectPattern(GLIDER))

    act(() => {
      fireEvent.keyDown(window, { key: 'a' })
    })

    expect(armedPattern(result.current.placement)).toBe(GLIDER)
  })

  it('Escape does not close the library, which owns its own Escape handling', () => {
    const { result } = renderHook(() => usePatternPlacement())
    act(() => result.current.openOrCancelLibrary())

    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' })
    })

    expect(isLibraryOpen(result.current.placement)).toBe(true)
  })

  it('stops responding to Escape once unmounted', () => {
    const { result, unmount } = renderHook(() => usePatternPlacement())
    act(() => result.current.selectPattern(GLIDER))
    const armed = result.current.placement
    unmount()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(result.current.placement).toBe(armed)
  })
})
