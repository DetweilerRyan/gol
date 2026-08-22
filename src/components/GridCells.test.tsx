import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { tileKey, tileOriginCell, type TileRange } from '../cellTiles'
import { createLiveCellStore } from '../liveCellStore'
import GridCells from './GridCells'

// Explicit small range, not a viewport-derived one -- the whole point of
// extracting this component is that its tests no longer pay for hundreds of
// buttons. A 2x2 tile range at spanCells 2 is enough to cover the enumeration
// (tile-to-cell origin offset, ty/tx loop order, tileKey keying) this
// component itself is now responsible for -- 16 buttons total.
const SPAN_CELLS = 2
const RANGE: TileRange = { minTileX: -1, maxTileX: 0, minTileY: -1, maxTileY: 0, spanCells: SPAN_CELLS }
const ANCHOR_X = 0
const ANCHOR_Y = 0
const CELL_SIZE = 20

function renderCells(props: Partial<React.ComponentProps<typeof GridCells>> = {}) {
  const merged: React.ComponentProps<typeof GridCells> = {
    range: RANGE,
    anchorX: ANCHOR_X,
    anchorY: ANCHOR_Y,
    cellSize: CELL_SIZE,
    store: createLiveCellStore(),
    onActivateCell: vi.fn(),
    ...props,
  }
  return { ...render(<GridCells {...merged} />), ...merged }
}

// Cell-level rendering (alive/dead style, aria-label, major-gridline border
// classes, its own store subscription) is Cell.test.tsx's job, and per-tile
// rendering (spanCells^2 buttons, transforms, O(changed) re-rendering) is
// CellTile.test.tsx's job -- see those files. What's left here is GridCells'
// own contract: that a click reaches onActivateCell (through CellTile,
// through Cell), and the tile-range enumeration (one CellTile per tile,
// tileKey-keyed) that replaced the old lattice's fixed-slot enumeration. The
// placing-mode preview overlay this used to also render is
// PatternPreview.test.tsx's job now -- see PatternPreview.tsx.
describe('GridCells click-to-activate', () => {
  it('a plain click on a cell button calls onActivateCell with that cell’s world coordinates', () => {
    const onActivateCell = vi.fn()
    renderCells({ onActivateCell })

    fireEvent.click(screen.getByRole('button', { name: 'Cell -1, -1' }))
    expect(onActivateCell).toHaveBeenCalledTimes(1)
    expect(onActivateCell).toHaveBeenCalledWith(-1, -1)
  })
})

describe('GridCells tile-range enumeration', () => {
  it('renders one CellTile per tile in range, each contributing spanCells^2 cells', () => {
    renderCells()

    const tilesX = RANGE.maxTileX - RANGE.minTileX + 1
    const tilesY = RANGE.maxTileY - RANGE.minTileY + 1
    for (let ty = RANGE.minTileY; ty <= RANGE.maxTileY; ty++) {
      const originY = tileOriginCell(ty, SPAN_CELLS)
      for (let tx = RANGE.minTileX; tx <= RANGE.maxTileX; tx++) {
        const originX = tileOriginCell(tx, SPAN_CELLS)
        for (let j = 0; j < SPAN_CELLS; j++) {
          for (let i = 0; i < SPAN_CELLS; i++) {
            const x = originX + i
            const y = originY + j
            expect(screen.getByRole('button', { name: `Cell ${x}, ${y}` })).toBeInTheDocument()
          }
        }
      }
    }
    expect(screen.getAllByRole('button')).toHaveLength(tilesX * SPAN_CELLS * tilesY * SPAN_CELLS)
  })

  // React's key is never reflected in the DOM, so the property above can't
  // see it -- this reads the element GridCells itself returns instead.
  // GridCells(props) can't be called as a plain function (React Compiler
  // injects a useMemoCache() call into every component it compiles, which
  // needs a live dispatcher), so this calls it from inside a throwaway
  // wrapper component's own render body -- a legitimate render call site --
  // and returns null rather than mounting the captured element, since
  // nothing here needs real DOM nodes.
  function captureElement(props: React.ComponentProps<typeof GridCells>): ReactElement {
    let captured: ReactElement | undefined
    function Probe() {
      captured = GridCells(props)
      return null
    }
    render(<Probe />)
    if (!captured) throw new Error('GridCells did not return an element')
    return captured
  }

  it('returns exactly one CellTile per tile in range, keyed by tileKey(tx, ty) in ty/tx loop order', () => {
    const element = captureElement({
      range: RANGE,
      anchorX: ANCHOR_X,
      anchorY: ANCHOR_Y,
      cellSize: CELL_SIZE,
      store: createLiveCellStore(),
      onActivateCell: vi.fn(),
    })
    const keys = (element.props as { children: ReactElement[] }).children.map((child) => child.key)

    const expectedKeys: string[] = []
    for (let ty = RANGE.minTileY; ty <= RANGE.maxTileY; ty++) {
      for (let tx = RANGE.minTileX; tx <= RANGE.maxTileX; tx++) {
        expectedKeys.push(tileKey(tx, ty))
      }
    }
    expect(keys).toEqual(expectedKeys)
  })
})
