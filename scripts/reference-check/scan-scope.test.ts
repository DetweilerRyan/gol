import { describe, expect, it } from 'vitest'
import { scanScopeOf } from './scan-scope.ts'

describe('scanScopeOf', () => {
  it('includes src/**, scripts/**, features/**, perf/**, rules/**, rule-tests/**, vale-styles/** for the source surface', () => {
    const paths = [
      'src/cellTiles.ts',
      'scripts/reference-check/run.ts',
      'features/steps/pattern-library.ts',
      'perf/harness.ts',
      'rules/no-foo.yml',
      'rule-tests/no-foo-test.yml',
      'vale-styles/JsDoc/BlockTagVocabulary.yml',
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

  // Mutation regression: an included prefix alone isn't enough -- the
  // extension still has to be one of SOURCE_EXTENSIONS. Every other fixture
  // that varies the extension is root-level, where exclusion falls out of
  // the prefix check instead and never touches this branch.
  it('excludes a disallowed extension even under an included source prefix', () => {
    expect(scanScopeOf(['src/foo.js']).sourceFiles).toEqual([])
  })

  // Mutation regression: isRootLevelTsFile's regex is anchored (`$`) to the
  // true end of the path -- a path that merely *contains* ".ts" earlier,
  // while actually ending in a different allowed extension, is not a
  // root-level .ts file.
  it('does not treat a path that merely contains ".ts" as a root-level .ts file', () => {
    expect(scanScopeOf(['foo.ts.yml']).sourceFiles).toEqual([])
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

  // Gap 1: the doc surface is now every tracked .md outside ideas/** and
  // .claude/worktrees/**, not an enumerated two-file list plus one
  // directory prefix -- a rule-file directory like vale-styles/JsDoc/ is
  // covered without an edit here.
  it('includes a .md file outside .claude/** and outside CLAUDE.md/README.md', () => {
    expect(scanScopeOf(['vale-styles/JsDoc/README.md']).docFiles).toEqual(['vale-styles/JsDoc/README.md'])
    expect(scanScopeOf(['adr/README.md']).docFiles).toEqual(['adr/README.md'])
    expect(scanScopeOf(['src/cache.rationale.md']).docFiles).toEqual(['src/cache.rationale.md'])
  })

  it('excludes an .md file sitting directly under ideas/ from the doc surface', () => {
    expect(scanScopeOf(['ideas/x.md']).docFiles).toEqual([])
  })

  it('excludes a nested .claude/worktrees/** doc file', () => {
    expect(scanScopeOf(['.claude/worktrees/s/CLAUDE.md']).docFiles).toEqual([])
  })

  it('classifies a .ts source file as source and not doc', () => {
    const scope = scanScopeOf(['src/cache.ts'])
    expect(scope.sourceFiles).toEqual(['src/cache.ts'])
    expect(scope.docFiles).toEqual([])
  })
})
