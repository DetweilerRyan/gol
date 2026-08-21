import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { CacheError, createCache } from './cache'

// A small, low-cardinality key alphabet (rather than fc.string()/arbitrary
// values) is deliberate: it keeps key paths colliding and nesting inside
// each other -- e.g. [0] and [0, 1] both landing in the generated set --
// which is exactly the shape that exercises the trie's PATH/ENTRY
// conversions, not just a flat map of unrelated entries.
const key = fc.integer({ min: 0, max: 4 })
const keyPath = fc.array(key, { minLength: 1, maxLength: 3 })

describe('createCache (property)', () => {
  it.prop([keyPath, fc.integer()])('retrieves the exact value that was just inserted at a key path', (path, value) => {
    const cache = createCache<number[], number>()
    cache.insert(path, value)
    expect(cache.retrieve(path)).toBe(value)
  })

  it.prop([keyPath, fc.integer()])('reports no entry once what was just inserted is removed', (path, value) => {
    const cache = createCache<number[], number>()
    cache.insert(path, value)
    cache.remove(path)
    expect(cache.has(path)).toBe(false)
  })

  // Runs a random sequence of insert/update/remove against key paths drawn
  // from the same small pool, so most operations land on a key path some
  // earlier operation already touched -- successes, "already exists", and
  // "no entry exists" all happen along the way. The invariant under test
  // (cache.size tracking iteration's own entry count) has to survive all
  // three, not just the happy path, since it's independent bookkeeping
  // (`_size`) alongside the tree that `_entries` walks.
  it.prop([
    fc.array(
      fc.record({
        type: fc.constantFrom<'insert' | 'update' | 'remove'>('insert', 'update', 'remove'),
        path: keyPath,
        value: fc.integer(),
      }),
      { maxLength: 30 },
    ),
  ])('keeps size equal to the number of entries iteration produces after any sequence of operations', (operations) => {
    const cache = createCache<number[], number>()

    for (const operation of operations) {
      try {
        if (operation.type === 'insert') {
          cache.insert(operation.path, operation.value)
        } else if (operation.type === 'update') {
          cache.update(operation.path, operation.value)
        } else {
          cache.remove(operation.path)
        }
      } catch (error) {
        // A CacheError here means this particular operation didn't apply
        // (e.g. insert on an already-occupied path) -- the cache is
        // unchanged, and the invariant should still hold. Anything else is
        // a real bug this property should not swallow.
        if (!(error instanceof CacheError)) {
          throw error
        }
      }

      expect(cache.size).toBe(Array.from(cache).length)
    }
  })

  // fc.uniqueArray's selector guarantees distinct key paths by content, not
  // just by array reference, so every generated path can be inserted
  // without a "already exists" collision -- unlike the property above,
  // this one is about a stable read, not a sequence of mutations.
  it.prop([fc.uniqueArray(keyPath, { selector: (path) => JSON.stringify(path), maxLength: 15 })])(
    'iterates in the same order across repeated reads when nothing mutates in between',
    (paths) => {
      const cache = createCache<number[], number>(paths.map((path, index): [number[], number] => [path, index]))

      expect(Array.from(cache)).toEqual(Array.from(cache))
    },
  )
})
