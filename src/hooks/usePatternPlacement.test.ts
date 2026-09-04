import { act, fireEvent, renderHook, type RenderHookResult } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PATTERNS, type Pattern } from '../patternLibrary'
import { armedPattern, isLibraryOpen, previewPositions } from '../patternPlacement'
import { usePatternPlacement } from './usePatternPlacement'

const GLIDER = PATTERNS.find((pattern) => pattern.name === 'Glider') as Pattern

// Gates the identity-stability describe below, on useCamera.test.ts's/
// Grid.test.tsx's/useZoomGlide.test.ts's precedent: Stryker's per-expression
// instrumentation defeats React Compiler's memoization, so an ungated
// identity assertion reds the dry run and npm run test:mutation never
// starts. globalThis.__stryker__ is set at module load by any instrumented
// file's own bootstrap, before test collection.
const underStryker = '__stryker__' in globalThis

type Hook = RenderHookResult<ReturnType<typeof usePatternPlacement>, unknown> & {
  onPlacePattern: ReturnType<typeof vi.fn>
}

// Shared by every test below: renders the hook, and gives the many tests that just arm the
// Glider and/or press a key a one-line way to do it, rather than each repeating the same
// renderHook/act/fireEvent skeleton with only the method or key name varying.
function setup(): Hook {
  const onPlacePattern = vi.fn()
  return Object.assign(
    renderHook(() => usePatternPlacement(onPlacePattern)),
    { onPlacePattern },
  )
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
    expect(armedPattern(result.current.placement)).toBeNull()
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
    expect(armedPattern(result.current.placement)).toBeNull()
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

  it('stampArmedPattern commits the armed pattern at the given cell and disarms in the same action', () => {
    const hook = setup()
    arm(hook)

    act(() => hook.result.current.stampArmedPattern(3, -4))

    expect(hook.onPlacePattern).toHaveBeenCalledWith(GLIDER, 3, -4)
    expect(armedPattern(hook.result.current.placement)).toBeNull()
  })

  it('stampArmedPattern commits nothing a second time -- stamping is single-shot, not repeatable', () => {
    const hook = setup()
    arm(hook)

    act(() => hook.result.current.stampArmedPattern(3, -4))
    act(() => hook.result.current.stampArmedPattern(9, 9))

    expect(hook.onPlacePattern).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['idle', (_hook: Hook) => {}],
    ['browsing', (hook: Hook) => act(() => hook.result.current.openOrCancelLibrary())],
  ])('stampArmedPattern commits nothing while %s, since no pattern is armed', (_mode, enterMode) => {
    const hook = setup()
    enterMode(hook)

    act(() => hook.result.current.stampArmedPattern(3, -4))

    expect(hook.onPlacePattern).not.toHaveBeenCalled()
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

// stable-hook-identities: architect's DESIGN pass measured stampArmedPattern
// capturing `placement` directly, so it churned identity every time
// previewAt moved the preview -- the only one of this hook's five returned
// functions with a proven, measured cost (Cell.tsx's own header and
// LifeBoard.test.tsx's "armed hover does not re-render mounted cells"
// describe pin the propagated consequence; this describe pins the cause at
// the hook boundary). The other four are inline arrows closing over nothing
// but their own call-time arguments and setPlacement, which React Compiler
// already keeps stable -- see usePatternPlacement.ts's own comment on why
// stampArmedPattern alone needed a ref.
describe('stampArmedPattern identity', () => {
  // Skipped under Stryker for the same reason useCamera.test.ts's own
  // "returned action identity" describe is: Stryker's per-expression
  // instrumentation defeats React Compiler's memoization, so a mutated
  // build returns a fresh stampArmedPattern on every render and this
  // assertion fails in Stryker's dry run, before a single mutant executes.
  // The unskipped companion below proves the probe can see a real change --
  // placement's own identity DOES change when previewAt moves the preview --
  // which holds with or without memoization, so it stays unskipped and
  // still exercises this describe's setup under mutation testing.
  it.skipIf(underStryker)('stampArmedPattern keeps identity across previewAt moving the preview', () => {
    const hook = setup()
    arm(hook)
    const before = hook.result.current.stampArmedPattern

    act(() => hook.result.current.previewAt(3, 4))
    act(() => hook.result.current.previewAt(9, 9))

    expect(hook.result.current.stampArmedPattern).toBe(before)
  })

  it('placement itself does change identity across previewAt -- the guard above is not vacuous', () => {
    const hook = setup()
    arm(hook)
    const before = hook.result.current.placement

    act(() => hook.result.current.previewAt(3, 4))

    expect(hook.result.current.placement).not.toBe(before)
  })
})
