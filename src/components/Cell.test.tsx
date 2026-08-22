import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { worldToScreen, type Camera } from '../camera'
import { cellKey } from '../gameOfLife'
import { createLiveCellStore } from '../liveCellStore'
import Cell from './Cell'

const camera: Camera = { offsetX: 0, offsetY: 0, cellSize: 20 }

// Cell no longer takes a Camera, and no longer does pixel math at all --
// callers (GridCells) derive the slot's pixel position and hand it a finished
// CSS transform. Tests still import worldToScreen purely to build a plausible
// transform from a world coordinate; that's a test-fixture convenience, not a
// dependency Cell.tsx itself has.
function transformFor(x: number, y: number) {
  const { x: leftPx, y: topPx } = worldToScreen(camera, x, y)
  return { transform: `translate(${leftPx}px, ${topPx}px)` }
}

function renderCell(props: Partial<React.ComponentProps<typeof Cell>> = {}) {
  const merged: React.ComponentProps<typeof Cell> = {
    x: 1,
    y: 1,
    ...transformFor(1, 1),
    cellSize: camera.cellSize,
    store: createLiveCellStore(),
    onActivate: vi.fn(),
    ...props,
  }
  return { ...render(<Cell {...merged} />), ...merged }
}

describe('Cell rendering', () => {
  it('renders an alive cell with the live style, aria-labeled "Cell x, y"', () => {
    const store = createLiveCellStore(new Set([cellKey(0, 0)]))
    renderCell({ x: 0, y: 0, ...transformFor(0, 0), store })

    const alive = screen.getByRole('button', { name: 'Cell 0, 0' })
    expect(alive.className).toContain('bg-gray-900')
    expect(alive.style.boxSizing).toBe('border-box')
  })

  it('renders a dead cell with the dead style', () => {
    renderCell({ x: 1, y: 0, ...transformFor(1, 0) })

    const dead = screen.getByRole('button', { name: 'Cell 1, 0' })
    expect(dead.className).toContain('bg-white')
  })

  it('applies its transform prop verbatim, doing no pixel math of its own', () => {
    renderCell({ x: 1, y: 1, transform: 'translate(7px, 11px)' })
    expect(screen.getByRole('button', { name: 'Cell 1, 1' }).style.transform).toBe('translate(7px, 11px)')
  })

  it('adds a major-x border class, and not major-y, for a cell on a multiple-of-10 x coordinate', () => {
    renderCell({ x: 10, y: 1, ...transformFor(10, 1) })
    const onMajorX = screen.getByRole('button', { name: 'Cell 10, 1' })
    expect(onMajorX.className).toContain('border-l-2 border-l-gray-400')
    expect(onMajorX.className).not.toContain('border-t-2 border-t-gray-400')
  })

  it('adds a major-y border class, and not major-x, for a cell on a multiple-of-10 y coordinate', () => {
    renderCell({ x: -1, y: 10, ...transformFor(-1, 10) })
    const onMajorY = screen.getByRole('button', { name: 'Cell -1, 10' })
    expect(onMajorY.className).toContain('border-t-2 border-t-gray-400')
    expect(onMajorY.className).not.toContain('border-l-2 border-l-gray-400')
  })

  it('adds neither major-gridline class, and pins the exact class list, for a cell on neither', () => {
    renderCell({ x: 1, y: 1, ...transformFor(1, 1) })
    const onNeither = screen.getByRole('button', { name: 'Cell 1, 1' })
    expect(onNeither.className).not.toContain('border-l-2 border-l-gray-400')
    expect(onNeither.className).not.toContain('border-t-2 border-t-gray-400')
    // Pins down the exact class list (not just the absence of the gridline classes above), so a
    // mutation that swaps either '' fallback for stray literal text is still caught even though
    // that text isn't one of the specific substrings checked above.
    expect(onNeither.className.split(/\s+/).filter(Boolean)).toEqual(
      'absolute top-0 left-0 border border-gray-200 bg-white hover:bg-gray-100'.split(' '),
    )
  })

  it('a cell on both a major-x and major-y coordinate gets both border classes', () => {
    renderCell({ x: 0, y: 0, ...transformFor(0, 0) })
    const cell = screen.getByRole('button', { name: 'Cell 0, 0' })
    expect(cell.className).toContain('border-l-2 border-l-gray-400')
    expect(cell.className).toContain('border-t-2 border-t-gray-400')
  })
})

describe('Cell click-to-activate', () => {
  it('a plain click calls onActivate with its own world coordinates', () => {
    const onActivate = vi.fn()
    renderCell({ x: 3, y: -2, ...transformFor(3, -2), onActivate })

    fireEvent.click(screen.getByRole('button', { name: 'Cell 3, -2' }))
    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(onActivate).toHaveBeenCalledWith(3, -2)
  })
})

describe('Cell aliveness subscription', () => {
  it('re-renders with the live style after the store toggles its own cell alive', () => {
    const store = createLiveCellStore()
    renderCell({ x: 2, y: 2, ...transformFor(2, 2), store })

    const cell = screen.getByRole('button', { name: 'Cell 2, 2' })
    expect(cell.className).toContain('bg-white')

    act(() => store.toggle(2, 2))

    expect(screen.getByRole('button', { name: 'Cell 2, 2' }).className).toContain('bg-gray-900')
  })
})
