// Layer 1 of definition-of-ready.md: deterministic facts, never a judgment.
// A bare board slug resolves by exact basename -- name is identity, so the
// lookup is not a guess. Every decision the board-shape hook makes lives
// here; run.ts owns only stdin, argv, fs and channel discipline.
import { basename, dirname } from 'node:path'
import { type HookOutcome } from '../post-tool-use.ts'
import { isAssessmentRecordPath } from './assessment-record.ts'
import { type LaneDeclarations, type LaneShape } from './lane-declarations.ts'

/**
 * A candidate's staleness input: how the sibling assessment record's stored
 * blob compares to the candidate's current bytes. `absent` covers both no
 * sibling path and no file at that path; `unreadable` covers a record that
 * exists but whose `idea-blob` field cannot be read. Required on
 * `checkShape` rather than optional, so a caller can never omit "no record"
 * as an oversight -- it has to be written as a value.
 */
export type RecordLookup =
  { kind: 'absent' } | { kind: 'present'; storedBlob: string; currentBlob: string } | { kind: 'unreadable' }

/** Board-scope gate, run in `run.ts` before a target's content is read in either mode: is `path` under `backlog/`, absolute or relative. */
export function isBoardPath(path: string): boolean {
  return path.includes('/backlog/') || path.startsWith('backlog/')
}

/**
 * Bare-slug resolution: ideas checked first, ready second, last hit wins. A
 * ready item is a folder, so its file is `<lane>/<slug>/proposal.md` rather
 * than `<slug>.md`. Returns `target` unchanged when it already exists, or
 * when no candidate does either.
 */
export function resolveTarget(target: string, exists: (path: string) => boolean): string {
  if (exists(target)) return target
  const slug = target.replace(/\.md$/, '')
  let resolved = target
  for (const candidate of [`backlog/ideas/${slug}.md`, `backlog/ready/${slug}/proposal.md`]) {
    if (exists(candidate)) resolved = candidate
  }
  return resolved
}

export function emptyPathOutcome(): HookOutcome {
  return { lines: ['LAYER1 (no path): 0 checks, 1 findings -- extraction returned empty'], deliver: true }
}

export function missingOutcome(target: string): HookOutcome {
  const label = target === '' ? '(no path)' : target
  return { lines: [`LAYER1 ${label}: 0 checks, 1 findings -- path missing or unreadable`], deliver: true }
}

// Argv mode's counterpart to the hook path's isBoardPath gate in run.ts --
// see checkTarget. A refusal to assess, worded distinctly from
// notACandidateOutcome so the two causes (off the board vs. on-board but not
// a candidate) stay tellable apart in the log stream.
export function offBoardOutcome(target: string): HookOutcome {
  return {
    lines: [`LAYER1 ${target}: off the board, 0 checks -- only a backlog/ target can be assessed`],
    deliver: false,
  }
}

// run.ts's counterpart of missingOutcome for a config read that failed --
// checkShape cannot classify any target without the declaration map, so this
// is the one outcome run.ts builds itself rather than delegating to
// checkShape. deliver is true, same as missingOutcome: this is the loudest
// channel short of a nonzero exit, since the board has no gate. `target` is
// whatever run.ts received before it ever resolved or read anything, since
// the config read happens ahead of resolution.
export function laneDeclarationsUnavailableOutcome(target: string, reason: string): HookOutcome {
  const label = target === '' ? '(no path)' : target
  return {
    lines: [`LAYER1 ${label}: 0 checks, 1 findings -- lane declarations unavailable (${reason})`],
    deliver: true,
  }
}

// The frontmatter window is sed -n '2,/^---$/p' exactly: line 2 through the
// first bare --- at or after it, inclusive; to EOF when no closer exists.
function frontmatterWindow(lines: string[]): string[] {
  // Equivalent mutant: seeding this array (Stryker's ArrayDeclaration) changes nothing --
  // fm's only consumer checks membership against `name:`/`title:`/`created:`/`status:` line
  // shapes the seeded string matches none of, and never reads length or order. Demonstrated
  // 2026-09-18 (1114 tests), re-demonstrated 2026-09-21 under the RecordLookup parameter
  // (1176 tests) and again under the declaration-driven classifyShape split (1222 tests):
  // mutant hand-applied, `npm run test:scripts` fully green every time.
  const fm: string[] = []
  for (let i = 1; i < lines.length; i++) {
    fm.push(lines[i])
    if (lines[i] === '---') break
  }
  return fm
}

