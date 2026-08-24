---
name: pattern-library-black-box
title: Convert pattern-library to a black-box step test driven through preview labels
created: 2026-08-23
---

## Context

Slice E in the acceptance-migration chain. `pattern-library.feature` is the one
feature whose Examples table is **not** redundant with the unit tests: it is the
only place the exact cell geometry of all 8 catalog patterns is pinned down.
The unit and property tests check names, categories, and the bounding-box anchor
convention — never the shapes themselves.

That makes it the highest-value feature to convert, and also the one where a
sloppy conversion loses the most.

Converting it is unusually cheap because `PatternPreview` **already exposes ARIA
geometry**: every cell of the armed pattern renders with
`aria-label="Pattern preview cell x, y"`, camera-exact regardless of viewport
clipping. So the 48-cell Pulsar is observable **without mounting a 13×13 grid**.
That is what makes this convertible at all — the alternative would be querying
~19,680 mounted cell buttons.

Gated on the pilot (`black-box-acceptance-pilot`) passing Gate P.

## Sketch

Rename `features/pattern-library.steps.test.ts` → `.steps.test.tsx`, and re-express
each step against the acceptance harness: open the library, arm the pattern, read
back the preview labels.

**The assertion must be bidirectional set equality.** Both halves:

1. every expected `Pattern preview cell x, y` label is present, **and**
2. the total preview-cell count equals the expected coordinate count.

A one-directional check survives character mutations that merge or split
coordinates inside that 48-entry string — which is the exact mutation class this
feature exists to catch. Assert both or the conversion silently weakens the one
feature that was pulling its weight.

## Touches

`features/pattern-library.feature` (step text only — the Examples values should
not move, so the mutant set stays comparable), its steps file renamed to `.tsx`,
and the acceptance harness from the pilot slice. No `src/` change expected.

## What the CONTRACT rulings settled

**The premise holds.** `PatternPreview.tsx` exposes
`aria-label="Pattern preview cell x, y"` — text, which is the only thing the jsdom
harness can observe (it stubs `getBoundingClientRect` to a constant and jsdom does
no layout, so no pixel geometry is reachable from that layer, ever).

**Ruling C closes the grouping question**: `PatternLibraryModal`'s unnamed
`<section>` per category is **not** an accessibility gap. Heading structure already
carries it — an AT user navigating linearly hears the heading, then the buttons —
so the black-box assertion is **reading order**, which is the affordance
heading-navigation provides. Do not add `aria-labelledby` for query convenience;
that is the shape `architect` rejected once already as "a test hook wearing an
affordance's name".

**Still open and still wants measuring:** whether a preview label survives being
off-screen. `PatternPreview` maps positions with no range check and no clipping
filter, which suggests yes — but that is a read of the source, not a measurement,
and Pulsar is 13x13 against a mounted window of -8..11.

## Open questions

- **Does the preview label survive being off-screen?** The claim above is that it
  is camera-exact regardless of clipping. Verify it against the largest pattern at
  the harness's fixed viewport before writing 8 scenarios against it.
- **Does arming a pattern need a real modal interaction, or can the harness reach
  the armed state more directly?** Going through the modal is more honest and
  exercises `usePatternPlacement`; going around it is faster. Prefer the modal
  unless it proves flaky.
- Whether the preview-label trick should be routed through
  `src/test-support/cellQuery.ts` (the shared alive/label vocabulary introduced by
  `aria-pressed-cell-state`) so preview labels and cell labels can't fork.
