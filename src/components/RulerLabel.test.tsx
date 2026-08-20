import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { worldToScreen, type Camera } from '../camera'
import RulerLabel from './RulerLabel'

const camera: Camera = { offsetX: -32, offsetY: -22.5, cellSize: 20 }

describe('RulerLabel', () => {
  it('renders the coordinate text for the x axis', () => {
    render(<RulerLabel axis="x" coordinate={5} camera={camera} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('positions the x-axis label via worldToScreen(camera, coordinate, 0), offset by 2px, using translateX', () => {
    render(<RulerLabel axis="x" coordinate={5} camera={camera} />)
    const label = screen.getByText('5')
    const expectedScreen = worldToScreen(camera, 5, 0)
    expect(label).toHaveStyle({ transform: `translateX(${expectedScreen.x + 2}px)` })
    expect(label.className).toContain('top-0.5')
  })

  it('renders the coordinate text for the y axis', () => {
    render(<RulerLabel axis="y" coordinate={-3} camera={camera} />)
    expect(screen.getByText('-3')).toBeInTheDocument()
  })

  it('positions the y-axis label via worldToScreen(camera, 0, coordinate), offset by 2px, using translateY', () => {
    render(<RulerLabel axis="y" coordinate={-3} camera={camera} />)
    const label = screen.getByText('-3')
    const expectedScreen = worldToScreen(camera, 0, -3)
    expect(label).toHaveStyle({ transform: `translateY(${expectedScreen.y + 2}px)` })
    expect(label.className).toContain('left-0.5')
  })

  it('reflects a different camera (pan/zoom) in the computed screen position', () => {
    const zoomedCamera: Camera = { offsetX: 10, offsetY: 4, cellSize: 40 }
    render(<RulerLabel axis="x" coordinate={12} camera={zoomedCamera} />)
    const label = screen.getByText('12')
    const expectedScreen = worldToScreen(zoomedCamera, 12, 0)
    expect(expectedScreen.x).toBe(80)
    expect(label).toHaveStyle({ transform: `translateX(${expectedScreen.x + 2}px)` })
  })
})
