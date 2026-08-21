import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { buildSeededLiveCells, parseSeedRequest, type SeedRequest } from './liveCellSeed'

// parseSeedRequest's documented fallbacks, restated here because the property
// below asserts against them from the outside -- an omitted param must land
// on exactly these, not merely on "some number".
const DEFAULT_SPREAD = 200
const DEFAULT_SEED = 1

// spread first, then count bounded by that spread's capacity -- drawing count
// unconstrained would mostly generate unsatisfiable requests (count >
// capacity) and prove nothing about buildSeededLiveCells itself. Spread is
// kept small so capacity, and therefore the number of cells each run has to
// place, stays cheap across hundreds of runs.
const spreadArbitrary = fc.nat({ max: 12 })
const seedRequestArbitrary: fc.Arbitrary<SeedRequest> = spreadArbitrary.chain((spread) => {
  const capacity = (2 * spread + 1) ** 2
  return fc.record({
    spread: fc.constant(spread),
    count: fc.integer({ min: 0, max: capacity }),
    seed: fc.nat(),
  })
})

// Query strings built from the same valid shape, but with each of the three
// values sometimes swapped for something malformed -- so parseSeedRequest sees
// a realistic mix of satisfiable and unsatisfiable requests, not just one or
// the other.
//
// The malformed half is deliberately weighted toward NEAR-MISSES rather than
// left to fc.string(): a random string almost never starts with a digit, so
// against pure garbage a parser that only checks a *leading* run of digits
// (/^\d+/) behaves identically to one anchored at both ends (/^\d+$/), and
// the canonical-decimal property below would pass on both. "Digits followed by
// junk" is exactly the input class where the two diverge, and exactly the
// class Number() silently widens ("1e3" -> 1000, "0x10" -> 16).
const digitsWithSuffixArbitrary = fc
  .tuple(fc.nat({ max: 5000 }), fc.string({ minLength: 1 }))
  .map(([digits, suffix]) => `${digits}${suffix}`)

const numericLookalikeArbitrary = fc.constantFrom('1e3', '0x10', '0b11', '+7', ' 7', '7 ', '7.0', '1_000', '1n')

const paramValueArbitrary = (validValue: fc.Arbitrary<number>) =>
  fc.option(fc.oneof(validValue.map(String), digitsWithSuffixArbitrary, numericLookalikeArbitrary, fc.string()), {
    nil: undefined,
  })

// Carries the raw per-param strings alongside the rendered query string, so a
// property can hold parseSeedRequest's *output* up against the exact text it
// was given -- checking that it only ever accepts a value, rather than only
// that it doesn't throw on one.
interface QueryCase {
  search: string
  raw: { cells?: string; spread?: string; seed?: string }
}

const queryCaseArbitrary: fc.Arbitrary<QueryCase> = fc
  .record({
    cells: paramValueArbitrary(fc.nat({ max: 5000 })),
    spread: paramValueArbitrary(fc.nat({ max: 100 })),
    seed: paramValueArbitrary(fc.nat()),
  })
  .map((raw) => {
    const params = new URLSearchParams()
    if (raw.cells !== undefined) params.set('cells', raw.cells)
    if (raw.spread !== undefined) params.set('spread', raw.spread)
    if (raw.seed !== undefined) params.set('seed', raw.seed)
    return { search: params.toString(), raw }
  })

const queryStringArbitrary = queryCaseArbitrary.map((queryCase) => queryCase.search)

function stripLeadingZeros(raw: string | undefined): string | undefined {
  return raw?.replace(/^0+(?=\d)/, '')
}

function parseCellKey(key: string): [number, number] {
  const [x, y] = key.split(',')
  return [Number(x), Number(y)]
}

describe('buildSeededLiveCells (property)', () => {
  it.prop([seedRequestArbitrary])('is deterministic -- the same request yields the same set of cells', (request) => {
    const a = [...buildSeededLiveCells(request)].sort()
    const b = [...buildSeededLiveCells(request)].sort()
    expect(a).toEqual(b)
  })

  it.prop([seedRequestArbitrary])('produces exactly `count` distinct cells', (request) => {
    expect(buildSeededLiveCells(request).size).toBe(request.count)
  })

  it.prop([seedRequestArbitrary])('places every cell within [-spread, spread] on both axes', (request) => {
    for (const key of buildSeededLiveCells(request)) {
      const [x, y] = parseCellKey(key)
      expect(x).toBeGreaterThanOrEqual(-request.spread)
      expect(x).toBeLessThanOrEqual(request.spread)
      expect(y).toBeGreaterThanOrEqual(-request.spread)
      expect(y).toBeLessThanOrEqual(request.spread)
    }
  })
})

describe('parseSeedRequest (property)', () => {
  it.prop([queryStringArbitrary])(
    'is total -- whatever it returns, buildSeededLiveCells always terminates and honors `count`',
    (search) => {
      const request = parseSeedRequest(search)
      expect(request === undefined || buildSeededLiveCells(request).size === request.count).toBe(true)
    },
  )

  it.prop([fc.string()])('never throws on an arbitrary string', (search) => {
    expect(() => parseSeedRequest(search)).not.toThrow()
  })

  // The validity half of the contract, which totality alone can't express: an
  // accepted param must be its own number written back out in decimal digits.
  // That rules out every string Number() would happily widen -- "1e3", "0x10",
  // "0b11", " 7", "7.0", "+7" -- as a class rather than one literal at a time,
  // because each of those renders back differently from what was given. A
  // seeder that quietly reads "1e3" as 1000 produces a population nobody asked
  // for, and every perf number measured against it inherits the error silently
  // (see perf/population.ts on why a wrong population is the failure mode this
  // module is gated to prevent).
  //
  // Leading zeros are the one accepted non-canonical spelling, so they're
  // normalised away before comparing: "007" is digits-only, Number() reads it
  // as plain decimal 7 (not octal), and rejecting it would buy no safety --
  // the risk this property guards is a value Number() reads as a DIFFERENT
  // number than the digits say, which a zero-padded decimal never is.
  it.prop([queryCaseArbitrary])(
    'accepts a param value only if it is that number in plain decimal digits',
    ({ search, raw }) => {
      const request = parseSeedRequest(search)
      fc.pre(request !== undefined)
      expect({
        cells: stripLeadingZeros(raw.cells),
        spread: stripLeadingZeros(raw.spread) ?? String(DEFAULT_SPREAD),
        seed: stripLeadingZeros(raw.seed) ?? String(DEFAULT_SEED),
      }).toEqual({
        cells: String(request?.count),
        spread: String(request?.spread),
        seed: String(request?.seed),
      })
    },
  )

  // The mirror of the property above, and the reason it can't drift into
  // over-rejection: every SeedRequest, rendered as the query string a perf
  // scenario would really put in a URL, parses back to exactly itself.
  it.prop([seedRequestArbitrary])('round-trips a rendered query string back to the same request', (request) => {
    expect(parseSeedRequest(`?cells=${request.count}&spread=${request.spread}&seed=${request.seed}`)).toEqual(request)
  })
})
