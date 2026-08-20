import { act, fireEvent, renderHook, type RenderHookResult } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PATTERNS, type Pattern } from '../gameOfLife'
import { armedPattern, isLibraryOpen, previewPositions, suppressesEnter } from '../patternPlacement'
import { usePatternPlacement } from './usePatternPlacement'

const GLIDER = PATTERNS.find((pattern) => pattern.name === 'Glider') as Pattern

type Hook = RenderHookResult<ReturnType<typeof usePatternPlacement>, unknown>

// Shared by every test below: renders the hook, and gives the many tests that just arm the
// Glider and/or press a key a one-line way to do it, rather than each repeating the same
// renderHook/act/fireEvent skeleton with only the method or key name varying.
function setup(): Hook {
  return renderHook(() => usePatternPlacement())
}

function arm({ result }: Hook) {
  act(() => result.current.selectPattern(GLIDER))
}

function pressKey(key: string) {
  act(() => {
    fireEvent.keyDown(window, { key })
  })
}

describe('usePatternPlacement', () => {
  it('starts idle', () => {
    const { result } = setup()
    expect(suppressesEnter(result.current.placement)).toBe(false)
    expect(isLibraryOpen(result.current.placement)).toBe(false)
  })

  it('openOrCancelLibrary opens the library, and cancels placing instead once a pattern is armed', () => {
    const hook = setup()
    const { result } = hook

    act(() => result.current.openOrCancelLibrary())
    expect(isLibraryOpen(result.current.placement)).toBe(true)

    arm(hook)
    expect(isLibraryOpen(result.current.placement)).toBe(false)
    expect(armedPattern(result.current.placement)).toBe(GLIDER)

    act(() => result.current.openOrCancelLibrary())
    expect(isLibraryOpen(result.current.placement)).toBe(false)
    expect(armedPattern(result.current.placement)).toBeNull()
  })

  it('closeLibrary returns to idle without arming anything', () => {
    const { result } = setup()
    act(() => result.current.openOrCancelLibrary())
    act(() => result.current.closeLibrary())
    expect(isLibraryOpen(result.current.placement)).toBe(false)
    expect(suppressesEnter(result.current.placement)).toBe(false)
  })

  it('previewAt moves the armed pattern’s preview, and does nothing when nothing is armed', () => {
    const hook = setup()
    const { result } = hook

    act(() => result.current.previewAt(3, 4))
    expect(previewPositions(result.current.placement)).toEqual([])

    arm(hook)
    act(() => result.current.previewAt(3, 4))
    expect(previewPositions(result.current.placement)).toHaveLength(GLIDER.cells.length)
  })

  it('disarm clears an armed pattern', () => {
    const hook = setup()
    arm(hook)
    act(() => hook.result.current.disarm())
    expect(armedPattern(hook.result.current.placement)).toBeNull()
  })

  it('Escape cancels placing', () => {
    const hook = setup()
    const { result } = hook
    arm(hook)
    act(() => result.current.previewAt(1, 1))

    pressKey('Escape')

    expect(armedPattern(result.current.placement)).toBeNull()
    expect(previewPositions(result.current.placement)).toEqual([])
  })

  it('a non-Escape key leaves placing untouched', () => {
    const hook = setup()
    arm(hook)

    pressKey('a')

    expect(armedPattern(hook.result.current.placement)).toBe(GLIDER)
  })

  it('Escape does not close the library, which owns its own Escape handling', () => {
    const { result } = setup()
    act(() => result.current.openOrCancelLibrary())

    pressKey('Escape')

    expect(isLibraryOpen(result.current.placement)).toBe(true)
  })

  it('stops responding to Escape once unmounted', () => {
    const hook = setup()
    arm(hook)
    const armed = hook.result.current.placement
    hook.unmount()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(hook.result.current.placement).toBe(armed)
  })

  // Distinct from the "stops responding to Escape" test above: that one only observes that
  // result.current doesn't change post-unmount, which would hold true even if cleanup were a
  // no-op (an unmounted renderHook's result is frozen regardless of whether the listener kept
  // firing). Asserting on the exact removeEventListener call is what actually proves the
  // listener registered on mount is the one torn down, under the same event name.
  it('removes exactly the "keydown" listener it added on mount, using the same handler reference', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = setup()

    const registeredCall = addSpy.mock.calls.find(([type]) => type === 'keydown')
    expect(registeredCall).toBeDefined()
    const [, handler] = registeredCall as [string, EventListener]

    unmount()

    expect(removeSpy).toHaveBeenCalledWith('keydown', handler)
  })
})
