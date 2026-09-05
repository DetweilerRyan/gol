import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { worldToScreen, type Camera } from '../camera'
import { CELL_ALIVE_ATTR, CELL_ALIVE_VALUE, CELL_DEAD_VALUE, cellLabel } from '../test-support/cellQuery'
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
    isAlive: false,
    onActivate: vi.fn(),
    isFocused: false,
    ...props,
  }
  return { ...render(<Cell {...merged} />), ...merged }
}

describe('Cell rendering', () => {
  it('renders a cell aria-labeled "Cell x, y", with border-box sizing', () => {
    renderCell({ x: 0, y: 0, ...transformFor(0, 0) })

    const cell = screen.getByRole('button', { name: cellLabel(0, 0) })
    expect(cell.style.boxSizing).toBe('border-box')
  })

  it('applies its transform prop verbatim, doing no pixel math of its own', () => {
    renderCell({ x: 1, y: 1, transform: 'translate(7px, 11px)' })
    expect(screen.getByRole('button', { name: 'Cell 1, 1' }).style.transform).toBe('translate(7px, 11px)')
  })
})

// aria-pressed says WHAT a cell is (its aliveness); the paint class below
// says what it LOOKS LIKE. Every aliveness assertion in this file goes
// through aria-pressed / CELL_ALIVE_ATTR from here down -- the one exception
// is the dedicated 'Cell paint' pair further below, kept deliberately as the
// visual contract.
describe('Cell aria-pressed aliveness', () => {
  it('exposes an alive cell as a pressed toggle button, readable through the accessibility tree', () => {
    renderCell({ x: 0, y: 0, ...transformFor(0, 0), isAlive: true })

    // getByRole with a `pressed` filter resolves through ARIA semantics, not
    // an attribute string -- this is the assertion the accepted outline
    // requires at least one of (see features/cell-life-and-death.e2e.spec.ts).
    expect(screen.getByRole('button', { name: cellLabel(0, 0), pressed: true })).toBeInTheDocument()
  })

  it('exposes a dead cell as an UNPRESSED toggle button, with aria-pressed="false" present rather than omitted', () => {
    renderCell({ x: 1, y: 0, ...transformFor(1, 0), isAlive: false })

    const dead = screen.getByRole('button', { name: cellLabel(1, 0), pressed: false })
    // aria-pressed="false" and an absent aria-pressed are different ARIA
    // statements (present-and-false vs. not-a-toggle-at-all) -- pin the
    // literal attribute value, not just the role query resolving.
    expect(dead).toHaveAttribute(CELL_ALIVE_ATTR, CELL_DEAD_VALUE)
  })

  it('flips aria-pressed when a re-render hands it a new isAlive prop', () => {
    // Cell no longer subscribes to a store itself (see this component's own
    // header, collapse-dead-cell-layer step 4) -- GridCells recomputes
    // isAlive from a fresh liveCellsInRange call and hands it down as a
    // prop, so what used to be "toggle the store, the subscription fires" is
    // now "re-render with a new prop value".
    const { rerender } = renderCell({ x: 2, y: 2, ...transformFor(2, 2), isAlive: false })
    const cell = screen.getByRole('button', { name: cellLabel(2, 2) })
    expect(cell).toHaveAttribute(CELL_ALIVE_ATTR, CELL_DEAD_VALUE)

    rerender(
      <Cell
        x={2}
        y={2}
        {...transformFor(2, 2)}
        cellSize={camera.cellSize}
        isAlive
        onActivate={vi.fn()}
        isFocused={false}
      />,
    )

    expect(cell).toHaveAttribute(CELL_ALIVE_ATTR, CELL_ALIVE_VALUE)
  })
})

// VISUAL CONTRACT. aria-pressed above says what a cell IS; this pins what it
// LOOKS LIKE, and is deliberately the only place in this file that reads the
// Tailwind paint class as an aliveness assertion. collapse-dead-cell-layer
// step 4 drops the per-cell border and hover: classes (GridLines.tsx and
// HoverIndicator.tsx own those now -- see Cell.tsx's own header), so a dead
// cell now paints NOTHING: no class beyond bare positioning, letting
// GridLines' own base fill and lines show straight through.
describe('Cell paint', () => {
  it('paints an alive cell dark and a dead cell with no background class at all', () => {
    renderCell({ x: 0, y: 0, ...transformFor(0, 0), isAlive: true })
    renderCell({ x: 1, y: 0, ...transformFor(1, 0), isAlive: false })

    const alive = screen.getByRole('button', { name: cellLabel(0, 0) })
    const dead = screen.getByRole('button', { name: cellLabel(1, 0) })
    expect(alive.className.split(/\s+/).filter(Boolean)).toEqual(['absolute', 'top-0', 'left-0', 'bg-cell-alive'])
    expect(dead.className.split(/\s+/).filter(Boolean)).toEqual(['absolute', 'top-0', 'left-0'])
  })
})

describe('Cell roving tabindex and focus description', () => {
  it('a non-focused cell is out of the sequential tab order, with no description', () => {
    renderCell({ x: 5, y: 5, ...transformFor(5, 5), isFocused: false })
    const cell = screen.getByRole('button', { name: 'Cell 5, 5' })
    expect(cell.tabIndex).toBe(-1)
    expect(cell).not.toHaveAttribute('aria-describedby')
  })

  it('the focused cell is the single tab stop, and carries a description', () => {
    renderCell({ x: 5, y: 5, ...transformFor(5, 5), isFocused: true })
    const cell = screen.getByRole('button', { name: 'Cell 5, 5' })
    expect(cell.tabIndex).toBe(0)
    expect(cell).toHaveAttribute('aria-describedby')
  })

  it("the description node's own id matches aria-describedby, and its whole content is exactly the state word", () => {
    renderCell({ x: 2, y: 3, ...transformFor(2, 3), isFocused: true, isAlive: true })
    const cell = screen.getByRole('button', { name: 'Cell 2, 3' })

    const describedById = cell.getAttribute('aria-describedby')
    expect(describedById).toBeTruthy()
    const description = document.getElementById(describedById!)
    expect(description).not.toBeNull()
    // Exactly the state word -- not the coordinate too. See Cell.tsx's own
    // comment on why: the coordinate is already the accessible NAME
    // (aria-label), and repeating it here would double-announce it.
    expect(description!.textContent).toBe('alive')
  })

  it('the description says "dead" for a dead focused cell, and updates when a re-render flips isAlive', () => {
    const { rerender } = renderCell({ x: 2, y: 3, ...transformFor(2, 3), isFocused: true, isAlive: false })
    const cell = screen.getByRole('button', { name: 'Cell 2, 3' })
    const describedById = cell.getAttribute('aria-describedby')!
    expect(document.getElementById(describedById)!.textContent).toBe('dead')

    rerender(
      <Cell x={2} y={3} {...transformFor(2, 3)} cellSize={camera.cellSize} isAlive onActivate={vi.fn()} isFocused />,
    )

    expect(document.getElementById(describedById)!.textContent).toBe('alive')
  })

  it('the description is visually hidden rather than removed from the accessible tree', () => {
    renderCell({ x: 2, y: 3, ...transformFor(2, 3), isFocused: true })
    const cell = screen.getByRole('button', { name: 'Cell 2, 3' })
    const describedById = cell.getAttribute('aria-describedby')!
    expect(document.getElementById(describedById)!.className).toContain('sr-only')
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
