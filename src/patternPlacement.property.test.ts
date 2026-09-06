import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { isDeepEqual } from './equality/is-deep-equal'
import { cellKey, createEmptyLiveCells } from './gameOfLife'
import { PATTERNS, placePattern, type Pattern } from './patternLibrary'
import {
  armedPattern,
  armPattern,
  cancelPlacing,
  INITIAL_PLACEMENT,
  isLibraryOpen,
  movePreviewTo,
  previewPositions,
  toggleLibrary,
  type PlacementState,
} from './patternPlacement'

const anyPattern = fc.constantFrom(...PATTERNS)
const anchor = fc.integer({ min: -10_000, max: 10_000 })

// Every transition the UI can drive, as data, so a whole interaction can be
// replayed as a sequence rather than hand-enumerated one path at a time.
type Action =
  | { type: 'toggleLibrary' }
  | { type: 'arm'; pattern: Pattern }
  | { type: 'cancel' }
  | { type: 'preview'; x: number; y: number }

const action: fc.Arbitrary<Action> = fc.oneof(
  fc.constant<Action>({ type: 'toggleLibrary' }),
  anyPattern.map<Action>((pattern) => ({ type: 'arm', pattern })),
  fc.constant<Action>({ type: 'cancel' }),
  fc.record({ x: anchor, y: anchor }).map<Action>(({ x, y }) => ({ type: 'preview', x, y })),
)

function apply(state: PlacementState, next: Action): PlacementState {
  switch (next.type) {
    case 'toggleLibrary': {
      return toggleLibrary(state)
    }
    case 'arm': {
      return armPattern(next.pattern)
    }
    case 'cancel': {
      return cancelPlacing(state)
    }
    case 'preview': {
      return movePreviewTo(state, next.x, next.y)
    }
  }
}

describe('placement state machine (property)', () => {
  const actions = fc.array(action, { maxLength: 30 })

  it.prop([actions])('never has the library open and a pattern armed at the same time', (sequence) => {
    let state = INITIAL_PLACEMENT
    for (const next of sequence) {
      state = apply(state, next)
      expect(isLibraryOpen(state) && armedPattern(state) !== null).toBe(false)
    }
  })

  it.prop([actions])('only ever previews cells while a pattern is armed', (sequence) => {
    let state = INITIAL_PLACEMENT
    for (const next of sequence) {
      state = apply(state, next)
      if (previewPositions(state).length > 0) expect(armedPattern(state)).not.toBeNull()
    }
  })

  // THE IDENTITY HALF OF THIS MODULE'S CONTRACT, stated once over every state a
  // sequence can reach: a transition that changes nothing must hand back the
  // very object it was given, not a deep-equal copy. A copy is invisible to
  // every assertion about state and re-renders every subscriber for nothing,
  // which is the cost the comments on those functions exist to avoid.
  //
  // Two of the three were already pinned by name in patternPlacement.test.ts
  // (cancelPlacing and movePreviewTo, each "returns the exact same state
  // reference when nothing is armed"); toggleLibrary's was NOT, and this slice
  // measured that gap -- returning a fresh `{ mode: 'browsing' }` instead of the
  // BROWSING constant left all 950 tests `npm test` then collected green. It
  // now has a named twin too.
  //
  // Deliberately scoped to the three functions whose no-op branch IS a
  // `return state`/shared constant. armPattern and a same-cell movePreviewTo
  // both build a fresh object that can be deep-equal to what came before, so a
  // blanket "no-op preserves identity" over every action would be false.
  it.prop([actions])('hands back the same object, not an equal copy, when a transition changes nothing', (sequence) => {
    let state = INITIAL_PLACEMENT
    for (const next of sequence) {
      state = apply(state, next)
    }

    for (const settled of [toggleLibrary(state), cancelPlacing(state)]) {
      if (isDeepEqual(settled, state)) expect(settled).toBe(state)
    }
    if (state.mode !== 'placing') expect(movePreviewTo(state, 0, 0)).toBe(state)
  })

  it.prop([actions])('always reaches a state a single further action can return to idle from', (sequence) => {
    let state = INITIAL_PLACEMENT
    for (const next of sequence) {
      state = apply(state, next)
    }
    // Escape/the Patterns button is the universal way out: cancelPlacing from
    // placing, toggleLibrary from browsing -- no sequence can strand the user
    // in a mode with no exit.
    const escaped = cancelPlacing(state)
    expect(armedPattern(escaped)).toBeNull()
    expect(isLibraryOpen(toggleLibrary(escaped))).toBe(true)
  })
})

describe('previewPositions (property)', () => {
  it.prop([anyPattern, anchor, anchor])(
    'previews exactly the cells placePattern would stamp at the same anchor, for every pattern',
    (pattern, x, y) => {
      const preview = previewPositions(movePreviewTo(armPattern(pattern), x, y))

      const stamped = createEmptyLiveCells()
      placePattern(stamped, pattern, x, y)

      expect(new Set(preview.map(([cellX, cellY]) => cellKey(cellX, cellY)))).toEqual(stamped)
    },
  )

  it.prop([anyPattern, anchor, anchor, anchor, anchor])(
    'is translation-invariant: moving the preview shifts every cell by the same offset',
    (pattern, x1, y1, x2, y2) => {
      const armed = armPattern(pattern)
      const first = previewPositions(movePreviewTo(armed, x1, y1))
      const second = previewPositions(movePreviewTo(armed, x2, y2))

      expect(second).toEqual(first.map(([cellX, cellY]) => [cellX + (x2 - x1), cellY + (y2 - y1)]))
    },
  )
})
