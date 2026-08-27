// The pure half of "what mutants does this run consist of": given each active
// target's feature text and its mutation sites, produce one record per
// mutant -- the mutated value, the filename it will be written under, and the
// mutated feature text itself.
//
// Split out of run.ts rather than left there, for the reason
// crap4ts.scripts.config.ts states about every `**/run.ts`: those files are
// excluded from crap4ts and Stryker as I/O shells, so a pure function left in
// one is invisible to both gates. This is the same relocation the
// acceptance-mutation-on-playwright cleanup made for playwright-runner.ts's
// sumSkipped, applied to the larger sibling it left behind.
//
// What is worth gating here is the ordinal-to-site correspondence.
// `buildMutantRecords` is the one place a mutant's filename and its mutated
// text are decided, and classification later looks a result up *by that
// filename* (run.ts -> specFileName -> summary.bySpecFile). A record whose
// name and text came from different sites would misattribute a real kill or
// a real survivor and there would be nothing in the output to notice it by --
// exactly the "confident number about nothing" class this program guards
// against everywhere else. Building both from the same `site` in one
// expression is what makes that drift unrepresentable, and it is a property
// a test can pin.
//
// This module knows nothing about what kind of site it is mutating --
// mutation-sites.ts's registries own that dispatch. A future site kind
// (step text, a DocString, ...) needs no change here: MutationSite already
// carries its own seedKey and its renderer is looked up by `site.kind`.
//
// No filesystem access here: reading the feature files is run.ts's job, and
// writing the mutants is too. This module only decides what they contain.
import type { MutationTarget } from './discovery.ts'
import { renderMutantText, type MutationSite } from './mutation-sites.ts'
import { mutantFeatureFileName } from './mutant-tree.ts'
import { mutateValue } from './mutation-rules.ts'

// One target, already read off disk: which feature it is, its unmutated text,
// and every mutation site in it.
export interface TargetPlan {
  target: MutationTarget
  featureText: string
  sites: MutationSite[]
}

export interface MutantRecord {
  target: MutationTarget
  site: MutationSite
  mutatedValue: string
  fileName: string
  text: string
}

// Ordinals restart at 0 per target, which is safe only because
// mutantFeatureFileName prefixes the target's own base name (see mutant-tree.ts):
// every mutant across every target shares one `features/` directory in the
// batched design, so "mutant-0" alone would collide.
export function buildMutantRecords(activePlans: TargetPlan[]): MutantRecord[] {
  const records: MutantRecord[] = []
  for (const plan of activePlans) {
    plan.sites.forEach((site, ordinal) => {
      const mutatedValue = mutateValue(site.value, site.seedKey)
      records.push({
        target: plan.target,
        site,
        mutatedValue,
        fileName: mutantFeatureFileName(plan.target.feature, ordinal),
        text: renderMutantText(plan.featureText, site, mutatedValue),
      })
    })
  }
  return records
}
