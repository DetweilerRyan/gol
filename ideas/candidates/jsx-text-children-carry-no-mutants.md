---
name: jsx-text-children-carry-no-mutants
title: An accessible name that comes from element text is outside the gate too
created: 2026-08-25
---

## Context

The sibling hole to the one `mutate-accessible-names` closes, found while closing it.

That slice established that Stryker does not mutate JSX **attribute** string literals
(`isValidParent()` excludes `types.isJSXAttribute`), and that wrapping the value in braces makes
the parent a `JSXExpressionContainer` so it mutates. Nine sites were converted that way.

The tenth could not be. `PatternLibraryModal.tsx`'s `aria-label="Pattern library"` turned out to
be **inert** — Headless UI's `DialogTitle` auto-registers itself as the dialog's
`aria-labelledby`, which wins the accessible-name computation. Chromium says so in its own
words: CDP reports the attribute as `"superseded": true`. So it was deleted rather than braced,
and the dialog's name now comes, as it always did, from

```tsx
<DialogTitle>Pattern Library</DialogTitle>
```

**JSX text children are not string literals either**, so that name carries no mutant, for a
second and different reason from the attribute case. Deleting the inert attribute removed a lie;
it did not close the gap.

**How much is exposed is unmeasured.** The attribute case was quantified (10 sites, 4 files)
before it was fixed; this one has not been. Any accessible name that comes from element text is
a candidate — `DialogTitle`, headings, button labels rendered as children rather than
`aria-label`. `GridToolbar`'s four buttons use `aria-label`, so they were covered by the sibling
slice; the pattern buttons in the library modal render their names as text, and
`patternCategoryInLibrary` reads exactly that text as the category contract.

## Sketch

**Measure first — the sibling slice's own ordering lesson.** `architect` reversed "audit then
convert" to "convert then audit" there, because reading test files by hand is precisely the
method that produced a wrong conclusion twice in this area. The equivalent here: find the sites,
then decide, rather than reasoning about which names come from text.

`ast-grep` can enumerate them — a `jsx_text` child of a JSX element whose accessible name is
load-bearing — but "load-bearing" is not a syntactic property, so expect the query to be a
starting list a human narrows, not a rule.

Then the honest question is whether there is a braces-equivalent at all. `{'Pattern Library'}`
as a **child** rather than an attribute value is the obvious candidate and is plausibly mutable
by the same mechanism, since the parent would again be a `jsx_expression` — **but that is
untested, and it should be probed exactly the way the attribute case was** (a throwaway
component, a `--mutate`-scoped run, count the mutants) before anyone converts anything. If it
works, note it is visually noisier than the attribute form and reads as odd in JSX; whether that
trade is worth it is a real judgment, not a foregone conclusion.

If it does not work, the fallback is the same as the sibling slice's E ruling: **the tests are
the durable asset.** Pin the name with a direct assertion and accept that no mutant enforces it.

## Touches

`src/components/PatternLibraryModal.tsx` and its test (the known site), plus whatever the survey
turns up. Possibly a companion to `rules/no-unbraced-accessible-name.yml` — but only if the
braces-as-child mechanism is measured to work; a rule enforcing a convention that buys no mutant
would be ceremony.

## Open questions

- **Does `{'text'}` as a JSX child produce a mutant?** Everything else depends on this. Probe it
  the way the attribute case was probed.
- How many sites are there? Unmeasured.
- Is this worth a slice at all, or is it the point at which the honest answer becomes "stop
  chasing the mutation gate and write the assertion"? The sibling slice's residual note applies
  here too: Stryker mutates a string to `""` or filler and **never swaps two names**, so even a
  working mechanism would not cover the failure mode that actually worries this repo.
