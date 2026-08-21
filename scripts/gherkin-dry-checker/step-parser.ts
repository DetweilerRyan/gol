// Extracts step objects (keyword, text, location) from raw Gherkin text, for
// the same feature-file subset described in the Acceptance Pipeline
// Specification's parser-spec.md: Feature/Background/Scenario/Scenario
// Outline/Examples declarations, Given/When/Then/And/But steps.
//
// Outside that subset: tags, `Rule:`, data tables, and doc strings. The first
// three fall through harmlessly -- they match no declaration prefix and no
// step keyword -- but a doc-string line that begins with a step keyword would
// be read as a step. No feature file here uses doc strings, and supporting one
// means tracking its `"""` fences, not just skipping lines.

// A step belongs either to a Background (shared, no owning scenario) or to a
// Scenario/Scenario Outline. Background steps carry null scenario index/name
// precisely because they aren't scoped to one scenario.
export type StepSection = 'background' | 'scenario'

export interface ParsedStep {
  section: StepSection
  scenarioIndex: number | null
  scenarioName: string | null
  stepIndex: number
  keyword: string
  text: string
}

// The trailing `$` is load-bearing, not symmetry with the `^`: `.` never
// matches a line terminator, and `parseSteps`'s `split(/\r?\n/)` doesn't split
// on a *lone* `\r` (nor on U+2028/U+2029), so a line reaching here can still
// contain one. With the `$`, such a line matches nothing and yields no step at
// all; without it, `(.+)` would stop at the terminator and silently record a
// step whose text is truncated there. Pinned by the bare-terminator test.
const STEP = /^(Given|When|Then|And|But)\s+(.+)$/

// Everything the parser needs to know to place the *next* step it reads.
// Carried as one value so the declaration handling below can be a pure
// old-state -> new-state function rather than five interleaved mutable locals.
interface ParserState {
  section: StepSection | null
  scenarioIndex: number
  scenarioName: string | null
  stepIndex: number
  inExamples: boolean
}

// inExamples: false here is unobservable, and a mutant flipping it to `true`
// is equivalent. The argument is exhaustive rather than statistical: all four
// `applyDeclaration` branches below set `inExamples` explicitly, so this value
// survives only until the first declaration line. Until then `state.section`
// is still null, so the one read site (`if (state.inExamples)` in the main
// loop) can only choose between `continue` and a `toStep` that returns null on
// its own orphan-step check -- both emit no step and leave state untouched.
// Kept `false` because it's the honest starting value, not because it matters.
const INITIAL_STATE: ParserState = {
  section: null,
  scenarioIndex: -1,
  scenarioName: null,
  stepIndex: 0,
  inExamples: false,
}

// Declaration lines emit no step of their own; they reset the state that the
// steps *after* them are recorded against. Returns null when the line isn't a
// declaration, i.e. when it might be a step.
function applyDeclaration(line: string, state: ParserState): ParserState | null {
  if (line.startsWith('Background:')) {
    return { section: 'background', scenarioIndex: -1, scenarioName: null, stepIndex: 0, inExamples: false }
  }
  if (/^Scenario( Outline)?:/.test(line)) {
    return {
      section: 'scenario',
      scenarioIndex: state.scenarioIndex + 1,
      // The `^` here is redundant, and a mutant dropping it is equivalent.
      // This branch only runs once the `test` above has proven `line` starts
      // with `Scenario( Outline)?:`, and this pattern is that same prefix plus
      // a `\s*` that can match empty -- so the unanchored form is guaranteed a
      // match at index 0, and `replace` takes the leftmost one. Same start,
      // same backtracking, same extent.
      scenarioName: line.replace(/^Scenario( Outline)?:\s*/, ''),
      stepIndex: 0,
      inExamples: false,
    }
  }
  if (line.startsWith('Examples:')) return { ...state, inExamples: true }
  if (line.startsWith('Feature:')) return { ...state, inExamples: false }
  return null
}

// Returns null for a line that isn't a step, and for a step that appears
// before any Background/Scenario declaration -- it has no section to belong to.
function toStep(line: string, state: ParserState): ParsedStep | null {
  const match = line.match(STEP)
  if (!match || !state.section) return null

  const [, keyword, text] = match
  const inScenario = state.section === 'scenario'
  return {
    section: state.section,
    scenarioIndex: inScenario ? state.scenarioIndex : null,
    scenarioName: inScenario ? state.scenarioName : null,
    stepIndex: state.stepIndex,
    keyword,
    text,
  }
}

export function parseSteps(featureText: string): ParsedStep[] {
  const steps: ParsedStep[] = []
  let state = INITIAL_STATE

  for (const rawLine of featureText.split(/\r?\n/)) {
    const line = rawLine.trim()
    // No explicit blank/comment skip: a blank line and a `#`-prefixed
    // comment both fail every declaration prefix (`applyDeclaration`) and
    // the STEP regex (`toStep` requires `^(Given|...)`, and a comment
    // containing step-like text such as `# Given x` still starts with `#`,
    // not the keyword) -- so falling through produces no declaration change
    // and no step either way. That's an exhaustive argument over the four
    // prefixes and the one regex, not a sampled one, which is why an earlier
    // explicit guard here was removed rather than kept untested. The
    // "ignores blank lines and comments" test still pins the behavior.

    const declared = applyDeclaration(line, state)
    if (declared) {
      state = declared
      continue
    }
    if (state.inExamples) continue

    const step = toStep(line, state)
    if (step) {
      steps.push(step)
      state = { ...state, stepIndex: state.stepIndex + 1 }
    }
  }

  return steps
}

export function extractPlaceholderNames(text: string): string[] {
  return [...text.matchAll(/<([A-Za-z0-9_]+)>/g)].map((m) => m[1])
}
