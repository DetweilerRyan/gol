import { act, render, renderHook } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { panCamera, type Camera } from '../camera'
import { centerCell } from '../gridFocus'
import { computeOnScreenRange } from '../gridGeometry'
import { useGridFocus } from './useGridFocus'
import type { ElementSize } from './useElementSize'

const CAMERA: Camera = { offsetX: -32, offsetY: -22.5, cellSize: 20 }
const SIZE: ElementSize = { width: 1280, height: 900 }

// A real, focusable DOM node matching the aria-label useGridFocus's DOM-sync
// effect queries for -- the hook uses document.querySelector directly (see
// its own header), so mounting this via RTL's render() into the same jsdom
// document is enough; no ref/container plumbing needed. A genuine RTL
// render (not a manually-appended DOM node) is what keeps this cleaned up
// between tests by src/test-setup.ts's global afterEach(cleanup).
function mountCellButton(x: number, y: number): HTMLButtonElement {
  render(React.createElement('button', { 'aria-label': `Cell ${x}, ${y}` }))
  const button = document.querySelector<HTMLButtonElement>(`[aria-label="Cell ${x}, ${y}"]`)
  if (!button) throw new Error('mountCellButton failed to render its own fixture button')
  return button
}

function setupHook(camera: Camera, size: ElementSize, onPan = vi.fn()) {
  const utils = renderHook(({ camera, size }) => useGridFocus(camera, size, onPan), {
    initialProps: { camera, size },
  })
  return { ...utils, onPan }
}

