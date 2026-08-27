// Seeded pseudo-random generation, and the one numeric-mutation primitive
// built directly on it that lives outside mutation-rules.ts's own
// VALUE_RULES dispatch: mutateInteger.
//
// This is a leaf module split out of mutation-rules.ts specifically so
// tuple-list.ts can depend on it. mutation-rules.ts's own VALUE_RULES table
// imports tuple-list.ts's isTupleList/mutateTupleList (the tuple rule sits
// ahead of the plain comma-list rule -- see mutation-rules.ts's header), so
// tuple-list.ts importing anything back from mutation-rules.ts would close a
// module import cycle -- oxlint's import/no-cycle rule, an ERROR rather than
// a warning, catches exactly this. Neither mutation-rules.ts nor
// tuple-list.ts is imported here, so both can depend on this module without
// forming one.
//
// mutateInteger specifically, rather than the general mutateValue dispatcher,
// is what tuple-list.ts's component-change strategy needs: every tuple
// component matches VALUE_RULES's own integer rule (`/^-?\d+$/`) and nothing
// earlier in that table -- a bare digit run can never also look like a
// tuple-list, a comma-list, a boolean, a null-like, or an ISO
// date/datetime/duration -- so calling mutateInteger with a rand seeded the
// same way mutateValue seeds one (see seededRandom's own callers) produces
// exactly what recursing through mutateValue would have, without the cycle.

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

export function mutateInteger(value: string, rand: RandomFn): string {
  return String(parseInt(value, 10) + nonzeroDelta(rand, 9))
}
