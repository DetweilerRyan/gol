// Deliberately MUTABLE rather than immutable, and that is a performance
// ruling rather than an oversight. See ./cache.rationale.md for the argument in full.

type KeyPath = unknown[]

type PathNode<T> = {
  readonly type: 'PATH'
  readonly nodes: Map<unknown, NonNullNode<T>>
}

type EntryNode<T> = {
  readonly type: 'ENTRY'
  readonly value: T
  readonly nodes: Map<unknown, NonNullNode<T>>
}

type NullNode = null | undefined

type NonNullNode<T> = PathNode<T> | EntryNode<T>

type NullableNode<T> = NullNode | NonNullNode<T>

/**
 * Thrown by a {@link Cache} operation that fails against a key path -- a
 * missing entry, an entry that already exists, or a stale iterator. The
 * key path accumulates as the error unwinds through nested containers, so
 * `message` names the full path from the root, not just where it surfaced.
 */
export class CacheError extends Error {
  constructor(message: string, keyPath: KeyPath = []) {
    super()
    this.#keyPath = keyPath
    this.#message = message
  }

  public static keyPathToString(keyPath: KeyPath): string {
    return '[' + keyPath.map(String).join(', ') + ']'
  }

  #keyPath: KeyPath
  #message: string

  public get message(): string {
    const keyPathStr = CacheError.keyPathToString(this.#keyPath)
    return 'CacheError: ' + this.#message + '\nKeyPath: ' + keyPathStr
  }

  public updateKeyPath(key: unknown) {
    this.#keyPath = [key, ...this.#keyPath]
    return this
  }
}

// Shared by _insert/_update/_remove: each recurses into a child keyed by
// `key`, and on the way back out needs to prepend that key onto any
// CacheError's keyPath so the error that reaches the caller names the full
// path from the root, not just the point where it was thrown. Extracted
// because the three call sites were otherwise identical catch blocks.
//
// SURVIVING MUTANT THAT IS *NOT* EQUIVALENT -- don't re-rule it as one, and
// don't delete this guard as dead code. Stryker reports `error instanceof
// CacheError` -> `true` as Survived, covered by 7 tests (so not a NoCoverage
// row, and equivalence is a question that can be asked of it -- the answer is
// no). The tempting argument is that the guard is dead: every error these
// three try blocks raise from the cache's OWN logic really is a CacheError,
// since each only recurses into _insert/_update/_remove and every base case
// those bottom out at throws `new CacheError(...)`. That argument is wrong,
// because a foreign error can arrive from the RUNTIME rather than from the
// logic. `keyPath` is `unknown[]`, so a long enough one is a legal call that
// overflows the stack inside the recursion, and the resulting RangeError
// unwinds through every one of these catch frames. Measured (architect,
// equivalence-rulings-live-in-commits-not-at-sites, Node 24 / darwin): an
// 8,000-key insert throws RangeError in ~223ms as written, and TypeError
// ("error.updateKeyPath is not a function") with the mutant applied. This
// guard's real job is that unwind path -- keeping a foreign error intact
// rather than masking it at the first catch frame.
//
// Deliberately left untested, which is why the mutant survives. The trigger
// DEPTH is environmental (frame size varies by engine, and by how a runner
// instruments the code) while the divergence is not; and on a larger stack
// the O(n^2) rest-spread in the recursive case reaches an uncatchable heap
// OOM before the RangeError -- measured at 200,000 keys, which kills the
// worker outright instead of reddening an assertion. A portable test costs
// more flakiness than this guard is worth.
function rethrowWithKey(error: unknown, key: unknown): never {
  if (error instanceof CacheError) {
    error.updateKeyPath(key)
  }
  throw error
}

function _has<T>(node: NullableNode<T>, keyPath: KeyPath): boolean {
  // fell off the tree case:
  if (!node) {
    return false
  }

  // base case:
  if (keyPath.length === 0) {
    return node.type === 'ENTRY'
  }

  // Recursive case:

  const [key, ...restKeys] = keyPath

  return _has(node.nodes.get(key), restKeys)
}

function _retrieve<T>(node: NullableNode<T>, keyPath: KeyPath): T {
  // base case:
  if (!node) {
    throw new CacheError('RetrieveError: no entry exists at the key path.')
  }

  // base case:
  if (keyPath.length === 0) {
    if (node.type === 'PATH') {
      throw new CacheError('RetrieveError: no entry exists at the key path.')
    }
    return node.value
  }

  // Recursive case:

  const [key, ...restKeys] = keyPath

  return _retrieve(node.nodes.get(key), restKeys)
}

function* _entries<TKeyPath extends unknown[], T>(node: NullableNode<T>, keyPath: KeyPath): Generator<[TKeyPath, T]> {
  // base case
  if (!node) {
    return
  }

  if (node.type === 'ENTRY') {
    // if the node is an entry then the keyPath is TKeyPath
    yield [keyPath as TKeyPath, node.value]
  }

  // recursively yield to each child's entries
  for (const [key, childNode] of node.nodes) {
    yield* _entries(childNode, [...keyPath, key])
  }
}

function _insert<T>(node: NullableNode<T>, keyPath: KeyPath, value: T): NonNullNode<T> {
  // base case
  if (keyPath.length === 0) {
    // if there is no node then create one
    if (!node) {
      return {
        type: 'ENTRY',
        value,
        nodes: new Map<unknown, NonNullNode<T>>(),
      }
    }
    // if the node is an entry node then throw
    if (node.type === 'ENTRY') {
      throw new CacheError('InsertError: an entry already exists at the key path.')
    }
    // if the node is a PathNode then convert it to an EntryNode
    return {
      ...node,
      type: 'ENTRY',
      value,
    }
  }

  // recursive case
  if (!node) {
    node = {
      type: 'PATH',
      nodes: new Map(),
    }
  }

  const [key, ...restKeyPath] = keyPath
  try {
    const childNode = _insert(node.nodes.get(key), restKeyPath, value)
    // SIDE EFFECT: mutate the existing notes map
    node.nodes.set(key, childNode)
    return node
  } catch (error) {
    rethrowWithKey(error, key)
  }
}

function _update<T>(node: NullableNode<T>, keyPath: KeyPath, value: T): NonNullNode<T> {
  // if there is no node then throw
  if (!node) {
    throw new CacheError('UpdateError: no entry exists at the key path.')
  }

  // base case:
  if (keyPath.length === 0) {
    if (node.type === 'PATH') {
      throw new CacheError('UpdateError: no entry exists at the key path.')
    }
    return {
      ...node,
      value,
    }
  }

  // Recursive case:

  const [key, ...restKeyPath] = keyPath
  try {
    const childNode = _update(node.nodes.get(key), restKeyPath, value)
    // SIDE EFFECT: mutate the existing notes map
    node.nodes.set(key, childNode)
    return node
  } catch (error) {
    rethrowWithKey(error, key)
  }
}

// The base case of _remove: we've walked the keyPath down to the node to
// remove itself. Split from the recursive case below so each half stays
// under the CRAP/CC threshold on its own.
function _removeAtNode<T>(node: NonNullNode<T>): NullableNode<T> {
  // if the node at the key path is not an entry node
  //  then we must throw
  if (node.type !== 'ENTRY') {
    throw new CacheError('RemoveError: no entry exists at the key path.')
  }

  // the node that we are removing has no descendants
  //  so let's remove the entire thing
  if (node.nodes.size === 0) {
    return null
  }
  // otherwise, the node does have descendants
  //  so return a new node without the entry
  //  but we preserve all of its descendants
  return {
    type: 'PATH',
    nodes: node.nodes,
  }
}

// The recursive case of _remove: descend to `key`'s child, then fold the
// result of removing there back into this node's own map.
function _removeAtChild<T>(node: NonNullNode<T>, key: unknown, restKeyPath: KeyPath): NullableNode<T> {
  try {
    const childNode = _remove(node.nodes.get(key), restKeyPath)

    // if the node as not been deleted then
    if (childNode) {
      // SIDE EFFECT: update my nodes with the new inner node
      node.nodes.set(key, childNode)
      // and return
      return node
    }

    // else the node has been deleted

    // SIDE EFFECT: then remove its entry from my node's map
    node.nodes.delete(key)
    // if my nodes map is now empty AND I don't have an entry
    //  then my node also needs to be deleted so return null
    if (node.nodes.size === 0 && node.type !== 'ENTRY') {
      return null
    }
    // otherwise return my node now that it has deleted the
    //  entry from the key
    return node
  } catch (error) {
    rethrowWithKey(error, key)
  }
}

function _remove<T>(node: NullableNode<T>, keyPath: KeyPath): NullableNode<T> {
  if (!node) {
    throw new CacheError('RemoveError: no entry exists at the key path.')
  }

  // base case: we are at the node to remove
  if (keyPath.length === 0) {
    return _removeAtNode(node)
  }

  // recursive case
  const [key, ...restKeyPath] = keyPath
  return _removeAtChild(node, key, restKeyPath)
}

export interface ReadonlyCache<TKeyPath extends unknown[], T> extends Iterable<[TKeyPath, T]> {
  has(keyPath: TKeyPath): boolean

