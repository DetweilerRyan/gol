---
name: toolbar-button-text-is-unasserted
title: Two toolbar buttons show text that nothing anywhere asserts
created: 2026-08-26
---

## Context

Found by `architect` while measuring the exposure for
`jsx-text-children-carry-no-mutants`, and deliberately excluded from that slice as a
**different** gap.

`src/components/GridToolbar.tsx` renders two buttons whose visible text is **superseded** by an
`aria-label`:

```
:38   Reset       on a button carrying aria-label={'Reset view'}
:47   Patterns    on a button carrying aria-label={'Open pattern library'}
```

Because the label wins the accessible-name computation, that text **is not the accessible name**
— which is why bracing it buys nothing and why the sibling slice correctly left it alone. It is
the mirror of `PatternLibraryModal`'s case, where an inert `aria-label` was deleted so the title
could name the dialog; here the label is the name and the text is the decoration.

**But nothing anywhere asserts either string.** Not a unit test, not a step module, not an e2e
spec. Both could be emptied, misspelled, or swapped with each other and every gate in the repo
would stay green.

That is a real hole and a small one: a sighted user reads those two words, and they are the only
labels on those buttons that a sighted user _can_ read. The accessible-name channel is guarded
(`mutate-accessible-names` braced both `aria-label`s and their mutants are killed); the visible
channel is not guarded at all.

## Sketch

The cheap fix is two assertions in `src/components/GridToolbar.test.tsx` — that file already
queries both buttons by their accessible names, so it is one `toHaveTextContent` each.

**Whether to also brace them is the real question, and it is not obvious.** Bracing puts the
strings on the mutation scoreboard, which is the sibling slice's whole mechanism — but that slice
ruled braces are for _accessible names_, and these are not. Two honest positions:

- **Brace them anyway**, on the grounds that user-visible text is a contract regardless of which
  ARIA channel carries it, and the mutation gate should see it.
- **Assert without bracing**, on the grounds that the braces convention should stay tied to
  accessible names so its rule (`no-unbraced-name-from-contents.yml`, enumerated by element)
  keeps a clean meaning. A hand-written assertion guards the text without widening the
  convention.

The second looks right to me, but it is `architect`'s call, and the answer decides whether this
touches `rules/` at all.

## The swap case, which is the interesting one

`Reset` and `Patterns` sit adjacent in the same toolbar. **Stryker mutates a string to `""` or
filler and never swaps two names** — the residual both affordance slices recorded — so even
bracing would not catch them being exchanged. If a swap is worth guarding, it needs a
membership-style assertion of the kind `GridRuler.test.tsx` carries for the two ruler groups,
where each button's text is asserted _against its own accessible name_.

That is the shape worth copying, and it is why this is not simply "add two assertions".

## Touches

`src/components/GridToolbar.test.tsx`, possibly `src/components/GridToolbar.tsx` if the bracing
question goes the other way, and `rules/no-unbraced-name-from-contents.yml`'s enumeration if it
does.

## Open questions

- Brace, or assert only? Decides whether `rules/` moves.
- Is the swap worth guarding, or is that over-reach for two buttons? `GridRuler`'s membership
  test exists because a swap there was a live risk in a generated layer blind to it; here both
  strings are already invisible to every layer, so the swap is a smaller marginal risk than the
  emptying is.
