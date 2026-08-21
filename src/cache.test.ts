import { describe, expect, it } from 'vitest'
import { CacheError, createCache, type Cache } from './cache'

describe('a basic cache of primitives', () => {
  type Primitive = string | number | boolean | null | undefined

  // Shared by several tests below: the same three-entry starting cache,
  // extracted so those tests state only what differs (dry4ts flagged the
  // repeated five-line createCache([...]) literal as duplication).
  function createRetrosUsersCache(): Cache<[string, number], Primitive> {
    return createCache([
      [['retros', 0], 'retro0'],
      [['retros', 1], 'retro1'],
      [['users', 89], 'user89'],
    ])
  }

  it('can insert and retrieve entries at key-paths.', () => {
    // Key-paths are typed as tupples and can have
    //  any type. Here we're only using strings.
    type KeyPath = [string, string, string]
    // An instance of a cache is created using
    //  the createCache factory method.
    //
    // Notice that we provide the type for all
    //  entries that will be stored in the cache
    //  instance at the time of creation.
    // The type for the entries cannot changes
    //  after creation.
    const cache = createCache<KeyPath, Primitive>()

    // A key path is an array of keys.
    // A key can be of any type, but for now
    //  we'll use strings.
    const keyPath: KeyPath = ['sol', 'earth', 'north america']

    cache.insert(keyPath, 'Retrium')

    // Use the has method to safely check an entry exists at a
    //  key path in the cache.
    expect(cache.has(keyPath)).toBe(true)

    // Use the retrieve method to get the entry stored
    //  at a key path in the cache.
    expect(cache.retrieve(keyPath)).toBe('Retrium')

    // Be careful, attempting to retrieve an entry from
    //  a key path that doesn't have an entry will throw
    expect(() => cache.retrieve(['sol', 'earth', 'antarctica'])).toThrow(/no entry exists/)
  })

  it('can be created with initial entries.', () => {
    // The createCache factory method is overloaded
    //  to accept an Iterable of [key-path, entry-value] tupples.
    //
    // This overload was provided to make these unit
    //  tests cleaner, but it may have real world uses
    const cache = createRetrosUsersCache()

    expect(cache.size).toBe(3)

    expect(cache.has(['retros', 0])).toBe(true)
    expect(cache.has(['retros', 1])).toBe(true)
    expect(cache.has(['users', 89])).toBe(true)

    expect(cache.retrieve(['retros', 0])).toBe('retro0')
    expect(cache.retrieve(['retros', 1])).toBe('retro1')
    expect(cache.retrieve(['users', 89])).toBe('user89')
  })

  it('can remove existing entries.', () => {
    const cache = createRetrosUsersCache()

    // remove retro 1
    cache.remove(['retros', 1])

    expect(cache.has(['retros', 1])).toBe(false)

    // Be careful, attepting to remove an
    //  entry that doesn't exist will throw.
    expect(() => cache.remove(['retros', 1])).toThrow(/no entry exist/)
  })

  it('can update existing entries.', () => {
    const cache = createRetrosUsersCache()

    // Once an entry exists in the cache inserting
    //  a new entry at the same key-path will throw.
    expect(() => cache.insert(['retros', 0], 'Sprint Retro 0')).toThrow(/entry already exists/)

    // An update method is provided for updating
    //  the value of an existing entry
    cache.update(['retros', 0], 'Sprint Retro 0')

    // the entry now has the updated value!
    expect(cache.retrieve(['retros', 0])).toBe('Sprint Retro 0')

    // Be careful, attempting to update an entry
    //  that does not exist will throw
    expect(() => cache.update(['retros', 2], 'Sprint Retro 2')).toThrow(/no entry exists/)
  })

  it('can have entries that are falsey.', () => {
    // Create a cache populated with every possible
    //  entry-value that evaluates to falsey.
    const cache = createCache<[string], Primitive>([
      [['undefined'], undefined],
      [['null'], null],
      [['empty string'], ''],
      [['zero'], 0],
      [['negative zero'], -0],
      [['NaN'], NaN],
      [['false'], false],
    ])

    // Every single one of those entries are in the cache.
    expect(cache.has(['undefined'])).toBe(true)
    expect(cache.has(['null'])).toBe(true)
    expect(cache.has(['empty string'])).toBe(true)
    expect(cache.has(['zero'])).toBe(true)
    expect(cache.has(['negative zero'])).toBe(true)
    expect(cache.has(['NaN'])).toBe(true)
    expect(cache.has(['false'])).toBe(true)

    // Every single one of those entries can be retrieved
    //  from the cache.
    expect(cache.retrieve(['undefined'])).toBe(undefined)
    expect(cache.retrieve(['null'])).toBe(null)
    expect(cache.retrieve(['empty string'])).toBe('')
    expect(cache.retrieve(['zero'])).toBe(0)
    expect(cache.retrieve(['negative zero'])).toBe(-0)
    expect(cache.retrieve(['NaN'])).toBe(NaN)
    expect(cache.retrieve(['false'])).toBe(false)
  })

  it('can have falsey as keys.', () => {
    // Create a cache populated with entries with
    //  key-paths that contian every possible key
    //  that evaluates to falsey.
    const cache = createCache<[Primitive], Primitive>([
      [[undefined], 'undefined'],
      [[null], 'null'],
      [[''], 'empty string'],
      [[0], 'zero'],
      //[[-0], 'negative zero'],
      [[NaN], 'NaN'],
      [[false], 'false'],
    ])

    // Cache sees keys with values of 0 and -0 as the same
    expect(() => cache.insert([-0], 'negative zero')).toThrow(/entry already exists/)

    // Every single one of the entries are in the cache
    expect(cache.has([undefined])).toBe(true)
    expect(cache.has([null])).toBe(true)
    expect(cache.has([''])).toBe(true)
    expect(cache.has([0])).toBe(true)
    expect(cache.has([NaN])).toBe(true)
    expect(cache.has([false])).toBe(true)

    // Every single one of those entries can be retrieved
    //  from the cache.
    expect(cache.retrieve([undefined])).toBe('undefined')
    expect(cache.retrieve([null])).toBe('null')
    expect(cache.retrieve([''])).toBe('empty string')
    expect(cache.retrieve([0])).toBe('zero')
    expect(cache.retrieve([NaN])).toBe('NaN')
    expect(cache.retrieve([false])).toBe('false')
  })

  it('can have objects as keys.', () => {
    type User = {
      type: 'user'
      name: string
    }
    function createUser(name: string): User {
      return {
        type: 'user',
        name,
      }
    }
    const john = createUser('John Smith')
    const jane = createUser('Jane Smith')

    const cache = createCache([
      [[john], 44],
      [[jane], 73],
    ])

    // Both of the entires are in the cache.
    expect(cache.has([john])).toBe(true)
    expect(cache.has([jane])).toBe(true)

    // Both of the entries can be retrieved from the cache.
    expect(cache.retrieve([john])).toBe(44)
    expect(cache.retrieve([jane])).toBe(73)

    // Keys are evaulated by reference, not via
    //  a deep equality check.
    expect(cache.has([createUser('John Smith')])).toBe(false)
    expect(() => cache.retrieve([createUser('John Smith')])).toThrow(/no entry exists/)
  })

  it('can have arrays as keys.', () => {
    const myArray = ['ok', 433, false]
    const myOtherArray: unknown[] = []
    const myThridArray = [3, 4, 2]

    const cache = createCache([
      [[myArray], 'my array'],
      [[myOtherArray], 'my other array'],
    ])

    expect(cache.has([myArray])).toBe(true)
    expect(cache.has([myOtherArray])).toBe(true)
    expect(cache.has([myThridArray])).toBe(false)
  })

  it('can have functions as keys.', () => {
    const myFunc = () => {}
    const myOtherFunc = () => {}
    const myThridFunc = () => {}

    const cache = createCache([
      [[myFunc], 'my function'],
      [[myOtherFunc], 'my other function'],
    ])

    expect(cache.has([myFunc])).toBe(true)
    expect(cache.has([myOtherFunc])).toBe(true)
    expect(cache.has([myThridFunc])).toBe(false)
  })

  it('can have Symbols as keys.', () => {
    const mySymbol = Symbol()
    const myOtherSymbol = Symbol()
    const myThridSymbol = Symbol()

    const cache = createCache([
      [[mySymbol], 'my symbol'],
      [[myOtherSymbol], 'my other symbol'],
    ])

    expect(cache.has([mySymbol])).toBe(true)
    expect(cache.has([myOtherSymbol])).toBe(true)
    expect(cache.has([myThridSymbol])).toBe(false)
  })

  // Shared by the super-/sub-entries tests below: both mutate one entry
  // through insert/update/update-to-falsey/remove and, after each step,
  // assert a fixed set of *other* key-paths are unaffected. The two tests
  // differed only in which key-path was mutated and which were checked, so
  // the mutate-then-check sequence is factored out (dry4ts flagged the
  // duplicated bodies at score 1.00). Takes `has`/`retrieve` detached from
  // the cache instance -- both close over the cache's own state rather than
  // `this`, so this stays agnostic to the cache's exact TKeyPath union and
  // each call site's checks can be typed as its own, narrower tuple.
  function assertUnaffected<KeyPath extends unknown[]>(
    has: (keyPath: KeyPath) => boolean,
    retrieve: (keyPath: KeyPath) => Primitive,
    checks: [KeyPath, Primitive][],
  ) {
    for (const [keyPath, value] of checks) {
      expect(has(keyPath)).toBe(true)
      expect(retrieve(keyPath)).toBe(value)
    }
  }

  it('can have super-entries.', () => {
    type SubKeyPath = [string, number]
    type SuperKeyPath = [string, number, string, number]
    type KeyPath = SubKeyPath | SuperKeyPath

    const cache = createCache<KeyPath, Primitive>([
      [['retros', 0, 'notes', 3], 'note 3'], // super-entry
      [['retros', 1, 'notes', 5], 'note 5'], // super-entry
    ])
    const superEntries: [SuperKeyPath, Primitive][] = [
      [['retros', 0, 'notes', 3], 'note 3'],
      [['retros', 1, 'notes', 5], 'note 5'],
    ]

    // Inserting a new sub-entry... has no affect on the super-entries
    cache.insert(['retros', 0], 'retro 0')
    assertUnaffected(cache.has, cache.retrieve, superEntries)

    // Updating the sub-entry... has no affect on the super-entries
    cache.update(['retros', 0], 'Sprint Retro 0')
    assertUnaffected(cache.has, cache.retrieve, superEntries)

    // Updating the sub-entry to falsey... has no affect on the super-entries.
    cache.update(['retros', 0], null)
    assertUnaffected(cache.has, cache.retrieve, superEntries)

    // Removing the sub-entry... has no affect on the super-entries.
    cache.remove(['retros', 0])
    assertUnaffected(cache.has, cache.retrieve, superEntries)

    // ...and the sub-entry itself is really gone, not left behind as a
    // stale ENTRY node that a missing `.set()` in _removeAtChild would
    // leave the parent still pointing at (its descendants are what force
    // _removeAtNode down its "keep as a PATH node" branch, the one path in
    // _remove that allocates a *new* node object rather than mutating in
    // place).
    expect(cache.has(['retros', 0])).toBe(false)
    expect(() => cache.retrieve(['retros', 0])).toThrow(/no entry exists/)
  })

  it('can have sub-entries.', () => {
    type SubKeyPath = [string, number]
    type SuperKeyPath = [string, number, string, number]
    type KeyPath = SubKeyPath | SuperKeyPath

    const cache = createCache<KeyPath, Primitive>([
      [['retros', 0], 'retro 0'], // sub-entry
      [['retros', 1], 'retro 1'], // sub-entry
    ])
    const subEntries: [SubKeyPath, Primitive][] = [
      [['retros', 0], 'retro 0'],
      [['retros', 1], 'retro 1'],
    ]

    // Inserting a super-entry... has no affect on the sub-entries
    cache.insert(['retros', 0, 'notes', 3], 'notes 3')
    assertUnaffected(cache.has, cache.retrieve, subEntries)

    // Updating the super-entry... has no affect on the sub-entries
    cache.update(['retros', 0, 'notes', 3], 'NOTE 3!!')
    assertUnaffected(cache.has, cache.retrieve, subEntries)

    // Updating the super-entry to falsey... has no affect on the sub-entries
    cache.update(['retros', 0, 'notes', 3], null)
    assertUnaffected(cache.has, cache.retrieve, subEntries)

    // Removing the super-entry... has no affect on the sub-entries
    cache.remove(['retros', 0, 'notes', 3])
    assertUnaffected(cache.has, cache.retrieve, subEntries)
  })
})

