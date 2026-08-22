import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Camera } from '../camera'
import { computeLattice, latticeCovers, latticeOffsetPx } from '../cellLattice'
import type { ElementSize } from './useElementSize'
import { useCellLattice } from './useCellLattice'

const camera: Camera = { offsetX: -32, offsetY: -22.5, cellSize: 20 }
const size: ElementSize = { width: 1280, height: 900 }

describe('useCellLattice', () => {
  it('flattens computeLattice + latticeOffsetPx into scalars on first render', () => {
    const { result } = renderHook(() => useCellLattice(camera, size))

    const lattice = computeLattice(camera, size.width, size.height)
    const { xPx, yPx } = latticeOffsetPx(lattice, camera)

    expect(result.current).toEqual({
      originX: lattice.originX,
      originY: lattice.originY,
      cols: lattice.cols,
      rows: lattice.rows,
      cellSize: lattice.cellSize,
      offsetXPx: xPx,
      offsetYPx: yPx,
    })
  })

  it('reuses the same lattice (origin/cols/rows unchanged) across a sub-cell pan', () => {
    const { result, rerender } = renderHook(({ camera }: { camera: Camera }) => useCellLattice(camera, size), {
      initialProps: { camera },
    })
    const before = result.current

    const subCellPan: Camera = { ...camera, offsetX: camera.offsetX + 0.5, offsetY: camera.offsetY + 0.5 }
    rerender({ camera: subCellPan })

    expect(result.current.originX).toBe(before.originX)
    expect(result.current.originY).toBe(before.originY)
    expect(result.current.cols).toBe(before.cols)
    expect(result.current.rows).toBe(before.rows)
    // Only the transformed-layer offset moves.
    expect(result.current.offsetXPx).not.toBe(before.offsetXPx)
    expect(result.current.offsetYPx).not.toBe(before.offsetYPx)
  })

  it('reuses the same lattice across a multi-cell pan that stays within slack', () => {
    const { result, rerender } = renderHook(({ camera }: { camera: Camera }) => useCellLattice(camera, size), {
      initialProps: { camera },
    })
    const before = result.current

    // Within LATTICE_SLACK_CELLS of the original origin -- confirmed by
    // latticeCovers below rather than assumed, so this test fails loudly if
    // the slack constant ever changes underneath it.
    const withinSlackPan: Camera = { ...camera, offsetX: camera.offsetX + 2 }
    const originalLattice = computeLattice(camera, size.width, size.height)
    expect(latticeCovers(originalLattice, withinSlackPan, size.width, size.height)).toBe(true)

    rerender({ camera: withinSlackPan })

    expect(result.current.originX).toBe(before.originX)
    expect(result.current.originY).toBe(before.originY)
    expect(result.current.cols).toBe(before.cols)
    expect(result.current.rows).toBe(before.rows)
  })

  it('rebases to a new lattice once a pan outgrows the slack, and the new lattice covers the new position', () => {
    const { result, rerender } = renderHook(({ camera }: { camera: Camera }) => useCellLattice(camera, size), {
      initialProps: { camera },
    })

    // Well beyond LATTICE_SLACK_CELLS -- confirmed by latticeCovers below
    // rather than assumed.
    const beyondSlackPan: Camera = { ...camera, offsetX: camera.offsetX + 50 }
    const originalLattice = computeLattice(camera, size.width, size.height)
    expect(latticeCovers(originalLattice, beyondSlackPan, size.width, size.height)).toBe(false)

    rerender({ camera: beyondSlackPan })

    const rebasedLattice = computeLattice(beyondSlackPan, size.width, size.height)
    expect(result.current.originX).toBe(rebasedLattice.originX)
    expect(result.current.originY).toBe(rebasedLattice.originY)
    expect(result.current.cols).toBe(rebasedLattice.cols)
    expect(result.current.rows).toBe(rebasedLattice.rows)

    // The returned offset must correspond to the returned (rebased) lattice,
    // never a stale pairing with the pre-rebase one.
    const { xPx, yPx } = latticeOffsetPx(rebasedLattice, beyondSlackPan)
    expect(result.current.offsetXPx).toBe(xPx)
    expect(result.current.offsetYPx).toBe(yPx)
  })

  it('keeps the rebased lattice as the sticky anchor: a later within-slack pan does not re-derive it', () => {
    // Regression for a mutant that no-ops the setLattice(current) call inside
    // useCellLattice: the *return value* of the render that rebases is
    // unaffected by that mutant (current is used directly, never lattice),
    // so this needs a second render to observe. Without the state update,
    // useCellLattice's `lattice` state is stuck at the pre-rebase anchor
    // forever, so every later render re-fails latticeCovers against that
    // stale anchor and recomputes from scratch -- still numerically correct
    // for a lone render, but it silently defeats the sticky anchor for every
    // render after the first rebase, and originX below is the cheapest
    // observable symptom of that (a fresh computeLattice's floor-based
    // origin moves with every sub-cell pan; a truly sticky one doesn't).
    const { result, rerender } = renderHook(({ camera }: { camera: Camera }) => useCellLattice(camera, size), {
      initialProps: { camera },
    })

    const beyondSlackPan: Camera = { ...camera, offsetX: camera.offsetX + 50 }
    rerender({ camera: beyondSlackPan })
    const rebasedOriginX = result.current.originX

    // +1 from beyondSlackPan: within the *rebased* lattice's slack, so a
    // correctly-sticky hook reuses it unchanged. Confirmed by latticeCovers
    // below, and the freshly-computed alternative is confirmed to actually
    // differ, so this test would fail loudly (not pass vacuously) if
    // LATTICE_SLACK_CELLS or the floor arithmetic ever changed underneath it.
    const withinNewSlackPan: Camera = { ...beyondSlackPan, offsetX: beyondSlackPan.offsetX + 1 }
    const rebasedLattice = computeLattice(beyondSlackPan, size.width, size.height)
    expect(latticeCovers(rebasedLattice, withinNewSlackPan, size.width, size.height)).toBe(true)
    const freshLatticeForThirdCamera = computeLattice(withinNewSlackPan, size.width, size.height)
    expect(freshLatticeForThirdCamera.originX).not.toBe(rebasedOriginX)

    rerender({ camera: withinNewSlackPan })

    expect(result.current.originX).toBe(rebasedOriginX)
  })

  it('forces a rebase on a cellSize change even when the pan itself is zero', () => {
    const { result, rerender } = renderHook(({ camera }: { camera: Camera }) => useCellLattice(camera, size), {
      initialProps: { camera },
    })
    const before = result.current

    const zoomed: Camera = { ...camera, cellSize: 8 }
    rerender({ camera: zoomed })

    expect(result.current.cellSize).toBe(8)
    expect(result.current).not.toEqual(before)

    const rebasedLattice = computeLattice(zoomed, size.width, size.height)
    expect(result.current.originX).toBe(rebasedLattice.originX)
    expect(result.current.originY).toBe(rebasedLattice.originY)
  })

  it('produces a finite lattice from the 0x0 pre-measurement viewport', () => {
    const unmeasured: ElementSize = { width: 0, height: 0 }
    const { result } = renderHook(() => useCellLattice(camera, unmeasured))

    const lattice = computeLattice(camera, 0, 0)
    expect(result.current.cols).toBe(lattice.cols)
    expect(result.current.rows).toBe(lattice.rows)
  })
})
