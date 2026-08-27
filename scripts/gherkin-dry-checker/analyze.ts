// Turns a flat list of parsed steps into DRY findings, per
// ir-dry-checker-spec.md's five finding kinds. Deliberately extended beyond
// the spec's single-feature-per-invocation scope: steps here are tagged with
// a `feature` field and analyzed across the whole project's Gherkin corpus,
// so cross-file vocabulary drift (the same step wording reused, or nearly
// reused, in a different .feature file) is caught too -- see run.ts.
import {
  jaccardSimilarity,
  NEAR_DUPLICATE_THRESHOLD,
  POSSIBLE_SYNONYM_THRESHOLD,
  slotPlaceholders,
  tokenize,
} from './similarity.ts'
import type { ParsedStep, StepSection } from './step-parser.ts'

// A parsed step tagged with the .feature file it came from -- the extra field
// that lifts this analysis from single-file to whole-corpus scope.
export interface CorpusStep extends ParsedStep {
  feature: string
}

// The snake_case field names below are the report's JSON wire format
// (reports/gherkin-dry/report.json), matching ir-dry-checker-spec.md's schema
// rather than this codebase's camelCase convention.
export interface StepLocation {
  feature: string
  section: StepSection
  scenario_index: number | null
  scenario_name: string | null
  step_index: number
  keyword: string
}

export interface FindingMember {
  text: string
  location: StepLocation
}

export type FindingKind =
  'duplicate-in-scenario' | 'exact-duplicate' | 'placeholder-variant' | 'near-duplicate' | 'possible-synonym'

export type FindingConfidence = 'high' | 'medium' | 'low'

export interface Finding {
  kind: FindingKind
  confidence: FindingConfidence
  canonical_candidate: string
  pattern_candidate: string | null
  members: FindingMember[]
  reason: string
  suggested_action: string
  // Only the similarity-derived kinds carry a Jaccard score; the exact and
  // placeholder-normalized kinds are matches, not scored comparisons.
  score?: number
}

export interface DryReport {
  schema_version: number
  summary: {
    step_occurrences: number
    unique_steps: number
    findings: number
  }
  findings: Finding[]
}

type StepsByText = Map<string, CorpusStep[]>

function toLocation(step: CorpusStep): StepLocation {
  return {
    feature: step.feature,
    section: step.section,
    scenario_index: step.scenarioIndex,
    scenario_name: step.scenarioName,
    step_index: step.stepIndex,
    keyword: step.keyword,
  }
}

function toMember(step: CorpusStep): FindingMember {
  return { text: step.text, location: toLocation(step) }
}

function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }
  return groups
}

function scenarioKey(step: CorpusStep): string {
  return `${step.feature}::${step.section}::${step.scenarioIndex}`
}

// The dedupe set's key for an unordered pair of step texts. It MUST be
// injective over unordered pairs: the same key is built on both the add side
// (findPlaceholderVariants) and the lookup side (findTokenSimilarities), so
// two different pairs sharing a key make `dedupePairs.has()` answer "already
// explained" about a pair nothing explained, and that pair's own finding
// silently vanishes from the report. Nothing downstream would notice -- this
// program exits 0 whatever it prints, so its tests are the only observer.
//
// `[a, b].sort().join(' ')` was NOT injective and did drop real findings:
// step texts contain spaces, so {"<alpha> x", "<beta> <gamma> x <delta>"}
// and {"<alpha> x <beta>", "<gamma> x <delta>"} both join to the same string
// (measured on unmutated source -- the first pair's near-duplicate finding
// disappears as soon as the second pair is in the corpus). JSON.stringify
// escapes the members, so no member can forge the delimiter.
//
// Exported for analyze.property.test.ts alone -- it is the one contract in
// this file a fixture cannot state, since injectivity is a claim about every
// pair of pairs rather than about four witnesses. Nothing else imports it and
// it is not part of the analysis surface; analyzeSteps is.
export function pairKey(a: string, b: string): string {
  // `.sort()` canonicalizes the pair, so the key does not depend on the order
  // the caller happens to hold the two texts in. That IS this function's
  // contract and its removal is a killed mutant, not an equivalent one.
  // Killed twice over in analyze.property.test.ts, and the distinction
  // matters: the order-independence PROPERTY kills it in `npm run
  // test:scripts` but cannot kill it in `npm run test:mutation:scripts` (a
  // property's title carries fast-check's per-run seed and Stryker filters
  // mutant runs by dry-run test name, so it never runs there -- measured);
  // the deterministic `it.each` twin beside it is what the gate sees.
  // Removing it would not change today's report, since
  // findPlaceholderVariants registers both orders and a lookup built in
  // either order still hits -- but that is the caller's loop shape, which
  // this function does not get to depend on.
  return JSON.stringify([a, b].sort())
}

function findDuplicatesInScenario(steps: CorpusStep[]): Finding[] {
  const findings: Finding[] = []
  const bySceneAndText = groupBy(steps, (s) => `${scenarioKey(s)}::${s.text}`)
  for (const members of bySceneAndText.values()) {
    if (members.length < 2) continue
    findings.push({
      kind: 'duplicate-in-scenario',
      confidence: 'high',
      canonical_candidate: members[0].text,
      pattern_candidate: null,
      members: members.map(toMember),
      reason: `The same step text appears ${members.length} times within one scenario/background.`,
      suggested_action:
        'Split into distinct scenarios, or confirm the repetition is intentional (e.g. asserting multiple facts after one action).',
    })
  }
  return findings
}