describe('a cache is iterable', () => {
  it('can iterate over existing entries.', () => {
    const cache = createCache([
      [['retros', 0], 'retro0'],
      [['retros', 1], 'retro1'],
      [['users', 89], 'user89'],
    ])

    for (const [keyPath, value] of cache) {
      expect(cache.has(keyPath)).toBe(true)
      expect(cache.retrieve(keyPath)).toBe(value)
    }
    expect(Array.from(cache).length).toBe(cache.size)
  })

  it('can be created from a cache.', () => {
    const cacheMaster = createCache([
      [['retros', 0], 'retro0'],
      [['retros', 1], 'retro1'],
      [['users', 89], 'user89'],
    ])

    const cache = createCache(cacheMaster)

    expect(cache.size).toBe(3)

    expect(cache.has(['retros', 0])).toBe(true)
    expect(cache.has(['retros', 1])).toBe(true)
    expect(cache.has(['users', 89])).toBe(true)

    expect(cache.retrieve(['retros', 0])).toBe('retro0')
    expect(cache.retrieve(['retros', 1])).toBe('retro1')
    expect(cache.retrieve(['users', 89])).toBe('user89')
  })

  it('will throw when inserting entries while iterating over the cache.', () => {
    const cache = createCache<[string, number], string>([
      [['retros', 0], 'retro0'],
      [['retros', 1], 'retro1'],
      [['users', 89], 'user89'],
    ])

    const initialSize = cache.size

    expect(() => {
      // make copies of all of the existing entries
      for (const [keyPath, value] of cache) {
        const [collection, id] = keyPath
        cache.insert([collection, id + 100], value)
      }
    }).toThrow('The cache was mutated while being iterated over')

    // the above iteration threw after the first insertion
    expect(cache.size).toBe(initialSize + 1)

    // now let's continue copying the rest of the entries
    //  in a way that is safe.
    Array.from(cache)
      .filter(([keyPath]) => {
        const [collection, id] = keyPath
        // skip the copies
        if (id >= 100) {
          return false
        }
        // skip the entries that already have copies
        if (cache.has([collection, id + 100])) {
          return false
        }

        return true
      })
      .forEach(([keyPath, value]) => {
        const [collection, id] = keyPath
        // inserting is safe here because the call, Array.from(cache),
        //  has already iterated over the entire cache and now
        //  we are simply looping through all the the entries
        //  that existing in the cache at the time that
        //  Array.from was called.
        cache.insert([collection, id + 100], value)
      })

    expect(cache.size).toBe(initialSize * 2)
  })

  it('will throw when removing an entry while iterating over the cache.', () => {
    const cache = createCache([
      [['retros', 0], 'retro0'],
      [['retros', 1], 'retro1'],
      [['users', 89], 'user89'],
    ])

    const initialSize = cache.size

    expect(() => {
      // remove all entries from the cache
      for (const [keyPath] of cache) {
        cache.remove(keyPath)
        // the next iteration of the cache
        //  will throw because it is unstable
        //  to continue the iterator after
        //  the cache has changed.
      }
    }).toThrow('The cache was mutated while being iterated over')

    // because the iterator above threw
    //  after the first removal, we will ahve
    //  only removed one entry.
    expect(cache.size).toBe(initialSize - 1)

    // if we wish to remove entries from the
    //  cache as we iterate over it. we need to
    //  iterate over the entire cache before
    //  removing entries.
    for (const [keyPath] of Array.from(cache)) {
      cache.remove(keyPath)
    }

    expect(cache.size).toBe(0)
  })

  it('will throw when updating an entry while iterating over the cache.', () => {
    const cache = createCache([
      [['retros', 0], 'retro0'],
      [['retros', 1], 'retro1'],
      [['users', 89], 'user89'],
    ])

    expect(() => {
      // update all values in the cache to include a new prefix.
      for (const [keyPath, value] of cache) {
        cache.update(keyPath, 'prefix_' + value)
        // the next iteration of the cache
        //  will throw because it is unstable
        //  to continue the iterator after
        //  the cache has changed.
      }
    }).toThrow('The cache was mutated while being iterated over')
  })

  // Nothing above ever iterates a cache with no entries -- _entries' `if
  // (!node) return` base case (the empty-cache path) was otherwise never
  // exercised.
  it('yields nothing for an empty cache.', () => {
    expect(Array.from(createCache())).toEqual([])
  })

  // Covers the three _fence++/_fence-- mutants directly: with the real
  // increment, a mutation mid-iteration (even one that "cancels out" size)
  // still bumps the fence and the next `yield` throws. A mutant that flips
  // any one of the three increments to a decrement instead nets back to the
  // fence value iteration started at, so the throw this test expects would
  // never fire.
  it('still detects mutation mid-iteration when the mutation nets back to the same size.', () => {
    const cache = createCache<[string], number>([
      [['a'], 1],
      [['b'], 2],
    ])

    expect(() => {
      for (const [keyPath] of cache) {
        cache.insert(['c'], 3)
        cache.remove(['c'])
        void keyPath
      }
    }).toThrow('The cache was mutated while being iterated over')
  })

  // The test above pairs insert with remove, whose fence bumps are
  // otherwise indistinguishable from an update's own bump (a lone flipped
  // increment always produces *some* mismatch and throws either way -- the
  // sign only becomes observable when it cancels another change back to
  // the fence value iteration started at). Pairing update with insert the
  // same way, but through the raw iterator so only *one* update call ever
  // runs, isolates update's own fence bump: it must be the specific
  // increment that cancels insert's, not just "some" mismatch.
  it('an update mid-iteration contributes its own change to the fence, not merely a mismatch.', () => {
    const cache = createCache<[string], number>([
      [['a'], 1],
      [['b'], 2],
    ])
    const iterator = cache[Symbol.iterator]()
    iterator.next()

    cache.insert(['scratch'], 99)
    cache.update(['scratch'], 100)

    expect(() => iterator.next()).toThrow('The cache was mutated while being iterated over')
  })
})

