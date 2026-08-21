/**
 *
 *
 *
 * The performance exception for Mutability
 *
 * TLDR: When fast read/write algorithms and memory effecient data structures
 * are the priority then Mutability wins over Immutability. Therefore,
 *
 * In order to ensure that this cache is as performant as possible we
 * will be deviating from some of the established conventions of the
 * Functional Paradigm. Namely, immutibily, pureity, and statelessness.
 *
 * For performance reasons the following methods will mutate the cache instance:
 *  - insert
 *  - update
 *  - remove
 *
 * How does embracing mutibility here increase performance?
 *
 * Each time an entry is inserted, updated, or removed from the cache,
 * the node where the entry exists must be replaced (no big deal right?)
 * AND the every nodes map at each node in the keypath may be mutated.
 *
 * The standard approach for seting and deleted values from a Map in javascript
 * that doesn't mutate the original map instance requires us to clone
 * old map and then performing the mutation on the clone. Meaning,
 * we have to loop over the entire map every time we add new value or
 * update/remove an existing value and therefore is O(n).
 *
 * immtable set:
 *
 * function set<K,V>(oldMap: ReadOnlyMap<K,V>, key: K, value: V): ReadOnlyMap<K,V> {
 *   // clone the map.
 *   const clone = new Map(oldMap); // O(n)
 *
 *   // mutate the clone
 *   clone.set(key,value); // O(1)
 *
 *   // return the clone
 *   return clone as ReadOnlyMap<K, V>;
 * }
 *
 * The immutable algorithms for the insert, update, and remove will have
 * an asymptotic complexity that is a function of the number of entries
 * in the cache O(n). While the muttable algorithms are constant time O(1).
 *
 * Simpmly put, an immutable apporach will cause calls to insert, update,
 * and remove to become slower as the cache grows larger and thats no
 * good.
 *
 * Is it possible to create an Immuable Map who's insertion and removal
 * althorithms are O(1)? yes, of course.
 *
 * Immer does have support for manipulating maps in an immutable way,
 * but their approach also creates shallow clones of maps and are O(n)
 *  as can be see here in their source code:
 * https://github.com/immerjs/immer/blob/f6736a4beef727c6e5b41c312ce1b202ad3afb23/src/plugins/mapset.ts#L169
 *
 * Immutable.js and muri both have immutable Maps with near constant time algorithms
 * that do not rely on cloning.
 *
 *
 *
 *
 */

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
    // to do throw when there is no node?
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

  // the node that we are removing has no decendants
  //  so let's remove the entire thing
  if (node.nodes.size === 0) {
    return null
  }
  // otherwise, the node does have decendants
  //  so return a new node without the entry
  //  but we preserve all of it's decendants
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

    // SIDE EFFECT: then remove it's entry form my node's map
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

  retrieve(keyPath: TKeyPath): T

  readonly size: number
}

export interface Cache<TKeyPath extends unknown[], T> extends ReadonlyCache<TKeyPath, T> {
  /**
   * Inserts a value at the key path.
   *
   * Throws if an entry does exist at the key path. Use the
   * {@link Cache.has} method to guard for an entry that
   * may already exist in the cache:
   *
   * ```typescript
   * if(cashe.has(keyPath)) {
   *   cache.insert(keyPath, value);
   * }
   * ```
   *
   * @remark @todo a future improvment under consideration is for
   * the insert method to return a remove, update, retrieve, and has methods
   * that don't require the keyPath to be passed in. This will reduce
   * the chances of code errors when keeping track of key paths for
   * entries that have been inserted.
   * ```typescript
   * cosnt { remove } = cache.insert(keyPath, value);
   * try {
   *   await doThingsWithValue(value);
   * } finally {
   *   remove();
   * }
   * ```
   *
   * @param keyPath
   * @param value
   */
  insert(keyPath: TKeyPath, value: T): void

  /**
   * Removes the entry from the cache at the provided key path.
   *
   * Throws if an entry does not exist at the key path. Ues the
   * {@link Cache.has} method to guard before removing the entry
   * at a key path you're unsure exists in the cache.
   *
   * ```typescript
   * if(cashe.has(keyPath)) {
   *   cache.remove(keyPath);
   * }
   * ```
   *
   * Removing an entry from a cache while iterating over it will
   * throw. This is because it is unstable to continue iterating
   * over the cache after it has been mutated:
   *
   * ```typescript
   * // remove all entries from the cache
   * for (const [keyPath, value] of cache) {
   *   // the first call to remove in this loop will succeed, but
   *   //  retrieving the next iteration will throw.
   *   cache.remove(keyPath);
   * }
   * ```
   *
   * Instead, make sure to complete the iteration of the cache before,
   * beginning to mutatate it:
   *
   * ```typescript
   * // remove all entries from the cache
   * for (const [keyPath, value] of Array.from(cache)) {
   *   cache.remove(keyPath);
   * }
   * ```
   * @param keyPath
   */
  remove(keyPath: TKeyPath): void
  update(keyPath: TKeyPath, value: T): void
}

export function createCache<TKeyPath extends unknown[], T>(
  initialEntries?: Iterable<[TKeyPath, T]>,
): Cache<TKeyPath, T> {
  let _root: NullableNode<T>
  let _size = 0
  /**
   * Is a fencing token representing a particular state of the cache.
   * Each time the cache is mutated (insert, update, or remove) the
   * fencing token will be set to a unique value.
   */
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
      /**
       * The fencing token representing the state that the cache
       * was in when we began iterating over it.
       */
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
