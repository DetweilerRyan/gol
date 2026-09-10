# `cache.ts` — implementation notes

Depth that overflows the hover budget, per `doc-comments.md` rule 7. The hover carries the contract; this
file carries why the contract is shaped that way. Read it before "modernising" anything in this module.

The performance exception for Mutability

TLDR: When fast read/write algorithms and memory-efficient data structures
are the priority, Mutability wins over Immutability. Therefore,

in order to ensure that this cache is as performant as possible we
will be deviating from some of the established conventions of the
Functional Paradigm. Namely, immutability, purity, and statelessness.

How does embracing mutability here increase performance?

Each time an entry is inserted, updated, or removed from the cache,
the node where the entry exists must be replaced (no big deal, right?)
AND every node's map along the keypath may be mutated.

The standard approach for setting and deleting values on a Map in
JavaScript without mutating the original map instance requires us to
clone the old map and then perform the mutation on the clone. Meaning,
we have to loop over the entire map every time we add a new value or
update/remove an existing value, and therefore it's O(n).

immutable set:

function set<K,V>(oldMap: ReadOnlyMap<K,V>, key: K, value: V): ReadOnlyMap<K,V> {
// clone the map.
const clone = new Map(oldMap); // O(n)

// mutate the clone
clone.set(key,value); // O(1)

// return the clone
return clone as ReadOnlyMap<K, V>;
}

The immutable algorithms for insert, update, and remove will have an
asymptotic complexity that is a function of the number of entries in
the cache, O(n), while the mutable algorithms are constant time O(1).

Simply put, an immutable approach will cause calls to insert, update,
and remove to become slower as the cache grows larger, and that's no
good.

Is it possible to create an immutable Map whose insertion and removal
algorithms are O(1)? Yes, of course.

Immer does have support for manipulating maps in an immutable way (this
repo itself opts into it via `enableMapSet()` inside `createLiveCellStore`,
for the live-cell Set that store owns), but their approach also creates a
shallow clone of the base Map/Set on first write within a `produce()` call,
and that clone is O(n) -- see `prepareMapCopy`/`prepareSetCopy` in
https://github.com/immerjs/immer/blob/v11.1.17/src/plugins/mapset.ts#L197-L201,
verified against immer 11.1.17, the version in this repo's lockfile at
the time of writing.

Immutable.js and mori both have immutable Maps with near-constant-time
algorithms that do not rely on cloning.
