// Type-aware mutation of a single Gherkin example cell value, following the
// rule ordering from https://github.com/unclebob/Acceptance-Pipeline-Specification's
// mutator-spec.md. Mutations are deterministic for a given (seedKey, value)
// pair so repeated runs produce identical, diffable mutants.

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

// A seeded [0, 1) generator. Every mutation rule draws from one of these
// rather than Math.random so a given (seedKey, value) pair always produces the
// same mutant.
export type RandomFn = () => number

// The five ways a free-text value can be perturbed. Kept as a closed union so
// STRING_MUTATORS below has to cover every one of them -- an unhandled strategy
// would return the value unmutated, which is exactly the no-op-mutant bug class
// this module has to avoid.
type StringMutationStrategy = 'insert' | 'delete' | 'replace' | 'swap' | 'case'

function hashString(input: string): number {
  let h = 1779033703 ^ input.length
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

// mulberry32
export function seededRandom(seedString: string): RandomFn {
  let seed = hashString(seedString)
  return function next() {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function nonzeroDelta(rand: RandomFn, max: number): number {
  let delta = 0
  while (delta === 0) delta = Math.floor(rand() * (max * 2 + 1)) - max
  return delta
}

function randomChar(rand: RandomFn): string {
  return ALPHABET[Math.floor(rand() * ALPHABET.length)]
}

function differentChar(rand: RandomFn, exclude: string): string {
  const index = Math.floor(rand() * ALPHABET.length)
  const ch = ALPHABET[index]
  return ch === exclude ? ALPHABET[(index + 1) % ALPHABET.length] : ch
}

// Every strategy takes the already-drawn target index so the number and order
// of `rand()` draws stays fixed regardless of which one is selected -- mutants
// have to be reproducible for a given (seedKey, value) pair.
type StringMutator = (value: string, i: number, rand: RandomFn) => string

function insertChar(value: string, i: number, rand: RandomFn): string {
  return value.slice(0, i) + randomChar(rand) + value.slice(i)
}

function deleteChar(value: string, i: number, _rand: RandomFn): string {
  return value.slice(0, i) + value.slice(i + 1)
}

function replaceChar(value: string, i: number, rand: RandomFn): string {
  return value.slice(0, i) + differentChar(rand, value[i]) + value.slice(i + 1)
}

function swapAdjacentChars(value: string, i: number, rand: RandomFn): string {
  const chars = value.split('')
  const differingPairs: number[] = []
  for (let k = 0; k < chars.length - 1; k++) {
    if (chars[k] !== chars[k + 1]) differingPairs.push(k)
  }
  if (differingPairs.length === 0) {
    // Every adjacent pair is identical (e.g. "aaaa") -- no swap could ever
    // change the string. Fall back to `replace`'s guaranteed-different char.
    return replaceChar(value, i, rand)
  }
  const k = differingPairs[Math.floor(rand() * differingPairs.length)]
  ;[chars[k], chars[k + 1]] = [chars[k + 1], chars[k]]
  return chars.join('')
}

function swapCharCase(value: string, i: number, rand: RandomFn): string {
  const ch = value[i]
  const swapped = ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()
  // Caseless characters (digits, punctuation) swap to themselves, which would
  // be a no-op mutation -- substitute a random letter instead.
  return swapped === ch
    ? value.slice(0, i) + randomChar(rand) + value.slice(i + 1)
    : value.slice(0, i) + swapped + value.slice(i + 1)
}

// A Record keyed by the closed strategy union, rather than a switch: adding a
// strategy without wiring it up becomes a type error instead of a silent
// fall-through that returns the value unmutated.
const STRING_MUTATORS: Record<StringMutationStrategy, StringMutator> = {
  insert: insertChar,
  delete: deleteChar,
  replace: replaceChar,
  swap: swapAdjacentChars,
  case: swapCharCase,
}

// A one-character value has no adjacent pair to swap, so `swap` is offered
// only from two characters up.
const SHORT_VALUE_STRATEGIES: StringMutationStrategy[] = ['insert', 'delete', 'replace', 'case']
const ALL_STRATEGIES: StringMutationStrategy[] = ['insert', 'delete', 'replace', 'swap', 'case']

function mutateString(value: string, rand: RandomFn): string {
  if (value.length === 0) return randomChar(rand)

  const strategies = value.length < 2 ? SHORT_VALUE_STRATEGIES : ALL_STRATEGIES
  const strategy = strategies[Math.floor(rand() * strategies.length)]
  const i = Math.floor(rand() * value.length)

  return STRING_MUTATORS[strategy](value, i, rand)
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/
const ISO_DURATION = /^P(?=\d|T)(\d+Y)?(\d+M)?(\d+D)?(T(\d+H)?(\d+M)?(\d+S)?)?$/

// Positions of the non-blank items in a comma-separated value. A value like
// ",," has none, and is left to the string fallback rather than "mutated" into
// an identical copy of itself.
function mutableCommaIndexes(value: string): number[] {
  const parts = value.split(',')
  return parts.map((_, i) => i).filter((i) => parts[i].trim().length > 0)
}

// A naive split on ',' turns a value like "(0, 0), (1, 0)" into *unbalanced*
// fragments -- "(0" and " 0)" -- never balanced ones, since the comma inside
// each pair is exactly what the split breaks on. Left alone, neither
// fragment's trimmed form matches the integer rule (`^-?\d+$`), so every
// such part falls through to the free-text string mutator and every mutant
// of a coordinate-pair list is syntax-breaking -- see the
// comma-list-mutants-are-all-syntax-breaking idea this stripping exists to
// close. Stripping a single leading '(' / trailing ')' before recursing
// exposes the digits underneath as the integer they are, so the coordinate
// itself gets mutated instead of the punctuation around it. Only one
// paren is ever stripped per side: these fragments are never
// doubly-parenthesised in this repo's data, and a value that legitimately
// starts or ends with '(' outside a coordinate pair is left with an empty
// prefix/suffix and mutates exactly as it did before this function existed.
function stripParenAffixes(trimmed: string): { prefix: string; core: string; suffix: string } {
  let core = trimmed
  let prefix = ''
  let suffix = ''
  if (core.startsWith('(')) {
    prefix = '('
    core = core.slice(1)
  }
  if (core.endsWith(')')) {
    suffix = ')'
    core = core.slice(0, -1)
  }
  return { prefix, core, suffix }
}

function mutateCommaList(value: string, rand: RandomFn, seedKey: string): string {
  const parts = value.split(',')
  const mutableIndexes = mutableCommaIndexes(value)
  const target = mutableIndexes[Math.floor(rand() * mutableIndexes.length)]
  const trimmed = parts[target].trim()
  const { prefix, core, suffix } = stripParenAffixes(trimmed)
  const mutated = prefix + mutateValue(core, `${seedKey}[${target}]`) + suffix
  // Splice by index rather than String#replace(trimmed, mutated): replace's
  // *string*-pattern overload still interprets $&, $`, $' and $-prefixed
  // digit sequences in the replacement text. Today's alphabet (lowercase
  // letters, digits, parens) can never produce one, but this makes that true
  // by construction instead of by the current alphabet staying that way.
  const start = parts[target].indexOf(trimmed)
  parts[target] = parts[target].slice(0, start) + mutated + parts[target].slice(start + trimmed.length)
  return parts.join(',')
}

function mutateInteger(value: string, rand: RandomFn): string {
  return String(parseInt(value, 10) + nonzeroDelta(rand, 9))
}

function mutateDecimal(value: string, rand: RandomFn): string {
  const decimals = value.split('.')[1].length
  // KNOWN DEFECT, left as-is deliberately: this is always exactly 1. The
  // decimal rule's pattern requires at least one digit after the dot, so
  // decimals >= 1, so 1e-(decimals-1) <= 1 and Math.max clamps every case to
  // the constant. The delta is therefore precision-independent where the
  // expression plainly intends it to scale with the number of decimals.
  // Dropping the clamp and using Math.min are the *same* fix, not two --
  // min(1, x) = x for all x <= 1 -- so the real question is whether a decimal
  // mutant should be a constant-magnitude or a precision-scaled perturbation,
  // which is a contract question about what acceptance-mutation measures
  // rather than a tidy-up: answering it re-pins every decimal row in
  // mutation-rules.test.ts's PINNED table. No .feature carries a decimal
  // column today, so nothing observable moves either way. Filed as
  // ideas/candidates/decimal-mutant-magnitude-is-precision-independent.md.
  // The three mutants on this line are equivalent *as written* and are
  // expected to survive the mutation gate; that survival is the defect's
  // only remaining signal, so don't collapse this to a literal 1.
  const magnitude = Math.max(1, Number(`1e-${decimals - 1}`))
  // A nonzero delta can still round back to the original string via toFixed
  // (e.g. 1.5 + 0.001 -> "1.5"), so retry against the actual formatted
  // output rather than just guaranteeing the delta itself is nonzero.
  let mutated: string
  do {
    let delta = 0
    while (delta === 0) delta = Number((rand() * 2 - 1) * magnitude || 0)
    mutated = (parseFloat(value) + delta).toFixed(decimals)
  } while (mutated === value)
  return mutated
}

function mutateIsoDate(value: string, rand: RandomFn): string {
  const d = new Date(`${value}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + nonzeroDelta(rand, 5))
  return d.toISOString().slice(0, 10)
}

function mutateIsoDateTime(value: string, rand: RandomFn): string {
  const d = new Date(value)
  d.setUTCMinutes(d.getUTCMinutes() + nonzeroDelta(rand, 30))
  return d.toISOString()
}

function mutateIsoDuration(value: string, rand: RandomFn): string {
  const match = value.match(/\d+/)!
  const original = parseInt(match[0], 10)
  // Clamping to a minimum of 1 can reproduce the original value (e.g.
  // original=1, delta=-1 -> max(1, 0) -> 1), so retry against the actual
  // clamped output rather than just guaranteeing the delta is nonzero.
  let bumped: number
  do {
    bumped = Math.max(1, original + nonzeroDelta(rand, 3))
  } while (bumped === original)
  return value.replace(match[0], String(bumped))
}

// A typed value rule: `matches` never draws from `rand`, so which rule fires
// doesn't perturb the random stream the winning `mutate` then draws from.
interface ValueRule {
  matches: (value: string) => boolean
  mutate: (value: string, rand: RandomFn, seedKey: string) => string
}

// Order is the contract, straight from mutator-spec.md: the most specific
// value shape wins, and anything unrecognized falls through to free-text
// mutation. Each `matches` must be exact enough that its `mutate` can assume
// the shape -- a duration with no digits, say, is left to the string fallback
// rather than handled defensively inside mutateIsoDuration.
const VALUE_RULES: ValueRule[] = [
  { matches: (v) => v.includes(',') && mutableCommaIndexes(v).length > 0, mutate: mutateCommaList },
  { matches: (v) => /^true$/i.test(v), mutate: (v) => matchCase(v, 'false') },
  { matches: (v) => /^false$/i.test(v), mutate: (v) => matchCase(v, 'true') },
  // Inert today, deliberately kept: `mutate` is the same `mutateString` the
  // no-rule-matched fallback in mutateValue calls, and `rand` is seeded
  // *before* rule dispatch, so whether this predicate fires is unobservable
  // -- same function, same stream, same output. It stays because VALUE_RULES
  // transcribes mutator-spec.md's rule list, and an entry omitted for
  // coinciding with the fallback makes that transcription unreadable against
  // the spec. Two things would re-arm it, and either one makes this comment
  // wrong: a fallback that is no longer mutateString, or a null-like mutator
  // that reads the `seedKey` third argument mutateString ignores. The
  // mutants on this line are equivalent by construction and are expected to
  // survive the mutation gate -- see the mutateDecimal note below for the
  // one dead expression here that is *not* in that category.
  { matches: (v) => /^(null|nil|none)$/i.test(v), mutate: mutateString },
  { matches: (v) => /^-?\d+$/.test(v), mutate: mutateInteger },
  { matches: (v) => /^-?\d+\.\d+$/.test(v), mutate: mutateDecimal },
  { matches: (v) => ISO_DATE.test(v), mutate: mutateIsoDate },
  { matches: (v) => ISO_DATETIME.test(v), mutate: mutateIsoDateTime },
  // The `/\d+/` conjunct is load-bearing and reads as though it isn't: "PT"
  // matches ISO_DURATION (the `(?=\d|T)` lookahead is satisfied by the T, and
  // every component group is optional) while carrying no digit at all, so
  // without it mutateIsoDuration's `value.match(/\d+/)!` dereferences null.
  // A `v !== 'P'` conjunct used to sit alongside it and was dead: the same
  // lookahead already makes ISO_DURATION.test('P') false, so the && never
  // reached it. Narrowing `\d+` to `\d` here is an equivalent mutant -- both
  // are existence checks -- and is expected to survive the mutation gate.
  { matches: (v) => ISO_DURATION.test(v) && /\d+/.test(v), mutate: mutateIsoDuration },
]

export function mutateValue(originalValue: string, seedKey: string): string {
  const rand = seededRandom(`${seedKey}::${originalValue}`)
  const rule = VALUE_RULES.find((r) => r.matches(originalValue))
  return rule ? rule.mutate(originalValue, rand, seedKey) : mutateString(originalValue, rand)
}

function matchCase(original: string, replacement: string): string {
  return original[0] === original[0].toUpperCase() ? replacement[0].toUpperCase() + replacement.slice(1) : replacement
}
