import { cellKey } from '../gameOfLife'
import { isMajorGridline } from '../gridGeometry'
import { useLiveCell } from '../hooks/useLiveCell'
import type { LiveCellStore } from '../liveCellStore'

// The id every focused cell's own visually-hidden description span is
// rendered with. A single fixed constant is safe -- exactly one Cell is ever
// isFocused at a time (CellTile computes it from the roving useGridFocus
// cursor), so there is never a second live node to collide with. See
// FOCUS_DESCRIPTION_ID's use below and features/screenplay/questions.ts's
// focusedCellAnnouncement, which resolves aria-describedby generically and
// never hardcodes this string.
const FOCUS_DESCRIPTION_ID = 'focus-cell-description'

// The cell's own paint, extracted from the component body rather than
// inlined in the className: this slice added four focus-cursor decision
// points to Cell (tabIndex, aria-describedby, the description span, and its
// alive/dead word), which took the component past crap4ts's complexity
// threshold of 6 at 8. The three branches here -- aliveness plus the two
// major-gridline edges -- are the half that has nothing to do with the focus
// cursor, so splitting them out is a division along a real seam rather than
// an arbitrary shave to clear the gate. Module-level, not nested inside
// Cell, because crap4ts scores only top-level functions (see CLAUDE.md's
// note on [unmatched-no-ast]) and a nested helper would leave the count
// where it was.
//
// No transition-colors: a generation step flips thousands of cells at once,
// and animating every one of those class changes simultaneously is real
// paint cost this project can't afford at the frame budgets perf/ tests
// against.
function cellPaintClasses(isAlive: boolean, x: number, y: number): string {
  return `absolute top-0 left-0 border border-gray-200 ${
    isAlive ? 'bg-gray-900 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
  } ${isMajorGridline(x) ? 'border-l-2 border-l-gray-400' : ''} ${isMajorGridline(y) ? 'border-t-2 border-t-gray-400' : ''}`
}

interface CellProps {
  x: number // world coordinate: aria-label, gridline classes, store key
  y: number
  cellSize: number
  transform: string // finished CSS transform placing this cell -- see CellTile
  store: LiveCellStore
  onActivate: (x: number, y: number) => void
  // Whether THIS cell is the roving-tabindex keyboard cursor -- see
  // CellTile.tsx's comment on why this is a plain boolean rather than the
  // whole FocusCell, and useGridFocus.ts for where it's decided.
  isFocused: boolean
}

// One cell button, split out so it can own its own aliveness subscription:
// useLiveCell(store, key) means a generation only re-renders the cells whose
// membership actually flipped, instead of every visible cell re-rendering
// because liveCells is a prop-drilled Set with a new identity each tick --
// see liveCellStore.ts's module header. The key is computed once here (not
// passed down from CellTile's map) so getCellSnapshot stays an
// allocation-free Set.has rather than building a string every render.
//
// Takes plain scalars rather than a Camera: a Camera's identity changes on
// every pointermove during a pan, and this component sits at the base of the
// render tree CellTile maps over, so a Camera-typed prop here would defeat
// the world-anchored tile range CellTile reads from (see cellTiles.ts and
// cellAnchor.ts) -- every Cell would still re-render on every pan tick even
// though its own world position never moved.
//
// Positioning arrives as a finished `transform` string rather than as
// leftPx/topPx numbers this component would concatenate itself. Cell-to-pixel
// mapping is CellTile's job end to end (it owns the cellOffsetPx calls);
// splitting it -- caller derives the pixels, callee formats them, and both
// hold cellSize -- put half of one derivation on each side of the boundary.
// Cell now knows only its world coordinate and how to paint what it is told.
export default function Cell({ x, y, cellSize, transform, store, onActivate, isFocused }: CellProps) {
  const key = cellKey(x, y)
  const isAlive = useLiveCell(store, key)
  return (
    <button
      type="button"
      aria-label={`Cell ${x}, ${y}`}
      // Not aria-checked: ARIA 1.2 limits aria-checked to checkbox, radio,
      // switch, option, menuitemcheckbox, menuitemradio and treeitem -- it
      // is not a supported state of role="button", so on this element it
      // would be invalid ARIA that assistive tech may simply ignore.
      // aria-pressed IS the supported toggle-button state. Always rendered
      // (never omitted for a dead cell, not even as a perf optimisation) --
      // omitting it means "this is not a toggle button at all", a different
      // and wrong statement from "pressed=false".
      aria-pressed={isAlive}
      // Roving tabindex: exactly one mounted cell -- wherever the keyboard
      // cursor is -- is a Tab stop; every other cell is programmatically
      // focusable (via useGridFocus's own el.focus() calls) but out of the
      // sequential Tab order. See keyboard-grid-navigation.feature's "The
      // whole grid is a single stop in the tab order".
      tabIndex={isFocused ? 0 : -1}
      // Only the focused cell carries a description -- this is the focus
      // CURSOR's own state, not a property of every cell, so a screen
      // reader browsing an unfocused cell must not hear about a coordinate
      // that isn't its own. aria-describedby (not aria-label) so the
      // coordinate -- already the accessible NAME -- isn't announced twice;
      // see FOCUS_DESCRIPTION_ID's own comment and the span below.
      aria-describedby={isFocused ? FOCUS_DESCRIPTION_ID : undefined}
      // Keyboard activation (Enter/Space) never goes through pointer
      // capture (see useGridPointerGestures' pointer-capture comment),
      // so it needs the same place-vs-toggle branch as the pointer
      // path.
      onClick={() => onActivate(x, y)}
      style={{
        width: cellSize,
        height: cellSize,
        transform,
        boxSizing: 'border-box',
      }}
      className={cellPaintClasses(isAlive, x, y)}
    >
      {/* The single word this cursor's accessible description carries, and
          deliberately not the coordinate too -- that's already the button's
          own accessible NAME (aria-label above), so repeating it here would
          have a screen reader announce "Cell 1, 0, button, not pressed, Cell
          1, 0 dead": the double announcement a live region was rejected for,
          one channel over. See features/steps/keyboard-grid-navigation.ts's
          own header for the CONTRACT send-back this answers. */}
      {isFocused && (
        <span id={FOCUS_DESCRIPTION_ID} className="sr-only">
          {isAlive ? 'alive' : 'dead'}
        </span>
      )}
    </button>
  )
}
