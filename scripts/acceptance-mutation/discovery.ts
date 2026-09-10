// Derives the acceptance mutator's target set from the .feature files
// present on disk (scripts/feature-files.ts), rather than a hand-maintained
// table -- the old TARGETS array went stale independently of
// gherkin-dry-checker's own hardcoded FEATURE_FILES list, the same failure
// mode in two places, and both now share listFeatureFiles.
//
// This no longer pairs a .feature against a *.steps.test.ts(x) file. The
// generated Playwright spec a mutant is actually run against (see
// mutant-tree.ts's specFileName) cannot exist yet when discovery runs --
// it's produced later, by bddgen, from the mutant .feature files this
// module's caller writes -- so there is nothing on disk to pair against at
// this point, and requiring one would be checking a file that hasn't been
// created yet rather than deriving what's needed from what has. Step
// definitions are found by bddgen itself, globally, from
// features/steps/*.ts (the same way features/*.e2e.spec.ts already works),
// not per-feature -- and bddgen's own `missingSteps: 'fail-on-gen'` throws
// when a .feature has an unmatched *step*, which is a finer-grained forward
// guarantee than the old feature<->steps-file pairing this replaces, so
// nothing is lost by dropping it.
import path from 'node:path'
import { listFeatureFiles } from '../feature-files.ts'
import { parseSingleStringFlag } from '../single-flag-arg.ts'

export interface MutationTarget {
  feature: string
}

export function discoverTargets(featuresDir: string): MutationTarget[] {
  return listFeatureFiles(featuresDir).map((feature) => ({ feature }))
}

/**
 * Narrows `targets` to the one named by `--feature`, accepting the bare
 * slice name, the bare `.feature` filename, or (once a target is nested)
 * its full relative path -- a match on either the target's whole `feature`
 * or just its basename. Returns `targets` unchanged when `featureArg` is
 * `undefined`.
 *
 * @throws Error if no target matches `featureArg`.
 * @throws Error if more than one target matches (naming every candidate) -- e.g. two nested targets sharing a basename.
 */
export function filterTargets(targets: MutationTarget[], featureArg: string | undefined): MutationTarget[] {
  if (featureArg === undefined) return targets
  const normalized = featureArg.endsWith('.feature') ? featureArg : `${featureArg}.feature`
  const matches = targets.filter(
    (target) => target.feature === normalized || path.basename(target.feature) === normalized,
  )
  if (matches.length === 0) {
    throw new Error(`Unknown --feature "${featureArg}" -- no target named ${normalized}`)
  }
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous --feature "${featureArg}" -- matches more than one target: ${matches.map((m) => m.feature).join(', ')}`,
    )
  }
  return matches
}

/**
 * The only flag run.ts's main() takes: `--feature <name>` scopes the run to
 * one target (see filterTargets above).
 *
 * @throws Error naming the accepted form, on any unknown flag, missing value, or positional argument.
 */
// A thin wrapper over single-flag-arg.ts's parseSingleStringFlag, kept here
// rather than inlined at the call site, for the same reason as above --
// run.ts is excluded from crap4ts/Stryker's scripts/ scope by their
// `run.ts`-at-any-depth globs, so the one line of logic (translating a
// `string | undefined` into `{ feature } | {}`) needs to live somewhere
// covered.
export function parseArgs(argv: string[]): { feature?: string } {
  const feature = parseSingleStringFlag(argv, 'feature', '--feature <name>')
  return feature === undefined ? {} : { feature }
}
