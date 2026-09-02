import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { worldToScreen, type Camera } from '../camera'
import HoverIndicator, { HOVER_INDICATOR_ID } from './HoverIndicator'

const CAMERA: Camera = { offsetX: 0, offsetY: 0, cellSize: 20 }

describe('HoverIndicator', () => {
  // A stable, non-visual test handle -- see this component's own comment on
  // HOVER_INDICATOR_ID for why: before this, the only way to reach this
  // element was its Tailwind paint class, which is a reach-around this repo
  // otherwise forbids (see rules/no-aliveness-by-paint-class.yml's sibling
  // reasoning) rather than a sanctioned handle.
  it('carries a stable id, HOVER_INDICATOR_ID', () => {
    const { container } = render(<HoverIndicator camera={CAMERA} hovered={{ x: 0, y: 0 }} />)
    const el = container.firstElementChild as HTMLElement
    expect(el.id).toBe(HOVER_INDICATOR_ID)
  })

  it('renders nothing when nothing is hovered', () => {
    const { container } = render(<HoverIndicator camera={CAMERA} hovered={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('positions itself at the hovered world cell via worldToScreen, sized to the current cellSize', () => {
    const { container } = render(<HoverIndicator camera={CAMERA} hovered={{ x: 3, y: -2 }} />)
    const el = container.firstElementChild as HTMLElement
    const { x: left, y: top } = worldToScreen(CAMERA, 3, -2)
    expect(el.style.transform).toBe(`translate(${left}px, ${top}px)`)
    expect(el.style.width).toBe(`${CAMERA.cellSize}px`)
    expect(el.style.height).toBe(`${CAMERA.cellSize}px`)
    // Same direct style-property assertion Cell.test.tsx and
    // PatternPreview.test.tsx both make for their own boxSizing -- a scoped
    // mutation scan found this one unguarded (StringLiteral 'border-box' ->
    // '').
    expect(el.style.boxSizing).toBe('border-box')
  })

  it('recomputes its position on a re-render with a new hovered cell', () => {
    const { container, rerender } = render(<HoverIndicator camera={CAMERA} hovered={{ x: 0, y: 0 }} />)
    const el = container.firstElementChild as HTMLElement
    const before = el.style.transform

    rerender(<HoverIndicator camera={CAMERA} hovered={{ x: 5, y: 5 }} />)

    expect(el.style.transform).not.toBe(before)
  })

  it('is decorative and never a hit target -- pointer-events-none and aria-hidden', () => {
    const { container } = render(<HoverIndicator camera={CAMERA} hovered={{ x: 0, y: 0 }} />)
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toContain('pointer-events-none')
    expect(el.getAttribute('aria-hidden')).toBe('true')
  })

  it('goes back to rendering nothing when hovered returns to null after being set', () => {
    const { container, rerender } = render(<HoverIndicator camera={CAMERA} hovered={{ x: 0, y: 0 }} />)
    expect(container.firstChild).not.toBeNull()

    rerender(<HoverIndicator camera={CAMERA} hovered={null} />)

    expect(container.firstChild).toBeNull()
  })
})
