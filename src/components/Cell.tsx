// The id every focused cell's own visually-hidden description span is
// rendered with. A single fixed constant is safe -- exactly one Cell is ever
// isFocused at a time (GridCells computes it from the roving useGridFocus
// cursor), so there is never a second live node to collide with. See
// FOCUS_DESCRIPTION_ID's use below and features/screenplay/questions.ts's
// focusedCellAnnouncement, which resolves aria-describedby generically and
// never hardcodes this string.
const FOCUS_DESCRIPTION_ID = 'focus-cell-description'

// The cell's own paint. collapse-dead-cell-layer's step 4 drops two things
// this used to carry: the border classes (GridLines.tsx is now the ONLY
// gridline source -- see that component's header -- so a per-cell border
// would double-paint the same lines) and the hover: classes (a single
// cursor-following HoverIndicator.tsx replaced ~19,680 `hover:bg-gray-100`
// rules, since most of the grid's area is unmounted cells now and CSS
// :hover has nothing to attach to there). What's left is one branch: alive
// paints solid, dead paints nothing at all, so GridLines' own white base
// fill (and its gridlines) show straight through an unmounted -- or
// mounted-but-dead-focused -- cell. A dead FOCUSED cell (the one case a dead
// cell still mounts, via liveCellWindow.ts's own +1) must stay transparent
// rather than e.g. bg-white for exactly that reason: a white fill here would
// punch a solid hole in GridLines' lines wherever the keyboard cursor parks
// on a dead cell.
//
// Named consequence of dropping the per-cell border, not silently absorbed:
// two adjacent LIVE cells now merge into one unbroken black region -- the
// gridline paints underneath the opaque cell, and there is no longer a
// border to frame each one individually the way border-gray-200 used to.
// The "appearance does not change" ruling on GridLines' base fill was about
// the gap between live cells, not about this.
//
// No transition-colors: a generation step flips thousands of cells at once,
// and animating every one of those class changes simultaneously is real
// paint cost this project can't afford at the frame budgets perf/ tests
// against.
//
// bg-cell-alive rather than a literal bg-gray-900, and deliberately with no
// dark: variant alongside it -- see src/index.css's own comment on
// --color-cell-alive. The token re-binds under html.dark with no change to
// this string, which is what keeps the per-cell hot path from paying for a
// second class on every mounted cell.
function cellPaintClasses(isAlive: boolean): string {
  return `absolute top-0 left-0 ${isAlive ? 'bg-cell-alive' : ''}`
}

interface CellProps {
  x: number // world coordinate: aria-label, store key
  y: number
  cellSize: number
  transform: string // finished CSS transform placing this cell -- see GridCells
  isAlive: boolean
  onActivate: (x: number, y: number) => void
  // Whether THIS cell is the roving-tabindex keyboard cursor -- see
  // GridCells.tsx's comment on why this is a plain boolean rather than the
  // whole FocusCell, and useGridFocus.ts for where it's decided.
  isFocused: boolean
}

// One cell button. Takes its own aliveness as a plain prop now rather than
// subscribing to the store itself (the useLiveCell hook this used to hold
// was retired at step 4, and liveCellStore's whole subscribeCell channel
// with it at the REVIEW pass -- see that module's header):
// GridCells now mounts only live cells (plus the focus cursor's own cell --
// liveCellWindow.ts's +1), so it already knows every mounted cell's
// aliveness from the one liveCellsInRange call that decided to mount it in
// the first place, and threading that through as a prop is cheaper than a
// second, per-cell subscription to the same store. The accepted cost: a
// generation tick now re-renders every mounted cell (Grid's own
// liveCellsInRange call reruns), not just the ones that flipped -- see
// Grid.tsx's own header and this slice's step-4 handoff for the two perf
// scenarios that show it.
//
// Takes plain scalars rather than a Camera: a Camera's identity changes on
// every pointermove during a pan, and a Camera-typed prop here would defeat
// the world-anchored render window GridCells computes from (see
// liveCellWindow.ts and cellAnchor.ts) -- every Cell would still re-render
// on every pan tick even though its own world position never moved.
//
// Positioning arrives as a finished `transform` string rather than as
// leftPx/topPx numbers this component would concatenate itself. Cell-to-pixel
// mapping is GridCells' job end to end (it owns the cellOffsetPx calls);
// splitting it -- caller derives the pixels, callee formats them, and both
// hold cellSize -- put half of one derivation on each side of the boundary.
// Cell now knows only its world coordinate, whether it's alive, and how to
// paint what it is told.
export default function Cell({ x, y, cellSize, transform, isAlive, onActivate, isFocused }: CellProps) {
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
      className={cellPaintClasses(isAlive)}
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