  /**
   * Retrieves the value stored at the key path.
   *
   * @throws CacheError if no entry exists at the key path -- guard with
   * {@link ReadonlyCache.has} first.
   */
  retrieve(keyPath: TKeyPath): T

  readonly size: number
}

/**
 * Mutates the cache instance in place for performance -- `insert`,
 * `update`, and `remove` never return a new cache. Each also bumps an
 * internal fence, so any of the three invalidates an iteration already in
 * progress over the cache (see `remove`'s note).
 */
export interface Cache<TKeyPath extends unknown[], T> extends ReadonlyCache<TKeyPath, T> {
  /**
   * Inserts a value at the key path.
   *
   * @throws CacheError if an entry already exists at the key path --
   * guard with {@link Cache.has} first.
   */
  // TODO: a future improvement under consideration is for
  // the insert method to return a remove, update, retrieve, and has methods
  // that don't require the keyPath to be passed in. This will reduce
  // the chances of code errors when keeping track of key paths for
  // entries that have been inserted.
  // ```typescript
  // const { remove } = cache.insert(keyPath, value);
  // try {
  //   await doThingsWithValue(value);
  // } finally {
  //   remove();
  // }
  // ```
  insert(keyPath: TKeyPath, value: T): void

  /**
   * Removes the entry from the cache at the provided key path.
   *
   * Removing mid-iteration invalidates that iteration: the *iterator's
   * next step* throws a {@link CacheError} (not this call). Finish
   * iterating first -- e.g. `Array.from(cache)` -- if you need to remove
   * while iterating.
   *
   * @throws CacheError if no entry exists at the key path -- guard with
   * {@link Cache.has} first.
   */
  remove(keyPath: TKeyPath): void

