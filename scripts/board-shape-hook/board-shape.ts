// Layer 1 of definition-of-ready.md: deterministic facts, never a judgment.
// A bare board slug resolves by exact basename -- name is identity, so the
// lookup is not a guess. Every decision the board-shape hook makes lives
// here; run.ts owns only stdin, argv, fs and channel discipline.
import { basename, dirname } from 'node:path'
import { type HookOutcome } from '../post-tool-use.ts'
import { isAssessmentRecordPath } from './assessment-record.ts'

/**
 * A candidate's staleness input, computed by `run.ts` against the sibling
 * record `assessment-record.ts`'s `siblingRecordPathFor` names. `absent`
 * covers both no sibling path and no file at that path; `unreadable` covers
 * a record that exists but whose `idea-blob` field cannot be read. Required
 * on `checkShape` rather than optional, so a caller can never omit "no
 * record" as an oversight -- it has to be written as a value.
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

// The frontmatter window is sed -n '2,/^---$/p' exactly: line 2 through the
// first bare --- at or after it, inclusive; to EOF when no closer exists.
function frontmatterWindow(lines: string[]): string[] {
  // Equivalent mutant: seeding this array (Stryker's ArrayDeclaration) changes nothing --
  // fm's only consumer checks membership against `name:`/`title:`/`created:`/`status:` line
  // shapes the seeded string matches none of, and never reads length or order. Demonstrated
  // 2026-09-18: mutant hand-applied, all 1114 of `npm run test:scripts` green.
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

// Two board shapes carry the candidate form and everything else does not.
// `<lane>/<name>.md` is a flat idea file, and `<lane>/<item>/proposal.md` is
// the same idea promoted into its own folder. Every other .md under an item
// folder is a per-item artifact -- a spec, a design, an amendment, a task
// list, a spike's findings -- and owes the candidate form nothing. The test is
// positional, so a new artifact kind needs no entry here, a numbered amendment
// needs no pattern, and a new lane directory needs no literal.
function isCandidatePath(target: string): boolean {
  const segments = segmentsAfterRoot(target)
  if (segments.length === 2) return true
  return segments.length === 3 && segments[2] === 'proposal.md'
}

// deliver is false, so no envelope reaches the acting agent and writing a
// spec, a design or an amendment stays silent. The line still reaches the log
// stream, worded as a refusal to assess rather than as a pass.
function notACandidateOutcome(target: string): HookOutcome {
  const line = `LAYER1 ${target}: not a candidate, 0 checks -- only an idea file carries the candidate shape`
  return { lines: [line], deliver: false }
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

/**
 * The six readiness checks over an already-resolved target's text: name
 * matches basename, title present, created is a date, no status field, and
 * the era-appropriate section headings. Refuses an assessment record's own
 * path before testing candidacy, since a record's shape carries the same
 * segment count as the idea file it judges. Always reports the lane summary
 * and the LAYER1 tally, and `deliver` is true only when a check failed.
 */
export function checkShape(target: string, text: string, _record: RecordLookup): HookOutcome {
  if (isAssessmentRecordPath(target)) return assessmentRecordOutcome(target)
  if (!isCandidatePath(target)) return notACandidateOutcome(target)
  const textLines = text.split('\n')
  // In the folder lanes the file is always proposal.md, so the identity the
  // name: field must match is the folder's basename, not the file's.
  const stem = basename(target, '.md')
  const base = stem === 'proposal' ? basename(dirname(target)) : stem
  const fm = frontmatterWindow(textLines)
  const identity = identityFindings(fm, base)
  const { era, findings: sections } = sectionFindings(textLines)
  const findings = identity.length + sections.length
  // wc -l counts newline bytes; grep -ci counts matching lines, case-insensitively.
  const newlines = (text.match(/\n/g) ?? []).length
  const depends = textLines.filter((l) => l.toLowerCase().includes('depends on')).length
  const lane = laneFor(target)
  return {
    lines: [
      ...identity,
      ...sections,
      `lane ${lane}, ${era} shape, ${newlines} lines, ${depends} depends-on mention(s)`,
      `LAYER1 ${target}: 6 checks, ${findings} findings`,
    ],
    deliver: findings > 0,
  }
}
