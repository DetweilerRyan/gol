import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { worldToScreen, type Camera } from '../camera'
import HoverIndicator from './HoverIndicator'

const CAMERA: Camera = { offsetX: 0, offsetY: 0, cellSize: 20 }

describe('HoverIndicator', () => {
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
