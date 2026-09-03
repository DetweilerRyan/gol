---
name: dark-mode-following-system-appearance
title: Add dark mode, defaulting to the system appearance
created: 2026-09-03
---

## Context

A product feature: the app should have a dark appearance, and should **follow the operating system's
setting by default** rather than making the user choose.

Surveyed before filing, and the ground is more favourable than it looks in one respect and more
hazardous in another.

**Favourable — most of the chrome already has it.** `src/catalyst/` ships `dark:` variants
throughout (`button`, `dialog`, `listbox`, `navbar`, `select`, `switch`, and more), so the toolbar
and the pattern-library modal largely come along for free. Catalyst is vendored and deliberately
outside every quality gate; read it to learn what a component does, **never refactor it** to this
repo's conventions.

**Also favourable — "default to system" is nearly free.** Tailwind v4's `dark:` variant keys off
`prefers-color-scheme` unless configured otherwise, so the _default_ half needs no mechanism at all.
The work is in the other half: a **manual override**, which turns one boolean into a three-state
preference (light / dark / follow system) plus somewhere to persist it.

**The board itself is hardcoded light, in exactly two places.** `GridLines.tsx:103` carries
`bg-white` as the base fill, and `Cell.tsx:37` paints a live cell `bg-gray-900`. Both carry long
comments explaining why they are what they are — `collapse-dead-cell-layer` moved the white fill
_into_ `GridLines` on purpose, and a dead cell paints **nothing** so the fill shows through. Read
both comments before touching either.

`src/index.css`'s `@theme` block currently holds only two font tokens, so there is a clean, empty
home for semantic colour tokens.

**[[design-token-layer]] already exists and covers building that home — read it before starting here.**
It was filed 2026-08-23 and its findings still hold (re-measured 2026-09-03): **36 `!important`
escapes** across `src/components/`, two competing button idioms, and no colour token at all. Its
observation that **`dry4ts` cannot see any of this** — it compares TypeScript structure, not Tailwind
class strings — is why none of it has ever surfaced as a gate finding. This candidate should not
re-propose that work; the two want designing together, and the ordering argument is recorded there.

## The hazard to design around first

**`rules/no-aliveness-by-paint-class.yml` hardcodes `regex: 'bg-gray-900|bg-white'`.** It stops the
black-box layers reading cell aliveness off the paint class instead of through
`src/test-support/cellQuery.ts`. If this slice renames or replaces those classes, **that rule's
regex silently stops matching** — and it fails in the dangerous direction: a rule matching nothing
is indistinguishable from a clean codebase, which is the exact failure shape CLAUDE.md documents for
a Stryker `ignorePatterns` glob, a `-t` pattern and a vitest `include` that match nothing.

The rule's own comments say the regex covers those two class names "and nothing else, also on
purpose", and `Cell.test.tsx` deliberately keeps one alive/dead pair as the sanctioned visual
contract. **`rules/` belongs to `architect` alone**, so this slice cannot fix it in passing — it
needs a REVIEW or DESIGN pass in the loop.

## Sketch

Deliberately thin; `architect` owns the shape.

**Prefer CSS custom properties on the root over `dark:` variants on the cell.** `Cell.tsx` is the
per-cell hot path — `collapse-dead-cell-layer` spent a whole slice getting the mounted count from
~19,680 down to the live cells plus the cursor — and a `dark:` variant doubles the class string on
every mounted cell. A token resolved once at the root costs nothing per cell and leaves
`Cell.tsx:37`'s single class intact, which also keeps the ast-grep hazard above much smaller.

**`src/hooks/useReducedMotion.ts` is the precedent adapter to copy**, not to invent around: a
`useSyncExternalStore` over `matchMedia`, isolating one browser API in one hook, with the domain
staying framework-free. Two things it already paid for. **jsdom does not implement `matchMedia` at
all** — any test mounting a tree that reaches such a hook must call `stubMatchMedia` from
`src/test-support/domStubs.ts`. And that hook deliberately carries **no defensive fallback**: an
unstubbed test throwing loudly beats shipping a branch no gate can exercise. A
`prefers-color-scheme` hook should make the same call.

Persistence (`localStorage`) is a second browser API and wants the same treatment — an adapter hook,
with the three-state preference itself expressed as pure logic in a framework-free module if it has
any rules worth stating.

## The contract question, which is the interesting one

**How is this observable at domain altitude?** Colour is rendered pixels — e2e residue, not Gherkin —
and `.gherkin-lintrc`'s `no-restricted-patterns` will rightly resist a scenario naming a class or a
hex value. But "the app follows my system appearance" _is_ a user-observable claim.

The likely answer is that the contract states the **preference and its effect on the control**
(which appearance is in effect, that it follows the system until overridden, that an override
sticks), observed through the toggle's own accessible name/state — while "the board is actually
painted dark" stays a hand-written `*.e2e.spec.ts` residue claim under category 3, rendered pixel
geometry. **That split is `architect`'s CONTRACT call, not this file's.**

Note the toolbar already carries four buttons (`Zoom in`, `Zoom out`, `Reset view`,
`Open pattern library`), and this repo's naming convention is **sentence case with no role word in
the name**.

## Touches

`src/index.css` (`@theme` tokens), `src/components/GridLines.tsx`, `src/components/Cell.tsx`,
`src/components/GridToolbar.tsx`, a new `src/hooks/` adapter or two, and
`rules/no-aliveness-by-paint-class.yml` (**`architect` only**). `features/` for whatever the contract
turns out to be.

This crosses the framework-free → hook → component layering, adds modules, and touches a rule — so
it trips several of CLAUDE.md's design-pass triggers. **Expect `architect` DESIGN before `coder`.**

## Open questions

- **What does a live cell look like in dark mode?** Inverting to a light cell on a dark field is the
  obvious answer, but the live cells are the salient content and inversion changes which of
  figure/ground is emphasised. A product decision, not a token swap.
- Does the **three-state** preference (light / dark / system) earn its complexity over a plain
  two-state toggle that simply starts from the system value? The stated requirement is only that the
  _default_ follows the system.
- **Cross-reference `gridline-rasterization-unmeasured-at-dpr-2`**: that candidate's technique is
  decoding a screenshot and scanning device pixels for where the line colour starts. Dark mode
  changes those colours, so the two interact — whichever lands second inherits the other's
  assumptions.
- Does anything in `perf/` read a colour? `no-aliveness-by-paint-class` scopes `features/*.ts` **and**
  `perf/*.ts` precisely because both were doing it once; worth re-checking rather than assuming the
  rule has held.
- Should the `@theme` tokens be semantic (`--color-board`, `--color-cell-alive`) or literal? Semantic
  is the reason the token layer exists, but it adds an indirection a reader of `Cell.tsx` must follow.
