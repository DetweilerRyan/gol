import { describe, expect, it } from 'vitest'
import { patternCellPositions, PATTERNS, type Pattern } from './patternLibrary'
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

const GLIDER = PATTERNS.find((pattern) => pattern.name === 'Glider') as Pattern
const BLOCK = PATTERNS.find((pattern) => pattern.name === 'Block') as Pattern

const browsing = toggleLibrary(INITIAL_PLACEMENT)
const placing = armPattern(GLIDER)

describe('INITIAL_PLACEMENT', () => {
  it('starts idle: library closed, nothing armed, nothing to preview', () => {
    expect(isLibraryOpen(INITIAL_PLACEMENT)).toBe(false)
    expect(armedPattern(INITIAL_PLACEMENT)).toBeNull()
    expect(previewPositions(INITIAL_PLACEMENT)).toEqual([])
  })

  it('is the idle-mode literal exactly, not just something the other queries treat as idle', () => {
    // The queries above (isLibraryOpen/armedPattern/previewPositions) all treat any non-'browsing',
    // non-'placing' mode as equivalent, so they can't tell 'idle' apart from a mutated or malformed
    // mode string -- assert the literal directly to pin it down.
    expect(INITIAL_PLACEMENT).toEqual({ mode: 'idle' })
  })
})

describe('toggleLibrary', () => {
  it('opens the library from idle', () => {
    expect(isLibraryOpen(browsing)).toBe(true)
    expect(armedPattern(browsing)).toBeNull()
  })

  it('disarms instead of reopening while a pattern is armed', () => {
    const next = toggleLibrary(placing)
    expect(isLibraryOpen(next)).toBe(false)
    expect(armedPattern(next)).toBeNull()
  })

  it('reopens the library after a pattern was armed and then cancelled', () => {
    expect(isLibraryOpen(toggleLibrary(toggleLibrary(placing)))).toBe(true)
  })
})

describe('armPattern', () => {
  it('arms the given pattern with no preview cell yet', () => {
    expect(armedPattern(placing)).toBe(GLIDER)
    expect(previewPositions(placing)).toEqual([])
  })

  it('closes the library when armed from the browsing state', () => {
    expect(isLibraryOpen(armPattern(BLOCK))).toBe(false)
  })

  it('replaces a previously armed pattern, dropping its preview cell', () => {
    const withPreview = movePreviewTo(placing, 4, 5)
    const rearmed = armPattern(BLOCK)
    expect(armedPattern(rearmed)).toBe(BLOCK)
    expect(previewPositions(withPreview).length).toBeGreaterThan(0)
    expect(previewPositions(rearmed)).toEqual([])
  })
})

describe('cancelPlacing', () => {
  it('returns to idle from placing', () => {
    const next = cancelPlacing(movePreviewTo(placing, 1, 1))
    expect(armedPattern(next)).toBeNull()
    expect(previewPositions(next)).toEqual([])
  })

  it('returns the exact same state reference when nothing is armed', () => {
    expect(cancelPlacing(INITIAL_PLACEMENT)).toBe(INITIAL_PLACEMENT)
    expect(cancelPlacing(browsing)).toBe(browsing)
  })
})

describe('movePreviewTo', () => {
  it('positions the armed pattern’s cells at the given anchor', () => {
    const moved = movePreviewTo(placing, 7, -3)
    expect(previewPositions(moved)).toEqual(patternCellPositions(GLIDER, 7, -3))
    expect(armedPattern(moved)).toBe(GLIDER)
  })

  it('replaces the previous preview cell rather than accumulating positions', () => {
    const moved = movePreviewTo(movePreviewTo(placing, 1, 1), 2, 2)
    expect(previewPositions(moved)).toEqual(patternCellPositions(GLIDER, 2, 2))
  })

  it('returns the exact same state reference when nothing is armed', () => {
    expect(movePreviewTo(INITIAL_PLACEMENT, 3, 3)).toBe(INITIAL_PLACEMENT)
    expect(movePreviewTo(browsing, 3, 3)).toBe(browsing)
  })
})

describe('isLibraryOpen', () => {
  it('is false while placing, so an armed pattern never leaves the modal open', () => {
    expect(isLibraryOpen(movePreviewTo(placing, 0, 0))).toBe(false)
  })
})

describe('previewPositions', () => {
  // idle/browsing states never actually carry a previewCell (the discriminated union makes
  // that unrepresentable through the exported constructors), so the `!state.previewCell` half
  // of the guard alone happens to return [] for every state reachable through normal use --
  // the `state.mode !== 'placing'` half is redundant *given the type*, but still load-bearing
  // defense-in-depth against exactly the kind of malformed state this cast constructs.
  it('returns [] for a non-placing state even if it were to carry a previewCell', () => {
    const malformed = { mode: 'browsing', previewCell: { x: 1, y: 1 } } as unknown as PlacementState
    expect(previewPositions(malformed)).toEqual([])
  })
})
