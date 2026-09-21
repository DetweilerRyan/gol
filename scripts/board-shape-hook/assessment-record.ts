// Path-string and text-only rules for an assessment record: which paths are
// its own, where a candidate idea or proposal file's record would sit, and
// how to read and compute the blob id that pins a record against staleness.
// No filesystem or subprocess IO -- a caller supplies text and bytes it
// already has. Lands as a standalone module with no consumer wired yet.
import { createHash } from 'node:crypto'

// Matches board-shape.ts's isBoardPath convention: an absolute path carries
// /backlog/ somewhere in it, a relative one starts with backlog/. The
// capturing group in the two path regexes below exists so a sibling lookup
// can reuse whatever prefix preceded backlog/ rather than assuming the
// board sits at the repo root.
const ASSESSMENT_RECORD_PATH =
  /^(?:.*\/)?backlog\/(?:ideas\/[^/]+\.assessment\.md|(?:ready|done)\/[^/]+\/assessment\.md)$/
const IDEA_PATH = /^((?:.*\/)?backlog\/)ideas\/([^/]+)\.md$/
const PROPOSAL_PATH = /^((?:.*\/)?backlog\/)(ready|done)\/([^/]+)\/proposal\.md$/
// [ \t] rather than \s: \s matches a newline, which would let a blank
// idea-blob: line's value bleed in from the line below it.
const IDEA_BLOB_LINE = /^idea-blob:[ \t]*(\S+)[ \t]*$/m

/**
 * True when `path` is an assessment record's own path -- the ideas-lane
 * sidecar `backlog/ideas/<name>.assessment.md`, or the promoted form
 * `backlog/{ready,done}/<name>/<record>.md`, where `<record>` is literally
 * `assessment`. Judges the path shape only; there is no filesystem check.
 */
export function isAssessmentRecordPath(path: string): boolean {
  return ASSESSMENT_RECORD_PATH.test(path)
}

/**
 * The record path a candidate idea or proposal file at `target` would use,
 * or `undefined` when `target` is itself a record path, is not a candidate
 * shape, or is off the board entirely. Total over every input, so a caller
 * never has to test candidacy first.
 */
export function siblingRecordPathFor(target: string): string | undefined {
  if (isAssessmentRecordPath(target)) return undefined
  const idea = IDEA_PATH.exec(target)
  if (idea) return `${idea[1]}ideas/${idea[2]}.assessment.md`
  const proposal = PROPOSAL_PATH.exec(target)
  if (proposal) return `${proposal[1]}${proposal[2]}/${proposal[3]}/assessment.md`
  return undefined
}

/**
 * The `idea-blob` value out of a record's frontmatter text, or `undefined`
 * when the field is missing, its value is empty, or the text carries no
 * such line at all. Reads text only; the caller supplies the record's own
 * text already decoded.
 */
export function storedBlobOf(recordText: string): string | undefined {
  return IDEA_BLOB_LINE.exec(recordText)?.[1]
}

/**
 * The git blob object id for `bytes`, computed directly as
 * `sha1("blob " + <byte length> + "\0" + bytes)` rather than via a
 * subprocess. Pass the exact encoded bytes -- from something like
 * `TextEncoder`, not a string's own `.length` -- since the header uses the
 * byte length, and a multi-byte character makes the two diverge.
 */
export function blobIdOf(bytes: Uint8Array): string {
  const hash = createHash('sha1')
  hash.update(`blob ${bytes.byteLength}\0`)
  hash.update(bytes)
  return hash.digest('hex')
}
