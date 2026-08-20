// Portable token-similarity baseline described in mutator's sibling spec,
// ir-dry-checker-spec.md. The spec deliberately leaves the exact stopword
// list, tokenizer, and placeholder-slot syntax as implementation choices
// ("intentionally allows implementation flexibility for language-neutral
// heuristics beyond these baselines") -- only the Jaccard formula and the
// 0.72 / 0.45 thresholds are mandated, both applied as specified below.

const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'to',
  'of',
  'in',
  'on',
  'at',
  'by',
  'with',
  'and',
  'or',
  'that',
  'this',
  'it',
  'its',
  'i',
  'my',
  'should',
  'would',
  'has',
  'have',
  'had',
  'do',
  'does',
  'did',
  'for',
  'from',
  'up',
  'down',
])

export const NEAR_DUPLICATE_THRESHOLD = 0.72
export const POSSIBLE_SYNONYM_THRESHOLD = 0.45

// Replaces each distinct placeholder *name* with a generic ordered slot
// (<_1>, <_2>, ...) so two steps differing only in placeholder naming
// normalize to the same shape.
export function slotPlaceholders(text: string): string {
  const slotByName = new Map<string, string>()
  let nextIndex = 0
  return text.replace(/<([A-Za-z0-9_]+)>/g, (_match: string, name: string) => {
    const existing = slotByName.get(name)
    if (existing !== undefined) return existing
    nextIndex += 1
    const slot = `<_${nextIndex}>`
    slotByName.set(name, slot)
    return slot
  })
}

export function tokenize(text: string): string[] {
  return text
    .replace(/<[A-Za-z0-9_]+>/g, ' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0 && !STOPWORDS.has(token))
}

export function jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
  const setA = new Set(tokensA)
  const setB = new Set(tokensB)
  const union = new Set([...setA, ...setB])
  if (union.size === 0) return 0
  let sharedCount = 0
  for (const token of setA) {
    if (setB.has(token)) sharedCount += 1
  }
  return sharedCount / union.size
}
