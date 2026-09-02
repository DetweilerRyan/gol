import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { worldToScreen, type Camera } from '../camera'
import { cellKey } from '../gameOfLife'
import { createLiveCellStore } from '../liveCellStore'
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
    store: createLiveCellStore(),
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

// aria-pressed says WHAT a cell is (its aliveness); the paint class below
// says what it LOOKS LIKE. Every aliveness assertion in this file goes
// through aria-pressed / CELL_ALIVE_ATTR from here down -- the one exception
// is the dedicated 'Cell paint' pair further below, kept deliberately as the
// visual contract.
describe('Cell aria-pressed aliveness', () => {
  it('exposes an alive cell as a pressed toggle button, readable through the accessibility tree', () => {
    const store = createLiveCellStore(new Set([cellKey(0, 0)]))
    renderCell({ x: 0, y: 0, ...transformFor(0, 0), store })

    // getByRole with a `pressed` filter resolves through ARIA semantics, not
    // an attribute string -- this is the assertion the accepted outline
    // requires at least one of (see features/cell-life-and-death.e2e.spec.ts).
    expect(screen.getByRole('button', { name: cellLabel(0, 0), pressed: true })).toBeInTheDocument()
  })

  it('exposes a dead cell as an UNPRESSED toggle button, with aria-pressed="false" present rather than omitted', () => {
    renderCell({ x: 1, y: 0, ...transformFor(1, 0) })

    const dead = screen.getByRole('button', { name: cellLabel(1, 0), pressed: false })
    // aria-pressed="false" and an absent aria-pressed are different ARIA
    // statements (present-and-false vs. not-a-toggle-at-all) -- pin the
    // literal attribute value, not just the role query resolving.
    expect(dead).toHaveAttribute(CELL_ALIVE_ATTR, CELL_DEAD_VALUE)
  })

  it('flips aria-pressed when the store toggles the cell', () => {
    const store = createLiveCellStore()
    renderCell({ x: 2, y: 2, ...transformFor(2, 2), store })

    const cell = screen.getByRole('button', { name: cellLabel(2, 2) })
    expect(cell).toHaveAttribute(CELL_ALIVE_ATTR, CELL_DEAD_VALUE)

    act(() => store.toggle(2, 2))

    expect(cell).toHaveAttribute(CELL_ALIVE_ATTR, CELL_ALIVE_VALUE)
  })
})

// VISUAL CONTRACT. aria-pressed above says what a cell IS; this pins what it
// LOOKS LIKE, and is deliberately the only place in this file that reads the
// Tailwind paint class AS AN ALIVENESS ASSERTION (the exact-class-list pin
// in 'Cell rendering' above also reads bg-white, but to pin the
// gridline-fallback branch, not aliveness) -- the paint is still real
// behaviour (see this slice's outline: "the cell's visible paint is
// unchanged"), and something in this file should still assert it.
describe('Cell paint', () => {
  it('paints an alive cell dark and a dead cell light', () => {
    const store = createLiveCellStore(new Set([cellKey(0, 0)]))
    renderCell({ x: 0, y: 0, ...transformFor(0, 0), store })
    renderCell({ x: 1, y: 0, ...transformFor(1, 0) })

    expect(screen.getByRole('button', { name: cellLabel(0, 0) }).className).toContain('bg-gray-900')
    expect(screen.getByRole('button', { name: cellLabel(1, 0) }).className).toContain('bg-white')
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
    const store = createLiveCellStore(new Set([cellKey(2, 3)]))
    renderCell({ x: 2, y: 3, ...transformFor(2, 3), isFocused: true, store })
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

  it('the description says "dead" for a dead focused cell, and updates live when the store toggles it', () => {
    const store = createLiveCellStore()
    renderCell({ x: 2, y: 3, ...transformFor(2, 3), isFocused: true, store })
    const cell = screen.getByRole('button', { name: 'Cell 2, 3' })
    const describedById = cell.getAttribute('aria-describedby')!
    expect(document.getElementById(describedById)!.textContent).toBe('dead')

    act(() => store.toggle(2, 3))

    expect(document.getElementById(describedById)!.textContent).toBe('alive')
  })

  it('the description is visually hidden rather than removed from the accessible tree', () => {
    renderCell({ x: 2, y: 3, ...transformFor(2, 3), isFocused: true })
    const cell = screen.getByRole('button', { name: 'Cell 2, 3' })
    const describedById = cell.getAttribute('aria-describedby')!
    expect(document.getElementById(describedById)!.className).toContain('sr-only')
  })

  // BROWSER QUIRK WORKAROUND regression test -- see Cell.tsx's own onBlur
  // comment for the full explanation (Chromium's sequential-focus-navigation
  // resume position survives blur() on the same DOM node, so the next Tab
  // press skips past a lone roving-tabindex cell entirely). This only proves
  // the reattachment actually happens and preserves the node's identity and
  // position -- the actual Tab-lands-back-on-a-cell claim is real-browser
  // behavior this jsdom suite cannot observe at all, and is instead pinned
  // by keyboard-grid-navigation.feature's own e2e scenarios.
  it('on blur, reattaches its own DOM node at the same position (same object, same parent, same next sibling)', async () => {
    renderCell({ x: 4, y: 4, ...transformFor(4, 4), isFocused: true })
    const cell = screen.getByRole('button', { name: 'Cell 4, 4' })
    const parent = cell.parentElement!
    const originalNextSibling = cell.nextSibling

    cell.focus()
    fireEvent.blur(cell)
    // The reattachment is deferred via queueMicrotask -- flush microtasks.
    await Promise.resolve()
    await Promise.resolve()

    expect(parent.contains(cell)).toBe(true)
    expect(cell.parentElement).toBe(parent)
    expect(cell.nextSibling).toBe(originalNextSibling)
  })

  it('does nothing, and does not throw, if the node is already disconnected by the time the deferred reattach runs', async () => {
    const { unmount } = renderCell({ x: 4, y: 4, ...transformFor(4, 4), isFocused: true })
    const cell = screen.getByRole('button', { name: 'Cell 4, 4' })

    cell.focus()
    fireEvent.blur(cell)
    unmount()
    expect(cell.isConnected).toBe(false)

    // If the isConnected guard were missing, the queued microtask would call
    // parent.insertBefore on a node whose parent is already gone (or whose
    // `next` sibling reference is stale), throwing asynchronously. Flushing
    // past the microtask with nothing here failing the test IS the
    // assertion -- vitest surfaces an unhandled rejection from a throwing
    // queueMicrotask callback as a test failure.
    await Promise.resolve()
    await Promise.resolve()
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
