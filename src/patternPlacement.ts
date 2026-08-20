import { patternCellPositions, type Pattern } from './patternLibrary'

// The pattern-library interaction as an explicit three-state machine, kept
// framework-free the same way camera.ts is (useCamera : camera.ts ::
// usePatternPlacement : this module). Modeling it as one state rather than
// separate "modal open" / "pattern armed" / "preview cell" flags makes the
// impossible combinations (library open *and* a pattern armed, a preview cell
// with nothing to preview) unrepresentable rather than merely avoided by
// convention.
//
// - idle: neither browsing nor placing; clicks toggle single cells.
// - browsing: the pattern library modal is open.
// - placing: a pattern is armed and follows the pointer until it's stamped.
export type PlacementState =
  | { mode: 'idle' }
  | { mode: 'browsing' }
  | { mode: 'placing'; pattern: Pattern; previewCell: { x: number; y: number } | null }

export const INITIAL_PLACEMENT: PlacementState = { mode: 'idle' }

const BROWSING: PlacementState = { mode: 'browsing' }

export function armPattern(pattern: Pattern): PlacementState {
  return { mode: 'placing', pattern, previewCell: null }
}

// The Patterns button's rule: while a pattern is armed it disarms instead of
// reopening the library, so the button doubles as the cancel affordance.
// There's no browsing case to handle -- the modal makes the rest of the page
// inert while open, so the button can't be pressed in that state.
export function toggleLibrary(state: PlacementState): PlacementState {
  return state.mode === 'placing' ? INITIAL_PLACEMENT : BROWSING
}

// Returns the same state reference when nothing is armed, so callers can pass
// this straight to a state setter without forcing a no-op re-render.
export function cancelPlacing(state: PlacementState): PlacementState {
  return state.mode === 'placing' ? INITIAL_PLACEMENT : state
}

// Preview tracking is ignored outside placing mode (pointer moves happen
// constantly, armed or not), again returning the same reference so only a
// genuine preview change re-renders.
export function movePreviewTo(state: PlacementState, x: number, y: number): PlacementState {
  if (state.mode !== 'placing') return state
  return { ...state, previewCell: { x, y } }
}

export function isLibraryOpen(state: PlacementState): boolean {
  return state.mode === 'browsing'
}

export function armedPattern(state: PlacementState): Pattern | null {
  return state.mode === 'placing' ? state.pattern : null
}

// World cells the armed pattern would occupy if stamped at the current preview
// cell -- empty whenever there's nothing to preview. Built on the same
// patternCellPositions helper placePattern itself uses, so the preview can't
// drift from where a stamp would actually land.
export function previewPositions(state: PlacementState): ReadonlyArray<readonly [number, number]> {
  if (state.mode !== 'placing' || !state.previewCell) return []
  return patternCellPositions(state.pattern, state.previewCell.x, state.previewCell.y)
}
