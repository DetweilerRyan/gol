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
 * The pathspecs for one run: the whole tree, or `scope` narrowed to the
 * three linted extensions. Pass verbatim to `git ls-files`.
 *
 * @param scope A directory or pathspec to lint instead of the whole tree.
 * @returns Pathspecs for `git ls-files`, always extension-bounded.
 */
export function pathspecsFor(scope: string | undefined): string[] {
  if (scope === undefined) return [...LINT_PATHSPECS]
  // Each extension is appended to the scope rather than the scope being
  // passed alone, so a scope naming a directory cannot widen the file set
  // past the three extensions Vale is configured for.
  //
  // The resulting pathspec is recursive, which is what a scope has to be:
  // git's `*` crosses `/` in a pathspec, unlike a shell glob. Measured --
  // `git ls-files 'src/*.md'` returns `src/hooks/useZoomGlide.meta.md`, two
  // directories down. lint-targets.test.ts pins that shape, since the
  // opposite reading would silently lint only a directory's own children.
  const base = scope.endsWith('/') ? scope.slice(0, -1) : scope
  return LINT_PATHSPECS.map((pattern) => `${base}/${pattern}`)
}

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
