import { describe, expect, it } from 'vitest'
import { panCamera, type Camera } from './camera'
import { computeOnScreenRange, type VisibleRange } from './gridGeometry'
import { centerCell, jumpToRowEdge, panToRevealPx, stepFocus } from './gridFocus'

const camera: Camera = { offsetX: -32, offsetY: -22.5, cellSize: 20 }

describe('centerCell', () => {
  it("returns (0, 0) for the default 1280x900 camera's on-screen range", () => {
    const range = computeOnScreenRange(camera, 1280, 900)
    expect(centerCell(range)).toEqual({ x: 0, y: 0 })
  })

  it('breaks an even-width tie toward the higher-numbered cell, not -0', () => {
    const range: VisibleRange = { minX: -32, maxX: 31, minY: -22, maxY: 21 }
    const center = centerCell(range)
    expect(center).toEqual({ x: 0, y: 0 })
    expect(Object.is(center.x, -0)).toBe(false)
    expect(Object.is(center.y, -0)).toBe(false)
  })

  it('finds the true middle of an odd-count range', () => {
    const range: VisibleRange = { minX: -2, maxX: 2, minY: -2, maxY: 2 }
    expect(centerCell(range)).toEqual({ x: 0, y: 0 })
  })

  it('handles a range with no symmetry around zero', () => {
    const range: VisibleRange = { minX: 10, maxX: 13, minY: -5, maxY: -2 }
    // (10 + 13 + 1) / 2 = 12, (-5 + -2 + 1) / 2 = -3
    expect(centerCell(range)).toEqual({ x: 12, y: -3 })
  })
})

describe('stepFocus', () => {
  it.each([
    ['left', { x: -1, y: 0 }],
    ['right', { x: 1, y: 0 }],
    ['up', { x: 0, y: -1 }],
    ['down', { x: 0, y: 1 }],
  ] as const)('moves %s by exactly one cell along its own axis', (direction, expected) => {
    expect(stepFocus({ x: 0, y: 0 }, direction)).toEqual(expected)
  })

  it('moves relative to an arbitrary starting cell, not just the origin', () => {
    expect(stepFocus({ x: 7, y: -3 }, 'right')).toEqual({ x: 8, y: -3 })
    expect(stepFocus({ x: 7, y: -3 }, 'up')).toEqual({ x: 7, y: -4 })
  })
})

describe('jumpToRowEdge', () => {
  const onScreen: VisibleRange = { minX: -32, maxX: 31, minY: -22, maxY: 21 }

  it('jumps to minX on the same row for the left edge', () => {
    expect(jumpToRowEdge({ x: 5, y: 3 }, 'left', onScreen)).toEqual({ x: -32, y: 3 })
  })

  it('jumps to maxX on the same row for the right edge', () => {
    expect(jumpToRowEdge({ x: 5, y: 3 }, 'right', onScreen)).toEqual({ x: 31, y: 3 })
  })

  it('never changes the row', () => {
    expect(jumpToRowEdge({ x: -32, y: -17 }, 'left', onScreen).y).toBe(-17)
  })
})

describe('panToRevealPx', () => {
  const onScreen: VisibleRange = { minX: -32, maxX: 31, minY: -22, maxY: 21 }

  it('returns {0, 0} when focus is already on screen', () => {
    expect(panToRevealPx({ x: 0, y: 0 }, camera, onScreen)).toEqual({ dxPixels: 0, dyPixels: 0 })
  })

  it('reveals a cell one past the left edge: applying the pan through the real panCamera puts focus at the new minX', () => {
    const focus = { x: onScreen.minX - 1, y: 0 }
    const { dxPixels, dyPixels } = panToRevealPx(focus, camera, onScreen)

    // Verified against camera.ts's own panCamera -- the exact function
    // useCamera's panByPixels calls, unchanged -- rather than trusting the
    // sign derivation in gridFocus.ts's own comment.
    const nextCamera = panCamera(camera, dxPixels, dyPixels)
    const nextOnScreen = computeOnScreenRange(nextCamera, 1280, 900)
    expect(nextOnScreen.minX).toBe(focus.x)
    expect(focus.x).toBeGreaterThanOrEqual(nextOnScreen.minX)
    expect(focus.x).toBeLessThanOrEqual(nextOnScreen.maxX)
    expect(dyPixels).toBe(0)
  })

  it('reveals a cell one past the right edge: applying the pan puts focus at the new maxX', () => {
    const focus = { x: onScreen.maxX + 1, y: 0 }
    const { dxPixels, dyPixels } = panToRevealPx(focus, camera, onScreen)

    const nextCamera = panCamera(camera, dxPixels, dyPixels)
    const nextOnScreen = computeOnScreenRange(nextCamera, 1280, 900)
    expect(nextOnScreen.maxX).toBe(focus.x)
    expect(dyPixels).toBe(0)
  })

  it('reveals a cell one past the top edge: applying the pan puts focus at the new minY', () => {
    const focus = { x: 0, y: onScreen.minY - 1 }
    const { dxPixels, dyPixels } = panToRevealPx(focus, camera, onScreen)

    const nextCamera = panCamera(camera, dxPixels, dyPixels)
    const nextOnScreen = computeOnScreenRange(nextCamera, 1280, 900)
    expect(nextOnScreen.minY).toBe(focus.y)
    expect(dxPixels).toBe(0)
  })

  it('reveals a cell one past the bottom edge: applying the pan puts focus at the new maxY', () => {
    const focus = { x: 0, y: onScreen.maxY + 1 }
    const { dxPixels, dyPixels } = panToRevealPx(focus, camera, onScreen)

    const nextCamera = panCamera(camera, dxPixels, dyPixels)
    const nextOnScreen = computeOnScreenRange(nextCamera, 1280, 900)
    expect(nextOnScreen.maxY).toBe(focus.y)
    expect(dxPixels).toBe(0)
  })

  it('reveals a cell off screen on both axes simultaneously', () => {
    const focus = { x: onScreen.minX - 3, y: onScreen.maxY + 5 }
    const { dxPixels, dyPixels } = panToRevealPx(focus, camera, onScreen)

    const nextCamera = panCamera(camera, dxPixels, dyPixels)
    const nextOnScreen = computeOnScreenRange(nextCamera, 1280, 900)
    expect(focus.x).toBeGreaterThanOrEqual(nextOnScreen.minX)
    expect(focus.x).toBeLessThanOrEqual(nextOnScreen.maxX)
    expect(focus.y).toBeGreaterThanOrEqual(nextOnScreen.minY)
    expect(focus.y).toBeLessThanOrEqual(nextOnScreen.maxY)
  })

  it('a far-off-screen cell is still fully revealed in one pan, not clamped to the nearest edge', () => {
    const focus = { x: onScreen.minX - 500, y: 0 }
    const { dxPixels, dyPixels } = panToRevealPx(focus, camera, onScreen)

    const nextCamera = panCamera(camera, dxPixels, dyPixels)
    const nextOnScreen = computeOnScreenRange(nextCamera, 1280, 900)
    expect(nextOnScreen.minX).toBe(focus.x)
    expect(dyPixels).toBe(0)
  })
})
