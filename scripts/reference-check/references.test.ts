import { describe, expect, it } from 'vitest'
import { basenameOf, extractFileTokens, extractLineReferences, extractSymbolCitations } from './references.ts'

describe('extractFileTokens', () => {
  it('finds a plain .ts token', () => {
    expect(extractFileTokens('see src/cellTiles.ts for the policy')).toEqual(['src/cellTiles.ts'])
  })

  it('finds a .tsx token without truncating it to .ts', () => {
    expect(extractFileTokens('see src/components/Grid.tsx')).toEqual(['src/components/Grid.tsx'])
  })

  it('finds .md tokens, the dominant citation form in this corpus', () => {
    expect(extractFileTokens('see `engineering.md` and `src/hooks/useZoomGlide.meta.md`')).toEqual([
      'engineering.md',
      'src/hooks/useZoomGlide.meta.md',
    ])
  })

  it('does not report a truncated match for a word starting with md', () => {
    expect(extractFileTokens('the .mdx flavour is not scanned')).toEqual([])
  })

  it('finds .yml and .yaml tokens', () => {
    expect(extractFileTokens('rules/no-foo.yml and sgconfig.yaml')).toEqual(['rules/no-foo.yml', 'sgconfig.yaml'])
  })

  it('finds a .sh token', () => {
    expect(extractFileTokens('see scripts/prose-lint/run.sh for the deleted shell form')).toEqual([
      'scripts/prose-lint/run.sh',
    ])
  })

  // Boundary case for FILE_TOKEN_SOURCE's trailing negative lookahead: a
  // longer word merely starting with the .sh extension is not a truncated
  // match, mirroring the existing .ts/tsconfig and .md/.mdx fixtures above.
  it('does not report a truncated match for a word starting with sh', () => {
    expect(extractFileTokens('run.shx is not a real file')).toEqual([])
  })

  it('finds more than one token on the same line', () => {
    expect(extractFileTokens('classify.ts and vitest-runner.ts')).toEqual(['classify.ts', 'vitest-runner.ts'])
  })

  it('drops a glob-fragment token containing *', () => {
    expect(extractFileTokens('matches *.test.ts and e2e.spec.ts')).toEqual(['e2e.spec.ts'])
  })

  it('drops a dotted-relative token with no filename of its own', () => {
    expect(extractFileTokens('a bare .ts extension')).toEqual([])
    expect(extractFileTokens('a bare .meta.md extension')).toEqual([])
  })

  // Gaps 2 and 3: isDiscardedToken now checks the token's *basename* rather
  // than the raw token, so a genuinely relative citation resolves by its
  // filename half instead of being discarded outright just for starting
  // with a dot (directly, or via an upward `../` segment).
  it('keeps a genuinely relative token, resolving by its own basename', () => {
    expect(extractFileTokens('see `./name.md` for the sidecar')).toEqual(['./name.md'])
    expect(extractFileTokens('see `../scrollbars.meta.md` for the sidecar')).toEqual(['../scrollbars.meta.md'])
  })

  it('keeps a token under a dot directory, no longer hidden by the leading segment', () => {
    expect(extractFileTokens('see `.claude/agents/articles/engineering.md`')).toEqual([
      '.claude/agents/articles/engineering.md',
    ])
  })

  it('drops a glob-fragment token even under an included source prefix', () => {
    expect(extractFileTokens('matches src/*.test.ts everywhere')).toEqual([])
  })

  it('does not report a truncated match for a longer word sharing the extension as a prefix', () => {
    expect(extractFileTokens('see tsconfig.json, not a real hit here')).toEqual([])
  })

  it('repairs the measured extraction artifact: the joiner between two possessive file mentions resolves by basename', () => {
    const [, second] = extractFileTokens("see classify.ts's/vitest-runner.ts's tests")
    expect(basenameOf(second)).toBe('vitest-runner.ts')
  })
})

describe('basenameOf', () => {
  it('returns the last path segment, or the token itself when it has no path separator', () => {
    expect(basenameOf('src/hooks/useCellTiles.ts')).toBe('useCellTiles.ts')
    expect(basenameOf('cellLattice.ts')).toBe('cellLattice.ts')
  })
})

describe('extractSymbolCitations', () => {
  it('finds a camelCase citation', () => {
    const citations = extractSymbolCitations("discovery.ts's pairTargets is deleted", 5)
    expect(citations).toEqual([
      { file: 'discovery.ts', line: 5, token: "discovery.ts's pairTargets", symbol: 'pairTargets' },
    ])
  })

  it('finds a PascalCase, ALL_CAPS, and snake_case citation', () => {
    expect(extractSymbolCitations("a.ts's Foo", 1)[0].symbol).toBe('Foo')
    expect(extractSymbolCitations("a.ts's PATTERN_CATEGORIES", 1)[0].symbol).toBe('PATTERN_CATEGORIES')
    expect(extractSymbolCitations("a.ts's pair_targets", 1)[0].symbol).toBe('pair_targets')
  })

  it('rejects a plain English possessive, the 93%-false-positive case', () => {
    expect(extractSymbolCitations("Cell.test.tsx's job", 1)).toEqual([])
  })

  it('rejects a single lowercase or single uppercase word with no shape signal', () => {
    expect(extractSymbolCitations("a.ts's grid", 1)).toEqual([])
    expect(extractSymbolCitations("a.ts's ID", 1)).toEqual([])
  })

  it('drops a citation whose file half is a glob fragment', () => {
    expect(extractSymbolCitations("*.test.ts's pairTargets", 1)).toEqual([])
  })

  // Gaps 2 and 3 reach this extractor too, since it shares isDiscardedToken
  // with extractFileTokens: a genuinely relative file half now keeps its
  // citation instead of being dropped for starting with a dot.
  it('keeps a citation whose file half is a genuinely relative token', () => {
    const citations = extractSymbolCitations("./decide.ts's pairTargets", 1)
    expect(citations).toEqual([
      { file: './decide.ts', line: 1, token: "./decide.ts's pairTargets", symbol: 'pairTargets' },
    ])
  })
})

describe('extractLineReferences', () => {
  it('finds a foo.ts:NN reference', () => {
    expect(extractLineReferences('see features/steps/pattern-library.ts:58 for the wiring')).toEqual([
      'features/steps/pattern-library.ts:58',
    ])
  })

  it('returns nothing when there is no line number suffix, or when the match is a glob fragment', () => {
    expect(extractLineReferences('see features/steps/pattern-library.ts for the wiring')).toEqual([])
    expect(extractLineReferences('matches *.test.ts:12')).toEqual([])
  })

  // Mutation regression: LINE_REFERENCE_PATTERN carries a `g` flag, and
  // every other fixture here has exactly one match per line -- which reads
  // identically with or without `g`, since a non-global `.match` still
  // returns the first match. Two references on one line is what the flag
  // is actually for.
  it('finds every reference on a line, not only the first', () => {
    expect(extractLineReferences('see a.ts:10 and b.ts:20')).toEqual(['a.ts:10', 'b.ts:20'])
  })

  // Gaps 2 and 3 reach this extractor too, since it shares isDiscardedToken
  // with extractFileTokens: a genuinely relative token now keeps its
  // (banned) line reference instead of being dropped for starting with a
  // dot.
  it('keeps a genuinely relative token, still banning the line-number suffix', () => {
    expect(extractLineReferences('see ./decide.ts:10 for the wiring')).toEqual(['./decide.ts:10'])
  })
})
