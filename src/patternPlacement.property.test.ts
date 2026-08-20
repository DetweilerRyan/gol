import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { cellKey, createEmptyLiveCells, PATTERNS, placePattern, type Pattern } from './gameOfLife'
import {
  armedPattern,
  armPattern,
  cancelPlacing,
  INITIAL_PLACEMENT,
  isLibraryOpen,
  movePreviewTo,
  previewPositions,
  suppressesEnter,
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

  it.prop([actions])('suppresses Enter exactly while browsing or placing, never otherwise', (sequence) => {
    let state = INITIAL_PLACEMENT
    for (const next of sequence) {
      state = apply(state, next)
      expect(suppressesEnter(state)).toBe(isLibraryOpen(state) || armedPattern(state) !== null)
    }
  })

  it.prop([actions])('only ever previews cells while a pattern is armed', (sequence) => {
    let state = INITIAL_PLACEMENT
    for (const next of sequence) {
      state = apply(state, next)
      if (previewPositions(state).length > 0) expect(armedPattern(state)).not.toBeNull()
    }
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
    expect(isLibraryOpen(toggleLibrary(escaped)) || suppressesEnter(escaped)).toBe(true)
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
