import { useState } from 'react'
import { computeLattice, latticeOffsetPx, nextLattice, type Lattice } from '../cellLattice'
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
// The coverage check runs during render, not in a useEffect: nextLattice
// returns either the stored lattice (by reference, if it still covers the
// viewport) or a freshly computed one, and whichever it is gets stored back
// with setLattice *and* is the same value the returned offset is derived
// from. Calling setState during render like this is the documented
// "adjusting state when a prop changes" pattern -- React discards this
// render's output and re-renders immediately with the new state, before
// anything commits to the DOM, so no frame ever paints the fresh lattice's
// coordinates against a transform derived from the stale one (or vice
// versa). Deferring the rebase to a useEffect would commit one frame first,
// painting cells positioned for a lattice the transformed layer hasn't
// caught up to yet.
//
// This cannot loop, and the guarantee is nextLattice's rather than this
// hook's: applying it to its own result returns that same object by
// reference (see cellLattice.property.test.ts's idempotence property, which
// rests in turn on a freshly computed lattice always covering the
// camera/viewport it was computed for), so the second render's `current !==
// lattice` guard is false.
export function useCellLattice(camera: Camera, size: ElementSize): CellLatticeView {
  const [lattice, setLattice] = useState<Lattice>(() => computeLattice(camera, size.width, size.height))

  const current = nextLattice(lattice, camera, size.width, size.height)

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
