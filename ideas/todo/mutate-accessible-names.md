---
name: jsx-attribute-strings-carry-no-mutants
title: Every accessible name in this repo is outside the mutation gate
created: 2026-08-25
---

## Context

Measured by `hardener` at the end of `ruler-label-axis-affordance`, and it is a fact about the
gate rather than about that slice.

**Stryker does not mutate JSX attribute string literals.** That slice added two
`aria-label="Column ruler"` / `aria-label="Row ruler"` attributes to `src/components/GridRuler.tsx`
and the mutation total moved by **zero** — 1306 instrumented before and after, 1287 of 1304
detected, 98.70% byte-identical. The five mutants `GridRuler.tsx` carries are the same five it
carried before the slice (two `ArrowFunction`s, a `BlockStatement`, and the two `` `x-${x}` ``/
`` `y-${y}` `` key template literals). Lines 48 and 54 carry none.

Corroborated repo-wide rather than inferred from one file: `src/components/GridToolbar.tsx` has
**nine** `aria-label`/`className` string attributes and exactly **one** mutant, a `BlockStatement`.

**Why this is worth a slice rather than a footnote.** This repo has been investing heavily in
accessible affordances as the black-box contract — `aria-pressed` for cell aliveness,
`aria-label` for cell coordinates, the pattern-preview labels, `Column ruler`/`Row ruler`,
`Horizontal scroll`/`Vertical scroll` — and `src/test-support/cellQuery.ts` and `rulerQuery.ts`
exist precisely to make those names a shared contract. **None of that surface is measured by the
mutation gate.** A mutant that renamed `Cell 3, 5` to `Cell 5, 3`, swapped the two ruler group
names, or emptied an `aria-label` would be caught only by whatever hand-written test happens to
assert it — the score cannot tell you whether such a test exists.

That is the repo's own recurring failure shape one layer up: a high score that is silently
scoped to less than the reader assumes. It is **not** a false score — 98.70% is correct about
the mutants that exist — but a reader concluding "the affordances are well covered because the
score is high" would be wrong, and nothing in the report says so.

The concrete near-miss: `cleaner`'s scoped scan reported **5 mutants, 5 killed, 100%** on
`GridRuler.tsx` and that read as confirmation the new wrappers were covered. It was true and it
measured nothing about them. `coder`'s hand-verification — swapping the two labels and watching
the membership test fail while the name-only test passed — was the only real check, and it was
an instinct rather than a gate.

## Research findings — the open questions are answered

Investigated 2026-08-25, against the installed `@stryker-mutator/instrumenter@10.0.0` and
upstream `master`. Every claim below is either quoted source or a measurement.

**1 · It is excluded by design, explicitly — not a gap.** `string-literal-mutator.js`'s
`isValidParent()` lists `types.isJSXAttribute(parent)` alongside import/export declarations,
`require()` calls and object-property keys. Confirmed identical on upstream `master`. **The
rationale is undocumented**: no commit in that file's visible history mentions JSX, so the
exclusion arrived with the initial mutator set (2020-06-19) unexplained. The company it keeps
suggests the intent was "strings that are structural rather than behavioural" — plausible for
`className` and `data-testid`, wrong for an accessible name, which is the one string in a JSX
attribute that _is_ the contract.

**2 · The exclusion keys on the DIRECT parent, and that is the whole opening.** Wrapping the
same string in braces makes its parent a `JSXExpressionContainer`, not a `JSXAttribute`, and it
mutates. Measured with a five-form probe:

| form                            | mutant?                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| `aria-label="Column ruler"`     | **no**                                                                                      |
| `aria-label={'Column ruler'}`   | **yes**                                                                                     |
| ``aria-label={`Column ruler`}`` | **yes** (the template-literal branch runs _before_ `isValidParent` and is unguarded at all) |
| `aria-label={MODULE_CONST}`     | at the const's declaration, not at the JSX site                                             |
| `aria-label={rulerName('x')}`   | at the function's `return`, not at the JSX site                                             |

