// The one place that says how a cell's aliveness is encoded in the DOM, for
// every layer that needs to query it: Playwright specs (features/, perf/)
// and RTL component tests (src/components/). Deliberately imports NOTHING --
// plain string constants and pure functions only -- so it is safe to import
// into three different module graphs at once (Playwright's transform,
// perf/'s tsconfig.app.json program, and vitest's `dom` project), none of
// which this file needs to know about. Do not import @playwright/test types
// here, and do not import this file from src/components/Cell.tsx: that would
// put a product string outside every gate this repo runs over src/.
//
// aria-pressed, not aria-checked or a class name -- see Cell.tsx's own
// comment on why aria-pressed is the supported ARIA state for a toggle
// button. Cell.tsx's `aria-label` template literal and cellLabel() below are
// deliberately two independent copies of the same format string, pinned
// together by Cell.test.tsx querying getByRole with cellLabel(x, y) as the
// accessible name -- see that file for the test that fails loudly if they
// drift.
export const CELL_ALIVE_ATTR = 'aria-pressed'
export const CELL_ALIVE_VALUE = 'true'
export const CELL_DEAD_VALUE = 'false'

export function cellLabel(x: number, y: number): string {
  return `Cell ${x}, ${y}`
}

// Every cell button, regardless of aliveness. The `^=` prefix match (rather
// than an exact aria-label) is deliberate: it selects on "this is a cell"
// without needing to know or reconstruct the coordinate.
export const CELL_SELECTOR = 'button[aria-label^="Cell "]'

export function cellSelector(x: number, y: number): string {
  return `button[aria-label="${cellLabel(x, y)}"]`
}

export const ALIVE_CELL_SELECTOR = `${CELL_SELECTOR}[${CELL_ALIVE_ATTR}="${CELL_ALIVE_VALUE}"]`
export const DEAD_CELL_SELECTOR = `${CELL_SELECTOR}[${CELL_ALIVE_ATTR}="${CELL_DEAD_VALUE}"]`
