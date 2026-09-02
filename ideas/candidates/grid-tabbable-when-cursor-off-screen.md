---
name: grid-tabbable-when-cursor-off-screen
title: Specify that the grid stays keyboard-reachable when the focus cursor is off screen
created: 2026-09-02
---

## Context

Raised by `product` twice during `collapse-dead-cell-layer` and deliberately deferred both times.

`liveCellsInRange(cells, range, focus)` mounts the focus cursor's cell **even when it is outside the
range and even when it is dead**. That `+1` is load-bearing: `product` measured that **pre-flip,
with the cursor off-range, the grid had no tab stop at all** — no mounted element carried
`tabindex="0"` and `rovingCell` read `null`. Its first attempt at an assertion went red on the real
tree for exactly that reason.

So _"the grid stays a single tab stop even when the cursor is off screen"_ is a real, user-visible
guarantee, and it is currently pinned by **one unit test** (`liveCellWindow.test.ts:89`) and **no
scenario**. `architect` explicitly declined to rule the `+1` out of the code for this reason.

**Why it was deferred, both times:** during the slice a scenario for it could only be red, and
adding a red scenario would have broken the green oracle step 4 flipped against. At VERIFY it was
green-_able_, but `keyboard-grid-navigation.feature` sits at the **10-scenario cap** and `product`
judged that restructuring a capped feature at merge time, with no CONTRACT review, is precisely the
move this pipeline exists to prevent.

## Sketch

`product`'s own proposal: **a new `keyboard-grid-reachability.feature`**, not a trim. It checked and
reported that no two current scenarios can merge without losing a claim, so the cap cannot be
cleared by consolidation.

The scenario shape is already reachable with existing steps: park the cursor, pan until it is off
screen, tab into the grid, assert focus lands on the cursor's cell rather than nowhere.

**Needs `architect` CONTRACT**, per the reasoning that deferred it — a new feature file is a
contract-surface decision, and the altitude linter gained four markup-vocabulary patterns during
this slice (`aria-`, `role=`, `tabindex`, `gridcell`) that a keyboard feature is the most likely
thing to trip.

## Touches

A new `features/keyboard-grid-reachability.feature` plus its `features/steps/` module — remember
**bddgen is all-or-nothing**, so the module lands with the feature or the whole `bdd` project stops
generating.

**Expect `acceptance-mutation` to move**: a new Examples table adds mutants. The current figure is
**79 / 79 / 0**, and the +24 over the pre-slice 55 was entirely `keyboard-grid-navigation`'s three
tables — so the accounting for a further move should be equally clean.

## Open questions

- Is _reachability_ a big enough subject for its own feature file, or does it belong with something
  else that would then also need naming? A one-scenario feature is a smell if nothing else joins it.
- Does the same guarantee need stating for the **dead** cursor case specifically? The `+1` mounts the
  cursor whether alive or dead, and the dead case is the one with no other reason to exist.
- Should the 10-scenario cap itself be revisited? It is a `.gherkin-lintrc` value, which is
  `architect`-owned, and this is the first time it has actually bound.
