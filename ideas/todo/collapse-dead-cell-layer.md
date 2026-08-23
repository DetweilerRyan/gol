---
name: collapse-dead-cell-layer
title: Stop mounting a button per dead cell, and give the grid a real keyboard model
created: 2026-08-23
---

## Context

**An empty board costs the same as a 50,000-cell board.** Measured on `main` at
`7078df6`, 1280×900: `pan-min-zoom-empty` renders **19,680 cells with zero
live** at 24.6ms per move-event, and `pan-min-zoom-50k` costs 24.9ms. The cost
is dead cells, and real boards are sparse — the library's largest pattern is
Pulsar at 48 cells.

`slice/tile-virtualized-cells` falsified its own cost model in the process of
landing, and the corrected model says **16.7ms is unreachable by tiling at any
tile size** (best ~40ms at S=2). The remaining lever is mounted count. This is
the slice that can hit the frame budget.

An earlier reading bounded this at ≤5% and was **wrong** — it measured whether
_statically having_ 19,680 nodes costs anything per move, which it doesn't. The
cost is that every strip event admits and evicts ~480 mostly-dead cells.

Separately, the a11y story here is nominal rather than real: there is no
`tabIndex` management anywhere in `src/`, no `role="grid"`, and no `.feature`
specifying keyboard cell activation at all — so **every cell is a natural tab
stop** (~3,400 at default zoom, ~19,680 at min zoom, ~33,200 at 1920×1080), in
tile-major order over a set that changes as you pan. Conformant and unusable.

## Sketch

Render **only live cells** as elements. Not canvas — that keeps ~90 of the 110
`cellLocator` call sites working and avoids hand-building accessibility over a
drawing surface.

| what a dead cell provides today  | replacement                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `aria-label="Cell x, y"`         | `role="grid"` + roving tabindex + live region                                                 |
| `onClick` hit target             | one handler on the layer + `screenToWorld` (exists, already used by `useGridPointerGestures`) |
| `border-gray-200` minor gridline | `repeating-linear-gradient` on the transformed layer                                          |
| `border-l-2` major gridline      | second gradient at 10× spacing (`gridGeometry` already computes these)                        |
| `hover:bg-gray-100`              | one hover indicator following the cursor                                                      |

**The a11y change is an improvement, not a regression** — replacing ~19,680
unusable tab stops with one tab stop plus arrow-key navigation is what a
screen-reader user actually needs.

## Touches

`Cell.tsx`, `CellTile.tsx`, `GridCells.tsx`, `Grid.tsx`, the gridline styling,
and a new keyboard/focus model. On the test side: ~20 dead-cell assertions, 18
unit assertions, and **13 `elementAtPoint` sites** — those resolve a pixel to an
element name, which is exactly what this removes, and they are the genuinely
hard part. Depends on `aria-pressed-cell-state` for the shared query helper.

## Open questions

Two product decisions are **already taken**: a **real** `role="grid"` with arrow
keys, Home/End and announcements — not "one tab stop that focuses the last-clicked
cell"; and **keep the hover affordance**, since every dead cell lights up today
and dropping it silently would be a UX regression.

Still open:

- What replaces `elementAtPoint` in the Playwright layer. This is the largest
  single cost in the slice and it belongs to `product` in VERIFY.
- Whether the focus cursor is a real DOM element or a painted overlay — the
  former keeps it addressable, the latter keeps the mounted count at ~live-cells.
- Whether gridlines-as-gradient survive the layer transform at all zoom levels
  without seams. Worth a spike before committing.

**Pipeline:** full cycle under the five-role pipeline, including `product`
SPECIFY — the keyboard model is new user-facing behaviour and is currently
unspecified anywhere — and `architect` CONTRACT during the acceptance spike.
