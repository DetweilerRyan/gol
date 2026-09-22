import { describe, expect, it } from 'vitest'
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
import { type LaneDeclarations } from './lane-declarations.ts'

// Absent-record filler for every checkShape call below that is not itself
// exercising the record lookup: it reports the 'no assessment record' clause
// and contributes no finding, so it never perturbs a shape-check assertion
// that predates the record parameter.
const NO_RECORD: RecordLookup = { kind: 'absent' }

// The tracked board-lanes.config.json's three lanes, as a LaneDeclarations
// value -- the same map lane-declarations.test.ts pins the config file
// parses into. Every checkShape call below that is not itself exercising
// declaration-driven classification passes this, so an ideas/ready/done
// target classifies exactly as it did before checkShape took a lanes
// parameter.
const LANES: LaneDeclarations = new Map([
  ['ideas', { shape: 'flat' }],
  ['ready', { shape: 'folder', item: 'proposal.md' }],
  ['done', { shape: 'folder', item: 'proposal.md' }],
])

describe('isBoardPath', () => {
  it.each([
    { name: 'accepts a relative path rooted at backlog/', path: 'backlog/ideas/foo.md', expected: true },
    { name: 'accepts an absolute path containing /backlog/', path: '/repo/backlog/ideas/foo.md', expected: true },
    { name: 'rejects a path outside the board', path: 'src/camera.ts', expected: false },
  ])('$name', ({ path, expected }) => {
    expect(isBoardPath(path)).toBe(expected)
  })
})

describe('resolveTarget', () => {
  // Object-table it.each, the audit.test.ts inScope shape: the individual
  // it() blocks this replaced were structurally identical at dry4ts
  // score 1.00 despite each exercising a different exists() predicate.
  it.each([
    {
      name: 'returns the target unchanged when it already exists',
      target: 'given.md',
      exists: (p: string) => p === 'given.md',
      expected: 'given.md',
    },
    {
      name: 'resolves a bare slug to the ideas/ candidate',
      target: 'my-slug',
      exists: (p: string) => p === 'backlog/ideas/my-slug.md',
      expected: 'backlog/ideas/my-slug.md',
    },
    {
      name: 'resolves a bare slug to the ready/ candidate',
      target: 'my-slug',
      exists: (p: string) => p === 'backlog/ready/my-slug/proposal.md',
      expected: 'backlog/ready/my-slug/proposal.md',
    },
    {
      name: 'picks the ready/ candidate when both exist -- last hit wins',
      target: 'my-slug',
      exists: (p: string) => p === 'backlog/ideas/my-slug.md' || p === 'backlog/ready/my-slug/proposal.md',
      expected: 'backlog/ready/my-slug/proposal.md',
    },
    {
      name: 'returns the target unresolved when no candidate exists either',
      target: 'nope',
      exists: () => false,
      expected: 'nope',
    },
    {
      name: 'does not fall through to slug candidates once the target itself already exists',
      target: 'given.md',
      exists: (p: string) => p === 'given.md' || p === 'backlog/ideas/given.md',
      expected: 'given.md',
    },
    {
      name: 'anchors the .md strip to the end of the slug, not any occurrence',
      target: 'a.md-b.md',
      exists: (p: string) => p === 'backlog/ideas/a.md-b.md',
      expected: 'backlog/ideas/a.md-b.md',
    },
  ])('$name', ({ target, exists, expected }) => {
    expect(resolveTarget(target, exists, LANES)).toBe(expected)
  })

  it('skips a lane absent from the declarations, contributing no candidate', () => {
    const lanes: LaneDeclarations = new Map([['ready', { shape: 'folder', item: 'proposal.md' }]])
    const exists = (p: string) => p === 'backlog/ideas/my-slug.md'
    expect(resolveTarget('my-slug', exists, lanes)).toBe('my-slug')
  })
})

