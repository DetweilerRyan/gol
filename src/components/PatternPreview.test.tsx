import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { worldToScreen, type Camera } from '../camera'
import PatternPreview from './PatternPreview'

const camera: Camera = { offsetX: 0, offsetY: 0, cellSize: 20 }

// DOM-order-after-cell-buttons is Grid.test.tsx's job now (it's a composition
// contract, not something this component can assert about itself). What's
// left here is PatternPreview's own contract: the attributes each preview
// cell renders with, and the positioning/remount behavior driven by its key.
describe('PatternPreview rendering', () => {
  it('renders a preview cell per position, pointer-events-none with a border-box style', () => {
    render(<PatternPreview camera={camera} positions={[[0, 0]]} />)
    const preview = screen.getByLabelText('Pattern preview cell 0, 0')
    expect(preview.className).toContain('pointer-events-none')
    expect(preview.style.boxSizing).toBe('border-box')
  })

  it('positions a preview cell via worldToScreen(camera, x, y)', () => {
    render(<PatternPreview camera={camera} positions={[[1, -1]]} />)
    const { x: left, y: top } = worldToScreen(camera, 1, -1)
    expect(screen.getByLabelText('Pattern preview cell 1, -1').style.transform).toBe(`translate(${left}px, ${top}px)`)
  })

  it('remounts preview-cell DOM nodes (rather than reusing them) when the preview positions change', () => {
    // The preview cell's key encodes its world position (`preview-${x}-${y}`), not a stable
    // per-slot index, so a changed position changes the key and React tears down and recreates
    // the node -- this is the one place a wrong/constant key is observable through
    // testing-library, since it changes DOM node identity, not just the rendered props.
    const { rerender } = render(<PatternPreview camera={camera} positions={[[0, 0]]} />)
    const before = screen.getByLabelText('Pattern preview cell 0, 0')

    rerender(<PatternPreview camera={camera} positions={[[1, 1]]} />)

    expect(screen.queryByLabelText('Pattern preview cell 0, 0')).not.toBeInTheDocument()
    const after = screen.getByLabelText('Pattern preview cell 1, 1')
    expect(after).not.toBe(before)
  })
})
