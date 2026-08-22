import { describe, expect, it, vi } from 'vitest'
import { createLiveCellStore } from './liveCellStore'
import { cellKey } from './gameOfLife'
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

  describe('empty grid', () => {
    it('advance notifies nobody and leaves bounds null', () => {
      const store = createLiveCellStore()
      const cellListener = vi.fn()
      const boundsListener = vi.fn()
      store.subscribeCell(cellKey(0, 0), cellListener)
      store.subscribeBounds(boundsListener)

      store.advance()

      expect(cellListener).not.toHaveBeenCalled()
      expect(store.getBoundsSnapshot()).toBeNull()
    })
  })

  describe('single cell', () => {
    it('advance kills an isolated cell (underpopulation), notifying its subscriber exactly once, bounds -> null', () => {
      const store = createLiveCellStore(new Set([cellKey(3, 3)]))
      const listener = vi.fn()
      store.subscribeCell(cellKey(3, 3), listener)

      store.advance()

      expect(listener).toHaveBeenCalledTimes(1)
      expect(store.getCellSnapshot(cellKey(3, 3))).toBe(false)
      expect(store.getBoundsSnapshot()).toBeNull()
    })
  })

  describe('toggle', () => {
    it('notifies exactly the toggled cell, and only it', () => {
      const store = createLiveCellStore()
      const toggledListener = vi.fn()
      const otherListener = vi.fn()
      store.subscribeCell(cellKey(2, 2), toggledListener)
      store.subscribeCell(cellKey(9, 9), otherListener)

      store.toggle(2, 2)

      expect(toggledListener).toHaveBeenCalledTimes(1)
      expect(otherListener).not.toHaveBeenCalled()
      expect(store.getCellSnapshot(cellKey(2, 2))).toBe(true)
    })

    it('toggled twice returns to the original state, notifying the subscriber both times', () => {
      const store = createLiveCellStore()
      const listener = vi.fn()
      store.subscribeCell(cellKey(4, 4), listener)

      store.toggle(4, 4)
      store.toggle(4, 4)

      expect(listener).toHaveBeenCalledTimes(2)
      expect(store.getCellSnapshot(cellKey(4, 4))).toBe(false)
    })
  })

  describe('place', () => {
    it('notifies only the cells that actually changed, not the whole pattern footprint', () => {
      // Block occupies (5,5) (6,5) (5,6) (6,6). Pre-seed one corner alive so
      // it's already alive before the stamp -- it must not be notified.
      const store = createLiveCellStore(new Set([cellKey(5, 5)]))
      const alreadyAlive = vi.fn()
      const newlyAlive = vi.fn()
      store.subscribeCell(cellKey(5, 5), alreadyAlive)
      store.subscribeCell(cellKey(6, 5), newlyAlive)

      store.place(BLOCK, 5, 5)

      expect(alreadyAlive).not.toHaveBeenCalled()
      expect(newlyAlive).toHaveBeenCalledTimes(1)
      expect(store.getCellSnapshot(cellKey(5, 5))).toBe(true)
      expect(store.getCellSnapshot(cellKey(6, 5))).toBe(true)
      expect(store.getCellSnapshot(cellKey(5, 6))).toBe(true)
      expect(store.getCellSnapshot(cellKey(6, 6))).toBe(true)
    })

    it('notifies nobody when the whole footprint is already alive', () => {
      const store = createLiveCellStore(new Set([cellKey(5, 5), cellKey(6, 5), cellKey(5, 6), cellKey(6, 6)]))
      const listener = vi.fn()
      store.subscribeCell(cellKey(5, 5), listener)

      store.place(BLOCK, 5, 5)

      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('unrelated subscribers', () => {
    it('a subscriber on a cell that never changes is never notified', () => {
      const store = createLiveCellStore(new Set([cellKey(0, 0)]))
      const untouched = vi.fn()
      store.subscribeCell(cellKey(50, 50), untouched)

      store.toggle(1, 1)
      store.advance()
      store.place(BLOCK, 20, 20)

      expect(untouched).not.toHaveBeenCalled()
    })
  })

  describe('subscribe/unsubscribe lifecycle', () => {
    it('unsubscribe stops further notifications', () => {
      const store = createLiveCellStore()
      const listener = vi.fn()
      const unsubscribe = store.subscribeCell(cellKey(1, 1), listener)

      store.toggle(1, 1)
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()
      store.toggle(1, 1)
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('trackedCellCount returns to 0 after the last unsubscribe', () => {
      const store = createLiveCellStore()
      const unsubA = store.subscribeCell(cellKey(1, 1), vi.fn())
      const unsubB = store.subscribeCell(cellKey(2, 2), vi.fn())
      expect(store.trackedCellCount()).toBe(2)

      unsubA()
      expect(store.trackedCellCount()).toBe(1)

      unsubB()
      expect(store.trackedCellCount()).toBe(0)
    })

    it('trackedCellCount stays at 1 bucket for multiple listeners on the same cell until all unsubscribe', () => {
      const store = createLiveCellStore()
      const unsubA = store.subscribeCell(cellKey(1, 1), vi.fn())
      const unsubB = store.subscribeCell(cellKey(1, 1), vi.fn())
      expect(store.trackedCellCount()).toBe(1)

      unsubA()
      expect(store.trackedCellCount()).toBe(1)

      unsubB()
      expect(store.trackedCellCount()).toBe(0)
    })

    it('double-unsubscribe is idempotent', () => {
      const store = createLiveCellStore()
      const unsubscribe = store.subscribeCell(cellKey(1, 1), vi.fn())
      unsubscribe()
      expect(() => unsubscribe()).not.toThrow()
      expect(store.trackedCellCount()).toBe(0)
    })

    it('a stale unsubscribe closure called again after resubscribing the same listener does not remove the new subscription', () => {
      const store = createLiveCellStore()
      const listener = vi.fn()
      const unsubFirst = store.subscribeCell(cellKey(1, 1), listener)
      unsubFirst()
      // Resubscribe the same listener reference to the same key -- unsubFirst
      // is now stale, but nothing has invalidated it. Calling it again must
      // stay a no-op rather than tearing down the new subscription.
      store.subscribeCell(cellKey(1, 1), listener)
      unsubFirst()

      store.toggle(1, 1)
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('unsubscribing via a second closure for an already-fully-removed key does not throw', () => {
      // subscribeCell twice with the same (key, listener) pair returns two
      // independent Unsubscribe closures over one Set entry (add is
      // idempotent). Calling the first removes the key's bucket entirely;
      // the second closure's own first call must then find no bucket left
      // to delete from, rather than dereferencing it.
      const store = createLiveCellStore()
      const listener = vi.fn()
      const unsubA = store.subscribeCell(cellKey(1, 1), listener)
      const unsubB = store.subscribeCell(cellKey(1, 1), listener)
      unsubA()
      expect(() => unsubB()).not.toThrow()
    })
  })

  describe('dispatch-order edge cases', () => {
    it('a listener subscribed during notification is not called for that in-flight notification', () => {
      const store = createLiveCellStore()
      const lateListener = vi.fn()
      const subscribingListener = vi.fn(() => {
        store.subscribeCell(cellKey(3, 3), lateListener)
      })
      store.subscribeCell(cellKey(3, 3), subscribingListener)

      store.toggle(3, 3)

      expect(subscribingListener).toHaveBeenCalledTimes(1)
      expect(lateListener).not.toHaveBeenCalled()

      // The newly-subscribed listener is live for the *next* notification.
      store.toggle(3, 3)
      expect(lateListener).toHaveBeenCalledTimes(1)
    })

    it('a listener unsubscribed mid-dispatch by another listener still receives its already-snapshotted call', () => {
      const store = createLiveCellStore()
      const victim = vi.fn()
      let unsubscribeVictim: () => void
      const unsubscriber = vi.fn(() => {
        unsubscribeVictim()
      })
      unsubscribeVictim = store.subscribeCell(cellKey(3, 3), victim)
      store.subscribeCell(cellKey(3, 3), unsubscriber)

      store.toggle(3, 3)

      expect(victim).toHaveBeenCalledTimes(1)
      expect(unsubscriber).toHaveBeenCalledTimes(1)
      expect(store.trackedCellCount()).toBe(1)
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
})
