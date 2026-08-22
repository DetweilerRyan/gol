import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { slotPixelPosition, slotWorldCoordinate } from '../cellLattice'
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

  it('positions each slot via slotPixelPosition(index, cellSize), independent of origin', () => {
    renderCells()

    const leftPx = slotPixelPosition(2, LATTICE.cellSize) // column index of world x=1
    const topPx = slotPixelPosition(2, LATTICE.cellSize) // row index of world y=1
    expect(screen.getByRole('button', { name: 'Cell 1, 1' }).style.transform).toBe(`translate(${leftPx}px, ${topPx}px)`)
  })
})
