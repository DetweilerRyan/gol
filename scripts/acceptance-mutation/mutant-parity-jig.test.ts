// A transient regression pin for the gherkin-ast-mutation refactor, not a
// permanent test of this program's behavior. It exists to prove one thing:
// that swapping gherkin-examples.ts's MutableCell/applyMutation shape for
// the MutationSite abstraction in mutation-sites.ts/examples-cell-sites.ts
// (step 3 of the refactor) produces byte-identical mutants on the real
// features/ tree -- same targets, same seed-key addresses, same mutated
// values, same mutated file text, in the same order.
//
// It is deliberately not a good regression test to keep around: it is
// pinned against the real features/ tree, so it fails the moment `product`
// re-pads an Examples table for any unrelated reason, in a scripts/ file
// scripts/ does not own the content of. Retire it at step 4 once the
// splice/escaping change lands and this parity claim has done its job.
//
// The two assertions below are the same claim checked two ways: the address
// list (readable, diffable, and the thing a human would actually want to see
// go wrong) and a hash of the full mutated file *texts* (opaque, but the
// only thing that would catch a whitespace- or line-rendering difference the
// address list can't see, since the step-3 renderer still re-renders a whole
// row).
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { discoverTargets } from './discovery.ts'
import { listMutationSites } from './mutation-sites.ts'
import { buildMutantRecords, type TargetPlan } from './mutant-plan.ts'

const FEATURES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../features')

function loadActivePlans(): TargetPlan[] {
  return discoverTargets(FEATURES_DIR)
    .map((target) => {
      const featureText = readFileSync(path.join(FEATURES_DIR, target.feature), 'utf8')
      return { target, featureText, sites: listMutationSites(featureText, target.feature) }
    })
    .filter((plan) => plan.sites.length > 0)
}