describe('emptyPathOutcome', () => {
  it('reports the extraction-empty finding and always delivers', () => {
    expect(emptyPathOutcome()).toEqual({
      lines: ['LAYER1 (no path): 0 checks, 1 findings -- extraction returned empty'],
      deliver: true,
    })
  })
})

describe('missingOutcome', () => {
  it('labels an empty target as (no path)', () => {
    expect(missingOutcome('')).toEqual({
      lines: ['LAYER1 (no path): 0 checks, 1 findings -- path missing or unreadable'],
      deliver: true,
    })
  })

  it('names a non-empty target directly', () => {
    expect(missingOutcome('backlog/ideas/gone.md')).toEqual({
      lines: ['LAYER1 backlog/ideas/gone.md: 0 checks, 1 findings -- path missing or unreadable'],
      deliver: true,
    })
  })
})

describe('offBoardOutcome', () => {
  it('refuses with a distinct off-board line and never delivers', () => {
    expect(offBoardOutcome('src/camera.ts')).toEqual({
      lines: ['LAYER1 src/camera.ts: off the board, 0 checks -- only a backlog/ target can be assessed'],
      deliver: false,
    })
  })
})

describe('laneDeclarationsUnavailableOutcome', () => {
  it.each([
    {
      name: 'labels an empty target as (no path)',
      target: '',
      reason: 'declaration file missing or unreadable',
      label: '(no path)',
    },
    {
      name: 'names a non-empty target directly',
      target: 'backlog/ideas/clean.md',
      reason: 'declaration file is not valid JSON',
      label: 'backlog/ideas/clean.md',
    },
  ])('$name, and always delivers, carrying the given reason', ({ target, reason, label }) => {
    expect(laneDeclarationsUnavailableOutcome(target, reason)).toEqual({
      lines: [`LAYER1 ${label}: 0 checks, 1 findings -- lane declarations unavailable (${reason})`],
      deliver: true,
    })
  })
})

const CLEAN = [
  '---',
  'name: clean',
  'title: A clean fixture',
  'created: 2026-09-18',
  '---',
  '',
  '## Situation',
  '',
  'Text.',
  '',
  '## Question',
  '',
  'Text.',
  '',
  '## Open questions',
  '',
  'None.',
  '',
].join('\n')

