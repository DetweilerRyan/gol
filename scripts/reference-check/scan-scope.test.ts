import { describe, expect, it } from 'vitest'
import { scanScopeOf } from './scan-scope.ts'

describe('scanScopeOf', () => {
  it('includes src/**, scripts/**, features/**, perf/**, rules/**, rule-tests/** for the source surface', () => {
    const paths = [
      'src/cellTiles.ts',
      'scripts/reference-check/run.ts',
      'features/steps/pattern-library.ts',
      'perf/harness.ts',
      'rules/no-foo.yml',
      'rule-tests/no-foo-test.yml',
    ]
    expect(scanScopeOf(paths).sourceFiles).toEqual([...paths].sort())
  })

  it('excludes src/catalyst/**', () => {
    expect(scanScopeOf(['src/catalyst/button.tsx']).sourceFiles).toEqual([])
  })

  it('includes a root-level .ts file', () => {
    expect(scanScopeOf(['vite.config.ts']).sourceFiles).toEqual(['vite.config.ts'])
  })

  it('excludes a root-level .md, .json, or non-.ts file', () => {
    expect(scanScopeOf(['README.md', 'package.json', 'sgconfig.yml']).sourceFiles).toEqual([])
  })

  it('excludes a file outside every included source prefix', () => {
    expect(scanScopeOf(['coverage/index.ts', 'ideas/todo/foo.ts']).sourceFiles).toEqual([])
  })

  it('includes CLAUDE.md and README.md, and every .claude/**/*.md, for the doc surface', () => {
    const paths = ['CLAUDE.md', 'README.md', '.claude/agents/coder.md', '.claude/agents/articles/engineering.md']
    expect(scanScopeOf(paths).docFiles).toEqual([...paths].sort())
  })

  it('excludes .claude/worktrees/** from the doc surface', () => {
    expect(scanScopeOf(['.claude/worktrees/some-slice/CLAUDE.md']).docFiles).toEqual([])
  })

  it('excludes ideas/** from both surfaces', () => {
    const scope = scanScopeOf(['ideas/todo/some-idea.md', 'ideas/candidates/other.md'])
    expect(scope.sourceFiles).toEqual([])
    expect(scope.docFiles).toEqual([])
  })

  it('excludes a non-.md file under .claude/**', () => {
    expect(scanScopeOf(['.claude/settings.json']).docFiles).toEqual([])
  })
})
