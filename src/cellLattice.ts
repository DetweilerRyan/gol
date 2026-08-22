import { worldToScreen, type Camera } from './camera'

// A cell lattice is a fixed grid of render "slots" -- a rectangle of (col,
// row) positions whose pixel positions depend only on (index, cellSize),
// never on camera.offsetX/offsetY. Panning moves the *camera* over the
// lattice; as long as the lattice still covers the viewport, only a single
// transformed offset (latticeOffsetPx) needs to change, not any individual
// cell's own position -- which is what lets a pan stop re-rendering cells
// altogether. A zoom (cellSize change) or a pan that outgrows the lattice's
// slack forces a rebase: a fresh computeLattice call, after which every slot
// holds a different world coordinate. A rebase re-renders the cell layer but
// does not remount it -- GridCells keys each cell by its slot index, so the
// DOM nodes are reused with new props. Only a zoom remounts, because
// changing cellSize changes cols/rows and so the shape of the slot keyspace
// itself.
//
// TWO CONSUMERS, AT TWO LAYERS, and the split is the point:
//
//   - src/hooks/useCellLattice.ts owns the *anchor*. It holds one Lattice in
//     useState and calls nextLattice on each render to decide whether that
//     anchor still covers the viewport or has to rebase. Deciding that is
//     the only stateful part of the design, which is why it is the only part
//     that needs a hook -- and the rule it delegates to (nextLattice) stays
//     here, where a property test can reach it.
//   - src/components/GridCells.tsx owns the *slot geometry*. It calls
//     slotWorldCoordinate, slotPixelPosition and slotIndex directly, once per
//     slot, turning the anchor's scalars into each cell's world coordinate,
//     pixel position and React key. Those three are scalar-in/scalar-out
//     precisely so that hot per-cell loop allocates nothing and hands React
//     Compiler primitive props.
//
// Nothing else in src/ imports this module, deliberately. Cell.tsx receives a
// finished CSS transform string and knows nothing of a lattice at all, and
// Grid.tsx only forwards the hook's scalars through to GridCells.

// How many cells of slack surround the viewport on each side, so a pan can
// move that far before the lattice needs to rebase (see latticeCovers).
// Measured against a 400px/40-move drag (10px/move, a typical mouse-pan
// cadence): at LATTICE_SLACK_CELLS = 4, the lattice rebases every 8.0 moves
// at cellSize: 20 (12.5% of moves pay a full re-render) and every 3.2 moves
// at cellSize: 8 (31%, since more, smaller cells fit in the same slack
// distance). The tradeoff is rendering slack cells that are never on screen,
// measured against gridGeometry.ts's computeVisibleRange -- today's buffered
// render, the baseline this module replaces -- at the default camera
// (offsetX: -32, offsetY: -22.5) and a 1280x900 viewport: +12.0% rendered
// cells at default zoom (cellSize: 20), +5.9% at min zoom (cellSize: 8,
// where the viewport already holds many more cells so the fixed slack is a
// smaller relative share). 4 was chosen as the point on
// that curve where rebase frequency drops sharply without the extra
// off-screen cells costing much.
export const LATTICE_SLACK_CELLS = 4

export interface Lattice {
  originX: number // world x occupying slot column 0
  originY: number // world y occupying slot row 0
  cols: number
  rows: number
  cellSize: number // the cellSize the slot pixel positions were computed for
}

export function computeLattice(camera: Camera, viewportWidthPx: number, viewportHeightPx: number): Lattice {
  return {
    originX: Math.floor(camera.offsetX) - LATTICE_SLACK_CELLS,
    // The `+ 1` (distinct from LATTICE_SLACK_CELLS below) absorbs the
    // fractional part of camera.offsetX that Math.floor above discarded:
    // ceil(offsetX + W) <= floor(offsetX) + 1 + ceil(W) always holds, so
    // without it a lattice rebased at a fractional offset could fall one
    // column short of covering the viewport's right/bottom edge.
    cols: Math.ceil(viewportWidthPx / camera.cellSize) + 1 + 2 * LATTICE_SLACK_CELLS,
    originY: Math.floor(camera.offsetY) - LATTICE_SLACK_CELLS,
    rows: Math.ceil(viewportHeightPx / camera.cellSize) + 1 + 2 * LATTICE_SLACK_CELLS,
    cellSize: camera.cellSize,
  }
}