  /**
   * Updates the value already stored at the key path.
   *
   * @throws CacheError if no entry exists at the key path -- guard with
   * {@link Cache.has} first.
   */
  update(keyPath: TKeyPath, value: T): void
}

/**
 * Creates a new, empty {@link Cache}, optionally seeded with entries.
 *
 * @throws CacheError if `initialEntries` contains two entries at the same
 * key path -- seeding inserts them one at a time.
 *
 * @see {@link ./cache.rationale.md}
 */
export function createCache<TKeyPath extends unknown[], T>(
  initialEntries?: Iterable<[TKeyPath, T]>,
): Cache<TKeyPath, T> {
  let _root: NullableNode<T>
  let _size = 0
  // Is a fencing token representing a particular state of the cache.
  // Each time the cache is mutated (insert, update, or remove) the
  // fencing token will be set to a unique value.
  let _fence = 0

  const cache: Cache<TKeyPath, T> = {
    has(keyPath) {
      return _has(_root, keyPath)
    },

    retrieve(keyPath) {
      return _retrieve(_root, keyPath)
    },

    insert(keyPath, value) {
      _root = _insert(_root, keyPath, value)
      _size++
      // the cache has mutated; update the fence
      _fence++
    },

    update(keyPath, value) {
      _root = _update(_root, keyPath, value)
      // the cache has mutated; update the fence
      _fence++
    },

    remove(keyPath) {
      _root = _remove(_root, keyPath)
      _size--
      // the cache has mutated; update the fence
      _fence++
    },

    get size() {
      return _size
    },

    *[Symbol.iterator]() {
      // The fencing token representing the state that the cache
      // was in when we began iterating over it.
      const initialFence = _fence
      for (const entry of _entries<TKeyPath, T>(_root, [])) {
        // if the current fence token has changed from the initial fence
        //  then we need to throw because the cache has been mutated and
        //  the iterator is no longer stable.
        if (initialFence !== _fence) {
          const [keyPath] = entry
          throw new CacheError(
            'The cache was mutated while being iterated over. Use Array.from on the cache to completely iterate over the cache before mutating it.',
            keyPath,
          )
        }
        yield entry
      }
    },
  }

  if (initialEntries) {
    for (const [keyPath, value] of initialEntries) {
      cache.insert(keyPath, value)
    }
  }

  return cache
}
