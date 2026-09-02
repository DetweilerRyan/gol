import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TileRange } from '../cellTiles'
import { cellKey } from '../gameOfLife'
import type { FocusCell } from '../gridFocus'
import { liveCellsInRange, type WindowCell } from '../liveCellWindow'
import GridCells from './GridCells'

const ANCHOR_X = 0
const ANCHOR_Y = 0
const CELL_SIZE = 20

// Well away from every cell any fixture below uses -- see the mounted-count
// guard's own comment for why a fixture needs an explicit "focus lands
// nowhere real" case too.
const FOCUS_OUTSIDE_RANGE: FocusCell = { x: 9999, y: 9999 }

function renderCells(props: Partial<React.ComponentProps<typeof GridCells>> = {}) {
  const merged: React.ComponentProps<typeof GridCells> = {
    cells: [],
    anchorX: ANCHOR_X,
    anchorY: ANCHOR_Y,
    cellSize: CELL_SIZE,
    onActivateCell: vi.fn(),
    focus: FOCUS_OUTSIDE_RANGE,
    ...props,
  }
  return { ...render(<GridCells {...merged} />), ...merged }
}

// Cell-level rendering (alive/dead style, aria-label, roving-tabindex,
// aria-describedby, its own store subscription) is Cell.test.tsx's job.
// What's left here is GridCells' own contract, post-collapse-dead-cell-layer:
// a click reaches onActivateCell (through Cell), positioning each `cells`
// entry via cellOffsetPx, and -- since step 4 -- rendering EXACTLY one Cell
// per entry in `cells`, no more and no fewer, which is what makes it safe
// for Grid.tsx to compute the render window once (liveCellsInRange) and hand
// it straight down. The placing-mode preview overlay this used to also
// render is PatternPreview.test.tsx's job now -- see PatternPreview.tsx.
describe('GridCells click-to-activate', () => {
  it('a plain click on a cell button calls onActivateCell with that cell’s world coordinates', () => {
    const onActivateCell = vi.fn()
    const cells: WindowCell[] = [{ key: cellKey(-1, -1), x: -1, y: -1, isAlive: true }]
    renderCells({ cells, onActivateCell })

    fireEvent.click(screen.getByRole('button', { name: 'Cell -1, -1' }))
    expect(onActivateCell).toHaveBeenCalledTimes(1)
    expect(onActivateCell).toHaveBeenCalledWith(-1, -1)
  })
})

describe('GridCells cell enumeration', () => {
  it('renders exactly one Cell button per entry in `cells`, with a transform derived from cellOffsetPx', () => {
    const cells: WindowCell[] = [
      { key: cellKey(-1, -1), x: -1, y: -1, isAlive: true },
      { key: cellKey(3, 5), x: 3, y: 5, isAlive: false },
    ]
    renderCells({ cells, anchorX: 2, anchorY: 1, cellSize: 10 })

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)

    const first = screen.getByRole('button', { name: 'Cell -1, -1' })
    // (x - anchorX) * cellSize, (y - anchorY) * cellSize -- see cellAnchor.ts's cellOffsetPx.
    expect(first.style.transform).toBe(`translate(${(-1 - 2) * 10}px, ${(-1 - 1) * 10}px)`)

    const second = screen.getByRole('button', { name: 'Cell 3, 5' })
    expect(second.style.transform).toBe(`translate(${(3 - 2) * 10}px, ${(5 - 1) * 10}px)`)
  })

  it('renders nothing at all for an empty window', () => {
    renderCells({ cells: [] })
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})

// One thin test: `focus` decides which single `cells` entry is the roving
// tab stop, by coordinate comparison -- the actual tabIndex/description
// rendering is Cell.test.tsx's job. This only proves the wiring reaches all
// the way down.
describe('GridCells focus pass-through', () => {
  it('the cells entry matching focus is the single tab stop', () => {
    const cells: WindowCell[] = [
      { key: cellKey(-1, -1), x: -1, y: -1, isAlive: true },
      { key: cellKey(0, 0), x: 0, y: 0, isAlive: true },
    ]
    renderCells({ cells, focus: { x: -1, y: -1 } })

    expect(screen.getByRole('button', { name: 'Cell -1, -1' }).tabIndex).toBe(0)
    expect(screen.getByRole('button', { name: 'Cell 0, 0' }).tabIndex).toBe(-1)
  })
})

// THE IN-GATE GUARD FOR THE SLICE'S ENTIRE PREMISE: an empty board no longer
// costs what a populated one costs, expressed as a mounted-button count this
// runs inside crap4ts/Stryker (unlike perf/, which no pipeline role runs on
// every slice -- see this slice's step-4 handoff). Exercises the REAL
// pipeline end to end -- liveCellsInRange (liveCellWindow.ts) feeding
// GridCells, exactly as Grid.tsx wires them -- rather than hand-building a
// `cells` array that would only prove GridCells trusts its own prop.
//
// The fixture straddles the mounted range's boundary on both axes, and every
// expected count below is counted BY HAND from the fixture, not derived by
// calling liveCellsInRange a second time -- doing that would make this a
// tautology against the very function it's meant to guard.
describe('GridCells mounted-count guard (collapse-dead-cell-layer)', () => {
  // spanCells=2, minTile=-1..0 on both axes -> world range x,y in [-2, 1] (4x4 = 16 cells).
  const RANGE: TileRange = { minTileX: -1, maxTileX: 0, minTileY: -1, maxTileY: 0, spanCells: 2 }

  const liveCells = new Set([
    cellKey(-2, -2), // inside range, alive
    cellKey(0, 0), // inside range, alive
    cellKey(1, 1), // inside range, alive (range's own far edge)
    cellKey(2, 2), // OUTSIDE range (x=2 > maxX=1) -- must not mount
    cellKey(-3, -3), // OUTSIDE range -- must not mount
  ])
  // |live ∩ window| by hand: (-2,-2), (0,0), (1,1) -- exactly 3.
  const LIVE_IN_WINDOW = 3

  function mount(focus: FocusCell) {
    const cells = liveCellsInRange(liveCells, RANGE, focus)
    return renderCells({ cells, focus })
  }

  it('mounts |live ∩ window| + 1 when the focus cursor sits on a dead, off-range cell', () => {
    mount({ x: 9999, y: 9999 })
    expect(screen.getAllByRole('button')).toHaveLength(LIVE_IN_WINDOW + 1)
  })

  it('mounts exactly |live ∩ window| when the focus cursor sits on a cell already counted (dedupe)', () => {
    mount({ x: 0, y: 0 }) // already live and in-window
    expect(screen.getAllByRole('button')).toHaveLength(LIVE_IN_WINDOW)
  })

  it('mounts |live ∩ window| + 1 when the focus cursor sits on a dead cell that IS in range', () => {
    mount({ x: -1, y: -1 }) // in range, never made live by the fixture
    expect(screen.getAllByRole('button')).toHaveLength(LIVE_IN_WINDOW + 1)
  })

  it('never mounts a dead, unfocused cell inside the range', () => {
    mount({ x: 9999, y: 9999 })
    // (-1, -1) is inside RANGE, dead, and not the focus cursor in this case.
    expect(screen.queryByRole('button', { name: 'Cell -1, -1' })).not.toBeInTheDocument()
  })
})