function identityFindings(fm: string[], base: string): string[] {
  const findings: string[] = []
  if (!fm.includes(`name: ${base}`)) findings.push(`name: does not match basename '${base}'`)
  if (!fm.some((l) => /^title: ./.test(l))) findings.push('title: missing or empty')
  if (!fm.some((l) => /^created: [0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(l))) {
    findings.push('created: not a YYYY-MM-DD date')
  }
  if (fm.some((l) => l.startsWith('status:'))) findings.push('status: present -- the directory is the status')
  return findings
}

function sectionFindings(lines: string[]): { era: 'scqa' | 'legacy'; findings: string[] } {
  const era = lines.includes('## Situation') ? 'scqa' : 'legacy'
  const first = era === 'scqa' ? '## Question' : '## Touches'
  const findings: string[] = []
  for (const heading of [first, '## Open questions']) {
    if (!lines.includes(heading)) findings.push(`section missing: ${heading}`)
  }
  return { era, findings }
}

// The board-relative path segments. `/backlog/` marks an absolute path and a
// leading `backlog/` a relative one. A target under neither marker keeps all
// of its segments, which is why checkShape alone has no board gate of its
// own -- called directly with an off-board target, it classifies by that
// segment count like any other. Both shells guard against that in run.ts
// before checkShape is ever reached: the hook mode gates on
// isBoardPath before it resolves or reads anything, and the argv mode gates
// on isBoardPath after resolving, immediately before this function would
// otherwise run.
function segmentsAfterRoot(target: string): string[] {
  const afterRoot = target.includes('/backlog/') ? target.split('/backlog/')[1] : target.replace(/^backlog\//, '')
  return afterRoot.split('/')
}

// The lane is the first board-relative segment. Only a candidate reaches
// here, and every candidate has at least two segments, so there is no
// shorter form to fall back to.
function laneFor(target: string): string {
  return segmentsAfterRoot(target)[0]
}

// Declaration-driven classification. A lane's declared shape decides which
// segment count carries the candidate form: `flat` wants exactly `<lane>/
// <name>.md`, `folder` wants exactly `<lane>/<item>/<lane.item>`. Every
// other .md under an item folder is a per-item artifact -- a spec, a design,
// an amendment, a task list, a spike's findings -- and owes the candidate
// form nothing, regardless of which shape the lane declares. The test is
// positional within a lane's own declared shape, so a new artifact kind
// still needs no entry here and a numbered amendment still needs no
// pattern -- only the lane name itself is looked up, by name, against
// `lanes`. An undeclared first segment and a segment count the lane's own
// shape does not expect each draw their own outcome rather than folding
// into "not a candidate", so the three refusal/warning causes stay tellable
// apart in the log stream. `classifyShape` carries the resolved `LaneShape`
// on its `candidate` branch, so a caller never has to look the lane back up.
type Classification =
  | { kind: 'candidate'; shape: LaneShape }
  | { kind: 'undeclared-lane' }
  | { kind: 'shape-mismatch' }
  | { kind: 'not-a-candidate' }

// Split out of classifyShape to hold each lane shape's own CRAP score under
// threshold -- the two branches share no decision points, so nothing but the
// call site was lost by separating them.
//
// Equivalent mutant on both `kind: 'candidate'` literals below (Stryker's
// StringLiteral, e.g. 'candidate' -> ''): checkShape's own dispatch only
// ever tests `classification.kind` against 'undeclared-lane', 'shape-mismatch'
// and 'not-a-candidate'; anything that matches none of those three falls
// through to candidateOutcome regardless of its actual string value. So
// 'candidate' is a human-readable tag, never a compared-against literal.
// Demonstrated 2026-09-21: both literals mutated in turn, `npm run
// test:scripts` fully green each time (1222 tests).
function classifyFlatLane(segments: string[], lane: Extract<LaneShape, { shape: 'flat' }>): Classification {
  return segments.length === 2 ? { kind: 'candidate', shape: lane } : { kind: 'shape-mismatch' }
}

function classifyFolderLane(segments: string[], lane: Extract<LaneShape, { shape: 'folder' }>): Classification {
  if (segments.length === 2) return { kind: 'shape-mismatch' }
  if (segments.length === 3) {
    return segments[2] === lane.item ? { kind: 'candidate', shape: lane } : { kind: 'not-a-candidate' }
  }
  return { kind: 'not-a-candidate' }
}

function classifyShape(target: string, lanes: LaneDeclarations): Classification {
  const segments = segmentsAfterRoot(target)
  if (segments.length < 2) return { kind: 'not-a-candidate' }
  const lane = lanes.get(segments[0])
  if (lane === undefined) return { kind: 'undeclared-lane' }
  return lane.shape === 'flat' ? classifyFlatLane(segments, lane) : classifyFolderLane(segments, lane)
}

// deliver is false, so no envelope reaches the acting agent and writing a
// spec, a design or an amendment stays silent. The line still reaches the log
// stream, worded as a refusal to assess rather than as a pass.
function notACandidateOutcome(target: string): HookOutcome {
  const line = `LAYER1 ${target}: not a candidate, 0 checks -- only an idea file carries the candidate shape`
  return { lines: [line], deliver: false }
}

// deliver is false, matching notACandidateOutcome's silence: an undeclared
// lane is not a malformed candidate, it is a path the config simply has no
// opinion about, so writing under it stays silent while the log stream still
// names the gap. Worded distinctly from notACandidateOutcome and
// shapeMismatchOutcome so the three causes stay tellable apart.
function undeclaredLaneOutcome(target: string): HookOutcome {
  const line = `LAYER1 ${target}: undeclared lane, 0 checks -- board-lanes.config.json names no lane for this path`
  return { lines: [line], deliver: false }
}

// deliver is false, same reasoning as undeclaredLaneOutcome: the lane is
// declared, but this path does not fit the shape declared for it -- a bare
// file where the lane expects an item folder, or an item folder's own file
// nested deeper than the lane declares. Worded distinctly from the other two
// refusal/warning outcomes so all three stay tellable apart.
function shapeMismatchOutcome(target: string): HookOutcome {
  const line = `LAYER1 ${target}: shape mismatch, 0 checks -- path does not match its lane's declared shape`
  return { lines: [line], deliver: false }
}

// The lane-sensitive half of the staleness check, isolated so checkShape
// itself gains only one branch for it. A blob mismatch means opposite things
// per lane: in ideas it is drift since the assessment ran, and a finding; in
// ready/done it is promotion's own history -- the freeze is expected, so it
// is reported but never a finding. `unreadable` is lane-blind, since a record
// this layer cannot read is a finding regardless of where the idea sits.
function assessmentSummary(lane: string, record: RecordLookup): { clause: string; finding: boolean } {
  if (record.kind === 'unreadable') return { clause: 'assessment record unreadable', finding: true }
  if (record.kind === 'absent') return { clause: 'no assessment record', finding: false }
  if (record.storedBlob === record.currentBlob) return { clause: 'assessment current', finding: false }
  return lane === 'ideas'
    ? { clause: 'assessment stale', finding: true }
    : { clause: 'assessment frozen', finding: false }
}

// deliver is false for the same reason notACandidateOutcome's is: an
// assessment record is a known artifact class, not a malformed candidate, so
// writing one stays silent rather than surfacing the shape checks meant for
// the idea file it judges. Worded distinctly from notACandidateOutcome so the
// two refusals -- wrong shape vs. a shape this layer declines to judge at all
// -- stay tellable apart in the log stream.
function assessmentRecordOutcome(target: string): HookOutcome {
  const line = `LAYER1 ${target}: an assessment record, 0 checks -- this layer does not shape-check its own judgments`
  return { lines: [line], deliver: false }
}

// The seven checks proper, run only once classifyShape has confirmed
// `target` is a candidate -- split out of checkShape to hold each function's
// own CRAP score under threshold. `shape` is the classification's own
// resolved LaneShape, so this never re-derives or re-looks-up the lane.
function candidateOutcome(target: string, text: string, record: RecordLookup, shape: LaneShape): HookOutcome {
  const textLines = text.split('\n')
  // In a folder lane the file is always the lane's declared item, so the
  // identity the name: field must match is the folder's basename, not the
  // file's -- generalized from the folder shape itself rather than a
  // hardcoded 'proposal' stem, so a lane declaring a different item name
  // classifies identically.
  const stem = basename(target, '.md')
  const base = shape.shape === 'folder' ? basename(dirname(target)) : stem
  const fm = frontmatterWindow(textLines)
  const identity = identityFindings(fm, base)
  const { era, findings: sections } = sectionFindings(textLines)
  const lane = laneFor(target)
  const { clause, finding: staleness } = assessmentSummary(lane, record)
  const findings = identity.length + sections.length + (staleness ? 1 : 0)
  // wc -l counts newline bytes; grep -ci counts matching lines, case-insensitively.
  const newlines = (text.match(/\n/g) ?? []).length
  const depends = textLines.filter((l) => l.toLowerCase().includes('depends on')).length
  return {
    lines: [
      ...identity,
      ...sections,
      `lane ${lane}, ${era} shape, ${newlines} lines, ${depends} depends-on mention(s)`,
      clause,
      `LAYER1 ${target}: 7 checks, ${findings} findings`,
    ],
    deliver: findings > 0,
  }
}

/**
 * The seven readiness checks over an already-resolved target's text: name
 * matches basename, title present, created is a date, no status field, the
 * era-appropriate section headings, and the sibling record's staleness
 * against `record`. `lanes` is the validated declaration map -- this
 * function cannot classify a target at all without it, so a caller with no
 * declarations resolves that first (see `laneDeclarationsUnavailableOutcome`
 * in `run.ts`). Refuses an assessment record's own path before classifying,
 * since a record's shape carries the same segment count as the idea file it
 * judges; an undeclared lane or a lane/segment-count mismatch each draw
 * their own warning rather than running the checks. Always reports the lane
 * summary, the assessment clause, and the LAYER1 tally; `deliver` is true
 * only when a check failed.
 */
export function checkShape(target: string, text: string, record: RecordLookup, lanes: LaneDeclarations): HookOutcome {
  if (isAssessmentRecordPath(target)) return assessmentRecordOutcome(target)
  const classification = classifyShape(target, lanes)
  if (classification.kind === 'undeclared-lane') return undeclaredLaneOutcome(target)
  if (classification.kind === 'shape-mismatch') return shapeMismatchOutcome(target)
  if (classification.kind === 'not-a-candidate') return notACandidateOutcome(target)
  return candidateOutcome(target, text, record, classification.shape)
}
