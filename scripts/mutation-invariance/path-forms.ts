// The ONLY interpreter of a path form anywhere in this program. checks.ts and
// diff-verdict.ts both call into here rather than comparing strings
// themselves, so there is exactly one place that decides what "covers" or
// "matches" means for a directory glob.
//
// The rule every function below encodes: an unrecognised form secures
// nothing and the gate fails -- never "unless a contradiction is found". A
// blocklist fails *open* (an unlisted form is silently accepted); every
// match here is a positive, narrow check, so a string this program has never
// seen returns false rather than true. No glob engine appears anywhere in
// this program -- vitestExcludeCovers and strykerIgnoreCovers are both
// string-equality checks against a small, explicit set of forms, not a glob
// match.

/**
 * The directory an `allow[]`/`absent[]` entry's `path` names, or
 * `undefined` if the entry is a bare file rather than the `dir/**` form
 * (schema-enforced for the `vitest-exclude` and `stryker-ignore-patterns`
 * tiers, and forbidden for `written-argument`).
 */
export function directoryOf(entryPath: string): string | undefined {
  return entryPath.endsWith('/**') ? entryPath.slice(0, -3) : undefined
}

/**
 * Whether `changedPath` falls under an `allow[]`/`absent[]` entry's `path`.
 * A directory entry (`dir/**`) matches any path strictly inside `dir` --
 * `changed.startsWith(dir + '/')`, where the trailing slash is load-bearing:
 * dropping it is the classic fail-open prefix bug (`features-x/foo` must
 * not match `features/**`). A bare-file entry matches only by exact
 * equality.
 */
export function matchesChangedPath(entryPath: string, changedPath: string): boolean {
  const dir = directoryOf(entryPath)
  if (dir === undefined) return changedPath === entryPath
  return changedPath.startsWith(`${dir}/`)
}

/**
 * Whether a vitest project's `exclude` glob covers `dir`. Recognises
 * exactly three literal forms (`${dir}/**`, `${dir}/**\/*`, `${dir}`); any
 * other string -- including one that a real glob engine would also treat as
 * covering `dir` -- returns false, per this module's fail-safe rule.
 */
export function vitestExcludeCovers(excludeGlob: string, dir: string): boolean {
  return excludeGlob === `${dir}/**` || excludeGlob === `${dir}/**/*` || excludeGlob === dir
}

/**
 * Whether one entry of stryker.config.json's `ignorePatterns` covers `dir`,
 * and whether that entry is a negation (`!`-prefixed, which *re-includes*
 * rather than excludes). Strips a leading `!` (recording `negated`), then a
 * leading `/`, then a trailing `/**` or `/`, then requires string equality
 * with `dir` -- checks.ts's C2 walks `ignorePatterns` in order and uses
 * `negated` to implement Stryker's own last-wins semantics; this function
 * has no opinion on ordering, only on what one pattern says about `dir` in
 * isolation.
 */
export function strykerIgnoreCovers(pattern: string, dir: string): { covers: boolean; negated: boolean } {
  const negated = pattern.startsWith('!')
  let rest = negated ? pattern.slice(1) : pattern
  if (rest.startsWith('/')) rest = rest.slice(1)
  if (rest.endsWith('/**')) rest = rest.slice(0, -3)
  else if (rest.endsWith('/')) rest = rest.slice(0, -1)
  return { covers: rest === dir, negated }
}