describe('a CacheError describes where it occurred', () => {
  // Nothing else in this file asserts on the rendered message -- every
  // other test matches only /no entry exists/, which is satisfied even if
  // the key-path never gets attached. This pins keyPathToString, the
  // message getter's concatenation, updateKeyPath, and the three
  // `if (error instanceof CacheError)` catch-guards in _insert/_update/
  // _remove that build the path up as the error propagates back out.
  // Only insert/update/remove wrap the throw with the key at each level as
  // it unwinds (retrieve/has never catch, so their errors always report an
  // empty key path) -- update on a missing nested key path is the shortest
  // way to exercise two levels of that accumulation.
  it('renders the full key path accumulated by nested calls.', () => {
    const cache = createCache([[['retros', 0], 'retro0']])

    let caught: unknown
    try {
      cache.update(['retros', 2], 'Sprint Retro 2')
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(CacheError)
    expect((caught as CacheError).message).toBe(
      'CacheError: UpdateError: no entry exists at the key path.\nKeyPath: [retros, 2]',
    )
  })
})

describe('interior PATH nodes are not entries', () => {
  // Six NoCoverage sites: nothing elsewhere ever has/retrieves/updates/
  // removes at a keypath that lands on an interior PATH node (one that only
  // exists because a longer keypath was inserted through it) rather than an
  // ENTRY node or a missing node entirely.
  function createCacheWithInteriorPath(): Cache<[string] | [string, string], string> {
    return createCache([[['a', 'b'], 'value']])
  }

  it('has() is false at an interior PATH node.', () => {
    const cache = createCacheWithInteriorPath()
    expect(cache.has(['a'])).toBe(false)
  })

  it('retrieve() throws at an interior PATH node.', () => {
    const cache = createCacheWithInteriorPath()
    expect(() => cache.retrieve(['a'])).toThrow(/no entry exists/)
  })

  it('update() throws at an interior PATH node.', () => {
    const cache = createCacheWithInteriorPath()
    expect(() => cache.update(['a'], 'replacement')).toThrow(/no entry exists/)
  })

  it('remove() throws at an interior PATH node.', () => {
    const cache = createCacheWithInteriorPath()
    expect(() => cache.remove(['a'])).toThrow(/no entry exists/)
  })
})

describe('removing a leaf entry directly under an ENTRY node', () => {
  // _remove's base-case guard (`node.type !== 'ENTRY'`) is only exercised on
  // its true branch by every other test here -- they all remove a leaf
  // whose parent is a PATH node. Removing ['a', 'b'] when ['a'] itself is
  // also an entry hits the guard's false branch: `node` (the parent of 'b')
  // has type 'ENTRY', so `!== 'ENTRY'` must actually evaluate rather than
  // being vacuously true, or ['a'] would be wrongly reported missing too.
  it('leaves the parent entry intact.', () => {
    const cache = createCache<[string] | [string, string], string>([
      [['a'], 'a-value'],
      [['a', 'b'], 'b-value'],
    ])

    cache.remove(['a', 'b'])

    expect(cache.has(['a'])).toBe(true)
    expect(cache.retrieve(['a'])).toBe('a-value')
    expect(cache.has(['a', 'b'])).toBe(false)
  })
})

describe('removing the last entry beneath a PATH node prunes it back to the root', () => {
  // has()/retrieve() can't tell an un-pruned, empty PATH node apart from a
  // truly absent one -- both report false/throw, since neither inspects
  // node.nodes.size (see the ghost-node note on the mutation-scan results
  // this test was written against). A second remove() at the same key path
  // can tell them apart: with real pruning the tree is entirely empty
  // again, so _remove's own top-level `!node` guard throws immediately,
  // with a *default*, still-empty key path -- an un-pruned PATH node left
  // behind instead recurses at least one level deeper before finding
  // nothing, and that recursion is what attaches key(s) to the thrown
  // error via rethrowWithKey as it unwinds.
  it('leaves an empty key path on a later remove at the same key path, not an accumulated one.', () => {
    const cache = createCache<[string, string], string>()
    cache.insert(['a', 'b'], 'value')

    cache.remove(['a', 'b'])

    let caught: unknown
    try {
      cache.remove(['a', 'b'])
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(CacheError)
    expect((caught as CacheError).message).toBe(
      'CacheError: RemoveError: no entry exists at the key path.\nKeyPath: []',
    )
  })
})