// Whether the lattice still fully covers the viewport under the given
// camera, without needing to rebase. A cellSize change always fails this --
// slot pixel positions are cellSize-scaled, so a zoom must rebase regardless
// of how much room the existing origin/cols/rows would otherwise leave.
export function latticeCovers(
  lattice: Lattice,
  camera: Camera,
  viewportWidthPx: number,
  viewportHeightPx: number,
): boolean {
  if (lattice.cellSize !== camera.cellSize) return false

  const minX = Math.floor(camera.offsetX)
  const maxX = Math.ceil(camera.offsetX + viewportWidthPx / camera.cellSize)
  const minY = Math.floor(camera.offsetY)
  const maxY = Math.ceil(camera.offsetY + viewportHeightPx / camera.cellSize)

  return (
    minX >= lattice.originX &&
    maxX <= lattice.originX + lattice.cols - 1 &&
    minY >= lattice.originY &&
    maxY <= lattice.originY + lattice.rows - 1
  )
}

// The sticky-anchor rule: keep the existing lattice while it still covers the
// viewport, and rebase onto a fresh one only when it doesn't. Pure, and
// deliberately here rather than as a ternary inside useCellLattice, because
// two things the hook's setState-during-render pattern depends on are
// properties of this function alone rather than of React:
//
//   1. It returns `previous` BY REFERENCE when coverage holds. That reference
//      identity is what the hook's `current !== lattice` guard tests, so an
//      implementation returning a structurally-equal copy would make the hook
//      call setState on every render forever.
//   2. Applying it to its own result is a no-op (see the idempotence property
//      in cellLattice.property.test.ts). That is the no-infinite-loop
//      guarantee: the hook's second render re-runs this against the lattice
//      the first render just stored, and gets that same object back.
export function nextLattice(
  previous: Lattice,
  camera: Camera,
  viewportWidthPx: number,
  viewportHeightPx: number,
): Lattice {
  return latticeCovers(previous, camera, viewportWidthPx, viewportHeightPx)
    ? previous
    : computeLattice(camera, viewportWidthPx, viewportHeightPx)
}

// The pixel offset of the lattice's own origin slot (col 0, row 0) under the
// current camera -- this is what a transformed layer wrapping every cell
// slot applies as its own translate, so panning moves that one offset
// instead of every cell's own position. Deliberately just worldToScreen:
// screenToWorld (used to resolve taps and hover back to a world cell) must
// agree with wherever the lattice visually painted, and worldToScreen is
// the one function both this and screenToWorld are already inverses of --
// reimplementing the arithmetic here would risk that identity drifting out
// of sync with camera.ts.
export function latticeOffsetPx(lattice: Lattice, camera: Camera): { xPx: number; yPx: number } {
  const { x, y } = worldToScreen(camera, lattice.originX, lattice.originY)
  return { xPx: x, yPx: y }
}

// The world coordinate a given lattice slot index currently holds, along one
// axis. Scalar in, scalar out -- kept separate from slotPixelPosition (and
// from returning an {x, y} pair) so the hot per-cell render loop stays
// allocation-free and so callers pass React Compiler primitive props rather
// than a fresh object every render.
export function slotWorldCoordinate(origin: number, index: number): number {
  return origin + index
}

// The pixel position of a lattice slot along one axis, relative to the
// lattice's own transformed offset (see latticeOffsetPx) -- independent of
// camera.offsetX/offsetY, which is what lets a pan avoid re-rendering slots
// at all.
export function slotPixelPosition(index: number, cellSize: number): number {
  return index * cellSize
}

// The linear, row-major index of a lattice slot -- the identity GridCells
// gives React as a slot's key. Lives here rather than inline at the call site
// because it is the one piece of the design's keying decision that is pure
// arithmetic: keying by slot index (not by world coordinate) is what lets a
// rebase re-render a Cell with new x/y props while reusing its DOM node,
// instead of remounting every cell on every pan. Row-major to match the
// nested loop order GridCells renders in, so index order and DOM order agree.
export function slotIndex(col: number, row: number, cols: number): number {
  return row * cols + col
}
