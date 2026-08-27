#!/usr/bin/env tsx
// Acceptance mutation runner, following the concept (not the toolchain) of
// https://github.com/unclebob/Acceptance-Pipeline-Specification: mutate one
// Gherkin example cell at a time and check whether the acceptance scenario
// notices. This mutates *specification data*, never source code -- see
// scripts/acceptance-mutation/mutation-rules.ts for the value rules.
//
// Which values are mutable, and how a mutant is located and rendered, is
// mutation-sites.ts's job (see gherkin-document.ts for the AST adapter it
// sits on) -- this file only asks it for every target's mutation sites and
// prints the result generically, by seedKey, so a new site kind never
// requires a change here.
//
// Batched Playwright design (architect-ratified, superseding the old
// one-vitest-spawn-per-mutant form): every mutant and every baseline is
// written as its own `.feature` file into a shared temp `features/`
// directory, and one `bddgen` + one `playwright test` invocation runs every
// generated spec in that directory at once (see mutant-plan.ts,
// mutant-tree.ts and playwright-runner.ts). This is *two* phases, not one combined batch:
//
//   Phase 1 writes only the unmutated baseline copy of each target that has
//   at least one mutable Examples cell, generates and runs it, and records
//   each target's baseline spec count. Aborts before any mutant is written
//   if a baseline isn't green (assertBaselineSpecGreen in classify.ts) --
//   there is then no trustworthy count to compare that target's mutants
//   against, so proceeding would misreport every one of them rather than
//   merely under-report.
//
//   Phase 2 writes every mutant across every active target, generates and
//   runs the whole batch, and classifies each mutant against its target's
//   phase-1 baseline count.
//
// Combining both into one batch would lose the "abort before any mutation"
// guarantee: a broken baseline and a broken mutant would be indistinguishable
// once everything runs together.
//
// The temp tree lives under .features-gen/acceptance-mutation/ (inside the
// repo, not the OS tmpdir) -- playwright-bdd's module resolution fails
// out-of-tree, and .features-gen/ is already covered by .gitignore,
// .prettierignore, .oxlintrc.json, and vite.config.ts's sharedExclude.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertBaselineSpecGreen, classifyMutant, summarizeResults, type Outcome } from './classify.ts'
import { discoverTargets, filterTargets, parseArgs, type MutationTarget } from './discovery.ts'
import { GherkinException } from './gherkin-document.ts'
import { listMutationSites } from './mutation-sites.ts'
import { buildMutantRecords, type TargetPlan } from './mutant-plan.ts'
import { baselineFeatureFileName, specFileName } from './mutant-tree.ts'
import { displaySite } from './report-format.ts'
import {
  bddgenSpawn,
  genSpawnFailureReason,
  playwrightTestSpawn,
  readPlaywrightSummary,
  runGenSpawn,
  runLevelAbortReason,
  sumSkipped,
} from './playwright-runner.ts'

// `site` is the mutation site's own seedKey, stored whole and only ever
// trimmed presentationally (report()'s displaySite call strips the row's own
// feature-name prefix so the table doesn't repeat it) -- never decomposed
// back into row/column. A kind-specific decomposition here would be exactly
// the "run.ts changes when a new site kind is added" outcome the site
// abstraction exists to avoid. For today's only kind (examples-cell) that
// seedKey already reads as `feature:row:column`, so nothing is lost; a
// step-text mutant's seedKey would print with the same column and mean
// something else entirely, which is fine -- this report doesn't need to
// know which.
interface MutantResult {
  feature: string
  site: string
  original: string
  mutated: string
  outcome: Outcome
}

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const FEATURES_DIR = path.join(REPO_ROOT, 'features')
const GEN_BASE_DIR = path.join(REPO_ROOT, '.features-gen/acceptance-mutation')

function resolveTargets(): MutationTarget[] {
  const { feature } = parseArgs(process.argv.slice(2))
  return filterTargets(discoverTargets(FEATURES_DIR), feature)
}

// The I/O half of planning: reading each target's feature text off disk. What
// the mutants derived from it then are is mutant-plan.ts's, which is pure and
// therefore inside crap4ts/Stryker's scripts/ scope -- this file is not, by
// the `**/run.ts` exclusion both configs carry.
//
// listMutationSites parses real Gherkin (gherkin-document.ts's AST adapter)
// rather than scanning lines, so a malformed .feature throws a
// GherkinException instead of silently producing a wrong or empty set of
// sites. That's deliberately not caught inside mutation-sites.ts or
// gherkin-document.ts -- letting it throw and attaching context here, at the
// one place that knows which target's feature file was being read, is this
// program's abort-loudly ethos applied to a parse failure the same way it's
// already applied to a bad baseline or a run-level Playwright error.
//
// listMutationSites can also throw for a reason that has nothing to do with
// parsing -- its own assertUniqueSeedKeys, on a duplicate seedKey across a
// target's sites. Re-labelling that as "Failed to parse" would be a
// confidently wrong diagnosis: the file parsed fine, and the actual message
// (which duplicated keys, which lines, what to do about it) would be
// buried inside a string that tells the reader to look for a syntax error
// instead. Narrow the catch to GherkinException specifically -- the real
// parse-failure case -- and let anything else propagate as itself.
function loadTargetPlans(targets: MutationTarget[]): TargetPlan[] {
  return targets.map((target) => {
    const featureText = readFileSync(path.join(FEATURES_DIR, target.feature), 'utf8')
    try {
      return { target, featureText, sites: listMutationSites(featureText, target.feature) }
    } catch (err) {
      if (err instanceof GherkinException) {
        throw new Error(`Failed to parse ${target.feature}: ${err.message}`)
      }
      throw err
    }
  })
}

