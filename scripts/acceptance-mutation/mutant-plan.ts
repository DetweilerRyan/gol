// The pure half of "what mutants does this run consist of": given each active
// target's feature text and its mutable Examples cells, produce one record per
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
// What is worth gating here is the ordinal-to-cell correspondence.
// `buildMutantRecords` is the one place a mutant's filename and its mutated
// text are decided, and classification later looks a result up *by that
// filename* (run.ts -> specFileName -> summary.bySpecFile). A record whose
// name and text came from different cells would misattribute a real kill or a
// real survivor and there would be nothing in the output to notice it by --
// exactly the "confident number about nothing" class this program guards
// against everywhere else. Building both from the same `cell` in one
// expression is what makes that drift unrepresentable, and it is a property a
// test can pin.
//
// No filesystem access here: reading the feature files is run.ts's job, and
// writing the mutants is too. This module only decides what they contain.
import type { MutationTarget } from './discovery.ts'
import { applyMutation, type MutableCell } from './gherkin-examples.ts'
import { mutantFeatureFileName } from './mutant-tree.ts'
import { mutateValue } from './mutation-rules.ts'

// One target, already read off disk: which feature it is, its unmutated text,
// and every Examples cell in it that can be mutated.
export interface TargetPlan {
  target: MutationTarget
  featureText: string
  cells: MutableCell[]
}

export interface MutantRecord {
  target: MutationTarget
  cell: MutableCell
  mutatedValue: string
  fileName: string
  text: string
}

// The mutation-value seed. Deliberately built from the target and the cell's
// own address rather than from the run -- a mutant's value must be the same on
// every run, or a survivor found today could not be reproduced tomorrow.
// Exported so a test can pin the format rather than restate it.
export function mutantSeedKey(featureFileName: string, cell: MutableCell): string {
  return `${featureFileName}:${cell.rowIndex}:${cell.columnName}`
}

// Ordinals restart at 0 per target, which is safe only because
// mutantFeatureFileName prefixes the target's own base name (see mutant-tree.ts):
// every mutant across every target shares one `features/` directory in the
// batched design, so "mutant-0" alone would collide.
export function buildMutantRecords(activePlans: TargetPlan[]): MutantRecord[] {
  const records: MutantRecord[] = []
  for (const plan of activePlans) {
    plan.cells.forEach((cell, ordinal) => {
      const mutatedValue = mutateValue(cell.value, mutantSeedKey(plan.target.feature, cell))
      records.push({
        target: plan.target,
        cell,
        mutatedValue,
        fileName: mutantFeatureFileName(plan.target.feature, ordinal),
        text: applyMutation(plan.featureText, cell, mutatedValue),
      })
    })
  }
  return records
}
