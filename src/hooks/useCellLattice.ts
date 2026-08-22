import { computeLattice, latticeOffsetPx, type Lattice } from '../cellLattice'
import type { Camera } from '../camera'
import type { ElementSize } from './useElementSize'

export interface CellLatticeView {
  originX: number
  originY: number
  cols: number
  rows: number
  cellSize: number
  offsetXPx: number
  offsetYPx: number
}

// Thin adapter over cellLattice.ts: computes a Lattice for the current
// camera/viewport and flattens it (plus the transformed-layer pixel offset)
// into scalars, so Grid holds no object identity from this hook -- a fresh
// Lattice object every render would be exactly the kind of prop churn this
// module exists to eliminate for GridCells' children.
//
// Deliberately stateless this step: it recomputes computeLattice on every
// call rather than keeping a rebase-only anchor, so it rebases whenever
// Math.floor(camera.offsetX/offsetY) changes or cellSize changes -- the same
// cells-in-viewport range gridGeometry.ts's computeVisibleRange would derive,
// just organized as a lattice. The slack in LATTICE_SLACK_CELLS therefore
// buys nothing yet; a later step adds the sticky anchor (only rebasing once
// latticeCovers fails) that lets a sub-cell pan skip cell re-renders
// entirely.
export function useCellLattice(camera: Camera, size: ElementSize): CellLatticeView {
  const lattice: Lattice = computeLattice(camera, size.width, size.height)
  const { xPx: offsetXPx, yPx: offsetYPx } = latticeOffsetPx(lattice, camera)

  return {
    originX: lattice.originX,
    originY: lattice.originY,
    cols: lattice.cols,
    rows: lattice.rows,
    cellSize: lattice.cellSize,
    offsetXPx,
    offsetYPx,
  }
}