function findExactDuplicatesAcrossScenarios(byText: StepsByText): Finding[] {
  const findings: Finding[] = []
  for (const [text, members] of byText) {
    const distinctScenarios = new Set(members.map(scenarioKey))
    // `members.length < 2` is mutation-equivalent to `false` here: a Set
    // built from `members` can never exceed `members.length`, so whenever
    // the first disjunct is true the second is too. Left in as an early,
    // cheaper check ahead of building the Set, not because a reachable input
    // distinguishes the two.
    if (members.length < 2 || distinctScenarios.size < 2) continue
    findings.push({
      kind: 'exact-duplicate',
      confidence: 'high',
      canonical_candidate: text,
      pattern_candidate: null,
      members: members.map(toMember),
      reason: `The same step text appears ${members.length} times across ${distinctScenarios.size} scenarios/backgrounds.`,
      suggested_action:
        'Confirm this shared vocabulary is intentional reuse; consider a Background or a shared step library if the setup is truly identical.',
    })
  }
  return findings
}

function findPlaceholderVariants(byText: StepsByText, dedupePairs: Set<string>): Finding[] {
  const findings: Finding[] = []
  const uniqueTexts = [...byText.keys()]
  const bySlottedForm = groupBy(uniqueTexts, (text) => slotPlaceholders(text))

  for (const texts of bySlottedForm.values()) {
    if (texts.length < 2) continue
    // Non-null: every text here came out of byText's own key set.
    const members = texts.flatMap((text) => byText.get(text)!.map(toMember))
    findings.push({
      kind: 'placeholder-variant',
      confidence: 'high',
      canonical_candidate: texts[0],
      pattern_candidate: slotPlaceholders(texts[0]),
      members,
      reason:
        'These step texts are identical once placeholder names are normalized to generic slots -- likely the same logical step with inconsistent placeholder naming.',
      suggested_action: 'Rename placeholders consistently, or unify into a single step definition.',
    })
    for (const a of texts) {
      for (const b of texts) {
        // Mutation-equivalent to `true` now that pairKey is injective: a
        // self-pair key can only ever equal another self-pair's, and every
        // lookup key is built from two distinct byText keys. Measured --
        // forcing the branch leaves all 649 of `npm run test:scripts` green.
        // It is a real guard against a non-injective key, though: see
        // pairKey's comment and the collision cases in analyze.test.ts.
        if (a !== b) dedupePairs.add(pairKey(a, b))
      }
    }
  }
  return findings
}

// Describes one scored pair. The score decides both the kind and how strongly
// to phrase it, so all three of those reads live here rather than inline in
// the pair scan below.
function toSimilarityFinding(byText: StepsByText, textA: string, textB: string, score: number): Finding {
  const kind: FindingKind = score >= NEAR_DUPLICATE_THRESHOLD ? 'near-duplicate' : 'possible-synonym'
  return {
    kind,
    confidence: kind === 'near-duplicate' ? 'medium' : 'low',
    canonical_candidate: textA,
    pattern_candidate: null,
    // Non-null: both texts came out of byText's own key set.
    members: [...byText.get(textA)!.map(toMember), ...byText.get(textB)!.map(toMember)],
    reason: `Token similarity ${score.toFixed(2)} after placeholder removal.`,
    suggested_action:
      kind === 'near-duplicate'
        ? 'Likely the same logical step with slightly different wording -- consider unifying the step definitions.'
        : 'Possibly related steps; review for accidental wording drift.',
    score: Number(score.toFixed(2)),
  }
}

function findTokenSimilarities(byText: StepsByText, dedupePairs: Set<string>): Finding[] {
  const findings: Finding[] = []
  const uniqueTexts = [...byText.keys()]
  const tokensByText = new Map(uniqueTexts.map((text) => [text, tokenize(text)]))

  // Both loop bounds (`i < ...` / `j < ...`) are mutation-equivalent to
  // `<=`: a mutated outer bound adds one extra `i` with `j` starting at
  // `i + 1`, whose own (unmutated) bound then rejects it immediately, so the
  // inner loop body never runs; a mutated inner bound adds one extra `j`
  // whose `uniqueTexts[j]` is `undefined`, so `tokensByText.get(textB)` is
  // undefined too and `jaccardSimilarity` treats it as an empty set --
  // `score` is always 0, which always fails the threshold check below and
  // is always skipped. Neither extra iteration can be observed either way.
  for (let i = 0; i < uniqueTexts.length; i++) {
    for (let j = i + 1; j < uniqueTexts.length; j++) {
      const textA = uniqueTexts[i]
      const textB = uniqueTexts[j]
      if (dedupePairs.has(pairKey(textA, textB))) continue

      // Non-null: tokensByText was built from exactly byText's key set.
      const score = jaccardSimilarity(tokensByText.get(textA)!, tokensByText.get(textB)!)
      if (score < POSSIBLE_SYNONYM_THRESHOLD) continue

      findings.push(toSimilarityFinding(byText, textA, textB, score))
    }
  }
  return findings
}

export function analyzeSteps(steps: CorpusStep[]): DryReport {
  const byText = groupBy(steps, (s) => s.text)
  const dedupePairs = new Set<string>()

  const findings = [
    ...findDuplicatesInScenario(steps),
    ...findExactDuplicatesAcrossScenarios(byText),
    ...findPlaceholderVariants(byText, dedupePairs),
    ...findTokenSimilarities(byText, dedupePairs),
  ]

  return {
    schema_version: 1,
    summary: {
      step_occurrences: steps.length,
      unique_steps: byText.size,
      findings: findings.length,
    },
    findings,
  }
}
