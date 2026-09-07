// Grammar for the opt-out marker this program recognises: the keyword
// `reference-check:` then `allow <token> -- <reason>`. Written throughout
// this file as two adjacent code spans rather than one contiguous span --
// this file is itself inside this program's own source scan scope, and the
// two keywords written contiguously (with nothing but whitespace between
// them) in a comment would read as a live, tokenless marker and report
// itself as stale (see isAllowMarkerLine below). The regex is anchored to
// the keyword itself,
// not to a particular comment-leader character, which is what lets one
// grammar work inside `//`, `#`, `*` (a JSDoc/block-comment continuation
// line) and HTML `<!-- -->` alike -- see CLAUDE.md's ratified design for
// `comment-reference-checks`.
//
// Mirrors ast-grep-rule-check's `allow-unresolved-files` marker
// (rule-file.ts's extractUnresolvedFilesMarker), narrowed to be
// token-scoped rather than file-scoped: a marker there suppresses a whole
// rule file's `files:` check, but this program scans on the order of 360
// files, so one marker excusing every token in the file it happens to sit
// in would be far too blunt. Here a marker naming token T excuses every
// site of T in the *same file*, and nothing else -- see checks.ts.

export interface AllowMarker {
  token: string
  /**
   * `null` when the marker carries no reason at all. Exactly as
   * ast-grep-rule-check's `extractUnresolvedFilesMarker` treats a reasonless
   * marker, a `null` reason does not count as an opt-out -- see checks.ts.
   */
  reason: string | null
  line: number
}

// `(\S+)` for the token (no internal whitespace); `(.*)`for the reason,
// which may itself legitimately contain ` -- ` (e.g. "hypothetical --mutate
// argument, not a real path"), so it is captured greedily to end of line
// rather than stopping at the first `--`.
const ALLOW_MARKER = /reference-check:\s*allow\s+(\S+)(?:\s+--\s+(.*))?/

// A marker written inside `/* ... */` or `<!-- ... -->` may have the
// comment's own closing delimiter trailing the reason on the same line;
// strip it so the stored reason doesn't carry punctuation that is really
// the comment's, not the author's.
function stripTrailingCommentCloser(reason: string): string {
  return reason
    .replace(/-->\s*$/, '')
    .replace(/\*\/\s*$/, '')
    .trim()
}

/**
 * True when `line`'s trimmed start is `//`, `*`, `/*` or `#` -- exported
 * for scannable-lines.ts to share, so the two modules agree on exactly one
 * definition of "this line is a comment" rather than drifting apart. Lives
 * here rather than there because extractAllowMarkers below needs it too,
 * and scannable-lines.ts already depends on this module (for
 * isAllowMarkerLine) -- putting it there instead would make the two
 * modules import each other.
 */
export function isCommentLine(line: string): boolean {
  const trimmed = line.trimStart()
  return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*') || trimmed.startsWith('#')
}

/** True when `line` carries a `reference-check:` then `allow` marker, in any of the four comment forms. */
export function isAllowMarkerLine(line: string): boolean {
  return ALLOW_MARKER.test(line)
}

/**
 * Every `reference-check:` then `allow <token> -- <reason>` marker found in
 * `text`, one per matching line, in line order. For `surface: 'source'`,
 * only a comment line (per isCommentLine) can carry a marker -- without
 * this restriction, a `.test.ts` file whose test *data* happens to be a
 * string literal shaped like a marker (this program's own fixtures are
 * exactly that) would be read as a real opt-out. `surface: 'doc'` scans
 * every line, matching scannableLinesOf's own rule for prose.
 */
export function extractAllowMarkers(text: string, surface: 'source' | 'doc'): AllowMarker[] {
  const markers: AllowMarker[] = []
  const lines = text.split('\n')
  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index]
    if (surface === 'source' && !isCommentLine(raw)) continue
    const match = raw.match(ALLOW_MARKER)
    if (!match) continue
    const rawReason = match[2] ? stripTrailingCommentCloser(match[2]) : ''
    markers.push({
      token: match[1],
      reason: rawReason.length > 0 ? rawReason : null,
      line: index + 1,
    })
  }
  return markers
}
