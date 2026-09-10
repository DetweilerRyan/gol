# `cache.ts` — implementation notes

Depth that overflows the hover budget, per `doc-comments.md` rule 7. The hover carries the contract; this
file carries why the contract is shaped that way. Read it before "modernising" anything in this module.

## The performance exception for mutability

**When fast read/write algorithms and memory-efficient data structures are the priority, mutability wins
over immutability.** So this module deliberately departs from three conventions of the functional
paradigm that the rest of `src/` holds to: immutability, purity, and statelessness.

Each time an entry is inserted, updated, or removed, the node holding that entry must be replaced — and
every node's `Map` along the key path may be mutated too.

## Why the immutable form is O(entries) and this one is O(keypath)

Setting or deleting a value on a `Map` without mutating the original requires cloning the map and
mutating the clone. That loops over the whole map on every write, so it is O(n):

```typescript
function set<K, V>(oldMap: ReadOnlyMap<K, V>, key: K, value: V): ReadOnlyMap<K, V> {
  // clone the map
  const clone = new Map(oldMap) // O(n)

  // mutate the clone
  clone.set(key, value) // O(1)

  // return the clone
  return clone as ReadOnlyMap<K, V>
}
```

The immutable algorithms for insert, update and remove therefore have a complexity that is a function of
the number of entries in the cache. The mutable ones are constant time. An immutable approach makes those
three calls slower as the cache grows, which is the thing this module exists to avoid.

## Immer does not close the gap, and the alternatives that would are not here

An immutable `Map` with near-constant-time insertion and removal is certainly possible. Immutable.js and
mori both ship one, built without cloning. Neither is a dependency of this repo.

Immer does support manipulating maps immutably, and this repo already opts into that elsewhere — see the
`enableMapSet()` call inside `createLiveCellStore`, for the live-cell `Set` that store owns. It does not
help here. Immer shallow-clones the base `Map` or `Set` on the first write inside a `produce()` call, and
that clone is O(n): see `prepareMapCopy` and `prepareSetCopy` in
https://github.com/immerjs/immer/blob/v11.1.17/src/plugins/mapset.ts#L197-L201, verified against immer
11.1.17, the version in this repo's lockfile at the time of writing.
