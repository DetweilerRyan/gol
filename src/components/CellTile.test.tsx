import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { cellOffsetPx } from '../cellAnchor'
import { tileOriginCell } from '../cellTiles'
import { cellKey } from '../gameOfLife'
import { createLiveCellStore } from '../liveCellStore'
import CellTile from './CellTile'

// Fixture deliberately avoids tileX: 0, tileY: 0 (the "single fixture" trap
// steps 1-3's cleaner passes kept finding: a zero tile index makes
// tileOriginCell's multiplication degenerate) and a zero anchor, and puts a
// negative tile index on BOTH axes rather than just one -- see this slice's
// prompt on the min/max-coincide and single-axis mutation-coverage gaps
// found in cellTiles.ts/cellAnchor.ts's own tests.
const SPAN_CELLS = 4
const CELL_SIZE = 20
const TILE_X = -2
const TILE_Y = 3
const ANCHOR_X = -4
const ANCHOR_Y = 0

function expectedTransform(x: number, y: number): string {
  const leftPx = cellOffsetPx(x, ANCHOR_X, CELL_SIZE)
  const topPx = cellOffsetPx(y, ANCHOR_Y, CELL_SIZE)
  return `translate(${leftPx}px, ${topPx}px)`
}

function renderTile(store = createLiveCellStore()) {
  const onActivate = vi.fn()
  const utils = render(
    <CellTile
      tileX={TILE_X}
      tileY={TILE_Y}
      spanCells={SPAN_CELLS}
      cellSize={CELL_SIZE}
      anchorX={ANCHOR_X}
      anchorY={ANCHOR_Y}
      store={store}
      onActivate={onActivate}
    />,
  )
  return { ...utils, store, onActivate }
}

describe('the observable contract', () => {
  it('renders spanCells^2 buttons, each with the right aria-label and transform', () => {
    renderTile()

    const originX = tileOriginCell(TILE_X, SPAN_CELLS)
    const originY = tileOriginCell(TILE_Y, SPAN_CELLS)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(SPAN_CELLS * SPAN_CELLS)

    for (let j = 0; j < SPAN_CELLS; j++) {
      const y = originY + j
      for (let i = 0; i < SPAN_CELLS; i++) {
        const x = originX + i
        const cell = screen.getByRole('button', { name: `Cell ${x}, ${y}` })
        expect(cell.style.transform).toBe(expectedTransform(x, y))
      }
    }
  })

  it('renders no wrapper node of its own -- a fragment, so all 16 buttons are direct children of the render container', () => {
    const { container } = renderTile()

    expect(container.children).toHaveLength(SPAN_CELLS * SPAN_CELLS)
    for (const child of Array.from(container.children)) {
      expect(child.tagName).toBe('BUTTON')
    }
  })
})

// The named deliverable of this slice: proof that toggling one cell inside a
// mounted tile re-renders only that cell, not its 15 tile-mates. Probed by
// distinct getCellSnapshot() keys rather than a raw call count, since mount
// itself calls getCellSnapshot both during render and again after subscribe
// (useSyncExternalStore's own consistency check) -- see Grid.test.tsx's
// "lattice pan-stability" describe for the same discipline one layer up.
//
// No it.skipIf(underStryker) here, unlike Grid.test.tsx's pan-stability
// pair: nothing above Cell re-renders on a store mutation (no prop on
// CellTile ever changes per pan tick or per generation -- see this
// component's own header), so there is no React Compiler memoization for
// Stryker's per-expression instrumentation to defeat. This test stays
// unskipped and contributes mutation coverage.
describe('O(changed) rendering', () => {
  it('toggling one cell re-renders only that cell, not its tile-mates', () => {
    const store = createLiveCellStore()
    renderTile(store)

    const originX = tileOriginCell(TILE_X, SPAN_CELLS)
    const originY = tileOriginCell(TILE_Y, SPAN_CELLS)
    const flippedX = originX + 1
    const flippedY = originY + 2
    const flippedKey = cellKey(flippedX, flippedY)

    const spy = vi.spyOn(store, 'getCellSnapshot')
    spy.mockClear()

    act(() => store.toggle(flippedX, flippedY))

    const distinctKeys = new Set(spy.mock.calls.map((call) => call[0]))
    expect(distinctKeys).toEqual(new Set([flippedKey]))
  })

  it('the flipped cell actually shows the new aliveness (the guard above is not vacuous)', () => {
    const store = createLiveCellStore()
    renderTile(store)

    const originX = tileOriginCell(TILE_X, SPAN_CELLS)
    const originY = tileOriginCell(TILE_Y, SPAN_CELLS)
    const flippedX = originX + 1
    const flippedY = originY + 2

    const cell = screen.getByRole('button', { name: `Cell ${flippedX}, ${flippedY}` })
    expect(cell.className).not.toContain('bg-gray-900')

    act(() => store.toggle(flippedX, flippedY))

    expect(cell.className).toContain('bg-gray-900')
  })
})
