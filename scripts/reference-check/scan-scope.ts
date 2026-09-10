// Which tracked/untracked-not-ignored paths this checker reads at all, and
// under which surface (source-comment-only vs every-line-is-a-doc). Pure:
// takes the path list run.ts got from `git ls-files`, returns the two
// classified lists -- no filesystem access here, so a test can hand this a
// literal array.
//
// `ideas/**` is excluded from both surfaces, deliberately, for two
// independent reasons -- either alone would justify the exclusion:
//
//  1. A document about dead references necessarily *names* dead references.
// reference-check: allow ideas/doc-references-are-checked-by-nothing.md -- a retired idea file, deleted when its slice landed; named as the measured example this exclusion was derived from
//     ideas/doc-references-are-checked-by-nothing.md itself scores 19
//     unresolved tokens against this checker's own extractor, every one
//     deliberate (the dead filenames it uses as its own worked examples).
//  2. An idea file's normal mode is naming a file that does not exist *yet*
//     -- a module it proposes creating -- which this checker cannot
//     distinguish from a defect (a module that existed and was deleted).
//
// Both are load-bearing: (1) is a false-positive problem specific to this
// one file; (2) would recur on every future idea file that sketches a new
// module by name.

export interface ScanScope {
  sourceFiles: string[]
  docFiles: string[]
}

// Extensions .ts/.tsx/.yml/.yaml only -- see references.ts's
// FILE_TOKEN_SOURCE, which extracts exactly these four.
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.yml', '.yaml']

// src/catalyst/ is vendored third-party Tailwind Catalyst UI, deliberately
// outside every gate in this repo (see CLAUDE.md) -- a comment inside it
// citing another vendored file is not this program's problem.
const SOURCE_EXCLUDED_PREFIXES = ['src/catalyst/']

const SOURCE_INCLUDED_PREFIXES = ['src/', 'scripts/', 'features/', 'perf/', 'rules/', 'rule-tests/']

// Root-level *.ts files earn scope too -- vite.config.ts names a throwaway
// `__probe.test.ts` measurement probe, and that class of file lives nowhere else.
// reference-check: allow __probe.test.ts -- the same never-committed measurement probe vite.config.ts names
function isRootLevelTsFile(path: string): boolean {
  return /^[^/]+\.ts$/.test(path)
}

// Both prefix lists deliberately share one quantifier rather than each
// writing its own `.some`. SOURCE_EXCLUDED_PREFIXES holds exactly one entry
// today, and over a one-element array `.some` and `.every` agree -- so an
// inline `.some` there is an unkillable mutant whose equivalence rests on
// the array's current length rather than on anything structural, and it
// becomes a live bug the day a second excluded prefix is added. Routed
// through here, the quantifier exists once and is pinned by the
// six-element SOURCE_INCLUDED_PREFIXES call site below.
function startsWithAny(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => path.startsWith(prefix))
}

function isSourceFile(path: string): boolean {
  if (!SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension))) return false
  if (startsWithAny(path, SOURCE_EXCLUDED_PREFIXES)) return false
  if (isRootLevelTsFile(path)) return true
  return startsWithAny(path, SOURCE_INCLUDED_PREFIXES)
}

const DOC_EXACT_FILES = new Set(['CLAUDE.md', 'README.md'])

// .claude/worktrees/ is a sanctioned slice-worktree location holding whole
// other checkouts -- their own .claude/, their own node_modules -- rather
// than this repo's own docs. Same reason agent-doc-check's
// EXCLUDED_DOC_DIRS prunes it (see scripts/agent-doc-check/run.ts).
const DOC_EXCLUDED_DIR_SEGMENTS = new Set(['worktrees'])

function isInsideExcludedDocDir(path: string): boolean {
  return path.split('/').some((segment) => DOC_EXCLUDED_DIR_SEGMENTS.has(segment))
}

function isDocFile(path: string): boolean {
  if (DOC_EXACT_FILES.has(path)) return true
  if (!path.startsWith('.claude/') || !path.endsWith('.md')) return false
  return !isInsideExcludedDocDir(path)
}

/** Classifies a tracked/untracked-not-ignored path list into the two surfaces this checker scans. */
export function scanScopeOf(paths: string[]): ScanScope {
  return {
    sourceFiles: paths.filter(isSourceFile).sort(),
    docFiles: paths.filter(isDocFile).sort(),
  }
}
