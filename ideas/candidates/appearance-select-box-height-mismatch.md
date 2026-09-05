---
name: appearance-select-box-height-mismatch
title: Make the appearance select match the toolbar buttons' height
created: 2026-09-05
---

## Context

Found by `architect` during the ADJUDICATE pass on the appearance control's truncated label, in the
same control but **deliberately not fixed there** — `product` had not reported it, it was outside the
batch, and changing a control's height on the morning of a palette review is a bigger visual change
than a width fix.

**The select's box is 36px tall against the toolbar buttons' 32px**, and Catalyst's `before:`
background pseudo-element is **30px** — so in light mode the white fill does not cover the control's
own border box.

**Root cause is the same family as the width defect that was fixed**: `GridToolbar.tsx`'s `h-8! py-0!`
lands on the Catalyst **wrapper span**, never on the inner `<select>`, which keeps its own
`py-[calc(--spacing(1.5)-1px)]`. The `!important` escapes are aimed at the wrong element.

That is worth noting against this slice's own achievement: the token layer let
`dark-mode-following-system-appearance` delete four `!bg-gray-900` escapes from this same file. The
two that remain here are not colour escapes but _sizing_ ones, and they do not work.

## Sketch

The honest options, and the vendored boundary rules one of them out:

- Target the inner `<select>` rather than the wrapper — needs a selector that reaches through
  Catalyst's markup, which is fragile against a vendored component's internals.
- Accept Catalyst's own sizing and **bring the buttons to the select's height** instead of the
  reverse.
- Use a different control shape entirely — but the `<select>` was ratified in CONTRACT and drives all
  seven appearance scenarios, so this is the expensive option.

**`src/catalyst/select.tsx` is vendored and outside every gate — read it, never refactor it.** Any fix
lives in `GridToolbar.tsx`.

## Touches

`src/components/GridToolbar.tsx` only, unless the third option is taken.

**Note what cannot guard this**: jsdom has no layout, and `architect` measured that a `<select>`
reports `scrollWidth === clientWidth` **even while clipping** (126/126, before the width fix) — so the
cheap DOM overflow check does not exist for this control family. Whether a rendered-geometry claim in
a hand-written spec is owed is an open question; category 3 admits it, but `architect` ruled during
CONTRACT that no `appearance-preference.e2e.spec.ts` exists or is owed, and that ruling was about
colour rather than geometry.

## Open questions

- **Is it visible enough to matter?** The measured facts are certain; the perceptibility is not, and
  nobody has asked the user. It reads as a slightly-too-tall control with an incomplete fill in light
  mode — which is exactly the kind of thing the user's eye is the gate for.
- Does fixing it re-open the width fix? `w-max` derives from the widest option's text metrics and is
  independent of height, so probably not — but they are the same control and should be checked
  together rather than assumed independent.
- Should the two remaining `!important` escapes in `GridToolbar.tsx` be removed as part of this? They
  are provably ineffective at what they target, which is a stronger argument for removal than
  tidiness.
