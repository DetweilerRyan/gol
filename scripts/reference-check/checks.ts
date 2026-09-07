// The checks described in the ratified design for `comment-reference-checks`:
// a comment or doc line names another file (or a symbol inside one), that
// target is deleted or renamed, and nothing notices. Mirrors
// agent-doc-check's/ast-grep-rule-check's checks.ts shape -- every check
// here is a binary fact, so this program (once wired into a gate, which
// this step deliberately does not do) would exit non-zero on any failure.
//
// Parsing/extraction lives in its own file per concern (scannable-lines.ts,
// references.ts, allow-markers.ts); this file is the checks themselves plus
// checkAll, which runs them all.
//
// Resolving a token against git *history* rather than the live tree was
// considered and rejected. It would spare the `cellLattice.ts` family of
// dead references automatically (they were deleted, and git remembers
// that), but it would just as happily spare a genuinely stale present-tense
// claim about a file that was deleted yesterday for the wrong reason --
// which is the exact defect this checker exists to catch. Checking history
// converts this into typo detection: "was this ever a real name," not "is
// it one now."

import { extractAllowMarkers, type AllowMarker } from './allow-markers.ts'
import { basenameOf, extractFileTokens, extractLineReferences, extractSymbolCitations } from './references.ts'
import { scannableLinesOf } from './scannable-lines.ts'

/**
 * The resolution universe this checker verifies references against:
 * `git ls-files --cached --others --exclude-standard` (tracked files *plus*
 * untracked-but-not-gitignored ones -- a just-created module resolves, and
 * a gitignored tree like `dist/` or `coverage/` is excluded for free).
 * Every lookup here is by *basename*, never full path -- see references.ts
 * for why a false negative on a same-named file elsewhere is the safe
 * direction to fail in.
 */
export interface FileIndex {
  /** True when some path in the resolution universe has this basename. */
  hasBasename(basename: string): boolean
  /** True when some path with this basename contains `symbol` as a whole word. */
  containsSymbol(basename: string, symbol: string): boolean
  /** How many paths were indexed. Zero means the universe failed to load. */
  readonly size: number
}

export interface ScannedFile {
  path: string
  surface: 'source' | 'doc'
  text: string
}

export interface CheckInput {
  files: ScannedFile[]
}

export interface Failure {
  check: string
  file: string
  message: string
}

/**
 * The tokens a same-file allow-marker excuses, by basename -- a marker
 * excuses a token only when it carries a non-null reason (see
 * allow-markers.ts), matching ast-grep-rule-check's
 * `extractUnresolvedFilesMarker` precedent exactly: a reasonless marker
 * never suppresses anything.
 */
function excusedBasenames(markers: AllowMarker[]): Set<string> {
  return new Set(markers.filter((marker) => marker.reason !== null).map((marker) => basenameOf(marker.token)))
}

/**
 * Check `file-reference-resolves`: every filename token on a scannable line
 * resolves against the FileIndex, unless excused by a same-file allow
 * marker.
 */
export function checkFileReferenceResolves(files: ScannedFile[], index: FileIndex): Failure[] {
  const failures: Failure[] = []
  for (const file of files) {
    const excused = excusedBasenames(extractAllowMarkers(file.text, file.surface))
    for (const line of scannableLinesOf(file.text, file.surface)) {
      for (const token of extractFileTokens(line.text)) {
        const basename = basenameOf(token)
        if (excused.has(basename) || index.hasBasename(basename)) continue
        failures.push({
          check: 'file-reference-resolves',
          file: file.path,
          message: `line ${line.lineNumber} references \`${token}\`, which does not resolve to any file in the repo`,
        })
      }
    }
  }
  return failures
}

/**
 * Check `cited-symbol-exists`: every `<file>'s <symbol>` citation names a
 * symbol that actually appears in the cited file, unless excused by a
 * same-file allow marker naming that file.
 */
export function checkCitedSymbolExists(files: ScannedFile[], index: FileIndex): Failure[] {
  const failures: Failure[] = []
  for (const file of files) {
    const excused = excusedBasenames(extractAllowMarkers(file.text, file.surface))
    for (const line of scannableLinesOf(file.text, file.surface)) {
      for (const citation of extractSymbolCitations(line.text, line.lineNumber)) {
        const basename = basenameOf(citation.file)
        if (excused.has(basename)) continue
        if (!index.hasBasename(basename)) continue // file-reference-resolves already reports this basename
        if (index.containsSymbol(basename, citation.symbol)) continue
        failures.push({
          check: 'cited-symbol-exists',
          file: file.path,
          message: `line ${citation.line} cites \`${citation.file}\`'s \`${citation.symbol}\`, which does not appear in ${basename}`,
        })
      }
    }
  }
  return failures
}