describe('checkShape', () => {
  it('finds nothing wrong with a well-formed scqa-era file and does not deliver', () => {
    const outcome = checkShape('backlog/ideas/clean.md', CLEAN, NO_RECORD, LANES)
    expect(outcome.deliver).toBe(false)
    expect(outcome.lines).toEqual([
      'lane ideas, scqa shape, 17 lines, 0 depends-on mention(s)',
      'no assessment record',
      'LAYER1 backlog/ideas/clean.md: 7 checks, 0 findings',
    ])
  })

  it('reports all six findings for a mismatched, status-bearing, headingless file', () => {
    const text = ['---', 'name: mismatched-name', 'status: ready', '---', '', 'Body with no headings.', ''].join('\n')
    const outcome = checkShape('backlog/ideas/all-six.md', text, NO_RECORD, LANES)
    expect(outcome.deliver).toBe(true)
    expect(outcome.lines).toEqual([
      "name: does not match basename 'all-six'",
      'title: missing or empty',
      'created: not a YYYY-MM-DD date',
      'status: present -- the directory is the status',
      'section missing: ## Touches',
      'section missing: ## Open questions',
      'lane ideas, legacy shape, 6 lines, 0 depends-on mention(s)',
      'no assessment record',
      'LAYER1 backlog/ideas/all-six.md: 7 checks, 6 findings',
    ])
  })

  it('reads the legacy era from a missing ## Situation heading and checks ## Touches instead', () => {
    const text = [
      '---',
      'name: legacy',
      'title: A legacy fixture',
      'created: 2026-09-18',
      '---',
      '',
      '## Touches',
      '',
      'Text.',
      '',
      '## Open questions',
      '',
      'None.',
      '',
    ].join('\n')
    const outcome = checkShape('backlog/ideas/legacy.md', text, NO_RECORD, LANES)
    expect(outcome.deliver).toBe(false)
    expect(outcome.lines[0]).toMatch(/^lane ideas, legacy shape,/)
  })

  it("takes identity from the folder's basename for a ready/ proposal.md, not the file stem", () => {
    const text = CLEAN.replace('name: clean', 'name: my-slug')
    const outcome = checkShape('backlog/ready/my-slug/proposal.md', text, NO_RECORD, LANES)
    expect(outcome.deliver).toBe(false)
    expect(outcome.lines[0]).toMatch(/^lane ready,/)
  })

  it('counts a case-insensitive "depends on" mention', () => {
    const text = CLEAN.replace('None.', 'Depends on something else.')
    const outcome = checkShape('backlog/ideas/clean.md', text, NO_RECORD, LANES)
    expect(outcome.lines[0]).toContain('1 depends-on mention(s)')
  })

  it('reads the lane off an absolute path via the /backlog/ marker', () => {
    const outcome = checkShape(
      '/repo/backlog/done/clean/proposal.md',
      CLEAN.replace('name: clean', 'name: clean'),
      NO_RECORD,
      LANES,
    )
    expect(outcome.lines[0]).toMatch(/^lane done,/)
  })

  it.each([
    { name: 'the ideas-lane record form', path: 'backlog/ideas/foo.assessment.md' },
    { name: 'the promoted ready-lane record form', path: 'backlog/ready/foo/assessment.md' },
  ])('refuses $name ahead of the candidate test, and pins the whole refusal outcome', ({ path }) => {
    expect(checkShape(path, CLEAN, NO_RECORD, LANES)).toEqual({
      lines: [`LAYER1 ${path}: an assessment record, 0 checks -- this layer does not shape-check its own judgments`],
      deliver: false,
    })
  })

  it('refuses a file sitting directly under backlog/ and pins the whole non-candidate outcome', () => {
    expect(checkShape('backlog/IDEA-TEMPLATE.md', CLEAN, NO_RECORD, LANES)).toEqual({
      lines: [
        'LAYER1 backlog/IDEA-TEMPLATE.md: not a candidate, 0 checks -- only an idea file carries the candidate shape',
      ],
      deliver: false,
    })
  })

  it('counts zero lines for a target with no newline character at all', () => {
    const outcome = checkShape('backlog/ideas/one-liner.md', 'no newline here', NO_RECORD, LANES)
    expect(outcome.lines.at(-3)).toMatch(/^lane ideas, legacy shape, 0 lines, 0 depends-on mention\(s\)$/)
  })

  it('does not stop the frontmatter window early at a blank line inside it', () => {
    const text = [
      '---',
      'name: clean',
      '',
      'title: A clean fixture',
      'created: 2026-09-18',
      '---',
      '',
      '## Situation',
      '',
      '## Question',
      '',
      '## Open questions',
      '',
    ].join('\n')
    const outcome = checkShape('backlog/ideas/clean.md', text, NO_RECORD, LANES)
    expect(outcome.deliver).toBe(false)
  })

  it('does not read past the closing --- into the body for the frontmatter checks', () => {
    const text = [
      '---',
      'name: clean',
      'title: A clean fixture',
      'created: 2026-09-18',
      '---',
      '',
      '## Situation',
      '',
      'status: mentioned in body text, not frontmatter',
      '',
      '## Question',
      '',
      '## Open questions',
      '',
    ].join('\n')
    const outcome = checkShape('backlog/ideas/clean.md', text, NO_RECORD, LANES)
    expect(outcome.deliver).toBe(false)
  })

  it('anchors the title check to line start, rejecting a false match like "subtitle:"', () => {
    const text = [
      '---',
      'name: clean',
      'subtitle: not the real title',
      'created: 2026-09-18',
      '---',
      '',
      '## Situation',
      '',
      '## Question',
      '',
      '## Open questions',
      '',
    ].join('\n')
    const outcome = checkShape('backlog/ideas/clean.md', text, NO_RECORD, LANES)
    expect(outcome.lines).toContain('title: missing or empty')
  })

  it('requires the created date to end the line, not merely start it', () => {
    const text = CLEAN.replace('created: 2026-09-18', 'created: 2026-09-18 (draft)')
    const outcome = checkShape('backlog/ideas/clean.md', text, NO_RECORD, LANES)
    expect(outcome.lines).toContain('created: not a YYYY-MM-DD date')
  })

  it('requires the created date to start the line, not merely appear later in it', () => {
    const text = CLEAN.replace('created: 2026-09-18', 'xcreated: 2026-09-18')
    const outcome = checkShape('backlog/ideas/clean.md', text, NO_RECORD, LANES)
    expect(outcome.lines).toContain('created: not a YYYY-MM-DD date')
  })

  it('names the missing scqa heading correctly rather than matching any blank line', () => {
    const text = [
      '---',
      'name: clean',
      'title: A clean fixture',
      'created: 2026-09-18',
      '---',
      '',
      '## Situation',
      '',
      '## Open questions',
      '',
    ].join('\n')
    const outcome = checkShape('backlog/ideas/clean.md', text, NO_RECORD, LANES)
    expect(outcome.lines).toContain('section missing: ## Question')
  })

  it('anchors the backlog/ prefix strip to the start of the path, not any occurrence', () => {
    // Unanchored, the strip would leave `sub/foo.md` -- two segments, and so a
    // candidate. The anchor is what keeps a look-alike directory off the board.
    // Both an anchored and an unanchored strip happen to read `zzbacklog` as
    // an undeclared lane here, so this row alone does not discriminate the
    // two -- see the row below, which does.
    // reference-check: allow sub/foo.md -- illustrative fragment from the unanchored strip above, never a real file
    expect(checkShape('zzbacklog/sub/foo.md', CLEAN, NO_RECORD, LANES).lines[0]).toContain('undeclared lane')
  })

  it('anchors the backlog/ prefix strip so a mid-string occurrence cannot manufacture a declared lane name', () => {
    // Unanchored, stripping the first "backlog/" out of "idbacklog/eas/foo.md"
    // (found mid-string, not at the start) leaves "id" + "eas/foo.md" ==
    // "ideas/foo.md" -- a two-segment flat-lane candidate. Anchored, the
    // string does not start with "backlog/" at all, so the strip is a no-op
    // and "idbacklog" stays the (undeclared) first segment. The two
    // implementations disagree on outcome *kind* here, not just wording --
    // this is what the row above could not pin.
    const outcome = checkShape('idbacklog/eas/foo.md', CLEAN, NO_RECORD, LANES)
    expect(outcome.lines.at(-1)).toContain('undeclared lane')
  })
})

