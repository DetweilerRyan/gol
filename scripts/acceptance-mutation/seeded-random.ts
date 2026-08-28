// The seeded pseudo-random stream every mutation rule draws from, and the one
// delta helper built directly on it.
//
// A leaf module: it imports nothing in this program, which is what lets both
// mutation-rules.ts and tuple-list.ts depend on it without closing a cycle.
// mutation-rules.ts's VALUE_RULES table imports isTupleList/mutateTupleList
// from tuple-list.ts (the tuple rule sits ahead of the plain comma-list rule
// -- see mutation-rules.ts's header), so the one edge that must never exist
// is tuple-list.ts importing back from mutation-rules.ts. oxlint's
// import/no-cycle rule is an ERROR rather than a warning and catches exactly
// that.
//
// What tuple-list.ts needs from mutation-rules.ts -- the ability to mutate a
// single tuple component's text -- is INJECTED as a parameter instead (see
// tuple-list.ts's ValueMutator), on the container-equality.ts precedent this
// repo already documents. So nothing beyond the stream itself was moved down
// here: mutateInteger stays in mutation-rules.ts beside the rest of
// VALUE_RULES' mutators, where a reader comparing the table against
// mutator-spec.md can still see it.

function hashString(input: string): number {
  let h = 1779033703 ^ input.length
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

// A seeded [0, 1) generator. Every mutation rule draws from one of these
// rather than Math.random so a given (seedKey, value) pair always produces the
// same mutant.
export type RandomFn = () => number

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

export function nonzeroDelta(rand: RandomFn, max: number): number {
  let delta = 0
  while (delta === 0) delta = Math.floor(rand() * (max * 2 + 1)) - max
  return delta
}
