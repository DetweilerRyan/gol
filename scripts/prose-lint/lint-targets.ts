// The git pathspecs and the one path exclusion this program's predecessor
// expressed as a single shell pipeline (`git ls-files '*.md' '*.ts' '*.tsx'
// | grep -v '^src/catalyst/'`), split here into two pure pieces instead.
// Split out of decide.ts/run.ts since both are small enough to be their own
// table-driven unit tests, and because run.ts is the only caller that needs
// either one.

/**
 * The git pathspecs Vale lints across the whole tree -- every tracked
 * Markdown, TypeScript and TSX file. Pass verbatim to `git ls-files`.
 */
export const LINT_PATHSPECS: readonly string[] = ['*.md', '*.ts', '*.tsx']

/**
 * Drops every path under the vendored `src/catalyst/` library boundary --
 * see CLAUDE.md's compact module map.
 */
export function excludeCatalyst(paths: string[]): string[] {
  // Anchored with `startsWith`, never `includes`: a hypothetical path with
  // `src/catalyst/` appearing partway through it, rather than at its start,
  // is not the vendored boundary and must survive this filter --
  // `grep -v '^src/catalyst/'` already anchored the same way, and an
  // `includes` port would silently stop doing so. lint-targets.test.ts's
  // own fixture pins the concrete case.
  return paths.filter((filePath) => !filePath.startsWith('src/catalyst/'))
}