describe('checkShape assessment record staleness', () => {
  const IDEA_TARGET = 'backlog/ideas/clean.md'
  const READY_TARGET = 'backlog/ready/my-slug/proposal.md'
  const READY_TEXT = CLEAN.replace('name: clean', 'name: my-slug')
  const MATCHED: RecordLookup = { kind: 'present', storedBlob: 'abc', currentBlob: 'abc' }
  const MISMATCHED: RecordLookup = { kind: 'present', storedBlob: 'abc', currentBlob: 'def' }
  const UNREADABLE: RecordLookup = { kind: 'unreadable' }

  // One table for both lanes: a blob mismatch means opposite things
  // depending on where the idea sits, so the ideas-lane and ready-lane rows
  // are pinned side by side rather than in separate describe blocks. The
  // ready-lane "frozen, zero findings" row is the one a lane-blind
  // implementation fails -- deleting the lane gate collapses it onto the
  // ideas-lane "stale, one finding" row instead.
  it.each([
    {
      name: 'ideas lane, no record yet',
      target: IDEA_TARGET,
      text: CLEAN,
      record: NO_RECORD,
      clause: 'no assessment record',
      findings: 0,
    },
    {
      name: 'ideas lane, record matches the current blob',
      target: IDEA_TARGET,
      text: CLEAN,
      record: MATCHED,
      clause: 'assessment current',
      findings: 0,
    },
    {
      name: 'ideas lane, record predates an edit',
      target: IDEA_TARGET,
      text: CLEAN,
      record: MISMATCHED,
      clause: 'assessment stale',
      findings: 1,
    },
    {
      name: 'ready lane, no record yet',
      target: READY_TARGET,
      text: READY_TEXT,
      record: NO_RECORD,
      clause: 'no assessment record',
      findings: 0,
    },
    {
      name: 'ready lane, record matches the current blob',
      target: READY_TARGET,
      text: READY_TEXT,
      record: MATCHED,
      clause: 'assessment current',
      findings: 0,
    },
    {
      name: 'ready lane, record predates promotion -- frozen, not stale',
      target: READY_TARGET,
      text: READY_TEXT,
      record: MISMATCHED,
      clause: 'assessment frozen',
      findings: 0,
    },
    {
      name: 'record unreadable, lane-blind',
      target: IDEA_TARGET,
      text: CLEAN,
      record: UNREADABLE,
      clause: 'assessment record unreadable',
      findings: 1,
    },
  ])('$name', ({ target, text, record, clause, findings }) => {
    const outcome = checkShape(target, text, record, LANES)
    expect(outcome.lines).toContain(clause)
    expect(outcome.lines.at(-1)).toBe(`LAYER1 ${target}: 7 checks, ${findings} findings`)
    expect(outcome.deliver).toBe(findings > 0)
  })
})

