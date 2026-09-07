// Which lines of one file are candidates for reference extraction at all.
//
// For a source file (surface 'source') that's comment lines only -- trimmed
// start is `//`, `*`, `/*` or `#` -- since a source file's non-comment text
// is code, not a claim about another file. For a doc file (surface 'doc')
// every line is scannable, since a Markdown file's prose is the thing being
// checked.
//
// Two mandatory preprocessing steps apply to every scannable line, in this
// order: strip URLs, then drop allow-marker lines. URLs first, because
// `src/cache.ts` cites an immer permalink containing `mapset.ts`, and that
// substring must never reach the tokenizer as a claim about a file in this
// repo. Allow-marker lines are dropped entirely (not merely exempted) from
// the *live-reference* scan, so the marker comment a fix adds does not
// itself read as a fresh, unresolved reference to the very token it is
// excusing -- checks.ts reads the raw, unfiltered text separately wherever
// it needs to see the markers themselves (extractAllowMarkers, and
// stale-allow-marker's own "does this token still appear anywhere live"
// scan, which deliberately starts from this filtered set).

import { isAllowMarkerLine, isCommentLine } from './allow-markers.ts'

export interface ScannableLine {
  lineNumber: number
  text: string
}

const URL_PATTERN = /https?:\/\/\S+/g

/**
 * The scannable lines of `text`, 1-indexed, URL-stripped, with allow-marker
 * lines removed: every line for `surface: 'doc'`, comment lines only for
 * `surface: 'source'`.
 */
export function scannableLinesOf(text: string, surface: 'source' | 'doc'): ScannableLine[] {
  const lines = text.split('\n')
  const result: ScannableLine[] = []
  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index]
    if (surface === 'source' && !isCommentLine(raw)) continue
    if (isAllowMarkerLine(raw)) continue
    result.push({ lineNumber: index + 1, text: raw.replace(URL_PATTERN, ' ') })
  }
  return result
}
