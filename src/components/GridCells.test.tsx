import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { worldToScreen, type Camera } from '../camera'
import { cellKey, type LiveCells } from '../gameOfLife'
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
    liveCells: new Set<string>() as LiveCells,
    previewPositions: [],
    onActivateCell: vi.fn(),
    ...props,
  }
  return { ...render(<GridCells {...merged} />), ...merged }
}

describe('GridCells cell rendering', () => {
  it('renders alive cells with the live style and dead cells with the dead style, aria-labeled "Cell x, y"', () => {
    const liveCells = new Set([cellKey(0, 0)]) as LiveCells
    renderCells({ liveCells })

    const alive = screen.getByRole('button', { name: 'Cell 0, 0' })
    expect(alive.className).toContain('bg-gray-900')
    expect(alive.style.boxSizing).toBe('border-box')

    const dead = screen.getByRole('button', { name: 'Cell 1, 0' })
    expect(dead.className).toContain('bg-white')
  })

  it('positions a cell via worldToScreen(camera, x, y)', () => {
    renderCells()
    const { x: left, y: top } = worldToScreen(camera, 1, 1)
    expect(screen.getByRole('button', { name: 'Cell 1, 1' }).style.transform).toBe(`translate(${left}px, ${top}px)`)
  })

  it('adds major-gridline border classes only to cells on a multiple-of-10 x or y coordinate', () => {
    renderCells()

    const onMajorX = screen.getByRole('button', { name: 'Cell 10, 1' })
    expect(onMajorX.className).toContain('border-l-2 border-l-gray-400')
    expect(onMajorX.className).not.toContain('border-t-2 border-t-gray-400')

    const onMajorY = screen.getByRole('button', { name: 'Cell -1, 10' })
    expect(onMajorY.className).toContain('border-t-2 border-t-gray-400')
    expect(onMajorY.className).not.toContain('border-l-2 border-l-gray-400')

    const onNeither = screen.getByRole('button', { name: 'Cell 1, 1' })
    expect(onNeither.className).not.toContain('border-l-2 border-l-gray-400')
    expect(onNeither.className).not.toContain('border-t-2 border-t-gray-400')
    // Pins down the exact class list (not just the absence of the gridline classes above), so a
    // mutation that swaps either '' fallback for stray literal text is still caught even though
    // that text isn't one of the specific substrings checked above.
    expect(onNeither.className.split(/\s+/).filter(Boolean)).toEqual(
      'absolute top-0 left-0 border border-gray-200 transition-colors bg-white hover:bg-gray-100'.split(' '),
    )
  })

  it('a cell on both a major-x and major-y coordinate gets both border classes', () => {
    renderCells({ cells: [{ x: 0, y: 0 }] })
    const cell = screen.getByRole('button', { name: 'Cell 0, 0' })
    expect(cell.className).toContain('border-l-2 border-l-gray-400')
    expect(cell.className).toContain('border-t-2 border-t-gray-400')
  })
})

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
        liveCells={new Set<string>() as LiveCells}
        previewPositions={[[1, 1]]}
        onActivateCell={vi.fn()}
      />,
    )

    expect(screen.queryByLabelText('Pattern preview cell 0, 0')).not.toBeInTheDocument()
    const after = screen.getByLabelText('Pattern preview cell 1, 1')
    expect(after).not.toBe(before)
  })
})
