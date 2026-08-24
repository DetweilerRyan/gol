---
name: e2e-layer-reaches-into-src
title: Rule whether the black-box layers should import their cell vocabulary from src/test-support
created: 2026-08-24
---

## Context

Four files under `features/` import from `src/test-support/cellQuery.ts`:

```
features/cell-life-and-death.e2e.spec.ts   CELL_SELECTOR, ALIVE_CELL_SELECTOR, DEAD_CELL_SELECTOR, cellLabel
features/camera-pan-and-zoom.e2e.spec.ts   ALIVE_CELL_SELECTOR
features/grid-scrollbars.e2e.spec.ts       ALIVE_CELL_SELECTOR
features/e2e-helpers.ts                    CELL_ALIVE_ATTR, CELL_ALIVE_VALUE, CELL_DEAD_VALUE, cellSelector
```

**The user's objection: that doesn't read as black-box.** `features/` is meant to be
the outside view of the product, and a reader has to already know that
`src/test-support/` is excluded from every quality gate and imports nothing at all
before those lines read as harmless rather than as a leak into the implementation.

## What was checked, and did not hold

The sharp form of the objection would be a **detection hole**: if `Cell.tsx`'s
`aria-label` format and `cellQuery.cellLabel` were changed _together_, would
anything fail? If not, the black-box layer would be importing its way out of
noticing a user-facing change — the same family as the phantom-kill and the
acceptance-mutation classifier defect, where a check cannot fail for the thing it
exists to watch.

**It does fail.** `src/components/Grid.test.tsx:175` and
`src/components/GridCells.test.tsx:46` assert the literal strings `'Cell 0, 0'`
and `'Cell -1, -1'`. The encoding is pinned by assertion, not only by derivation.

**And moving the module would not have changed that**, in either direction. The
both-move-together property is about derivation versus assertion; it is
independent of which directory the module sits in. Location is not what makes
this safe.

## What survives

Two things, and they are weaker than the sharp version but not nothing:

1. **The layering reads wrong.** Whatever the safety argument, `features/` reaching
   into `src/` is a shape a reader has to be talked out of.
2. **The black-box layer is not self-sufficient about its own vocabulary.** The e2e
   layer cannot detect an accessible-name change; the unit layer can. That is
   defensible — an element's own accessible name is arguably a unit-level fact —
   but it should be a decision rather than an accident.

## The cost of the obvious fix

That import is not incidental. `slice/aria-pressed-cell-state` created
`cellQuery.ts` specifically to end **three independent copies of `ALIVE_CLASS`,
three of `DEAD_CLASS`, and four inline `/bg-white/` literals** that had drifted
apart across the e2e specs. Any answer that re-duplicates the vocabulary into
`features/` reopens exactly that, unless something pins the copies together.

## Options

| option                                   | effect                                | cost                                                                                                                                                                                                                                                                                              |
| ---------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Move `cellQuery.ts` into `features/`** | nothing in `features/` reaches `src/` | **Inverts the dependency.** `Cell.test.tsx`, `Grid.test.tsx` and `CellTile.test.tsx` would import from the spec layer — a worse direction, and it cuts against `no-test-support-in-product-{ts,tsx}`, which exists to keep `src/` out of test-support, not to push `src/` tests into `features/`. |
| **Duplicate into `features/`, pinned**   | the layer becomes self-sufficient     | needs a test asserting the two copies agree, or the drift the helper killed comes back                                                                                                                                                                                                            |
| **Leave it, and write down why**         | zero churn                            | the discomfort remains, and it is a reasonable discomfort                                                                                                                                                                                                                                         |

## Precedent that should govern the ruling

`architect` has ruled on this family twice, and **both rulings turned on what a
reader can derive from elsewhere, not on where a file lives**:

- the **major-gridline border class** — legitimate visual contract, because every
  cell's `aria-label` already carries exact coordinates, so an AT user has _more_
  information, and the only "fix" would be "a test hook wearing an affordance's
  name";
- **pattern-library category grouping** — not a gap, because heading structure
  already carries it.

Apply the same test here: what can a reader of `features/` derive without the
import, and what would be lost by removing it.

## Touches

`src/test-support/cellQuery.ts` (possibly moved), the four `features/` files above,
`rules/no-test-support-in-product-{ts,tsx}.yml` if the direction changes, and
CLAUDE.md's description of the layer. Ruling first; the slice's size depends
entirely on which option lands.

## Open questions

- **Is "black-box" a property of what a test imports, or of what it observes?**
  The e2e specs drive a real browser against a built app and assert only on the
  DOM. They import string constants, not behaviour. Whether that counts as
  reaching into the implementation is the actual question, and it is a definition
  question rather than a technical one.
- Does the same reasoning reach `features/harness/board.tsx`, which imports
  `../../src/App` and `domStubs`? It must — it mounts the app — so any rule here
  has to distinguish "the harness may, the specs may not," or accept both.
- Worth noting that after `split-acceptance-harness`, the per-feature harness
  imports **nothing** from `src/` — only the core does. If that holds as the
  remaining five conversions land, `features/` has exactly one `src/` chokepoint
  plus the e2e specs' vocabulary import, which may make this cheaper to change
  than it looks.
