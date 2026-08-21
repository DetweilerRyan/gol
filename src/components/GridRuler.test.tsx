import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { worldToScreen, type Camera } from '../camera'
import type { MajorGridlines } from '../gridGeometry'
import GridRuler from './GridRuler'

const camera: Camera = { offsetX: -2, offsetY: -1, cellSize: 20 }
// x and y values are disjoint on purpose, so getByText never has to
// disambiguate a coordinate shared by both axes.
const gridlines: MajorGridlines = { x: [-10, 0, 10], y: [100, 110] }

describe('GridRuler', () => {
  it('renders one RulerLabel per axis per majorGridlines entry', () => {
    render(<GridRuler gridlines={gridlines} camera={camera} />)
    const rulerLabels = [...document.querySelectorAll('span')].filter((el) => el.className.includes('text-[10px]'))
    expect(rulerLabels).toHaveLength(gridlines.x.length + gridlines.y.length)
  })

  it('renders the x-axis labels along the top edge and the y-axis labels along the left edge', () => {
    render(<GridRuler gridlines={gridlines} camera={camera} />)
    for (const x of gridlines.x) {
      expect(screen.getByText(String(x)).className).toContain('top-0.5')
    }
    for (const y of gridlines.y) {
      expect(screen.getByText(String(y)).className).toContain('left-0.5')
    }
  })

  it('positions each label via worldToScreen(camera, coordinate, ...)', () => {
    render(<GridRuler gridlines={gridlines} camera={camera} />)
    const label = screen.getByText('10')
    const expectedScreen = worldToScreen(camera, 10, 0)
    expect(label).toHaveStyle({ transform: `translateX(${expectedScreen.x + 2}px)` })
  })

  // The key encodes coordinate value (`x-${x}` / `y-${y}`), not a stable per-slot index, so a
  // shifted gridlines array should move persisting coordinates' labels in place (same node) and
  // mount fresh nodes for newly visible ones, rather than remounting the whole row -- this is the
  // one place a wrong/constant key is observable through testing-library. Rerendering with a
  // shifted array is strictly better here than firing a real wheel event over a full grid, which
  // is what this extraction exists to avoid paying for.
  it('reuses a label DOM node for a coordinate that stays visible across a gridlines change, and mounts a fresh node for a newly visible one', () => {
    const { rerender } = render(<GridRuler gridlines={gridlines} camera={camera} />)
    const persistingBefore = screen.getByText('0')

    const shifted: MajorGridlines = { x: [0, 10, 20], y: [100, 110] }
    rerender(<GridRuler gridlines={shifted} camera={camera} />)

    expect(screen.getByText('0')).toBe(persistingBefore)
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.queryByText('-10')).not.toBeInTheDocument()
  })
})