**3 · Verified on the real component, and it costs nothing.** Wrapping `GridRuler.tsx`'s two
`aria-label` values took it from **5 mutants to 7**, and both new `StringLiteral` mutants were
**killed by the tests that already exist** — no new test needed, because `GridRuler.test.tsx`'s
membership and exact-name tests already assert those strings. Prettier accepts the form and
oxlint does not enable `react/jsx-curly-brace-presence`, so nothing objects.

**4 · There is no supported opt-in.** StrykerJS has four plugin kinds — TestRunner, Reporter,
Checker, **Ignore** — and no `Mutator` kind; a user cannot add a mutator or override a built-in
one. (Older docs referencing a custom `Mutator` plugin predate the instrumenter rewrite.) Note
Ignore plugins only ever _subtract_ mutants, so they are the wrong direction entirely.

## Sketch

**Recommended: the braces form, scoped to accessible names only.** `aria-label={'Column ruler'}`
for the strings that carry contract, left as plain attributes everywhere else. Two characters,
measured to produce killed mutants, no new tests, no tooling objection.

Scope it deliberately rather than applying it everywhere. `className` strings are the _visual_
contract this repo has repeatedly ruled out of mutation scope (`Cell.test.tsx`'s paint block,
`RulerLabel.tsx`'s `edgeClass`), and mutating them would manufacture survivors nobody wants to
chase. The candidates are `aria-label`, `aria-valuetext`, `role`, and `title` — the strings an
AT user actually receives.

**Name the risk plainly: this relies on undocumented internal behaviour.** Stryker excludes
`JSXAttribute` but not `JSXExpressionContainer`, and nothing says that is deliberate — the
unguarded template-literal branch suggests the boundary is incidental rather than designed. A
future release could close it, silently, and the mutants would just stop appearing. That fails
**safe** (the score drops or the count falls, it never falsely rises), but it argues for a
**test that pins the affordance directly** rather than leaning on the mutation score to notice.
That test already exists for `GridRuler`; the audit below is what says whether it exists
elsewhere.

**Rejected: patching the instrumenter.** The repo has precedent (`patches/crap4ts+1.0.1.patch`),
but that patch fixes a genuine upstream defect with an open PR behind it. This would be
overriding a deliberate upstream decision in a hot path, re-derived on every release, to buy
what two characters already buy.

**Do first, regardless of which route: the audit.** The real risk register is _which existing
affordances have a hand-written test that would catch a rename_, and nothing currently produces
it. `product`'s VERIFY on `ruler-label-axis-affordance` found the browser layer's guard on a
ruler swap was **incidental** — carried by tests whose stated purpose was gridline multiples —
and that the generated `bdd` layer was blind to it entirely. Expect more of that. Candidates:
`Cell.tsx`'s `aria-label`/`aria-pressed`, `PatternPreview.tsx`'s preview-cell labels,
`Scrollbar.tsx`'s `Horizontal scroll`/`Vertical scroll`, `GridToolbar.tsx`'s nine attributes.

## Touches

Investigation only at first. Then `CLAUDE.md` (the mutation-testing notes in Commands, which
already document several scope traps of exactly this kind), possibly
`src/components/{GridRuler,Cell,GridToolbar,Scrollbar,PatternPreview}.tsx` under route 2, and
`.claude/agents/hardener.md` if the compensating discipline becomes a role duty.

## Open questions

- Excluded by design, or a gap in the current instrumenter? Decides everything downstream.
- Does route 2 actually produce mutants? One throwaway `--mutate` run answers it.
- Does this extend beyond `aria-*`? `className` attributes are equally unmutated, which is
  mostly fine — the repo treats paint classes as a visual contract — but `role` attributes are
  **not** decoration, and `role="group"` losing its value would be the same class of silent
  regression.
- Which existing affordances have a hand-written test that would catch a rename, and which
  don't? That audit is the actual risk register, and nothing currently produces it.
