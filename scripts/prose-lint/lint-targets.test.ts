import { describe, expect, it } from 'vitest'
import { excludeCatalyst, LINT_PATHSPECS, pathspecsFor } from './lint-targets.ts'

describe('LINT_PATHSPECS', () => {
  it('lints tracked Markdown, TypeScript and TSX files', () => {
    expect(LINT_PATHSPECS).toEqual(['*.md', '*.ts', '*.tsx'])
  })
})

describe('excludeCatalyst', () => {
  it('drops a path under the vendored src/catalyst/ boundary', () => {
    expect(excludeCatalyst(['src/catalyst/button.tsx', 'src/App.tsx'])).toEqual(['src/App.tsx'])
  })

  it('keeps a path that merely contains src/catalyst/ deeper than its own root', () => {
    // `includes`-based port would have dropped this. `grep -v '^src/catalyst/'`
    // never would have, since `^` anchors to the start of the line.
    expect(excludeCatalyst(['docs/src/catalyst/x.md'])).toEqual(['docs/src/catalyst/x.md'])
  })

  it('keeps every path when none matches the vendored prefix', () => {
    expect(excludeCatalyst(['CLAUDE.md', 'src/App.tsx'])).toEqual(['CLAUDE.md', 'src/App.tsx'])
  })

  it('drops every path when all of them match the vendored prefix', () => {
    expect(excludeCatalyst(['src/catalyst/a.tsx', 'src/catalyst/b.tsx'])).toEqual([])
  })
})

describe('pathspecsFor', () => {
  it('returns the whole-tree pathspecs when no scope is given', () => {
    expect(pathspecsFor(undefined)).toEqual(['*.md', '*.ts', '*.tsx'])
  })

  it('bounds a scope to the three linted extensions', () => {
    expect(pathspecsFor('src')).toEqual(['src/*.md', 'src/*.ts', 'src/*.tsx'])
  })

  it('accepts a trailing slash without doubling it', () => {
    expect(pathspecsFor('features/')).toEqual(['features/*.md', 'features/*.ts', 'features/*.tsx'])
  })

  // Pins the reason a scope works at all: git's `*` crosses `/` in a
  // pathspec, so `src/*.md` is recursive and reaches
  // `src/hooks/useZoomGlide.meta.md`. A reader assuming shell-glob semantics
  // would expect a scope to miss every nested file.
  it('produces a recursive pathspec rather than one bounded to direct children', () => {
    expect(pathspecsFor('src')).not.toContain('src/**/*.md')
    expect(pathspecsFor('src')[0]).toBe('src/*.md')
  })

  it('returns a fresh array rather than the shared constant', () => {
    expect(pathspecsFor(undefined)).not.toBe(LINT_PATHSPECS)
  })
})
