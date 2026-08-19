// Extracts step objects (keyword, text, location) from raw Gherkin text, for
// the same feature-file subset described in the Acceptance Pipeline
// Specification's parser-spec.md: Feature/Background/Scenario/Scenario
// Outline/Examples declarations, Given/When/Then/And/But steps.

const STEP = /^(Given|When|Then|And|But)\s+(.+)$/

export function parseSteps(featureText) {
  const lines = featureText.split(/\r?\n/)
  const steps = []

  let section = null // 'background' | 'scenario'
  let scenarioIndex = -1
  let scenarioName = null
  let stepIndex = 0
  let inExamples = false

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('#')) continue

    if (line.startsWith('Background:')) {
      section = 'background'
      scenarioIndex = -1
      scenarioName = null
      stepIndex = 0
      inExamples = false
      continue
    }
    if (/^Scenario( Outline)?:/.test(line)) {
      section = 'scenario'
      scenarioIndex += 1
      scenarioName = line.replace(/^Scenario( Outline)?:\s*/, '')
      stepIndex = 0
      inExamples = false
      continue
    }
    if (line.startsWith('Examples:')) {
      inExamples = true
      continue
    }
    if (line.startsWith('Feature:')) {
      inExamples = false
      continue
    }
    if (inExamples) continue

    const match = line.match(STEP)
    if (match && section) {
      const [, keyword, text] = match
      steps.push({
        section,
        scenarioIndex: section === 'background' ? null : scenarioIndex,
        scenarioName: section === 'background' ? null : scenarioName,
        stepIndex,
        keyword,
        text,
      })
      stepIndex += 1
    }
  }

  return steps
}

export function extractPlaceholderNames(text) {
  return [...text.matchAll(/<([A-Za-z0-9_]+)>/g)].map((m) => m[1])
}
