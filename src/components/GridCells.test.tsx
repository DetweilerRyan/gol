import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { slotIndex, slotPixelPosition, slotWorldCoordinate } from '../cellLattice'
import { createLiveCellStore } from '../liveCellStore'
import GridCells from './GridCells'

// Explicit small lattice, not a viewport-derived one -- the whole point of
// extracting this component is that its tests no longer pay for hundreds of
// buttons. 3x3 is enough to cover the enumeration (origin offset, row-major
// order, slot-index keying) this component itself is now responsible for.
const LATTICE = { originX: -1, originY: -1, cols: 3, rows: 3, cellSize: 20 }

function renderCells(props: Partial<React.ComponentProps<typeof GridCells>> = {}) {
  const merged: React.ComponentProps<typeof GridCells> = {
    ...LATTICE,
    store: createLiveCellStore(),
    onActivateCell: vi.fn(),
    ...props,
  }
  return { ...render(<GridCells {...merged} />), ...merged }
}

// Cell-level rendering (alive/dead style, aria-label, major-gridline border
// classes, its own store subscription) is Cell.test.tsx's job now -- see
// Cell.tsx. What's left here is GridCells' own contract: that it wires
// onActivate through to Cell correctly, and the lattice-slot enumeration
// (world coordinate + pixel position per slot) that replaced the old
// camera-derived cells array. The placing-mode preview overlay this used to
// also render is PatternPreview.test.tsx's job now -- see PatternPreview.tsx.
describe('GridCells click-to-activate', () => {
  it('a plain click on a cell button calls onActivateCell with that cell’s world coordinates', () => {
    const onActivateCell = vi.fn()
    renderCells({ onActivateCell })

    fireEvent.click(screen.getByRole('button', { name: 'Cell 1, 1' }))
    expect(onActivateCell).toHaveBeenCalledTimes(1)
    expect(onActivateCell).toHaveBeenCalledWith(1, 1)
  })
})

describe('GridCells lattice enumeration', () => {
  it('renders one cell per (col, row) slot, offset by originX/originY', () => {
    renderCells()

    for (let j = 0; j < LATTICE.rows; j++) {
      for (let i = 0; i < LATTICE.cols; i++) {
        const x = slotWorldCoordinate(LATTICE.originX, i)
        const y = slotWorldCoordinate(LATTICE.originY, j)
        expect(screen.getByRole('button', { name: `Cell ${x}, ${y}` })).toBeInTheDocument()
      }
    }
    expect(screen.getAllByRole('button')).toHaveLength(LATTICE.cols * LATTICE.rows)
  })

  it('hands each slot a transform built from slotPixelPosition(index, cellSize), independent of origin', () => {
    renderCells()

    const leftPx = slotPixelPosition(2, LATTICE.cellSize) // column index of world x=1
    const topPx = slotPixelPosition(2, LATTICE.cellSize) // row index of world y=1
    expect(screen.getByRole('button', { name: 'Cell 1, 1' }).style.transform).toBe(`translate(${leftPx}px, ${topPx}px)`)
  })

  // React's key is never reflected in the DOM, so the two properties above
  // can't see it -- this reads the element GridCells itself returns instead.
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

  it('returns exactly cols*rows Cell elements, keyed by slotIndex(col, row, cols), not the world coordinate', () => {
    const element = captureElement({ ...LATTICE, store: createLiveCellStore(), onActivateCell: vi.fn() })
    const keys = (element.props as { children: ReactElement[] }).children.map((child) => child.key)

    const expectedKeys: string[] = []
    for (let j = 0; j < LATTICE.rows; j++) {
      for (let i = 0; i < LATTICE.cols; i++) {
        expectedKeys.push(String(slotIndex(i, j, LATTICE.cols)))
      }
    }
    expect(keys).toEqual(expectedKeys)
  })
})
