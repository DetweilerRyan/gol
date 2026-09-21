import { describe, expect, it } from 'vitest'
import {
  checkShape,
  emptyPathOutcome,
  isBoardPath,
  missingOutcome,
  offBoardOutcome,
  resolveTarget,
} from './board-shape.ts'

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
    expect(resolveTarget(target, exists)).toBe(expected)
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
    const outcome = checkShape('backlog/ideas/clean.md', CLEAN)
    expect(outcome.deliver).toBe(false)
    expect(outcome.lines).toEqual([
      'lane ideas, scqa shape, 17 lines, 0 depends-on mention(s)',
      'LAYER1 backlog/ideas/clean.md: 6 checks, 0 findings',
    ])
  })

  it('reports all six findings for a mismatched, status-bearing, headingless file', () => {
    const text = ['---', 'name: mismatched-name', 'status: ready', '---', '', 'Body with no headings.', ''].join('\n')
    const outcome = checkShape('backlog/ideas/all-six.md', text)
    expect(outcome.deliver).toBe(true)
    expect(outcome.lines).toEqual([
      "name: does not match basename 'all-six'",
      'title: missing or empty',
      'created: not a YYYY-MM-DD date',
      'status: present -- the directory is the status',
      'section missing: ## Touches',
      'section missing: ## Open questions',
      'lane ideas, legacy shape, 6 lines, 0 depends-on mention(s)',
      'LAYER1 backlog/ideas/all-six.md: 6 checks, 6 findings',
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
    const outcome = checkShape('backlog/ideas/legacy.md', text)
    expect(outcome.deliver).toBe(false)
    expect(outcome.lines[0]).toMatch(/^lane ideas, legacy shape,/)
  })

  it("takes identity from the folder's basename for a ready/ proposal.md, not the file stem", () => {
    const text = CLEAN.replace('name: clean', 'name: my-slug')
    const outcome = checkShape('backlog/ready/my-slug/proposal.md', text)
    expect(outcome.deliver).toBe(false)
    expect(outcome.lines[0]).toMatch(/^lane ready,/)
  })

  it('counts a case-insensitive "depends on" mention', () => {
    const text = CLEAN.replace('None.', 'Depends on something else.')
    const outcome = checkShape('backlog/ideas/clean.md', text)
    expect(outcome.lines[0]).toContain('1 depends-on mention(s)')
  })

  it('reads the lane off an absolute path via the /backlog/ marker', () => {
    const outcome = checkShape('/repo/backlog/done/clean/proposal.md', CLEAN.replace('name: clean', 'name: clean'))
    expect(outcome.lines[0]).toMatch(/^lane done,/)
  })

  it.each([
    { name: 'the ideas-lane record form', path: 'backlog/ideas/foo.assessment.md' },
    { name: 'the promoted ready-lane record form', path: 'backlog/ready/foo/assessment.md' },
  ])('refuses $name ahead of the candidate test, and pins the whole refusal outcome', ({ path }) => {
    expect(checkShape(path, CLEAN)).toEqual({
      lines: [`LAYER1 ${path}: an assessment record, 0 checks -- this layer does not shape-check its own judgments`],
      deliver: false,
    })
  })

  it('refuses a file sitting directly under backlog/ and pins the whole non-candidate outcome', () => {
    expect(checkShape('backlog/TEMPLATE.md', CLEAN)).toEqual({
      lines: ['LAYER1 backlog/TEMPLATE.md: not a candidate, 0 checks -- only an idea file carries the candidate shape'],
      deliver: false,
    })
  })

  it('counts zero lines for a target with no newline character at all', () => {
    const outcome = checkShape('backlog/ideas/one-liner.md', 'no newline here')
    expect(outcome.lines.at(-2)).toMatch(/^lane ideas, legacy shape, 0 lines, 0 depends-on mention\(s\)$/)
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
    const outcome = checkShape('backlog/ideas/clean.md', text)
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
    const outcome = checkShape('backlog/ideas/clean.md', text)
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
    const outcome = checkShape('backlog/ideas/clean.md', text)
    expect(outcome.lines).toContain('title: missing or empty')
  })

  it('requires the created date to end the line, not merely start it', () => {
    const text = CLEAN.replace('created: 2026-09-18', 'created: 2026-09-18 (draft)')
    const outcome = checkShape('backlog/ideas/clean.md', text)
    expect(outcome.lines).toContain('created: not a YYYY-MM-DD date')
  })

  it('requires the created date to start the line, not merely appear later in it', () => {
    const text = CLEAN.replace('created: 2026-09-18', 'xcreated: 2026-09-18')
    const outcome = checkShape('backlog/ideas/clean.md', text)
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
    const outcome = checkShape('backlog/ideas/clean.md', text)
    expect(outcome.lines).toContain('section missing: ## Question')
  })

  it('anchors the backlog/ prefix strip to the start of the path, not any occurrence', () => {
    // Unanchored, the strip would leave `sub/foo.md` -- two segments, and so a
    // candidate. The anchor is what keeps a look-alike directory off the board.
    // reference-check: allow sub/foo.md -- illustrative fragment from the unanchored strip above, never a real file
    expect(checkShape('zzbacklog/sub/foo.md', CLEAN).lines[0]).toContain('not a candidate')
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
    // Named residue, 2026-09-19: checkShape alone has no board gate, so an
    // off-board path with exactly two segments satisfies the <lane>/<name>.md
    // shape by coincidence when checkShape is called directly, as this row
    // does. Both shells gate on isBoardPath in run.ts before checkShape is
    // ever reached, so this path is unreachable from either --hook or argv
    // mode. Adding the gate here, inside isCandidatePath, would strand the ^
    // anchor in segmentsAfterRoot as an equivalent mutant, which is why it is
    // named rather than closed.
    {
      name: 'an off-board two-segment path is a candidate when checkShape is called directly',
      target: 'src/camera.ts',
      candidate: true,
    },
  ])('$name', ({ target, candidate }) => {
    expect((checkShape(target, CLEAN).lines.at(-1) ?? '').includes(REFUSAL)).toBe(!candidate)
  })
})
