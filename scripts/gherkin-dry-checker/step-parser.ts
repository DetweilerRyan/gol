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

const INITIAL_STATE: ParserState = {
  section: null,
  scenarioIndex: -1,
  scenarioName: null,
  stepIndex: 0,
  inExamples: false,
}

function isBlankOrComment(line: string): boolean {
  return line === '' || line.startsWith('#')
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
    if (isBlankOrComment(line)) continue

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