// One row per mutant: which feature, the site's own seedKey (already
// `feature:rowIndex:columnName` -- see examples-cell-sites.ts), and the
// deterministic mutated value that site produces. Order matches
// buildMutantRecords' own iteration order (targets in discovery order, sites
// in listMutationSites order within a target).
const EXPECTED_ADDRESSES: [feature: string, seedKey: string, mutatedValue: string][] = [
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:0:state', 'alie'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:0:neighbors', '-7'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:0:next state', 'dea'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:1:state', 'avive'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:1:neighbors', '-1'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:1:next state', 'vdead'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:2:state', 'alvie'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:2:neighbors', '-7'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:2:next state', 'alie'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:3:state', 'live'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:3:neighbors', '-6'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:3:next state', 'aliev'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:4:state', 'alivd'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:4:neighbors', '-5'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:4:next state', 'wdead'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:5:state', 'deapd'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:5:neighbors', '-3'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:5:next state', 'dfead'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:6:state', 'Dead'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:6:neighbors', '6'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:6:next state', 'aliqve'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:7:state', 'tdead'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:7:neighbors', '13'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:7:next state', 'decd'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:0:x', '-5'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:0:y', '5'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:0:expected center x', '8'],
  ['cell-life-and-death.feature', 'cell-life-and-death.feature:0:expected center y', '-3'],
  ['grid-reference-lines.feature', 'grid-reference-lines.feature:0:coordinate', '2'],
  ['grid-reference-lines.feature', 'grid-reference-lines.feature:1:coordinate', '6'],
  ['grid-reference-lines.feature', 'grid-reference-lines.feature:2:coordinate', '-16'],
  ['pattern-library.feature', 'pattern-library.feature:0:pattern', 'Blck'],
  ['pattern-library.feature', 'pattern-library.feature:0:category', 'StiLl Life'],
  ['pattern-library.feature', 'pattern-library.feature:0:cells', '(0, 0), (1, 0), (0, 1), a1, 1)'],
  ['pattern-library.feature', 'pattern-library.feature:1:pattern', 'Beehivse'],
  ['pattern-library.feature', 'pattern-library.feature:1:category', 'Still Lifre'],
  ['pattern-library.feature', 'pattern-library.feature:1:cells', '(1, 0), (2, 0), (0, 1), (3, 1), (1, )2, (2, 2)'],
  ['pattern-library.feature', 'pattern-library.feature:2:pattern', 'linker'],
  ['pattern-library.feature', 'pattern-library.feature:2:category', 'Oscilaltors'],
  ['pattern-library.feature', 'pattern-library.feature:2:cells', '(0, 0), 1, 0), (2, 0)'],
  ['pattern-library.feature', 'pattern-library.feature:3:pattern', 'Tad'],
  ['pattern-library.feature', 'pattern-library.feature:3:category', 'Oscillaotrs'],
  ['pattern-library.feature', 'pattern-library.feature:3:cells', '(1, 0), (2, 0), (3, 0), (0, 1), (1, 1), (c, 1)'],
  ['pattern-library.feature', 'pattern-library.feature:4:pattern', 'eBacon'],
  ['pattern-library.feature', 'pattern-library.feature:4:category', 'Oscillaors'],
  [
    'pattern-library.feature',
    'pattern-library.feature:4:cells',
    '(0, 0), (1, 0), (0, 1), (1, 1), (2, ), (3, 2), (2, 3), (3, 3)',
  ],
  ['pattern-library.feature', 'pattern-library.feature:5:pattern', 'Pulsr'],
  ['pattern-library.feature', 'pattern-library.feature:5:category', 'OsciLlators'],
  [
    'pattern-library.feature',
    'pattern-library.feature:5:cells',
    '(2, 0), (3, 0), (4, 0), (8, 0), (k9, 0), (10, 0), (0, 2), (5, 2), (7, 2), (12, 2), (0, 3), (5, 3), (7, 3), (12, 3), (0, 4), (5, 4), (7, 4), (12, 4), (2, 5), (3, 5), (4, 5), (8, 5), (9, 5), (10, 5), (2, 7), (3, 7), (4, 7), (8, 7), (9, 7), (10, 7), (0, 8), (5, 8), (7, 8), (12, 8), (0, 9), (5, 9), (7, 9), (12, 9), (0, 10), (5, 10), (7, 10), (12, 10), (2, 12), (3, 12), (4, 12), (8, 12), (9, 12), (10, 12)',
  ],
  ['pattern-library.feature', 'pattern-library.feature:6:pattern', 'Glder'],
  ['pattern-library.feature', 'pattern-library.feature:6:category', 'Spceships'],
  ['pattern-library.feature', 'pattern-library.feature:6:cells', '(1, 0), (2, 1), (0, )2, (1, 2), (2, 2)'],
  ['pattern-library.feature', 'pattern-library.feature:7:pattern', 'LWSS (lightweight Spaceship)'],
  ['pattern-library.feature', 'pattern-library.feature:7:category', 'SPaceships'],
  [
    'pattern-library.feature',
    'pattern-library.feature:7:cells',
    '(1, 0), (4, 0), (0, 1), (0, 2), (4, )2, (0, 3), (1, 3), (2, 3), (3, 3)',
  ],
]

// A hash of every mutant's full rendered file text, concatenated in order --
// catches anything the address list above can't see (row rendering,
// whitespace, line count) without embedding ~55 whole feature files here.
// Byte-identical to the pre-refactor hash pinned before step 3 landed.
const EXPECTED_TEXTS_HASH = 'b008d60f5cc45ab01bc4c9390ddcd46d17f7a0a10558f66acd82d7022c24bd38'

describe('gherkin-ast-mutation parity jig', () => {
  it('pins the current 55-mutant set produced from the real features/ tree', () => {
    const records = buildMutantRecords(loadActivePlans())

    const addresses = records.map((r) => [r.target.feature, r.site.seedKey, r.mutatedValue] as const)
    expect(addresses).toHaveLength(55)
    expect(addresses).toEqual(EXPECTED_ADDRESSES)

    const textsHash = createHash('sha256')
      .update(records.map((r) => r.text).join(' '))
      .digest('hex')
    expect(textsHash).toBe(EXPECTED_TEXTS_HASH)
  })
})
