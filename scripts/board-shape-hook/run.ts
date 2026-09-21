// I/O shell for the board-shape hook (idea-assess's Layer 1): stdin, argv,
// fs reads, channel writes, exit. board-shape.ts owns every decision.
// Always exits 0 -- the board has no gate.
//
// Argv mode is idea-assess's Layer 1 injection (SKILL.md calls it "Layer
// 1", hence the LAYER1 line prefix); --hook mode fires from
// .claude/settings.json on every backlog/** Write or Edit, reading the
// PostToolUse JSON payload on stdin. Everything goes to stderr in hook
// mode, as the shell's `exec 1>&2` did; argv mode writes to stdout and
// never delivers an envelope.
//
// Runner: bare node, no shebang -- the hook command in .claude/settings.json
// and the SKILL.md injection line both name `node` directly. Requires a
// node whose flag-free .ts run writes zero stderr bytes (type stripping,
// documented from v23.6; measured clean on v24.19.0). Erasable syntax only
// -- no enum, no namespace, no parameter properties.
import { existsSync, readFileSync } from 'node:fs'
import { envelope, extractFilePath, type HookOutcome } from '../post-tool-use.ts'
import { blobIdOf, siblingRecordPathFor, storedBlobOf } from './assessment-record.ts'
import {
  checkShape,
  emptyPathOutcome,
  isBoardPath,
  laneDeclarationsUnavailableOutcome,
  missingOutcome,
  offBoardOutcome,
  resolveTarget,
  type RecordLookup,
} from './board-shape.ts'
import { parseLaneDeclarations } from './lane-declarations.ts'

// The sibling record's staleness input for a resolved, on-board target.
// `absent` covers both "no sibling shape at all" (a record's own path, or a
// non-candidate artifact -- checkShape refuses those before this value is
// ever read) and "sibling path computed but no file sits there yet".
// `unreadable` covers a record file that exists but whose idea-blob field
// cannot be recovered, whether because the read itself throws or because
// storedBlobOf finds no such field.
function recordLookupFor(target: string, ideaBytes: Buffer): RecordLookup {
  const recordPath = siblingRecordPathFor(target)
  if (recordPath === undefined || !existsSync(recordPath)) return { kind: 'absent' }
  let recordText: string
  try {
    recordText = readFileSync(recordPath, 'utf8')
  } catch {
    return { kind: 'unreadable' }
  }
  const storedBlob = storedBlobOf(recordText)
  if (storedBlob === undefined) return { kind: 'unreadable' }
  return { kind: 'present', storedBlob, currentBlob: blobIdOf(ideaBytes) }
}

// Reads the lane declarations from the checkout root, CWD-relative -- both
// entry points below already run with cwd at the checkout root, the same
// assumption resolveTarget's own backlog/ candidates rest on. `undefined`
// stands for "missing or unreadable"; parseLaneDeclarations turns that, and
// every other malformed shape, into a single `unavailable` outcome with a
// reason.
function readLaneDeclarationsText(): string | undefined {
  try {
    return readFileSync('board-lanes.config.json', 'utf8')
  } catch {
    return undefined
  }
}

function checkTarget(target: string): HookOutcome {
  const lanes = parseLaneDeclarations(readLaneDeclarationsText())
  if (lanes.kind === 'unavailable') return laneDeclarationsUnavailableOutcome(target, lanes.reason)
  const resolved = resolveTarget(target, existsSync)
  if (resolved === '' || !existsSync(resolved)) return missingOutcome(resolved)
  if (!isBoardPath(resolved)) return offBoardOutcome(resolved)
  const bytes = readFileSync(resolved)
  return checkShape(resolved, bytes.toString('utf8'), recordLookupFor(resolved, bytes), lanes.lanes)
}

function readStdin(): string {
  try {
    return readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

if (process.argv[2] === '--hook') {
  const path = extractFilePath(readStdin())
  let outcome: HookOutcome | undefined
  if (path === '') outcome = emptyPathOutcome()
  else if (isBoardPath(path)) outcome = checkTarget(path)
  if (outcome) {
    for (const line of outcome.lines) process.stderr.write(line + '\n')
    if (outcome.deliver) process.stdout.write(envelope(outcome.lines))
  }
  process.exit(0)
} else {
  const outcome = checkTarget(process.argv[2] ?? '')
  for (const line of outcome.lines) process.stdout.write(line + '\n')
  process.exit(0)
}
