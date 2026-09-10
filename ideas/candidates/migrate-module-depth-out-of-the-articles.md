---
name: migrate-module-depth-out-of-the-articles
title: Move per-module interface depth out of the shared articles and into JSDoc
created: 2026-09-09
---

## Situation

`state-flow.md` carries a bullet per hook and per component, describing what each one owns and delegates
to. Measured 2026-09-09, before any migration: **4,486 bytes across fourteen per-hook sub-bullets, plus
1,536 across four per-component bullets — 29% of the article.**

Those modules already carry their own JSDoc. `useCamera.ts` has nine lines of it, `useCellTiles.ts` nine,
`useZoomGlide.ts` seven. **So the article restates what a hover already gives a caller.**

CLAUDE.md's routing branch 4 sends that content to JSDoc, or to a `<module>.md` sidecar beside the source.
Branch 5, which the sidecar rollout runs on, is a different branch with a different destination.

## Complication

**This is a DRY violation across surfaces, which is the failure `engineering.md` names and whose stated fix
is a pointer rather than a second copy.** Nothing checks the two copies agree, and one has already drifted:
`state-flow.md` describes fifteen hooks where `src/hooks/` holds sixteen. `useContentBounds.ts` appears
once, inside `useLiveCells`'s bullet, and has no bullet of its own. Found by `architect` at
`split-state-flow-article`'s REVIEW, and pre-existing on `main` rather than introduced by that split.

**The gate profile changes.** Every rollout slice so far has been `.claude/**` only, and therefore
mutation-invariant. This one edits `src/hooks/*.ts` and `src/components/*.tsx`.

**Ruled 2026-09-09 by the user: a comment-only edit to `src/` does not need the full mutation run.** The
argument is that Stryker's mutators operate on AST nodes — arithmetic, conditionals, literals — and a
comment is not one, so no mutant is created, removed or re-fated. **One carve-out**: a comment carrying a
_directive_ is not inert. `// prettier-ignore`, `@ts-expect-error`, an `eslint-disable`, and this repo's own
`// reference-check: allow …` and `// ast-grep-rule-check: allow-…` markers all change tool behaviour, and
re-arm the full run. That ruling wants recording beside the merge protocol's predicate, which is CLAUDE.md's
branch 1.

**Two other constraints come with the destination.** `doc-comments.md` governs the hover budget and the
measured JSDoc syntax hazards. `rules/no-dead-doc-on-annotated-return-literal` fires on a JSDoc block placed
on a property of an annotated `return { … }` literal, which is exactly the shape a careless migration would
produce.

## Question

Which bullets move to JSDoc, and which are cross-module contracts that must stay in the article?

## Answer

**The discriminating test, from `architect` at `split-state-flow-article`'s REVIEW: a constraint stays in
the article when its audience never hovers the module that owns it.**

### Stays in `state-flow.md`

| Bullet                                                              | Why it cannot become a hover                                                                                                                    |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `useMatchMedia` — tests must call `stubMatchMedia`                  | Binds whoever writes a component test whose tree reaches appearance or reduced motion. They never open `useMatchMedia.ts`. **Strongest entry.** |
| `useAppearance` — call exactly once, from `App.tsx`                 | A singleton constraint on the composition root, enforced nowhere else                                                                           |
| `useCamera` — `commit()` cancels the glide; five external writers   | Pairwise contract with `useZoomGlide`; neither hover states it                                                                                  |
| `useZoomGlide` — cancelled at unmount, never flushed                | The contract _is_ the contrast with `useRafCoalescedPan`'s flush                                                                                |
| `useCellTiles` — range reference-stable by `nextTileRange`          | Feeds the pan-hysteresis guarantee three modules away                                                                                           |
| `useGridPointerGestures` — rect-relative pixels, never a `Camera`   | Says who owns the world-coordinate conversion                                                                                                   |
| `Grid` — pan transform on the inner layer, never `#grid-content`    | Spans `Grid`, `useGridPointerGestures` and `useWheelInput`                                                                                      |
| `LifeBoard` — the stacking order                                    | Spans three components; no single hover can hold it                                                                                             |
| `Grid` — the sibling DOM paint order                                | Same                                                                                                                                            |
| `Grid` — imports none of the four inverted overlay components       | A dependency-direction rule, not interface depth                                                                                                |
| `Cell` paints nothing when dead, so `GridLines`' fill shows through | Cross-component; explains why a dead-but-focused cell stays transparent                                                                         |
| A pan within hysteresis re-renders no cell                          | Spans the store, `useCellTiles`, `gridFocus`, `liveCellWindow` and React Compiler                                                               |
| `GridCells` no longer decides which cells exist                     | Spans `Grid`, `GridCells` and `liveCellWindow`                                                                                                  |

### Safe to migrate wholesale

`useElementSize`, `useWheelInput`, `useInitialCentering`, `useRafCoalescedPan`'s mechanics, `useLiveCells`,
and the `useReducedMotion`/`useSystemAppearance` extraction history.

### Ordering

**Ruled 2026-09-09 by the user: this slice runs BEFORE `architecture.md` is split.** That article is
twenty module bullets, so splitting it first would carefully place prose into a sidecar that this slice then
moves again. The retired `roll-the-rationale-sidecar-out` effort carried the same ordering constraint.

## Touches

`src/hooks/*.ts`, `src/components/*.tsx`, `.claude/agents/articles/state-flow.md`, and CLAUDE.md for the
comment-only clause on the mutation-invariance predicate. Possibly `src/<module>.md` sidecars, which would
be the first use of a tier CLAUDE.md documents and nothing has yet used.

## Open questions

- **Does any bullet want a `<module>.md` sidecar rather than JSDoc?** Branch 4 offers both, and the
  discriminator is the hover budget in `doc-comments.md`. No module in this repo has ever used the sidecar
  half, so the first one sets the precedent.
- **Does `architecture.md` have the same shape?** Its per-module bullets were not measured with the same
  instrument, because they do not match the list format `state-flow.md` uses. Measure before planning.
- **Should `useContentBounds.ts` gain a bullet, or is its absence correct?** It is reachable only through
  `GridScrollbars`, so the answer may be that it never needed one. Decide rather than defaulting.
