import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { worldToScreen, type Camera } from '../camera'
import { createLiveCellStore } from '../liveCellStore'
import GridCells from './GridCells'

const camera: Camera = { offsetX: 0, offsetY: 0, cellSize: 20 }

// Explicit small fixtures, not a viewport-derived range -- the whole point of
// extracting this component is that its tests no longer pay for hundreds of
// buttons. 3x3 is enough to cover the major-gridline (x-only, y-only,
// neither) and alive/dead branches at once.
const NINE_CELLS = [
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: -1, y: 0 },
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: -1, y: 10 },
  { x: 10, y: 1 },
  { x: 1, y: 1 },
]

function renderCells(props: Partial<React.ComponentProps<typeof GridCells>> = {}) {
  const merged: React.ComponentProps<typeof GridCells> = {
    camera,
    cells: NINE_CELLS,
    store: createLiveCellStore(),
    previewPositions: [],
    onActivateCell: vi.fn(),
    ...props,
  }
  return { ...render(<GridCells {...merged} />), ...merged }
}

// Cell-level rendering (alive/dead style, aria-label, worldToScreen
// positioning, major-gridline border classes, its own store subscription) is
// Cell.test.tsx's job now -- see Cell.tsx. What's left here is GridCells' own
// contract: that it wires onActivate through to Cell correctly, and the
// preview-overlay stacking/remount behavior below.
describe('GridCells click-to-activate', () => {
  it('a plain click on a cell button calls onActivateCell with that cell’s world coordinates', () => {
    const onActivateCell = vi.fn()
    renderCells({ onActivateCell })

    fireEvent.click(screen.getByRole('button', { name: 'Cell 1, 1' }))
    expect(onActivateCell).toHaveBeenCalledTimes(1)
    expect(onActivateCell).toHaveBeenCalledWith(1, 1)
  })
})

describe('GridCells preview overlay', () => {
  it('renders a preview cell per position, after the cell buttons in DOM order', () => {
    const { container } = renderCells({ previewPositions: [[0, 0]] })
    const preview = screen.getByLabelText('Pattern preview cell 0, 0')
    expect(preview.className).toContain('pointer-events-none')
    expect(preview.style.boxSizing).toBe('border-box')

    const children = [...container.children]
    const lastButtonIndex = children.map((el) => el.tagName).lastIndexOf('BUTTON')
    const previewIndex = children.indexOf(preview)
    expect(previewIndex).toBeGreaterThan(lastButtonIndex)
  })

  it('positions a preview cell via worldToScreen(camera, x, y)', () => {
    renderCells({ previewPositions: [[1, -1]] })
    const { x: left, y: top } = worldToScreen(camera, 1, -1)
    expect(screen.getByLabelText('Pattern preview cell 1, -1').style.transform).toBe(`translate(${left}px, ${top}px)`)
  })

  it('remounts preview-cell DOM nodes (rather than reusing them) when the preview positions change', () => {
    // The preview cell's key encodes its world position (`preview-${x}-${y}`), not a stable
    // per-slot index, so a changed position changes the key and React tears down and recreates
    // the node -- this is the one place a wrong/constant key is observable through
    // testing-library, since it changes DOM node identity, not just the rendered props.
    const { rerender } = renderCells({ previewPositions: [[0, 0]] })
    const before = screen.getByLabelText('Pattern preview cell 0, 0')

    rerender(
      <GridCells
        camera={camera}
        cells={NINE_CELLS}
        store={createLiveCellStore()}
        previewPositions={[[1, 1]]}
        onActivateCell={vi.fn()}
      />,
    )

    expect(screen.queryByLabelText('Pattern preview cell 0, 0')).not.toBeInTheDocument()
    const after = screen.getByLabelText('Pattern preview cell 1, 1')
    expect(after).not.toBe(before)
  })
})