/**
 * Check `no-file-line-references`: a `foo.ts:NN` line reference is banned
 * outright in source comments, whether or not it currently resolves --
 * `<file>'s <symbol>` is the form that survives a line being added above
 * it, this doesn't. Source only, per the ratified design; docs are exempt
 * because `no-file-line-references` never scanned prose in the first place.
 */
export function checkNoFileLineReferences(files: ScannedFile[]): Failure[] {
  const failures: Failure[] = []
  for (const file of files) {
    if (file.surface !== 'source') continue
    const excused = excusedBasenames(extractAllowMarkers(file.text, file.surface))
    for (const line of scannableLinesOf(file.text, file.surface)) {
      for (const reference of extractLineReferences(line.text)) {
        const [fileToken] = reference.split(':')
        if (excused.has(basenameOf(fileToken))) continue
        failures.push({
          check: 'no-file-line-references',
          file: file.path,
          message: `line ${line.lineNumber} references \`${reference}\` -- cite \`<file>'s <symbol>\` instead, which survives a line being added above it`,
        })
      }
    }
  }
  return failures
}

/**
 * One marker's contribution to `stale-allow-marker`: stale when its reason
 * is missing (never a functioning opt-out, per excusedBasenames above), when
 * its token now resolves, or when its token appears on no non-marker
 * scannable line in the file -- i.e. nothing in the file needs excusing
 * anymore.
 */
function staleReasonFor(marker: AllowMarker, liveBasenames: ReadonlySet<string>, index: FileIndex): string | null {
  if (marker.reason === null) return 'the marker has no reason, so it never excuses anything'
  const basename = basenameOf(marker.token)
  if (index.hasBasename(basename)) return `\`${basename}\` now resolves`
  if (!liveBasenames.has(basename)) return `\`${basename}\` appears on no other scannable line in this file`
  return null
}

/**
 * Check `stale-allow-marker`: an allow marker that no longer excuses
 * anything, either because its token now resolves or because the token it
 * names no longer appears anywhere else in the file.
 */
export function checkStaleAllowMarker(files: ScannedFile[], index: FileIndex): Failure[] {
  const failures: Failure[] = []
  for (const file of files) {
    const markers = extractAllowMarkers(file.text, file.surface)
    if (markers.length === 0) continue
    const liveLines = scannableLinesOf(file.text, file.surface)
    const liveBasenames = new Set(liveLines.flatMap((line) => extractFileTokens(line.text).map(basenameOf)))
    for (const marker of markers) {
      const reason = staleReasonFor(marker, liveBasenames, index)
      if (reason === null) continue
      failures.push({
        check: 'stale-allow-marker',
        file: file.path,
        message: `line ${marker.line} allow marker for \`${marker.token}\` is stale: ${reason}`,
      })
    }
  }
  return failures
}

/**
 * Guard 1 of `reference-check-inert`: zero files scanned is a failure, not
 * a clean run -- catches a broken scope predicate, a failed `git ls-files`,
 * or an empty universe. Direct analogue of ast-grep-rule-check's
 * checkAnyRulesFound.
 */
export function checkAnyFilesScanned(files: ScannedFile[]): Failure[] {
  if (files.length > 0) return []
  return [
    {
      check: 'reference-check-inert',
      file: '(none)',
      message: 'no files were scanned -- check scan-scope.ts and the resolution universe run.ts built it from',
    },
  ]
}

/**
 * Guard 2 of `reference-check-inert`: zero candidate file tokens across the
 * whole scan is a failure. The tree carries well over a thousand live
 * references today, so zero means the comment-line predicate or the token
 * regex broke. Direct analogue of agent-doc-check's
 * checkCycleStringConsistent's zero-mention branch.
 */
export function checkAnyReferencesFound(files: ScannedFile[]): Failure[] {
  const anyToken = files.some((file) =>
    scannableLinesOf(file.text, file.surface).some((line) => extractFileTokens(line.text).length > 0),
  )
  if (anyToken) return []
  return [
    {
      check: 'reference-check-inert',
      file: '(none)',
      message:
        'no candidate file-reference tokens were found anywhere -- check the comment-line predicate or the token regex',
    },
  ]
}

export function checkAll(input: CheckInput, index: FileIndex): Failure[] {
  return [
    ...checkAnyFilesScanned(input.files),
    ...checkAnyReferencesFound(input.files),
    ...checkFileReferenceResolves(input.files, index),
    ...checkCitedSymbolExists(input.files, index),
    ...checkNoFileLineReferences(input.files),
    ...checkStaleAllowMarker(input.files, index),
  ]
}
