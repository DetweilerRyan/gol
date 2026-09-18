import { describe, expect, it } from 'vitest'
import { checkShape, emptyPathOutcome, isBoardPath, missingOutcome, resolveTarget } from './board-shape.ts'

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
  it('returns the target unchanged when it already exists', () => {
    const exists = (p: string) => p === 'given.md'
    expect(resolveTarget('given.md', exists)).toBe('given.md')
  })

  it('resolves a bare slug to the ideas/ candidate', () => {
    const exists = (p: string) => p === 'backlog/ideas/my-slug.md'
    expect(resolveTarget('my-slug', exists)).toBe('backlog/ideas/my-slug.md')
  })

  it('resolves a bare slug to the ready/ candidate', () => {
    const exists = (p: string) => p === 'backlog/ready/my-slug/proposal.md'
    expect(resolveTarget('my-slug', exists)).toBe('backlog/ready/my-slug/proposal.md')
  })

  it('picks the ready/ candidate when both exist -- last hit wins', () => {
    const exists = (p: string) => p === 'backlog/ideas/my-slug.md' || p === 'backlog/ready/my-slug/proposal.md'
    expect(resolveTarget('my-slug', exists)).toBe('backlog/ready/my-slug/proposal.md')
  })

  it('returns the target unresolved when no candidate exists either', () => {
    const exists = () => false
    expect(resolveTarget('nope', exists)).toBe('nope')
  })

  it('does not fall through to slug candidates once the target itself already exists', () => {
    const exists = (p: string) => p === 'given.md' || p === 'backlog/ideas/given.md'
    expect(resolveTarget('given.md', exists)).toBe('given.md')
  })

  it('anchors the .md strip to the end of the slug, not any occurrence', () => {
    const exists = (p: string) => p === 'backlog/ideas/a.md-b.md'
    expect(resolveTarget('a.md-b.md', exists)).toBe('backlog/ideas/a.md-b.md')
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

  it('falls back to the dirname basename for a lane path with no subdirectory segment', () => {
    const outcome = checkShape('backlog/clean.md', CLEAN.replace('name: clean', 'name: clean'))
    expect(outcome.lines[0]).toMatch(/^lane backlog,/)
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
    const text = CLEAN.replace('name: clean', 'name: foo')
    const outcome = checkShape('zzbacklog/sub/foo.md', text)
    expect(outcome.lines[0]).toMatch(/^lane zzbacklog,/)
  })
})
