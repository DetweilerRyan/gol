// Per-line extraction of the three reference shapes this checker cares
// about: a bare filename token (extractFileTokens), a `<file>'s <symbol>`
// citation (extractSymbolCitations), and a banned `file.ts:NN` line
// reference (extractLineReferences). All three share one filename-token
// grammar, FILE_TOKEN_SOURCE.
//
// Matching everywhere in this program is by *basename*, never full path
// (basenameOf) -- deliberately under-reports, so a false negative on a
// same-named file living in a different directory is the safe direction. It
// also repairs a real extraction artifact: `classify.ts's/vitest-runner.ts's`
// yields a raw token of `s/vitest-runner.ts` (the greedy token grammar eats
// straight through the `'s/` joiner between the two real filenames), whose
// *basename* -- `vitest-runner.ts` -- is the file actually being cited.

// `tsx` before `ts`: a regex alternation tries alternatives left to right,
// and `ts` is a literal prefix of `tsx`, so the longer form has to come
// first or `app.tsx` would report a truncated `.ts` match.
const EXTENSION_ALTERNATION = 'tsx|ts|yaml|yml'
// The trailing negative lookahead keeps `.tsconfig` (or any other longer
// word starting with a real extension) from reporting a truncated token.
const FILE_TOKEN_SOURCE = `[A-Za-z0-9_.*/-]*\\.(?:${EXTENSION_ALTERNATION})(?![A-Za-z0-9_])`

function isDiscardedToken(token: string): boolean {
  // Dropped per the design's measured extraction sweep: a token containing
  // `*` is a glob fragment (`test.ts`, `e2e.spec.ts` matched as literal `*`
  // wildcards elsewhere), and a token starting with `.` is dotted-relative
  // noise with no filename of its own (a bare `.ts` matched with a
  // zero-length prefix).
  return token.includes('*') || token.startsWith('.')
}

/**
 * Every `<name>.ts`/`.tsx`/`.yml`/`.yaml`-shaped token on `line`, minus glob
 * fragments and dotted-relative noise -- see isDiscardedToken.
 */
export function extractFileTokens(line: string): string[] {
  const matches = line.match(new RegExp(FILE_TOKEN_SOURCE, 'g')) ?? []
  return matches.filter((token) => !isDiscardedToken(token))
}

/** The last `/`-delimited segment of a token -- what every resolution check in this program actually compares. */
export function basenameOf(token: string): string {
  const segments = token.split('/')
  return segments[segments.length - 1]
}

// camelCase, PascalCase, ALL_CAPS and snake_case all either carry an
// underscore or mix letter case; a plain English word -- the 93%
// false-positive case measured against this tree (see the ratified design)
// -- does neither. This is deliberately permissive about *which* of the
// four shapes it is: the false-positive cost is in matching "job", not in
// conflating "Grid" with "GridLines". No bare-shape check
// (`/^[A-Za-z_][A-Za-z0-9_]*$/`) is needed here: `word` always comes from
// CITATION_PATTERN's own second capture group below, which already
// requires exactly that character class, so a differently-shaped `word`
// can never reach this function from its only caller.
function isIdentifierShaped(word: string): boolean {
  return word.includes('_') || (/[a-z]/.test(word) && /[A-Z]/.test(word))
}

export interface Citation {
  file: string
  line: number
  token: string
  symbol: string
}

const CITATION_PATTERN = new RegExp(`(${FILE_TOKEN_SOURCE})'s\\s+([A-Za-z_][A-Za-z0-9_]*)`, 'g')

/**
 * Every `<file>'s <symbol>` citation on `line`, restricted to
 * identifier-shaped symbols (camelCase/PascalCase/ALL_CAPS/snake_case).
 * Matching any word after `'s` measures 93% false positives -- English
 * possessives like "Cell.test.tsx's job" -- so the shape restriction on the
 * symbol *is* the check, not a refinement of it.
 */
export function extractSymbolCitations(line: string, lineNumber: number): Citation[] {
  const citations: Citation[] = []
  for (const match of line.matchAll(CITATION_PATTERN)) {
    const [full, file, symbol] = match
    if (isDiscardedToken(file)) continue
    if (!isIdentifierShaped(symbol)) continue
    citations.push({ file, line: lineNumber, token: full, symbol })
  }
  return citations
}

const LINE_REFERENCE_PATTERN = new RegExp(`${FILE_TOKEN_SOURCE}:\\d+`, 'g')

/** Every banned `file.ts:NN`-shaped reference on `line`. */
export function extractLineReferences(line: string): string[] {
  const matches = line.match(LINE_REFERENCE_PATTERN) ?? []
  return matches.filter((token) => !isDiscardedToken(token))
}