// The two run-level stop conditions runLevelAbortReason enforces, plus the
// per-spec skipped count sumSkipped (playwright-runner.ts) totals up --
// unlike flaky/errors, that one is enforced one level down, inside
// classifyMutant/assertBaselineSpecGreen (a skipped spec scores `error`,
// never silently folds into a kill or a survive). All three are carried
// back out of a phase that *didn't* abort. `errored: 0` plus a clean exit
// is real evidence every one of them was zero (see runLevelAbortReason and
// classify.ts's own comments) -- printing this in report() is what makes
// that evidence visible to a reader instead of only to the code that
// checked it.
interface PhaseStats {
  flaky: number
  errors: number
  skipped: number
}

// Phase 1: write one unmutated copy per active target, run the batch once,
// and return each target's feature filename mapped to its baseline spec
// count, alongside the phase's own run-level stats. Throws (aborting before
// any mutant is written) if bddgen fails, the Playwright run itself reports
// a run-level problem, or any one target's baseline isn't green.
function runBaselinePhase(activePlans: TargetPlan[]): { baselineCounts: Map<string, number>; stats: PhaseStats } {
  const dir = mkdtempSync(path.join(GEN_BASE_DIR, 'baseline-'))
  try {
    const featuresDir = path.join(dir, 'features')
    mkdirSync(featuresDir, { recursive: true })
    for (const plan of activePlans) {
      writeFileSync(path.join(featuresDir, baselineFeatureFileName(plan.target.feature)), plan.featureText)
    }

    const genFailure = genSpawnFailureReason('bddgen (baseline phase)', runGenSpawn(bddgenSpawn(dir)))
    if (genFailure) throw new Error(genFailure)

    const jsonOutputPath = path.join(dir, 'baseline-results.json')
    runGenSpawn(playwrightTestSpawn(dir, jsonOutputPath))
    const summary = readPlaywrightSummary(jsonOutputPath)
    const abortReason = runLevelAbortReason(summary)
    if (abortReason) throw new Error(`Baseline phase aborted: ${abortReason}`)

    const baselineCounts = new Map<string, number>()
    for (const plan of activePlans) {
      const spec = specFileName(baselineFeatureFileName(plan.target.feature))
      const count = assertBaselineSpecGreen(plan.target.feature, spec, summary!.bySpecFile[spec])
      baselineCounts.set(plan.target.feature, count)
    }
    return { baselineCounts, stats: { flaky: summary!.flaky, errors: summary!.errors, skipped: sumSkipped(summary!) } }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// Phase 2: write every mutant across every active target, run the batch
// once, and classify each mutant against its target's phase-1 baseline
// count, alongside the phase's own run-level stats. Throws (surfacing the
// whole run as an error) on the same run-level conditions phase 1 checks --
// neither is attributable to any one mutant, so neither can be scored as a
// per-mutant outcome.
function runMutantPhase(
  activePlans: TargetPlan[],
  baselineCounts: Map<string, number>,
): { results: MutantResult[]; stats: PhaseStats } {
  const records = buildMutantRecords(activePlans)

  const dir = mkdtempSync(path.join(GEN_BASE_DIR, 'mutants-'))
  try {
    const featuresDir = path.join(dir, 'features')
    mkdirSync(featuresDir, { recursive: true })
    for (const record of records) {
      writeFileSync(path.join(featuresDir, record.fileName), record.text)
    }

    const genFailure = genSpawnFailureReason('bddgen (mutant phase)', runGenSpawn(bddgenSpawn(dir)))
    if (genFailure) throw new Error(genFailure)

    const jsonOutputPath = path.join(dir, 'mutant-results.json')
    runGenSpawn(playwrightTestSpawn(dir, jsonOutputPath))
    const summary = readPlaywrightSummary(jsonOutputPath)
    const abortReason = runLevelAbortReason(summary)
    if (abortReason) throw new Error(`Mutant phase aborted: ${abortReason}`)

    const results = records.map((record) => {
      const spec = specFileName(record.fileName)
      const baselineTotalTests = baselineCounts.get(record.target.feature)!
      const outcome = classifyMutant(baselineTotalTests, summary!.bySpecFile[spec])
      return {
        feature: record.target.feature,
        site: record.site.seedKey,
        original: record.site.value,
        mutated: record.mutatedValue,
        outcome,
      }
    })
    return { results, stats: { flaky: summary!.flaky, errors: summary!.errors, skipped: sumSkipped(summary!) } }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function main(): void {
  let targets: MutationTarget[]
  try {
    targets = resolveTargets()
  } catch (err) {
    console.error((err as Error).message)
    process.exit(1)
  }

  let plans: TargetPlan[]
  try {
    plans = loadTargetPlans(targets)
  } catch (err) {
    console.error((err as Error).message)
    process.exit(1)
  }
  // A target whose .feature carries no Examples table contributes zero
  // mutants -- it is reported, never silently dropped, but nothing is written
  // or spawned on its behalf (see summarizeResults in classify.ts for the
  // NaN%-at-zero-mutants defect this separation exists to close). Note this
  // cannot report a target `--feature` excluded: filterTargets runs before
  // loadTargetPlans, so an unselected target never becomes a plan at all. The
  // printed label says so, rather than claiming a coverage it doesn't have.
  const activePlans = plans.filter((p) => p.sites.length > 0)
  const zeroMutantFeatures = plans.filter((p) => p.sites.length === 0).map((p) => p.target.feature)

  let results: MutantResult[] = []
  // Named by phase so a printed 0 is legible as "checked, and clean" for
  // that specific phase, rather than a single run-wide total that can't
  // distinguish "baseline was clean, mutant phase wasn't" from the reverse.
  const phaseStats: { phase: string; stats: PhaseStats }[] = []
  if (activePlans.length > 0) {
    mkdirSync(GEN_BASE_DIR, { recursive: true })
    try {
      const baseline = runBaselinePhase(activePlans)
      phaseStats.push({ phase: 'baseline', stats: baseline.stats })
      const mutants = runMutantPhase(activePlans, baseline.baselineCounts)
      phaseStats.push({ phase: 'mutant', stats: mutants.stats })
      results = mutants.results
    } catch (err) {
      console.error((err as Error).message)
      process.exit(1)
    }
  }

  report(results, zeroMutantFeatures, phaseStats)

  const survivedOrErrored = results.filter((r) => r.outcome !== 'killed')
  process.exit(survivedOrErrored.length > 0 ? 1 : 0)
}

function report(
  results: MutantResult[],
  zeroMutantFeatures: string[],
  phaseStats: { phase: string; stats: PhaseStats }[],
): void {
  if (results.length > 0) {
    // The Site column drops each row's own feature name off the front of its
    // seedKey (displaySite, report-format.ts) -- the Feature column already
    // says it, so printing it twice per row bought nothing. Widths are
    // computed off the same trimmed strings the rows themselves print.
    const sites = results.map((r) => displaySite(r.feature, r.site))
    const widths = {
      feature: Math.max(7, ...results.map((r) => r.feature.length)),
      site: Math.max(4, ...sites.map((s) => s.length)),
      original: Math.max(8, ...results.map((r) => r.original.length)),
      mutated: Math.max(7, ...results.map((r) => r.mutated.length)),
      outcome: 8,
    }
    const pad = (s: string | number, w: number) => String(s).padEnd(w)
    const header = `${pad('Feature', widths.feature)}  ${pad('Site', widths.site)}  ${pad('Original', widths.original)}  ${pad('Mutated', widths.mutated)}  Outcome`
    console.log(header)
    console.log('-'.repeat(header.length))
    results.forEach((r, i) => {
      const marker = r.outcome === 'killed' ? '✓' : r.outcome === 'survived' ? '✗' : '!'
      console.log(
        `${pad(r.feature, widths.feature)}  ${pad(sites[i], widths.site)}  ${pad(r.original, widths.original)}  ${pad(r.mutated, widths.mutated)}  ${marker} ${r.outcome}`,
      )
    })
    console.log('-'.repeat(header.length))
  }

  if (zeroMutantFeatures.length > 0) {
    console.log(`0 mutants (no Examples table): ${zeroMutantFeatures.join(', ')}`)
  }

  // flaky/errors are enforced by runLevelAbortReason (a nonzero either one
  // throws before this point is ever reached); skipped is enforced one
  // level down, per spec, by classifyMutant/assertBaselineSpecGreen (see
  // PhaseStats' own comment). All three are printed here so that
  // enforcement is auditable rather than only implicit in a clean exit.
  // retries:0 in playwright.acceptance-mutation.config.ts is what makes a
  // nonzero flaky count here mean "something outside this run re-ran a
  // test" rather than an ordinary retry succeeding.
  for (const { phase, stats } of phaseStats) {
    console.log(`${phase} phase: ${stats.flaky} flaky, ${stats.errors} run-level error(s), ${stats.skipped} skipped`)
  }

  const { total, killed, survived, errored, scorePercent } = summarizeResults(results)
  console.log(
    `${total} mutants | ${killed} killed | ${survived} survived | ${errored} errored | mutation score: ${scorePercent}%`,
  )
}

// Guards against running main() as a side effect of an import -- if run.ts
// ever grows tests of its own that import resolveTargets/runBaselinePhase/
// runMutantPhase, none of them should trigger a real process.exit.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
