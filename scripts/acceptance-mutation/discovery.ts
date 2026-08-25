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
import { parseArgs as nodeParseArgs } from 'node:util'
import { listFeatureFiles } from '../feature-files.ts'

export interface MutationTarget {
  feature: string
}

export function discoverTargets(featuresDir: string): MutationTarget[] {
  return listFeatureFiles(featuresDir).map((feature) => ({ feature }))
}

// `--feature` narrows a run to one target, accepting either the bare slice
// name or the full `.feature` filename. An unrecognized name throws rather
// than silently matching nothing -- the same silent-empty-glob hazard
// listFeatureFiles guards against, one level up.
export function filterTargets(targets: MutationTarget[], featureArg: string | undefined): MutationTarget[] {
  if (featureArg === undefined) return targets
  const normalized = featureArg.endsWith('.feature') ? featureArg : `${featureArg}.feature`
  const match = targets.find((target) => target.feature === normalized)
  if (!match) {
    throw new Error(`Unknown --feature "${featureArg}" -- no target named ${normalized}`)
  }
  return [match]
}

// The only flag run.ts's main() takes: `--feature <name>` scopes the run to
// one target (see filterTargets above). A thin wrapper over node:util's
// parseArgs, kept here rather than inlined at the call site, for the same
// reason as above -- run.ts is excluded from crap4ts/Stryker's scripts/
// scope by their `**/run.ts` globs, so the one line of logic (translating
// parseArgs' `values` shape into `{ feature } | {}`) needs to live somewhere
// covered.
//
// This used to be hand-rolled, and was re-derived three times over one
// slice's iterations -- unknown-flag rejection, missing-value rejection,
// and positional rejection are each things node:util's parseArgs has done
// since Node 18.3, under `strict: true` (the default) and
// `allowPositionals: false` (also the default once strict is true). Check
// the stdlib before writing the loop.
//
// Node's own rejection messages (e.g. "Unknown option '--nope'") name the
// offending argument but not what *is* valid, and an agent invoking this
// tool has to know both to recover. Catch and re-throw with the accepted
// form appended, rather than replacing Node's text -- this is a message
// fix, not a reason to reclaim the parsing logic itself.
export function parseArgs(argv: string[]): { feature?: string } {
  let values: { feature?: string }
  try {
    ;({ values } = nodeParseArgs({
      args: argv,
      options: { feature: { type: 'string' } },
      strict: true,
      allowPositionals: false,
    }))
  } catch (error) {
    // `as Error` rather than an `error instanceof Error` narrowing: parseArgs
    // throws only ERR_PARSE_ARGS_* / ERR_INVALID_ARG_TYPE, all Error
    // subclasses, so the non-Error arm would be unreachable by construction --
    // and unreachable defensive code is invisible to every gate here (Stryker
    // has no mutator for `instanceof`, so it generates no mutant on such a
    // ternary at all, and crap4ts scores line coverage, which a never-taken
    // branch on an executed line doesn't move). Same idiom as run.ts's own
    // `(err as Error).message`.
    throw new Error(`${(error as Error).message}. The only accepted argument is --feature <name>.`)
  }
  return values.feature === undefined ? {} : { feature: values.feature }
}