describe('checkShape candidate classification', () => {
  const REFUSAL = 'not a candidate, 0 checks -- only an idea file carries the candidate shape'
  it.each([
    { name: 'a flat idea file is a candidate', target: 'backlog/ideas/foo.md', candidate: true },
    { name: 'a ready-lane proposal is a candidate', target: 'backlog/ready/foo/proposal.md', candidate: true },
    { name: 'a done-lane proposal is a candidate', target: 'backlog/done/foo/proposal.md', candidate: true },
    {
      name: 'an absolute proposal path classifies the same',
      target: '/repo/backlog/done/foo/proposal.md',
      candidate: true,
    },
    { name: 'a spec is a per-item artifact', target: 'backlog/ready/foo/spec.md', candidate: false },
    { name: 'a design is a per-item artifact', target: 'backlog/done/foo/design.md', candidate: false },
    { name: 'a numbered amendment needs no pattern', target: 'backlog/done/foo/amendment-11.md', candidate: false },
    { name: 'an unbuilt tasks.md needs no new entry', target: 'backlog/ready/foo/tasks.md', candidate: false },
    { name: 'a spike findings file is a per-item artifact', target: 'backlog/done/foo/findings.md', candidate: false },
    {
      name: 'an absolute artifact path classifies the same',
      target: '/repo/backlog/done/foo/spec.md',
      candidate: false,
    },
    { name: 'a fourth segment is not a candidate', target: 'backlog/ready/foo/sub/proposal.md', candidate: false },
    // proposal.md sitting in the third slot of a four-segment path must not
    // satisfy the three-segment shape on its own -- pins the segment-count
    // check rather than only the basename check it is paired with.
    {
      name: 'proposal.md in the third slot of a four-segment path is not a candidate',
      target: 'backlog/ready/item/proposal.md/stray.md',
      candidate: false,
    },
    { name: 'a bare single-segment argv target is not a candidate', target: 'clean.md', candidate: false },
  ])('$name', ({ target, candidate }) => {
    expect((checkShape(target, CLEAN, NO_RECORD, LANES).lines.at(-1) ?? '').includes(REFUSAL)).toBe(!candidate)
  })

  // Named residue, 2026-09-19, narrowed 2026-09-21 once classification became
  // declaration-driven: checkShape alone has no board gate, so an off-board
  // path whose first segment happens to match a declared lane name still
  // classifies as a candidate when checkShape is called directly, as this
  // row does. Both shells gate on isBoardPath in run.ts before checkShape is
  // ever reached, so this path is unreachable from either --hook or argv
  // mode. Adding the gate here, inside classifyShape, would strand the ^
  // anchor in segmentsAfterRoot as an equivalent mutant, which is why it is
  // named rather than closed. `src/camera.ts` -- the row this replaced --
  // moved below: `src` is not a declared lane name, so it no longer
  // illustrates the residue and now draws its own undeclared-lane outcome
  // instead.
  it('classifies an off-board path as a candidate when its lane segment happens to match a declared lane name', () => {
    const text = CLEAN.replace('name: clean', 'name: off-board')
    const outcome = checkShape('ideas/off-board.md', text, NO_RECORD, LANES)
    expect(outcome.lines.at(-1)).toContain('7 checks,')
  })

  it('classifies an off-board path with no declared-lane collision as an undeclared lane, not a candidate', () => {
    const outcome = checkShape('src/camera.ts', CLEAN, NO_RECORD, LANES)
    expect(outcome.lines.at(-1)).toContain('undeclared lane')
    expect(outcome.deliver).toBe(false)
  })
})

