---
name: wheel-zoom-direction-unstated
title: Decide whether shift+wheel zoom direction belongs in the contract, now that pruning removed it
created: 2026-08-24
---

## Context

`prune-gherkin-to-domain-language` deleted the outline _"Shift-held zoom resolves
the scroll direction from whichever axis carries it"_, whose `down → decrease`
rows were the only place `features/**` stated that **shift+wheel down zooms
out**. The surviving `mouse-wheel-controls` scenario asserts only that the zoom
level goes above 100.

`product` found this during VERIFY and recorded it deliberately as a judgement
call rather than a finding — correctly, since `architect`'s ratification
criterion asks whether the _promise_ survives, and "shift+wheel zooms" does. It
is filed here so the decision is made on purpose rather than by omission.

**The asymmetry is what makes it worth a decision.** Pan direction survived the
prune — `camera-pan-and-zoom.feature` still says "the camera should have moved
down and right into the grid". Wheel-zoom direction did not. If direction is
worth stating for pan, the same argument reaches zoom; if it isn't, the pan
clause is arguably also below altitude. Right now the contract says one and not
the other, and nothing chose that.

Behaviour is unaffected and unit-pinned at `src/camera.test.ts:146`, plus
`:151`/`:156` and `src/camera.property.test.ts:170` for the axis-fallback half.
Nothing is broken; the question is purely what the contract should state.

## Sketch

Three options, and the middle one is probably right:

1. **State it.** One `Then` clause on the surviving scenario — "and scrolling the
   other way should zoom out" — or one extra table-less scenario. Costs **zero**
   acceptance mutants, since a table-less scenario has no mutant surface. Touches
   `mouse-wheel-controls.feature` and its steps file.
2. **State it once, at the right altitude, and drop the pan clause's asymmetry** —
   i.e. decide that direction is a domain fact for both gestures, and make the two
   features consistent with each other.
3. **Leave it.** Argue that "shift+wheel zooms" plus the zoom-percentage scenarios
   in `camera-pan-and-zoom.feature` (200/50/300/40/100) already pin direction
   implicitly, since a user who can reach 40% has necessarily zoomed out.

Option 3's argument is weaker than it looks: those percentages are reached
through the toolbar's domain zoom actions, not the wheel. So the _wheel's_
direction is genuinely unstated, not merely stated elsewhere.

## Touches

`features/mouse-wheel-controls.feature` + `.steps.test.ts`, and possibly
`features/camera-pan-and-zoom.feature` if option 2. A `product` slice end to end
— no `src/` change, and small enough to ride along with the next feature that
touches `mouse-wheel-controls` rather than standing alone.

## Open questions

- Is gesture direction a domain fact or an input-device detail? This repo has
  already ruled that the Firefox/Windows **axis** swap is an input-device detail
  belonging to the unit layer. Direction is not obviously the same thing —
  "scroll down to zoom out" is a UX convention a user can be wrong about,
  whereas "which of deltaX/deltaY carries it" is not.
- If option 1, does it re-trip `no-restricted-patterns`? "zoom out" is domain
  language and should pass, but check rather than assume — the pattern list is
  `architect`-owned and must not be edited to make a scenario fit.
