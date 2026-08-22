import { useState } from 'react'
import { computeLattice, latticeCovers, latticeOffsetPx, type Lattice } from '../cellLattice'
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

// Thin adapter over cellLattice.ts: holds a sticky Lattice anchor (via
// useState) and flattens it -- plus the transformed-layer pixel offset --
// into scalars, so Grid holds no object identity from this hook, and so a
// pan only rebases when it actually needs to.
//
// The coverage check runs during render, not in a useEffect: `current` below
// is either the stored lattice (if it still covers the viewport) or a freshly
// computed one, and whichever it is gets stored back with setLattice *and*
// is the same value the returned offset is derived from. Calling setState
// during render like this is the documented "adjusting state when a prop
// changes" pattern -- React discards this render's output and re-renders
// immediately with the new state, before anything commits to the DOM, so no
// frame ever paints the fresh lattice's coordinates against a transform
// derived from the stale one (or vice versa). Deferring the rebase to a
// useEffect would commit one frame first, painting cells positioned for a
// lattice the transformed layer hasn't caught up to yet.
//
// A freshly computed lattice always covers the camera/viewport it was
// computed for (LATTICE_SLACK_CELLS >= 1 guarantees this -- see the comment
// on computeLattice's `+ 1`), so the second render's coverage check always
// passes and this cannot loop.
export function useCellLattice(camera: Camera, size: ElementSize): CellLatticeView {
  const [lattice, setLattice] = useState<Lattice>(() => computeLattice(camera, size.width, size.height))

  const current: Lattice = latticeCovers(lattice, camera, size.width, size.height)
    ? lattice
    : computeLattice(camera, size.width, size.height)

  if (current !== lattice) {
    setLattice(current)
  }

  const { xPx: offsetXPx, yPx: offsetYPx } = latticeOffsetPx(current, camera)

  return {
    originX: current.originX,
    originY: current.originY,
    cols: current.cols,
    rows: current.rows,
    cellSize: current.cellSize,
    offsetXPx,
    offsetYPx,
  }
}