describe('useGridFocus', () => {
  it('starts at the centered view’s center cell when the initial size is already real', () => {
    const { result } = setupHook(CAMERA, SIZE)
    expect(result.current.focus).toEqual({ x: 0, y: 0 })
  })

  it('one-shot-recenters from centeredCamera(w, h) once a real size arrives, ignoring the stale camera prop entirely', () => {
    // A deliberately mismatched initial camera: centerCell of THIS camera at
    // 0x0 is (500, 500) (ceil(500) both axes), and centerCell of THIS camera
    // at the real size below would be roughly (532, 532) if the one-shot
    // latch wrongly used the (still-stale) `camera` prop instead of
    // recomputing centeredCamera(w, h) itself, as its own header argues it
    // must. Neither wrong answer is (0, 0), which is what the correct,
    // freshly-centered computation gives for this size -- see step 1's
    // gridFocus.test.ts for the identical assertion against the real
    // default 1280x900 camera.
    const staleCamera: Camera = { offsetX: 500, offsetY: 500, cellSize: 20 }
    const { result, rerender } = setupHook(staleCamera, { width: 0, height: 0 })
    expect(result.current.focus).toEqual({ x: 500, y: 500 })

    rerender({ camera: staleCamera, size: SIZE })

    expect(result.current.focus).toEqual({ x: 0, y: 0 })
  })

  it('only recenters once -- a later resize does not move an already-user-set focus', () => {
    const { result, rerender } = setupHook(CAMERA, { width: 0, height: 0 })
    rerender({ camera: CAMERA, size: SIZE })
    expect(result.current.focus).toEqual({ x: 0, y: 0 })

    act(() => result.current.moveFocus('right'))
    expect(result.current.focus).toEqual({ x: 1, y: 0 })

    // A further resize must not snap the user-moved focus back to center.
    rerender({ camera: CAMERA, size: { width: 900, height: 700 } })
    expect(result.current.focus).toEqual({ x: 1, y: 0 })
  })

  // The one-shot latch's guard is two clauses (`width <= 0 || height <= 0`),
  // and the two tests above exercise it only at {0, 0} -- where either clause
  // alone returns early, so each MASKS the other and a mutant weakening one
  // of them stays green. Measured: `width <= 0` -> `width < 0` survives the
  // whole unit+dom suite without these. An axis-asymmetric zero is what
  // separates them: a viewport measured on one axis only is still not a real
  // measurement, so the latch must not fire and the cursor must still be the
  // useState initializer's stale-camera value.
  it.each([
    ['only its height', { width: 0, height: SIZE.height }],
    ['only its width', { width: SIZE.width, height: 0 }],
  ])('does not fire the one-shot recenter when the viewport has measured %s', (_axis, partialSize) => {
    const staleCamera: Camera = { offsetX: 500, offsetY: 500, cellSize: 20 }
    const { result, rerender } = setupHook(staleCamera, partialSize)

    expect(result.current.focus).toEqual(
      centerCell(computeOnScreenRange(staleCamera, partialSize.width, partialSize.height)),
    )

    // ...and still fires normally once a genuinely real size arrives, so the
    // assertion above is a deferral rather than the latch being broken.
    rerender({ camera: staleCamera, size: SIZE })
    expect(result.current.focus).toEqual({ x: 0, y: 0 })
  })

  it('moveFocus steps exactly one cell in the given direction', () => {
    const { result } = setupHook(CAMERA, SIZE)
    act(() => result.current.moveFocus('right'))
    expect(result.current.focus).toEqual({ x: 1, y: 0 })
    act(() => result.current.moveFocus('down'))
    expect(result.current.focus).toEqual({ x: 1, y: 1 })
  })

  it('jumpToEdge moves to the on-screen row edge, matching computeOnScreenRange', () => {
    const { result } = setupHook(CAMERA, SIZE)
    const onScreen = computeOnScreenRange(CAMERA, SIZE.width, SIZE.height)

    act(() => result.current.jumpToEdge('left'))
    expect(result.current.focus).toEqual({ x: onScreen.minX, y: 0 })

    act(() => result.current.jumpToEdge('right'))
    expect(result.current.focus).toEqual({ x: onScreen.maxX, y: 0 })
  })

  it('setFocus jumps straight to the given coordinate, bypassing stepFocus entirely', () => {
    const { result } = setupHook(CAMERA, SIZE)
    act(() => result.current.setFocus(17, -9))
    expect(result.current.focus).toEqual({ x: 17, y: -9 })
  })

  it('moveFocus pans the camera (via onPan) when the move carries focus off computeOnScreenRange, and the pan applied through the real panCamera reveals it', () => {
    const onScreen = computeOnScreenRange(CAMERA, SIZE.width, SIZE.height)
    const onPan = vi.fn()
    const { result } = setupHook(CAMERA, SIZE, onPan)

    act(() => result.current.setFocus(onScreen.minX, 0))
    onPan.mockClear()
    act(() => result.current.moveFocus('left'))

    expect(result.current.focus).toEqual({ x: onScreen.minX - 1, y: 0 })
    expect(onPan).toHaveBeenCalledTimes(1)
    const [dxPixels, dyPixels] = onPan.mock.calls[0]
    const nextCamera = panCamera(CAMERA, dxPixels, dyPixels)
    const nextOnScreen = computeOnScreenRange(nextCamera, SIZE.width, SIZE.height)
    expect(nextOnScreen.minX).toBe(onScreen.minX - 1)
  })

  // The vertical twin of the test above. `dxPixels !== 0 || dyPixels !== 0`
  // is satisfied by its left operand alone on every horizontal reveal, so a
  // mutant blanking the right operand survives unless a purely VERTICAL
  // reveal -- dx exactly 0, dy non-zero -- is asserted too.
  it('moveFocus pans vertically, with no horizontal component, when the move carries focus off the top edge', () => {
    const onScreen = computeOnScreenRange(CAMERA, SIZE.width, SIZE.height)
    const onPan = vi.fn()
    const { result } = setupHook(CAMERA, SIZE, onPan)

    act(() => result.current.setFocus(0, onScreen.minY))
    onPan.mockClear()
    act(() => result.current.moveFocus('up'))

    expect(result.current.focus).toEqual({ x: 0, y: onScreen.minY - 1 })
    expect(onPan).toHaveBeenCalledTimes(1)
    const [dxPixels, dyPixels] = onPan.mock.calls[0]
    expect(dxPixels).toBe(0)
    expect(dyPixels).not.toBe(0)
    const nextOnScreen = computeOnScreenRange(panCamera(CAMERA, dxPixels, dyPixels), SIZE.width, SIZE.height)
    expect(nextOnScreen.minY).toBe(onScreen.minY - 1)
  })

  it('moveFocus does not call onPan when the move stays on screen', () => {
    const onPan = vi.fn()
    const { result } = setupHook(CAMERA, SIZE, onPan)
    act(() => result.current.moveFocus('right'))
    expect(onPan).not.toHaveBeenCalled()
  })

  it('setFocus never calls onPan, even for a coordinate off the current on-screen range', () => {
    const onScreen = computeOnScreenRange(CAMERA, SIZE.width, SIZE.height)
    const onPan = vi.fn()
    const { result } = setupHook(CAMERA, SIZE, onPan)
    act(() => result.current.setFocus(onScreen.maxX + 500, 0))
    expect(onPan).not.toHaveBeenCalled()
  })

  it('moveFocus/jumpToEdge move real DOM focus onto the new cell', () => {
    mountCellButton(0, 0)
    const rightButton = mountCellButton(1, 0)
    const { result } = setupHook(CAMERA, SIZE)

    act(() => result.current.moveFocus('right'))

    expect(document.activeElement).toBe(rightButton)
  })

  // The pointer route's own DOM-focus half, added as this slice's step-4
  // ADJUDICATE corrective. Before the dead-cell layer collapsed, the browser
  // supplied this for free (a click lands on a mounted <button>, which
  // Chromium focuses itself); with only live cells mounted, a click on a dead
  // cell has no button to focus at native-focus time and real focus is left
  // on the body. Asserting the ACTIVE ELEMENT rather than result.current.focus
  // is the point -- the cursor coordinate moved either way, and it is the DOM
  // half that the two e2e reds were about.
  it('setFocus moves real DOM focus onto the clicked cell, not just the roving-tabindex target', () => {
    mountCellButton(0, 0)
    const clicked = mountCellButton(4, -2)
    const { result } = setupHook(CAMERA, SIZE)

    act(() => result.current.setFocus(4, -2))

    expect(result.current.focus).toEqual({ x: 4, y: -2 })
    expect(document.activeElement).toBe(clicked)
  })

  it('does NOT steal DOM focus on initial mount or on the one-shot auto-recenter', () => {
    mountCellButton(0, 0)
    const activeBefore = document.activeElement
    const { rerender } = setupHook(CAMERA, { width: 0, height: 0 })
    rerender({ camera: CAMERA, size: SIZE })

    // Neither mounting the hook nor its own automatic recentering should
    // have moved real DOM focus away from wherever it already was.
    expect(document.activeElement).toBe(activeBefore)
  })
})
