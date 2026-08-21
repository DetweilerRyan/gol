import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { buildSeededLiveCells, parseSeedRequest, type SeedRequest } from './liveCellSeed'

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
// values sometimes swapped for arbitrary garbage -- so parseSeedRequest sees
// a realistic mix of satisfiable and unsatisfiable requests, not just one or
// the other.
const paramValueArbitrary = (validValue: fc.Arbitrary<number>) =>
  fc.option(fc.oneof(validValue.map(String), fc.string()), { nil: undefined })

const queryStringArbitrary = fc
  .record({
    cells: paramValueArbitrary(fc.nat({ max: 5000 })),
    spread: paramValueArbitrary(fc.nat({ max: 100 })),
    seed: paramValueArbitrary(fc.nat()),
  })
  .map(({ cells, spread, seed }) => {
    const params = new URLSearchParams()
    if (cells !== undefined) params.set('cells', cells)
    if (spread !== undefined) params.set('spread', spread)
    if (seed !== undefined) params.set('seed', seed)
    return params.toString()
  })

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
})
