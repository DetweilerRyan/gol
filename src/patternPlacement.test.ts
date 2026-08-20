import { describe, expect, it } from 'vitest'
import { patternCellPositions, PATTERNS, type Pattern } from './gameOfLife'
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
} from './patternPlacement'

const GLIDER = PATTERNS.find((pattern) => pattern.name === 'Glider') as Pattern
const BLOCK = PATTERNS.find((pattern) => pattern.name === 'Block') as Pattern

const browsing = toggleLibrary(INITIAL_PLACEMENT)
const placing = armPattern(GLIDER)

describe('INITIAL_PLACEMENT', () => {
  it('starts idle: library closed, nothing armed, Enter not suppressed, nothing to preview', () => {
    expect(isLibraryOpen(INITIAL_PLACEMENT)).toBe(false)
    expect(armedPattern(INITIAL_PLACEMENT)).toBeNull()
    expect(suppressesEnter(INITIAL_PLACEMENT)).toBe(false)
    expect(previewPositions(INITIAL_PLACEMENT)).toEqual([])
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
    expect(suppressesEnter(next)).toBe(false)
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

describe('suppressesEnter', () => {
  it('is true while browsing and while placing, false only when idle', () => {
    expect(suppressesEnter(browsing)).toBe(true)
    expect(suppressesEnter(placing)).toBe(true)
    expect(suppressesEnter(movePreviewTo(placing, 0, 0))).toBe(true)
    expect(suppressesEnter(INITIAL_PLACEMENT)).toBe(false)
  })
})

describe('isLibraryOpen', () => {
  it('is false while placing, so an armed pattern never leaves the modal open', () => {
    expect(isLibraryOpen(movePreviewTo(placing, 0, 0))).toBe(false)
  })
})
