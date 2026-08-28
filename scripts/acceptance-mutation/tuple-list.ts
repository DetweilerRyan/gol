// A repo-specific value rule for parenthesised, fixed-arity numeric tuple
// lists -- "(0, 0), (1, 0), (0, 1), (1, 1)", the shape pattern-library.feature's
// `cells` column uses to state a pattern's live cells relative to its own
// bounding box. This is deliberately its own module rather than an entry
// inside mutation-rules.ts: that file's header says VALUE_RULES transcribes
// https://github.com/unclebob/Acceptance-Pipeline-Specification's
// mutator-spec.md, and a tuple grammar this specific to this repo's data
// doesn't come from that spec, so it lives beside the transcription instead
// of inside it -- the same relationship examples-cell-sites.ts has to
// mutation-sites.ts's registry.
//
// The predecessor here was mutateCommaList's stripParenAffixes: a naive split
// on ',' shreds "(0, 0), (1, 0)" into *unbalanced* fragments ("(0", " 0)"),
// so stripParenAffixes shaved one leading/trailing paren off each fragment to
// expose the digits underneath. That's a patch over the mismatch between a
// flat comma-list mutator and a nested tuple value, not a model of the value
// -- it never notices a tuple's own two components, so it can never propose
// "swap x and y" as a mutation, and it corrupts non-tuple paren-lists (e.g.
// "(2026-05-13, P3D)", not a numeric pair) the same way it fixes tuple ones.
// This module replaces it with an actual parse: a list of fixed-arity numeric
// tuples, each tuple's components individually addressable by byte offset.
// This module imports nothing from mutation-rules.ts, and cannot: that file's
// VALUE_RULES table imports isTupleList/mutateTupleList below (the tuple rule
// sits ahead of the plain comma-list rule), so an import back would close a
// module import cycle -- oxlint's import/no-cycle, an ERROR rather than a
// warning. What this module needs from there, mutating one tuple component's
// text, arrives as an injected ValueMutator parameter instead, on the
// container-equality.ts precedent. Only the seeded stream's TYPE is imported.
import type { RandomFn } from './seeded-random.ts'

// The component mutator mutateTupleList is handed. In production this is
// mutation-rules.ts's own mutateValue -- so a component's mutation is
// literally recursion through VALUE_RULES, the same thing mutateCommaList
// does with its own fragments, rather than a direct mutateInteger call that
// merely happens to agree with it today.
export type ValueMutator = (value: string, seedKey: string) => string

interface TupleComponent {
  start: number
  end: number
  text: string
}

interface TupleMatch {
  components: TupleComponent[]
}

// The whole string, and nothing else, must be a comma-separated list of
// parenthesised groups of comma-separated integers -- "WHOLLY", per this
// module's contract, so a value with any leading/trailing/interstitial text
// outside that shape (including a doubly-parenthesised "((0, 0))", whose
// outer '(' is not immediately followed by a digit) is rejected rather than
// partially matched.
const TUPLE_LIST_SHAPE = /^\(\s*-?\d+(?:\s*,\s*-?\d+)*\s*\)(?:\s*,\s*\(\s*-?\d+(?:\s*,\s*-?\d+)*\s*\))*$/

// Parses `value` into its tuples' component spans, or returns null if it
// isn't wholly a fixed-arity numeric tuple list. "Fixed-arity" is checked
// separately from the shape regex above: that regex alone would also accept
// "(1, 2), (3, 4, 5)" (a 2-tuple beside a 3-tuple), since each parenthesised
// group is matched independently of its neighbours' component counts.
function parseTupleList(value: string): TupleMatch[] | null {
  if (!TUPLE_LIST_SHAPE.test(value)) return null

  const tuples: TupleMatch[] = []
  for (const tupleMatch of value.matchAll(/\(([^()]*)\)/g)) {
    const inner = tupleMatch[1]
    const innerStart = tupleMatch.index + 1 // one past the '('
    const components: TupleComponent[] = []
    for (const componentMatch of inner.matchAll(/-?\d+/g)) {
      const start = innerStart + componentMatch.index
      components.push({ start, end: start + componentMatch[0].length, text: componentMatch[0] })
    }
    tuples.push({ components })
  }

  const arity = tuples[0].components.length
  return tuples.every((tuple) => tuple.components.length === arity) ? tuples : null
}

// Whether `value` is wholly a delimited list of fixed-arity numeric tuples.
// Never draws from `rand` -- ValueRule's contract (see mutation-rules.ts):
// which rule fires must not perturb the random stream the winning rule's own
// `mutate` then draws from.
export function isTupleList(value: string): boolean {
  return parseTupleList(value) !== null
}

