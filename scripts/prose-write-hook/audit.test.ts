import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  emptyPathOutcome,
  inScope,
  noRootOutcome,
  outcomeFor,
  repoRelative,
  valeAbsentOutcome,
  valeCandidates,
} from './audit.ts'

describe('emptyPathOutcome', () => {
  it('reports the extraction-empty finding and always delivers', () => {
    expect(emptyPathOutcome()).toEqual({ lines: ['PROSEHOOK (no path): extraction returned empty'], deliver: true })
  })
})

describe('noRootOutcome', () => {
  it('names the path when no repo root was found', () => {
    expect(noRootOutcome('/tmp/x/foo.md')).toEqual({
      lines: ['PROSEHOOK /tmp/x/foo.md: no repo root found -- NOT RUN'],
      deliver: true,
    })
  })
})

describe('repoRelative', () => {
  it.each([
    {
      name: 'strips the repo root prefix and the separator',
      path: '/repo/.claude/skills/x/SKILL.md',
      root: '/repo',
      expected: '.claude/skills/x/SKILL.md',
    },
    {
      name: 'returns the path unchanged when it does not start with the root',
      path: 'elsewhere/foo.md',
      root: '/repo',
      expected: 'elsewhere/foo.md',
    },
    {
      name: 'does not strip a root that is only a string prefix, not a path segment boundary',
      path: '/repository/foo.md',
      root: '/repo',
      expected: '/repository/foo.md',
    },
  ])('$name', ({ path, root, expected }) => {
    expect(repoRelative(path, root)).toBe(expected)
  })
})

describe('inScope', () => {
  it.each([
    { name: 'accepts a skills/ markdown file', rel: '.claude/skills/idea-assess/SKILL.md', expected: true },
    { name: 'accepts a references/ markdown file', rel: '.claude/references/merge-protocol.md', expected: true },
    {
      name: 'rejects a non-markdown file in scope otherwise',
      rel: '.claude/skills/idea-assess/scripts/run.ts',
      expected: false,
    },
    { name: 'rejects a path outside skills/ and references/', rel: '.claude/agents/coder.md', expected: false },
    {
      name: 'rejects a .meta.md sidecar even though it sits in scope otherwise',
      rel: '.claude/skills/idea-assess/notes.meta.md',
      expected: false,
    },
  ])('$name', ({ rel, expected }) => {
    expect(inScope(rel)).toBe(expected)
  })
})

describe('valeCandidates', () => {
  it('joins vale onto every PATH entry', () => {
    expect(valeCandidates(['/usr/bin', '/opt/homebrew/bin'].join(path.delimiter))).toEqual([
      path.join('/usr/bin', 'vale'),
      path.join('/opt/homebrew/bin', 'vale'),
    ])
  })

  it('returns a single empty-directory candidate for an undefined PATH', () => {
    expect(valeCandidates(undefined)).toEqual([path.join('', 'vale')])
  })
})

describe('valeAbsentOutcome', () => {
  it('names the relative path and always delivers', () => {
    expect(valeAbsentOutcome('.claude/skills/x/SKILL.md')).toEqual({
      lines: ['PROSEHOOK .claude/skills/x/SKILL.md: vale absent -- NOT RUN'],
      deliver: true,
    })
  })
})

describe('outcomeFor', () => {
  it('reports a clean line and does not deliver when vale finds nothing', () => {
    expect(outcomeFor('.claude/skills/x/SKILL.md', '')).toEqual({
      lines: ['PROSEHOOK .claude/skills/x/SKILL.md: 0 findings'],
      deliver: false,
    })
  })

  it('counts a colon-bearing output line as a finding, and delivers the vale text plus a summary', () => {
    const valeOutput = 'x/SKILL.md:3:1:Rule.Name:message\n'
    expect(outcomeFor('x/SKILL.md', valeOutput)).toEqual({
      lines: [
        'x/SKILL.md:3:1:Rule.Name:message',
        'PROSEHOOK x/SKILL.md: 1 finding(s) -- run /prose-audit on this file, and fix before landing',
      ],
      deliver: true,
    })
  })

  it('trims a single trailing newline off the vale text before delivering it', () => {
    const valeOutput = 'a:1:1:R:m\nb:2:1:R:m\n'
    const outcome = outcomeFor('f.md', valeOutput)
    expect(outcome.lines[0]).toBe('a:1:1:R:m\nb:2:1:R:m')
  })

  it('leaves the vale text untouched when it carries no trailing newline', () => {
    const valeOutput = 'a:1:1:R:m'
    const outcome = outcomeFor('f.md', valeOutput)
    expect(outcome.lines[0]).toBe('a:1:1:R:m')
  })
})
