import { describe, expect, it, vi } from 'vitest'
import { createLiveCellStore } from './liveCellStore'
import { cellKey, type CellKey } from './gameOfLife'
import { getPatternByName } from './patternLibrary'

const BLOCK = getPatternByName('Block')!

describe('createLiveCellStore', () => {
  describe('getLiveCells / freeze invariant', () => {
    it('is frozen immediately after construction', () => {
      const store = createLiveCellStore()
      expect(() => (store.getLiveCells() as Set<string>).add('9,9')).toThrow()
    })

    it('stays frozen after every kind of mutator', () => {
      const store = createLiveCellStore(new Set([cellKey(0, 0)]))

      store.toggle(1, 1)
      expect(() => (store.getLiveCells() as Set<string>).add('9,9')).toThrow()

      store.place(BLOCK, 5, 5)
      expect(() => (store.getLiveCells() as Set<string>).add('9,9')).toThrow()

      store.advance()
      expect(() => (store.getLiveCells() as Set<string>).add('9,9')).toThrow()
    })

    it('takes ownership at construction -- mutating the caller Set afterward does not reach the store', () => {
      const callerCells = new Set([cellKey(0, 0)])
      const store = createLiveCellStore(callerCells)
      callerCells.add(cellKey(9, 9))
      expect(store.getLiveCells().has(cellKey(9, 9))).toBe(false)
    })
  })

  // WHAT THIS BLOCK REPLACED, since a reader comparing against git history
  // will find it much shorter. Until collapse-dead-cell-layer's REVIEW pass
  // these cases were per-cell: subscribeCell on the cells a mutation should
  // and should not touch, asserted through getCellSnapshot. That channel is
  // retired with the render path that used it (see liveCellStore.ts's
  // header), so what survives is the mutation's effect on the published set
  // plus the whole-set dispatch. The per-cell precision is not weakened here
  // and asserted elsewhere -- it is GONE, deliberately, and the successor
  // contract is stated in liveCellStore.property.test.ts's header.
  describe('mutators', () => {
    it('advance on an empty grid changes nothing and leaves bounds null', () => {
      const store = createLiveCellStore()
      const listener = vi.fn()
      store.subscribeCells(listener)

      store.advance()

      expect(listener).toHaveBeenCalledTimes(1)
      expect(store.getLiveCells().size).toBe(0)
      expect(store.getBoundsSnapshot()).toBeNull()
    })

    it('advance kills an isolated cell (underpopulation), bounds -> null', () => {
      const store = createLiveCellStore(new Set([cellKey(3, 3)]))

      store.advance()

      expect(store.getLiveCells().has(cellKey(3, 3))).toBe(false)
      expect(store.getBoundsSnapshot()).toBeNull()
    })

    it('toggled twice returns to the original state, notifying both times', () => {
      const store = createLiveCellStore()
      const listener = vi.fn()
      store.subscribeCells(listener)

      store.toggle(4, 4)
      expect(store.getLiveCells().has(cellKey(4, 4))).toBe(true)
      store.toggle(4, 4)

      expect(store.getLiveCells().has(cellKey(4, 4))).toBe(false)
      expect(listener).toHaveBeenCalledTimes(2)
    })

    it('place brings the whole footprint to life, including a corner that was already alive', () => {
      // Block occupies (5,5) (6,5) (5,6) (6,6). One corner is pre-seeded, so
      // this also covers the merge case: an already-live cell stays alive
      // rather than being toggled off.
      const store = createLiveCellStore(new Set([cellKey(5, 5)]))

      store.place(BLOCK, 5, 5)

      const live = store.getLiveCells()
      for (const key of [cellKey(5, 5), cellKey(6, 5), cellKey(5, 6), cellKey(6, 6)]) {
        expect(live.has(key)).toBe(true)
      }
    })

    it('place onto an already-live footprint still notifies, and keeps the published identity', () => {
      // The one mutator path where immer returns the base Set unchanged (a
      // redundant Set add is not a mutation), so it is the case that shows
      // the whole-set channel is unconditional rather than delta-driven --
      // the retired per-cell channel notified nobody here.
      const store = createLiveCellStore(new Set([cellKey(5, 5), cellKey(6, 5), cellKey(5, 6), cellKey(6, 6)]))
      const listener = vi.fn()
      store.subscribeCells(listener)
      const before = store.getLiveCells()

      store.place(BLOCK, 5, 5)

      expect(listener).toHaveBeenCalledTimes(1)
      expect(store.getLiveCells()).toBe(before)
    })
  })

  // Every guarantee here used to be stated on the per-cell channel and is
  // re-anchored on the whole-set one rather than dropped: notify() dispatches
  // over a copy (Array.from) in both surviving channels, and that copy is
  // what these three cases are about.
  describe('dispatch-order edge cases', () => {
    it('a listener subscribed during notification is not called for that in-flight notification', () => {
      const store = createLiveCellStore()
      const lateListener = vi.fn()
      const subscribingListener = vi.fn(() => {
        store.subscribeCells(lateListener)
      })
      store.subscribeCells(subscribingListener)

      store.toggle(3, 3)

      expect(subscribingListener).toHaveBeenCalledTimes(1)
      expect(lateListener).not.toHaveBeenCalled()

      // The newly-subscribed listener is live for the *next* notification.
      store.toggle(3, 3)
      expect(lateListener).toHaveBeenCalledTimes(1)
    })

    it('every listener reads the already-published generation, whenever in the dispatch it runs', () => {
      // publish() precedes notify(), so dispatch order can never be a
      // correctness question -- an early listener and a late one see the same
      // (new) state. A blinker, so the read is a real generation rather than
      // a one-cell toggle: both ends die and one new cell is born.
      const store = createLiveCellStore(new Set([cellKey(0, 0), cellKey(1, 0), cellKey(2, 0)]))
      const seen: Array<Set<CellKey>> = []
      store.subscribeCells(() => seen.push(new Set(store.getLiveCells())))
      store.subscribeCells(() => seen.push(new Set(store.getLiveCells())))

      store.advance()

      const expected = new Set([cellKey(1, -1), cellKey(1, 0), cellKey(1, 1)])
      expect(seen).toEqual([expected, expected])
    })

    it('a listener unsubscribed mid-dispatch by another listener still receives its already-snapshotted call', () => {
      const store = createLiveCellStore()
      const victim = vi.fn()
      let unsubscribeVictim: () => void
      const unsubscriber = vi.fn(() => {
        unsubscribeVictim()
      })
      unsubscribeVictim = store.subscribeCells(victim)
      store.subscribeCells(unsubscriber)

      store.toggle(3, 3)

      expect(victim).toHaveBeenCalledTimes(1)
      expect(unsubscriber).toHaveBeenCalledTimes(1)

      // And is genuinely gone for the next one.
      store.toggle(3, 3)
      expect(victim).toHaveBeenCalledTimes(1)
    })

    it('double-unsubscribe is idempotent and does not disturb another subscriber', () => {
      const store = createLiveCellStore()
      const survivor = vi.fn()
      const unsubscribe = store.subscribeCells(vi.fn())
      store.subscribeCells(survivor)

      unsubscribe()
      expect(() => unsubscribe()).not.toThrow()

      store.toggle(1, 1)
      expect(survivor).toHaveBeenCalledTimes(1)
    })
  })

  describe('bounds', () => {
    it('is null on an empty store and becomes the live-cell bounding box after a mutation', () => {
      const store = createLiveCellStore()
      expect(store.getBoundsSnapshot()).toBeNull()

      store.toggle(2, 3)

      expect(store.getBoundsSnapshot()).toEqual({ minX: 2, maxX: 3, minY: 3, maxY: 4 })
    })

    it('returns the same object identity across reads when nothing has mutated', () => {
      const store = createLiveCellStore(new Set([cellKey(0, 0)]))
      const first = store.getBoundsSnapshot()
      const second = store.getBoundsSnapshot()
      expect(second).toBe(first)
    })

    it('returns the same object identity across a mutation that does not move the box', () => {
      // Toggling (0,0) off and (1,1) doesn't exist yet; use two cells inside
      // the same bounding box so a toggle within it leaves minX/maxX/minY/maxY
      // unchanged.
      const store = createLiveCellStore(new Set([cellKey(0, 0), cellKey(1, 1)]))
      const before = store.getBoundsSnapshot()

      // Toggling (0, 1) on stays inside the existing [0,2)x[0,2) box.
      store.toggle(0, 1)

      const after = store.getBoundsSnapshot()
      expect(after).toEqual(before)
      expect(after).toBe(before)
    })

    it('returns a new object identity when the box actually moves', () => {
      const store = createLiveCellStore(new Set([cellKey(0, 0)]))
      const before = store.getBoundsSnapshot()

      store.toggle(10, 10)

      const after = store.getBoundsSnapshot()
      expect(after).not.toEqual(before)
      expect(after).not.toBe(before)
    })

    it('notifies bounds subscribers unconditionally on every mutation, even one that does not change bounds', () => {
      const store = createLiveCellStore(new Set([cellKey(0, 0), cellKey(1, 1)]))
      const boundsListener = vi.fn()
      store.subscribeBounds(boundsListener)

      store.toggle(0, 1)

      expect(boundsListener).toHaveBeenCalledTimes(1)
    })

    it('bounds subscriptions unsubscribe cleanly', () => {
      const store = createLiveCellStore()
      const listener = vi.fn()
      const unsubscribe = store.subscribeBounds(listener)

      store.toggle(0, 0)
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()
      store.toggle(1, 1)
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('a stale bounds-unsubscribe closure called again after resubscribing the same listener does not remove the new subscription', () => {
      const store = createLiveCellStore()
      const listener = vi.fn()
      const unsubFirst = store.subscribeBounds(listener)
      unsubFirst()
      store.subscribeBounds(listener)
      unsubFirst()

      store.toggle(0, 0)
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('subscribeCells / getLiveCells (whole-set subscription)', () => {
    it('notifies a whole-set subscriber on toggle', () => {
      const store = createLiveCellStore()
      const listener = vi.fn()
      store.subscribeCells(listener)

      store.toggle(0, 0)

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('notifies a whole-set subscriber on advance, even when the delta is empty', () => {
      const store = createLiveCellStore()
      const listener = vi.fn()
      store.subscribeCells(listener)

      store.advance()

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('notifies a whole-set subscriber on place', () => {
      const store = createLiveCellStore()
      const listener = vi.fn()
      store.subscribeCells(listener)

      store.place(BLOCK, 0, 0)

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('getLiveCells reflects the mutation a subscriber was notified about', () => {
      const store = createLiveCellStore()
      let seenAlive: boolean | undefined
      store.subscribeCells(() => {
        seenAlive = store.getLiveCells().has(cellKey(2, 2))
      })

      store.toggle(2, 2)

      expect(seenAlive).toBe(true)
    })

    it('whole-set subscriptions unsubscribe cleanly', () => {
      const store = createLiveCellStore()
      const listener = vi.fn()
      const unsubscribe = store.subscribeCells(listener)

      store.toggle(0, 0)
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()
      store.toggle(1, 1)
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('a stale cells-unsubscribe closure called again after resubscribing the same listener does not remove the new subscription', () => {
      const store = createLiveCellStore()
      const listener = vi.fn()
      const unsubFirst = store.subscribeCells(listener)
      unsubFirst()
      store.subscribeCells(listener)
      unsubFirst()

      store.toggle(0, 0)
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('keeps the two surviving channels independent -- releasing one leaves the other subscribed', () => {
      // The per-cell channel this case used to contrast against is gone, so
      // the remaining pair worth separating is bounds vs cells: they are two
      // Sets dispatched by one notify(), and a release on either must not
      // reach the other.
      const store = createLiveCellStore()
      const boundsListener = vi.fn()
      const cellsListener = vi.fn()
      const releaseBounds = store.subscribeBounds(boundsListener)
      store.subscribeCells(cellsListener)

      releaseBounds()
      store.toggle(0, 0)

      expect(boundsListener).not.toHaveBeenCalled()
      expect(cellsListener).toHaveBeenCalledTimes(1)
    })
  })
})