describe('checkShape declaration-driven classification', () => {
  // Rows 3, 5 and 8 of the design's decision table: the three outcomes a
  // board target can draw once the lane is declared but the path either
  // names no lane at all, or names one whose declared shape it does not
  // fit. Every row asserts both the wording and that the outcome never
  // delivers -- a warning reaches the log stream only, exactly like
  // notACandidateOutcome, so the finding tally an eventual candidate write
  // produces stays uncontaminated by a path that was never classified.
  it.each([
    {
      name: 'row 3: an undeclared lane never reaches the checks',
      target: 'backlog/unknown/foo.md',
      contains: 'undeclared lane',
    },
    {
      name: 'row 5: a flat lane with a third segment is a shape mismatch',
      target: 'backlog/ideas/sub/foo.md',
      contains: 'shape mismatch',
    },
    {
      name: 'row 8: a folder lane with only two segments is a shape mismatch',
      target: 'backlog/ready/foo.md',
      contains: 'shape mismatch',
    },
  ])('$name', ({ target, contains }) => {
    const outcome = checkShape(target, CLEAN, NO_RECORD, LANES)
    expect(outcome.lines).toEqual([expect.stringContaining(contains)])
    expect(outcome.deliver).toBe(false)
  })

  it('draws distinct wording for an undeclared lane, a shape mismatch, and a non-candidate artifact', () => {
    const undeclared = checkShape('backlog/unknown/foo.md', CLEAN, NO_RECORD, LANES).lines[0]
    const mismatch = checkShape('backlog/ready/foo.md', CLEAN, NO_RECORD, LANES).lines[0]
    const notACandidate = checkShape('backlog/ready/foo/spec.md', CLEAN, NO_RECORD, LANES).lines[0]
    expect(new Set([undeclared, mismatch, notACandidate]).size).toBe(3)
  })

  // The slice's namesake claim: a folder lane's identity extraction is
  // driven by the shape declared for it, not by a hardcoded 'proposal' stem
  // -- so a lane declaring a differently-named item classifies and reports
  // identity exactly as ready/done already do.
  it('takes identity from the folder basename for a folder lane declaring an item other than proposal.md', () => {
    const lanes: LaneDeclarations = new Map([['archive', { shape: 'folder', item: 'summary.md' }]])
    const text = CLEAN.replace('name: clean', 'name: my-thing')
    const outcome = checkShape('backlog/archive/my-thing/summary.md', text, NO_RECORD, lanes)
    expect(outcome.deliver).toBe(false)
    expect(outcome.lines.at(-1)).toBe('LAYER1 backlog/archive/my-thing/summary.md: 7 checks, 0 findings')
  })
})
