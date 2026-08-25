import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { worldToScreen, type Camera } from '../camera'
import type { MajorGridlines } from '../gridGeometry'
import { rulerGroupLabel } from '../test-support/rulerQuery'
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
  // is what this extraction exists to avoid paying for. Both axes are shifted in the same
  // rerender -- a constant/empty key on either axis alone would otherwise go unnoticed, since a
  // single shared key collision only shows up as a wrongly-reused node once more than one label
  // on that axis is on screen at once.
  it('reuses a label DOM node for a coordinate that stays visible across a gridlines change, and mounts a fresh node for a newly visible one, on both axes', () => {
    const { rerender } = render(<GridRuler gridlines={gridlines} camera={camera} />)
    const persistingXBefore = screen.getByText('0')
    const persistingYBefore = screen.getByText('110')

    const shifted: MajorGridlines = { x: [0, 10, 20], y: [110, 120] }
    rerender(<GridRuler gridlines={shifted} camera={camera} />)

    expect(screen.getByText('0')).toBe(persistingXBefore)
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.queryByText('-10')).not.toBeInTheDocument()

    expect(screen.getByText('110')).toBe(persistingYBefore)
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.queryByText('100')).not.toBeInTheDocument()
  })

  // The one assertion the whole affordance rests on: which axis's numbers
  // live inside which named group. Asserting the two group names exist is
  // not enough -- that passes even if the two wrappers were swapped. This
  // must fail if GridRuler ever puts x's coordinates under "Row ruler" (or
  // vice versa), since that swap is confidently wrong and every other test
  // here still passes it.
  it('groups the x-axis (column) coordinates under "Column ruler" and the y-axis (row) coordinates under "Row ruler", never mixed', () => {
    render(<GridRuler gridlines={gridlines} camera={camera} />)

    const columnGroup = screen.getByRole('group', { name: rulerGroupLabel('x') })
    const rowGroup = screen.getByRole('group', { name: rulerGroupLabel('y') })

    for (const x of gridlines.x) {
      expect(within(columnGroup).getByText(String(x))).toBeInTheDocument()
      expect(within(rowGroup).queryByText(String(x))).not.toBeInTheDocument()
    }
    for (const y of gridlines.y) {
      expect(within(rowGroup).getByText(String(y))).toBeInTheDocument()
      expect(within(columnGroup).queryByText(String(y))).not.toBeInTheDocument()
    }
  })

  it('names the two ruler groups exactly "Column ruler" and "Row ruler", matching src/test-support/rulerQuery.ts', () => {
    render(<GridRuler gridlines={gridlines} camera={camera} />)

    expect(screen.getByRole('group', { name: 'Column ruler' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Row ruler' })).toBeInTheDocument()
    expect(rulerGroupLabel('x')).toBe('Column ruler')
    expect(rulerGroupLabel('y')).toBe('Row ruler')
  })
})