// Swaps two components' text in place by index, exactly the splice-not-render
// discipline mutateCommaList already followed (see its own comment on why
// String#replace's $&-interpolating overload is avoided): only the two spans
// themselves move, every other byte -- including the ", " between them --
// is untouched. `first` must precede `second` in `value`; the only caller,
// below, always passes a tuple's own components[0] then components[1], which
// matchAll guarantees are already in left-to-right document order, so there
// is no reordering to do here.
function spliceSwap(value: string, first: TupleComponent, second: TupleComponent): string {
  return (
    value.slice(0, first.start) +
    second.text +
    value.slice(first.end, second.start) +
    first.text +
    value.slice(second.end)
  )
}

// component-change: today's behaviour, carried over from mutateCommaList's
// recursion into mutateValue on a single fragment. Components are addressed
// by their flat, tuple-major position across the whole list (0 for the first
// tuple's first component, 1 for its second, 2 for the next tuple's first,
// ...) rather than by a nested (tuple index, component index) pair -- the
// derived seed key format, `${seedKey}[i]`, is mutateCommaList's own shape,
// carried over unchanged; `i` is simply this module's analogue of that
// function's flat split-list index.
//
// Delegates the component's own mutation to the injected `mutate`, which in
// production is mutateValue -- so this is recursion through VALUE_RULES, and
// a component's text gets whatever rule that table says a bare digit run
// gets, now and after any future edit to it.
function mutateComponent(
  value: string,
  tuples: TupleMatch[],
  rand: RandomFn,
  seedKey: string,
  mutate: ValueMutator,
): string {
  const flatComponents = tuples.flatMap((tuple) => tuple.components)
  const index = Math.floor(rand() * flatComponents.length)
  const target = flatComponents[index]
  const mutated = mutate(target.text, `${seedKey}[${index}]`)
  return value.slice(0, target.start) + mutated + value.slice(target.end)
}

// The rule's mutate, plus the injected component mutator -- so the
// VALUE_RULES entry wraps it in an arrow rather than naming it directly. Two
// strategies: component-change (above, today's behaviour) and swap-x-y
// (transpose a tuple's two components). The class draw is always the FIRST
// draw, regardless of arity or of whether any tuple is actually swappable --
// so this rule's draw sequence never depends on data shape, only which
// branch the first draw's outcome (plus the data-dependent, non-drawing
// swappable-candidate check) sends it down. Everything after the first draw
// is branch-local.
export function mutateTupleList(value: string, rand: RandomFn, seedKey: string, mutate: ValueMutator): string {
  const tuples = parseTupleList(value)
  if (!tuples) throw new Error(`mutateTupleList called on a value that is not a tuple-list: ${JSON.stringify(value)}`)

  // The 0.5 boundary is pinned deterministically by tuple-list.test.ts's
  // `() => 0.5` stub rather than left to a hunted seed: `rand` is an injected
  // parameter, so the exact boundary value is reachable by construction and
  // the `< 0.5` -> `<= 0.5` mutant dies without any seed search. 0.5 is
  // in-domain for a [0, 1) RandomFn, which is what makes that stub a legal
  // input rather than a contrived one.
  const wantsSwap = rand() < 0.5 // draw #1, unconditionally
  const arity = tuples[0].components.length
  // Swap only ever transposes a tuple's first two components, so it's only
  // offered for 2-tuples -- "swap x and y" is meaningless for a 1-tuple and
  // ambiguous for a 4-tuple. Restricted further to pairs where the two
  // components actually differ: swapping (2, 2) is a byte-identical no-op
  // mutant, the exact bug class this module's nonzeroDelta/differentChar/
  // do-while discipline elsewhere exists to prevent.
  const swapCandidates =
    arity === 2 ? tuples.filter((tuple) => tuple.components[0].text !== tuple.components[1].text) : []

  if (wantsSwap && swapCandidates.length > 0) {
    const target = swapCandidates[Math.floor(rand() * swapCandidates.length)] // draw #2, swap branch
    return spliceSwap(value, target.components[0], target.components[1])
  }

  // Falls back here both when the first draw picked component-change AND
  // when it picked swap but no swap candidate existed (every pair's
  // components equal, or arity !== 2) -- draw #2 in this branch is
  // mutateComponent's own target-index draw, never a second class draw.
  return mutateComponent(value, tuples, rand, seedKey, mutate)
}
