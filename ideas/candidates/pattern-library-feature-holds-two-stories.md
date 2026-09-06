---
name: pattern-library-feature-holds-two-stories
title: Split pattern-library.feature along the seam between the catalog and a placement session
created: 2026-09-05
---

## Context

`product` read the whole file as a stakeholder at `preview-follows-pointer-may-be-statable`'s VERIFY
pass, at my request and while it was fresh, precisely so this would not have to be reconstructed
later. Nothing acted on it then. It is now at **12 of the cap of 12** — the cap `architect` raised
from 10 two slices ago — so the next scenario forces the question.

**The file's own preamble is the evidence.** _"Choose a named pattern from a categorized library and
stamp it onto the grid, so I don't have to toggle each cell by hand"_ licenses the catalog outline and
the four stamping scenarios. It says nothing about what the other **seven of twelve** are about: a mode
the user is in — something armed, a preview tracking the aim, two ways out, and the promise that an
exit really disarms rather than merely hiding. That is a placement **session**, and the story at the
top never introduces it. Two stories under one header.

## The seam, and the rule that places it

**A scenario lives where its _claim_ lives, not where its `Given` lives.** That rule matters more than
the split, because it is what places the thirteenth.

**`pattern-library.feature` keeps the story it already tells** — the catalog outline plus anchoring,
merging, overwrite, and Enter-stamps-at-focus. **Five.** Enter-stamps stays despite its armed `Given`:
its claim is _where the stamp lands_, and arming is setup. Note its comment currently argues it lives
here because _"arming a pattern is this feature's vocabulary"_ — under a split that argument points at
the wrong file and must be restated in terms of the stamp.

**A new feature takes the session** — arming is single-shot, a second arm replaces the first, the
preview follows the aim, Escape and the Patterns control each cancel, and each cancel genuinely
disarms. **Seven.** _"A stamped pattern is used up"_ moves despite its stamp `Given`: its claim is
_the arm is consumed_.

**Why the split beats another raise**: both catalog subjects are closed — eight patterns is the
catalog, and anchor/merge/overwrite/keyboard is the stamp — while **every recent addition has been
session-side**, including the one that filled the twelfth slot. The split puts the five slots of
headroom exactly where growth actually happens.

## Sketch

`keyboard-grid-navigation` / `keyboard-grid-reachability` is the in-repo precedent and the shape to
copy: the second file carries **its own** As/I-want/So-that rather than inheriting the first's.

Four mechanical constraints, from `product`:

- Session steps move to the new step module; the borrowed catalog and stamp steps are a
  **global-registry** fact with no import expressing it, which is the documented convention and what
  `rules/no-domain-imports-in-bdd-steps.yml` enforces from the other side.
- **bddgen is all-or-nothing** — the `.feature` and its step module land in one slice, or the entire
  `bdd` project stops generating.
- The Examples table stays with the catalog, so the new feature is a designed
  **`0 mutants (no Examples table)`** target. **The 91/91/0 figure will not move on the split**, and a
  reader expecting it to should not read the flat line as a regression.
- **`features/` must stay flat and underscore-free until `intent-driven-layout` lands** — that slice
  owns `playwright.config.ts`, whose `bdd` glob is the non-crossing `features/*.feature`.

## Touches

`features/pattern-library.feature`, a new `.feature` plus its `features/steps/` module, and the
comment on Enter-stamps that argues for the wrong file post-split.

No `src/` change. `acceptance-mutation` unmoved by construction (see above).

## Open questions

- **Is "placement session" the right name?** `product` described the subject rather than naming the
  file, deliberately. The name is the one decision it left open.
- Does the split want a `Rule:` block inside one file instead of two files? Gherkin supports it and it
  would keep the borrowed steps in one registry module — but this repo has no `Rule:` anywhere today,
  so it would be a new convention rather than a copied one.
- **Should this wait for `intent-driven-layout`?** That slice makes `features/` nestable, and a
  `pattern-library/` directory holding both files may be the better shape than two flat siblings.
  Landing this first is not wrong, but it is a decision made under a constraint that is about to lift.
