import { tileKey, type TileRange } from '../cellTiles'
import type { FocusCell } from '../gridFocus'
import type { LiveCellStore } from '../liveCellStore'
import CellTile from './CellTile'

interface GridCellsProps {
  range: TileRange
  anchorX: number
  anchorY: number
  cellSize: number
  store: LiveCellStore
  onActivateCell: (x: number, y: number) => void
  // The one deliberate exception to this component's own "every prop stays
  // stable across a pan tick" contract below -- see CellTile.tsx's matching
  // comment for why, and this slice's step-3 handoff for the measurement.
  focus: FocusCell
}

// The cell layer, rendered as one CellTile per tile in `range` (see
// cellTiles.ts's TileRange) rather than a camera-derived cells array: every
// prop here except `focus` -- range, anchorX, anchorY, cellSize, store,
// onActivateCell -- stays reference-/value-stable across a within-range pan
// tick (range by nextTileRange's reference-identity contract; anchorX/anchorY
// only change on a rare re-anchor; cellSize only on zoom), which is what lets
// that pan stop re-rendering this component at all -- React Compiler's
// memoization of Grid's <GridCells> element bails before this function body
// ever runs. Only the transformed layer div Grid wraps this in (see
// Grid.tsx) moves.
//
// `focus` is the deliberate, temporary exception (collapse-dead-cell-layer
// step 3): it changes on every keyboard focus move, forcing this component
// and every CellTile it renders to re-run -- but a focus move is not a pan
// tick, so the guarantee above still holds for the gestures it was written
// to protect (pointer-drag, wheel). See CellTile.tsx's own comment on the
// same prop for the cost and why it isn't worth fixing before step 4 deletes
// this component.
//
// The React key is tileKey(tx, ty) -- the tile's own WORLD-ANCHORED
// IDENTITY -- not a lattice-style linear slot index. THIS INVERTS THE
// REASONING THIS COMMENT USED TO CARRY, and the inversion is correct, not a
// regression to "fix" back:
//
// Under the old lattice (cellLattice.ts, now replaced), the mounted region
// was a fixed set of render SLOTS that rebased under a moving camera, so a
// slot's own world coordinate changed on every pan tick -- even a sub-cell
// one that didn't force a rebase -- and keying by that coordinate would have
// forced React to remount every cell on every pan. Keying by the slot's
// linear index instead let a rebase reuse the same DOM nodes with new
// x/y props.
//
// Under tiling, the mounted region is the opposite shape: a set of
// world-anchored tiles that stays exactly fixed while the range holds, and
// only grows or shrinks at the covering set's edge (see cellTiles.ts's
// nextTileRange). A retained tile's tileX/tileY never change for as long as
// it stays mounted, so keying by tileKey(tx, ty) is exactly the identity that
// lets a retained tile survive a strip event untouched: React's reconciler
// matches the key to the same element it rendered last time, finds every one
// of that CellTile's props unchanged (see CellTile.tsx's own "no prop may
// change per pan tick" invariant), and bails without calling CellTile's
// function body again. Keying by loop-position instead would defeat exactly
// this: an entering tile on one edge shifts every following tile's
// loop-position, so every retained tile would be reassigned a different key
// on every strip event and remount rather than survive it.
//
// The placing-mode preview overlay used to live here too; it's now
// PatternPreview.tsx, rendered by Grid as a following sibling of this
// component -- see Grid.test.tsx's DOM-order assertion.
//
// Slot-to-pixel mapping (what used to live here as slotPixelPosition calls)
// now lives one level down, inside CellTile -- see cellOffsetPx in
// cellAnchor.ts -- since a tile, not this whole layer, is the unit whose
// geometry can stay untouched by a pan.
//
// Aliveness itself is no longer computed here -- each Cell subscribes to its
// own membership via useLiveCell(store, key), so a generation only re-renders
// the cells that actually changed. See liveCellStore.ts's module header.
export default function GridCells({ range, anchorX, anchorY, cellSize, store, onActivateCell, focus }: GridCellsProps) {
  const tiles: React.ReactNode[] = []
  for (let ty = range.minTileY; ty <= range.maxTileY; ty++) {
    for (let tx = range.minTileX; tx <= range.maxTileX; tx++) {
      tiles.push(
        <CellTile
          key={tileKey(tx, ty)}
          tileX={tx}
          tileY={ty}
          spanCells={range.spanCells}
          cellSize={cellSize}
          anchorX={anchorX}
          anchorY={anchorY}
          store={store}
          onActivate={onActivateCell}
          focus={focus}
        />,
      )
    }
  }
  return <>{tiles}</>
}
