import { describe, expect, it } from 'vitest'
import { excludeCatalyst, LINT_PATHSPECS } from './lint-targets.ts'

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
