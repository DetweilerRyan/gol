import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Camera } from '../camera'
import { computeLattice, latticeOffsetPx } from '../cellLattice'
import type { ElementSize } from './useElementSize'
import { useCellLattice } from './useCellLattice'

const camera: Camera = { offsetX: -32, offsetY: -22.5, cellSize: 20 }
const size: ElementSize = { width: 1280, height: 900 }

describe('useCellLattice', () => {
  it('flattens computeLattice + latticeOffsetPx into scalars', () => {
    const { result } = renderHook(() => useCellLattice(camera, size))

    const lattice = computeLattice(camera, size.width, size.height)
    const { xPx, yPx } = latticeOffsetPx(lattice, camera)

    expect(result.current).toEqual({
      originX: lattice.originX,
      originY: lattice.originY,
      cols: lattice.cols,
      rows: lattice.rows,
      cellSize: lattice.cellSize,
      offsetXPx: xPx,
      offsetYPx: yPx,
    })
  })

  it('recomputes on every render (stateless this step): a changed camera changes the view', () => {
    const { result, rerender } = renderHook(({ camera }: { camera: Camera }) => useCellLattice(camera, size), {
      initialProps: { camera },
    })
    const before = result.current

    const panned: Camera = { ...camera, offsetX: camera.offsetX + 1 }
    rerender({ camera: panned })

    expect(result.current).not.toEqual(before)
  })
})
