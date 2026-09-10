import { describe, expect, it } from 'vitest'
import { directoryOf, matchesChangedPath, strykerIgnoreCovers, vitestExcludeCovers } from './path-forms.ts'

// The deliberately deterministic row set architect's DESIGN pass specified,
// pinned across all three matchers below: an unrecognised form must secure
// nothing (return false / covers: false), never "unless a contradiction is
// found". `features-x/foo` is the load-bearing negative -- the classic
// fail-open prefix bug this module exists to avoid.
const PINNED_ROWS = [
  '',
  '/',
  '*',
  '**',
  'features',
  '/features',
  '/features/',
  '/features/**',
  '!features',
  '!/features',
  'src/features',
  'FEATURES',
  'features-x/foo',
  'features/',
]

describe('directoryOf', () => {
  it('strips a trailing /** to recover the directory', () => {
    expect(directoryOf('features/**')).toBe('features')
    expect(directoryOf('.claude/**')).toBe('.claude')
  })

  it('returns undefined for a bare (non-directory) path', () => {
    expect(directoryOf('CLAUDE.md')).toBeUndefined()
    expect(directoryOf('features')).toBeUndefined()
  })
})

describe('vitestExcludeCovers -- pinned rows against dir "features"', () => {
  it.each(PINNED_ROWS)('%j does not cover "features" except the bare "features" row', (glob) => {
    const expected = glob === 'features'
    expect(vitestExcludeCovers(glob, 'features')).toBe(expected)
  })

  it('recognises the dir/** and dir/**/* forms too', () => {
    expect(vitestExcludeCovers('features/**', 'features')).toBe(true)
    expect(vitestExcludeCovers('features/**/*', 'features')).toBe(true)
  })
})

describe('strykerIgnoreCovers -- pinned rows against dir "features"', () => {
  // Rows that DO cover "features" once leading `!`/`/` and a trailing
  // `/**`/`/` are stripped -- every other pinned row covers nothing.
  const COVERING = new Set([
    'features',
    '/features',
    '/features/',
    '/features/**',
    '!features',
    '!/features',
    'features/',
  ])
  const NEGATED = new Set(['!features', '!/features'])

  it.each(PINNED_ROWS)('%j', (pattern) => {
    const result = strykerIgnoreCovers(pattern, 'features')
    expect(result.covers).toBe(COVERING.has(pattern))
    expect(result.negated).toBe(NEGATED.has(pattern))
  })

  it('reports negated: true independent of whether the pattern covers the directory', () => {
    expect(strykerIgnoreCovers('!src', 'features')).toEqual({ covers: false, negated: true })
  })
})

describe('matchesChangedPath -- directory entries', () => {
  it.each(PINNED_ROWS)('%j against entry "features/**"', (changedPath) => {
    const expected = changedPath === 'features/'
    expect(matchesChangedPath('features/**', changedPath)).toBe(expected)
  })

  it('matches a real file nested under the directory', () => {
    expect(matchesChangedPath('features/**', 'features/foo.feature')).toBe(true)
    expect(matchesChangedPath('features/**', 'features/steps/bar.ts')).toBe(true)
  })

  it('does not match a sibling directory sharing a prefix (the load-bearing negative)', () => {
    expect(matchesChangedPath('features/**', 'features-x/foo')).toBe(false)
  })

  it('does not match the directory name alone, with no trailing content', () => {
    expect(matchesChangedPath('features/**', 'features')).toBe(false)
  })
})

describe('matchesChangedPath -- bare-file entries', () => {
  it('matches only by exact equality', () => {
    expect(matchesChangedPath('CLAUDE.md', 'CLAUDE.md')).toBe(true)
    expect(matchesChangedPath('CLAUDE.md', 'CLAUDE.md.bak')).toBe(false)
    expect(matchesChangedPath('CLAUDE.md', 'docs/CLAUDE.md')).toBe(false)
  })
})
