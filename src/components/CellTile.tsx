import { cellOffsetPx } from '../cellAnchor'
import { tileOriginCell } from '../cellTiles'
import type { FocusCell } from '../gridFocus'
import type { LiveCellStore } from '../liveCellStore'
import Cell from './Cell'

interface CellTileProps {
  tileX: number // tile indices, not world coordinates -- see tileOriginCell
  tileY: number
  spanCells: number
  cellSize: number
  anchorX: number // the sticky anchor's own world coordinates -- see cellAnchor.ts
  anchorY: number
  store: LiveCellStore
  onActivate: (x: number, y: number) => void
  // THE ONE SANCTIONED EXCEPTION to "no prop on CellTile may change per pan
  // tick" below -- collapse-dead-cell-layer step 3, and deliberately
  // temporary. `focus` changes on every keyboard focus move (arrow keys,
  // Home/End, a click), which is NOT a pan tick: a plain pointer-drag/wheel
  // pan never touches useGridFocus's state at all, so GridCells still bails
  // on those exactly as before. A focus move, in contrast, re-renders every
  // mounted CellTile (~850 at a typical viewport) to find and update the
  // one Cell whose x/y now (or no longer) matches -- a known, accepted cost
  // that dies at step 4, when this component is deleted and only the
  // handful of live+focused cells stay mounted. Do not optimise it now;
  // see this slice's step-3 handoff for the measurement this rests on.
  focus: FocusCell
}

// One mounted tile: spanCells x spanCells Cell buttons, rendered as a
// FRAGMENT -- no DOM node of its own. That keeps the DOM shape identical to
// today's flat button list under the layer div (see GridCells.tsx), adds
// zero nodes for paint/layout to carry, and leaves document.elementFromPoint
// behaviour untouched. Do not wrap the cells in a div -- that was a ratified
// decision in the tile-virtualized-cells design, not an incidental one.
//
// Cells are keyed by their INTRA-TILE LINEAR INDEX (j * spanCells + i), an
// integer, no string allocation -- mirroring GridCells.tsx's slotIndex
// keying, but scoped to this tile rather than to the whole mounted region:
// a tile's own cells never change shape (spanCells is fixed at
// TILE_SPAN_CELLS for the whole session), so nothing here ever needs to
// remount by that key changing.
//
// THE INVARIANT THIS COMPONENT DEPENDS ON: no prop on CellTile may change
// per pan tick or per generation. tileX/tileY/spanCells/store/onActivate
// never change for a retained tile (see cellTiles.ts's nextTileRange --
// GridCells will key each mounted CellTile by tileKey(tileX, tileY), so a
// retained tile keeps the exact same props across a pan that doesn't evict
// it); cellSize changes only on zoom; anchorX/anchorY only on re-anchor (see
// cellAnchor.ts's ANCHOR_DRIFT_CELLS -- rare, once per ~4,096 cells of
// travel). Break it and React Compiler's memoization of this component stops
// applying, so every retained tile re-renders on every pan tick -- the same
// failure mode Grid.tsx's activateCell comment documents one layer up, and
// the suite stays green everywhere except Grid.test.tsx's pan-stability
// block.
//
// The hazard is NARROWER than "never construct a prop at the call site",
// though, and the narrowing is measured rather than reasoned: wrapping
// onActivate in an inline arrow where GridCells passes it does NOT break
// anything, because React Compiler memoizes that wrapper against its own
// (stable) dependency. What actually defeats it is a prop the compiler
// cannot memoize at all -- specifically the hoisted `function` declaration
// referenced from a closure above it that Grid.tsx's comment describes,
// which compiles to a fresh identity on every render.
//
// This same invariant is also the PRECONDITION FOR IMPERATIVE CELL PAINTING,
// a possible future slice (see the tile-virtualized-cells design's review
// notes). Under the old lattice (cellLattice.ts), every rebase changed each
// mounted cell's x/y and therefore its className/aria-label, so React would
// have clobbered an imperative DOM write every few moves. Under tiling, a
// mounted cell's world coordinates are fixed for its whole mounted
// lifetime -- they're derived from tileX/tileY/spanCells here, none of
// which change while the tile stays mounted -- so Cell.tsx's className
// (which THAT component writes, not this one) never changes for reasons
// internal to this component, and React never rewrites it out from under an
// imperative write. Since the aria-pressed-cell-state slice, an imperative
// painter would have to keep two attributes in sync instead of one --
// className AND aria-pressed both derive from the same isAlive read, so
// nothing here changes, but a future imperative-painting slice inherits
// twice the surface. Noted here so a future slice finds the connection
// rather than rediscovering it.
export default function CellTile({
  tileX,
  tileY,
  spanCells,
  cellSize,
  anchorX,
  anchorY,
  store,
  onActivate,
  focus,
}: CellTileProps) {
  const originX = tileOriginCell(tileX, spanCells)
  const originY = tileOriginCell(tileY, spanCells)

  const cells: React.ReactNode[] = []
  for (let j = 0; j < spanCells; j++) {
    const y = originY + j
    const topPx = cellOffsetPx(y, anchorY, cellSize)
    for (let i = 0; i < spanCells; i++) {
      const x = originX + i
      const leftPx = cellOffsetPx(x, anchorX, cellSize)
      cells.push(
        <Cell
          // Stryker's `j * spanCells - i` and `j / spanCells + i` mutants here are EQUIVALENT,
          // adjudicated rather than untested: for any spanCells >= 1 both stay unique across the
          // tile and stable for the session (spanCells never changes), and a key never reaches
          // the DOM -- so React reconciles identically and no test layer can observe either.
          key={j * spanCells + i}
          x={x}
          y={y}
          cellSize={cellSize}
          transform={`translate(${leftPx}px, ${topPx}px)`}
          store={store}
          onActivate={onActivate}
          isFocused={x === focus.x && y === focus.y}
        />,
      )
    }
  }
  return <>{cells}</>
}
