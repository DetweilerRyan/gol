// Per-line extraction of the three reference shapes this checker cares
// about: a bare filename token (extractFileTokens), a `<file>'s <symbol>`
// citation (extractSymbolCitations), and a banned `<file>:NN` line
// reference (extractLineReferences). All three share one filename-token
// grammar, FILE_TOKEN_SOURCE.
//
// Matching everywhere in this program is by *basename*, never full path
// (basenameOf) -- deliberately under-reports, so a false negative on a
// same-named file living in a different directory is the safe direction. It
// also repairs a real extraction artifact, measured against this repo's own
// history: `classify.ts's/vitest-runner.ts's` yielded a raw token of
// `s/vitest-runner.ts` (the greedy token grammar eats straight through the
// `'s/` joiner between the two real filenames), whose *basename* --
// `vitest-runner.ts` -- was the file actually being cited (vitest-runner.ts
// has since been retired by `acceptance-mutation-on-playwright`).
// reference-check: allow vitest-runner.ts -- retired by acceptance-mutation-on-playwright; the worked example above is grounded in a real, now-historical extraction artifact

// `tsx` before `ts`: a regex alternation tries alternatives left to right,
// and `ts` is a literal prefix of `tsx`, so the longer form has to come
// first or a hypothetical `app.tsx` would report a truncated `.ts` match.
// reference-check: allow app.tsx -- illustrative hypothetical filename, not a real file
// `md` earns its place because this repo's dominant citation form is a bare
// backticked filename rather than a Markdown link -- measured 2026-09-09 at
// 1,448 backticked `.md` tokens against 4 link-form ones. Every off-the-shelf
// link checker reads links, so none of them sees the 1,448. See
// doc-comments.rationale.md for the three tools evaluated and rejected.
//
// `sh` was added later: this alternation is an allowlist, and any other
// extension -- `sh` included, before this -- was invisible to
// file-reference-resolves and could never trip stale-allow-marker either.
// prose-lint-runner-is-shell-not-typescript hit exactly that: it deleted
// scripts/prose-lint's own shell-script predecessor while a sidecar still
// cited it by name, the gate stayed green, and a ratified allow-marker for
// the citation turned out to be unsatisfiable -- a marker naming a token
// this extractor cannot produce is stale on arrival. There are zero tracked
// .sh files in this repo, so every live `.sh` citation names either dated
// history (a deleted file, excused by a same-file allow-marker) or another
// repository's file that never existed here (same remedy).
const EXTENSION_ALTERNATION = 'tsx|ts|yaml|yml|md|sh'
// The trailing negative lookahead keeps `.tsconfig` (or any other longer
// word starting with a real extension) from reporting a truncated token.
const FILE_TOKEN_SOURCE = `[A-Za-z0-9_.*/-]*\\.(?:${EXTENSION_ALTERNATION})(?![A-Za-z0-9_])`

function isDiscardedToken(token: string): boolean {
  // Dropped per the design's measured extraction sweep: a token containing
  // `*` is a glob fragment (`test.ts`, `e2e.spec.ts` matched as literal `*`
  // wildcards elsewhere), and a token whose *basename* starts with `.` is
  // dotted-relative noise with no filename of its own (a bare `.ts` matched
  // with a zero-length prefix). Checking the basename rather than the raw
  // token is the fix for Gaps 2 and 3: a genuinely relative citation like
  // `./cache.rationale.md` or `../scrollbars.rationale.md` now resolves by
  // its basename instead of being discarded outright, and a dot *directory*
  // segment (`.vale/`, `.claude/`) no longer hides everything beneath it --
  // only a token whose own filename half starts with `.` is still noise.
  // reference-check: allow test.ts -- illustrative glob-fragment example, not a real file
  // reference-check: allow e2e.spec.ts -- illustrative glob-fragment example, not a real file
  return token.includes('*') || basenameOf(token).startsWith('.')
}

/**
 * Every `<name>.ts`/`.tsx`/`.yml`/`.yaml`/`.sh`-shaped token on `line`, minus
 * glob fragments (any token containing `*`) and dotted-relative noise (any
 * token whose basename starts with `.`).
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
// requires exactly that character class.
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

/** Every banned `<file>:NN`-shaped reference on `line`. */
export function extractLineReferences(line: string): string[] {
  const matches = line.match(LINE_REFERENCE_PATTERN) ?? []
  return matches.filter((token) => !isDiscardedToken(token))
}
