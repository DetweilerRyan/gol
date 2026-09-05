import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { worldToScreen, type Camera } from '../camera'
import { anchorOffsetPx, cellOffsetPx, computeAnchor } from '../cellAnchor'
import { MAJOR_GRIDLINE_INTERVAL, gridLinePhasePx } from '../gridGeometry'
import GridLines from './GridLines'

function renderGridLines(camera: Camera) {
  const { container } = render(<GridLines camera={camera} />)
  return container.firstElementChild as HTMLElement
}

describe('GridLines rendering', () => {
  it('is a single decorative, non-interactive node', () => {
    const el = renderGridLines({ offsetX: 0, offsetY: 0, cellSize: 20 })
    expect(el.getAttribute('aria-hidden')).toBe('true')
    expect(el.className).toContain('pointer-events-none')
    expect(el.className).toContain('inset-0')
  })

  // collapse-dead-cell-layer step 4: a dead cell mostly no longer mounts at
  // all, so without a base fill here the gaps between live cells would show
  // #grid-content's own background through instead of the board's own fill a
  // dead cell used to paint -- a visible appearance regression the ruling on
  // that slice's handoff explicitly rejects. bg-board rather than a literal
  // bg-white since dark-mode-following-system-appearance: the token resolves
  // to white in light mode and to the dark board fill under html.dark, with
  // no change to this class string -- see src/index.css.
  it('carries its own board base fill, so the gap between live cells still reads as the board', () => {
    const el = renderGridLines({ offsetX: 0, offsetY: 0, cellSize: 20 })
    expect(el.className).toContain('bg-board')
  })

  it('never carries a transform -- it is camera-exact via background-position, not a translated layer', () => {
    const el = renderGridLines({ offsetX: 123.4, offsetY: -56.7, cellSize: 20 })
    expect(el.style.transform).toBe('')
  })

  it('sizes each background layer to a period in pixels: minor = cellSize, major = cellSize * MAJOR_GRIDLINE_INTERVAL', () => {
    const camera: Camera = { offsetX: 0, offsetY: 0, cellSize: 20 }
    const el = renderGridLines(camera)
    const majorPeriod = camera.cellSize * MAJOR_GRIDLINE_INTERVAL
    expect(el.style.backgroundSize).toBe(
      `${majorPeriod}px 100%, 100% ${majorPeriod}px, ${camera.cellSize}px 100%, 100% ${camera.cellSize}px`,
    )
  })

  it("positions every background layer from gridGeometry.ts's own gridLinePhasePx, major layers first", () => {
    const camera: Camera = { offsetX: 4.7, offsetY: -3.2, cellSize: 20 }
    const el = renderGridLines(camera)
    const { minorXPx, minorYPx, majorXPx, majorYPx } = gridLinePhasePx(camera)
    expect(el.style.backgroundPosition).toBe(
      `${majorXPx}px 0px, 0px ${majorYPx}px, ${minorXPx}px 0px, 0px ${minorYPx}px`,
    )
  })

  it('carries four background image layers: major-x, major-y, minor-x, minor-y, in that order', () => {
    const el = renderGridLines({ offsetX: 0, offsetY: 0, cellSize: 20 })
    const layers = el.style.backgroundImage.split('), ')
    expect(layers).toHaveLength(4)
    expect(layers[0]).toContain('to right')
    expect(layers[0]).toContain('2px') // major width
    expect(layers[1]).toContain('to bottom')
    expect(layers[1]).toContain('2px')
    expect(layers[2]).toContain('to right')
    expect(layers[2]).toContain('1px') // minor width
    expect(layers[3]).toContain('to bottom')
    expect(layers[3]).toContain('1px')
  })

  // dark-mode-following-system-appearance: these read the board-line design
  // tokens rather than a literal --color-gray-* var directly, so the same
  // string re-themes under html.dark -- see src/index.css.
  it('uses the board-line design tokens, not hardcoded hex or a raw gray variable', () => {
    const el = renderGridLines({ offsetX: 0, offsetY: 0, cellSize: 20 })
    expect(el.style.backgroundImage).toContain('var(--color-board-line-minor)')
    expect(el.style.backgroundImage).toContain('var(--color-board-line-major)')
  })

  // The coincidence question this slice's spike had to answer: gridLinePhasePx's
  // minor phase must land at the exact same screen pixel as a Cell's own
  // border, which is (worldToScreen(camera, x, y) mod nothing extra --
  // anchorOffsetPx + cellOffsetPx is an EXACT identity with worldToScreen, per
  // cellAnchor.ts's own header). toBeCloseTo rather than toBe: the two sides
  // reach that pixel value via a different sequence of floating-point
  // operations (a multiply-then-wrap vs a subtract-then-multiply), so they
  // are congruent over the reals but can differ by ~1e-13px in IEEE 754 --
  // orders of magnitude below any rasterization quantum, never an exact
  // decimal match for an arbitrary camera.
  it("coincides with a mounted cell's own screen position at an arbitrary integer boundary, modulo floating-point noise", () => {
    const camera: Camera = { offsetX: 4.7, offsetY: -3.2, cellSize: 12.8 }
    const { minorXPx, minorYPx } = gridLinePhasePx(camera)

    for (const worldCoordinate of [-37, -1, 0, 1, 42]) {
      const anchor = computeAnchor(camera, 4)
      const { xPx, yPx } = anchorOffsetPx(anchor, camera)
      const cellLeftPx = xPx + cellOffsetPx(worldCoordinate, anchor.x, camera.cellSize)
      const cellTopPx = yPx + cellOffsetPx(worldCoordinate, anchor.y, camera.cellSize)

      // The cell's own screen position, wrapped into the same [0, cellSize)
      // window gridLinePhasePx reports its phase in.
      const wrap = (value: number, period: number) => ((value % period) + period) % period
      expect(wrap(cellLeftPx, camera.cellSize)).toBeCloseTo(minorXPx, 9)
      expect(wrap(cellTopPx, camera.cellSize)).toBeCloseTo(minorYPx, 9)

      // And directly against worldToScreen, cellAnchor's own reference point.
      const direct = worldToScreen(camera, worldCoordinate, worldCoordinate)
      expect(wrap(direct.x, camera.cellSize)).toBeCloseTo(minorXPx, 9)
      expect(wrap(direct.y, camera.cellSize)).toBeCloseTo(minorYPx, 9)
    }
  })

  it('recomputes its background-position on every camera change -- no stale phase after a pan', () => {
    const { container, rerender } = render(<GridLines camera={{ offsetX: 0, offsetY: 0, cellSize: 20 }} />)
    const el = container.firstElementChild as HTMLElement
    const before = el.style.backgroundPosition

    rerender(<GridLines camera={{ offsetX: 3.5, offsetY: 0, cellSize: 20 }} />)

    expect(el.style.backgroundPosition).not.toBe(before)
  })
})
