// Pairs each .feature file with the .steps.test file that implements it,
// discovered from the filesystem rather than a hand-maintained table -- the
// old TARGETS array went stale independently of gherkin-dry-checker's own
// hardcoded FEATURE_FILES list, the same failure mode in two places. Accepts
// both `.steps.test.ts` and `.steps.test.tsx`: that extension is the
// discriminator between the node/direct-call and jsdom/RTL step-definition
// forms during the migration to the latter, and both coexist while it's in
// progress.
import { readdirSync } from 'node:fs'
import { parseArgs as nodeParseArgs } from 'node:util'
import { listFeatureFiles } from '../feature-files.ts'

export interface MutationTarget {
  feature: string
  steps: string
}

const STEPS_SUFFIX = /\.steps\.test\.tsx?$/

// Pure pairing over an already-read file list, so it's testable without
// touching a filesystem. `featureNames` and `allFileNames` are separate
// parameters rather than one list filtered internally twice, since callers
// (discoverTargets below, and tests) already have both.
export function pairTargets(featureNames: string[], allFileNames: string[]): MutationTarget[] {
  const stepsFiles = allFileNames.filter((name) => STEPS_SUFFIX.test(name))
  const targets: MutationTarget[] = []
  const claimed = new Set<string>()

  for (const feature of featureNames) {
    const base = feature.slice(0, -'.feature'.length)
    const matches = stepsFiles.filter(
      (steps) => steps === `${base}.steps.test.ts` || steps === `${base}.steps.test.tsx`,
    )
    if (matches.length === 0) {
      throw new Error(
        `${feature} has no matching steps file (expected ${base}.steps.test.ts or ${base}.steps.test.tsx)`,
      )
    }
    if (matches.length > 1) {
      throw new Error(`${feature} matches more than one steps file: ${matches.join(', ')}`)
    }
    targets.push({ feature, steps: matches[0] })
    claimed.add(matches[0])
  }

  const orphanSteps = stepsFiles.filter((steps) => !claimed.has(steps))
  if (orphanSteps.length > 0) {
    throw new Error(`Steps file(s) with no matching .feature file: ${orphanSteps.join(', ')}`)
  }

  return targets
}

export function discoverTargets(featuresDir: string): MutationTarget[] {
  const featureNames = listFeatureFiles(featuresDir)
  const allFileNames = readdirSync(featuresDir)
  return pairTargets(featureNames, allFileNames)
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
export function parseArgs(argv: string[]): { feature?: string } {
  const { values } = nodeParseArgs({
    args: argv,
    options: { feature: { type: 'string' } },
    strict: true,
    allowPositionals: false,
  })
  return values.feature === undefined ? {} : { feature: values.feature }
}
