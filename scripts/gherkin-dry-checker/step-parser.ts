// Extracts step objects (keyword, text, location) from raw Gherkin text, for
// the same feature-file subset described in the Acceptance Pipeline
// Specification's parser-spec.md: Feature/Background/Scenario/Scenario
// Outline/Examples declarations, Given/When/Then/And/But steps.

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

// The trailing `$` is redundant with `.+`'s greedy match to end-of-string (no
// line here ever contains an embedded newline, since callers only ever match
// against one already-split, already-trimmed line) -- a mutant that drops it
// is equivalent, confirmed by fuzzing both regexes against thousands of step
// lines with no divergence. Left in for readability/symmetry with the `^`.
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

// inExamples: false here is unobservable -- every declaration branch below
// overwrites it outright, and the one read site (`state.inExamples` in the
// main loop) can only matter once `state.section` is non-null, which nothing
// before the first declaration can be (see toStep's orphan-step check). A
// mutant flipping this to `true` is equivalent, confirmed by fuzzing. Kept
// `false` because it's the honest starting value, not because it's load-bearing.
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
      // The `^` here is redundant: this branch only runs once the `test`
      // above has already proven `line` starts with `Scenario( Outline)?:`,
      // so the unanchored regex's leftmost match is necessarily at index 0
      // too. A mutant that drops it is equivalent, confirmed by fuzzing.
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
    // and no step either way. An earlier explicit guard here was provably
    // dead code (verified by fuzzing), so it was removed rather than kept
    // untested.

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
