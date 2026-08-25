---
name: screenplay-harness-decomposition
title: Decompose the acceptance harness by Screenplay's kinds instead of only by feature
created: 2026-08-24
---

## Context

`slice/split-acceptance-harness` split the harness **by feature** — a core plus one
module per feature — so a conversion adds its own file rather than editing shared
code. That solved the collision problem it was aimed at.

`product`'s VERIFY pass then found the shape has **two tiers documented and three
tiers needed**: the zoom-percentage readout and the ruler labels are wanted by
**four** features (`camera-pan-and-zoom`, `mouse-wheel-controls`,
`grid-reference-lines`, `grid-scrollbars`) — not one, and not all. Read literally,
the first of those four either re-rolls the reader three more times or edits the
core, which is the Open-Closed violation the split removed.

**The Screenplay Pattern is prior art for exactly that third tier**, and it names the
missing axis: our decomposition is by _feature_, and the thing that repeats is a
_kind_.

## The pattern

Five building blocks, per Serenity/JS's handbook:

| block           | definition (quoted)                                                                                                    | ours today                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Actor**       | "represent people and external systems interacting with the system under test"                                         | none — implicit, one user                                              |
| **Ability**     | "thin wrappers around any integration libraries required to interact with the system under test"                       | `board.tsx`'s `createRoot` mount, the `active` singleton, `cellButton` |
| **Interaction** | "command objects that instruct an actor how to use their abilities to perform the given activity"                      | `Board.toggle()`, `Board.advance()`                                    |
| **Question**    | "instruct actors how to use their abilities to **retrieve information**… and provide a way to parameterise activities" | `Board.stateAt()`, `generation()`, `liveCount()`                       |
| **Task**        | "associate business meaning with **sequences of activities** and turn them into reusable building blocks"              | **none** — steps compose inline                                        |

Two observations fall straight out. **`Board` conflates Interactions and Questions**
into one interface. And **the four-feature problem is a Questions problem**: reading
the zoom percentage is a Question, and a Question is independent of which feature
asks it. In Screenplay that is not a special case needing a third tier — Questions
are a peer of Interactions, and shared by construction.

## The tension with what just landed, and why it resolves

**Screenplay decomposes by kind; `split-acceptance-harness` decomposes by feature.
Those are orthogonal axes, and adopting Screenplay naively would undo S2's
concurrency property** — if every Question lives in one shared module, two
concurrent conversions both adding Questions collide on it.

The resolution is a distinction worth stating precisely, because it is what makes
one shared file dangerous and another benign:

- **S2's problem was shared mutable configuration.** `VIEWPORT` and the old
  module-level `REQUIRED_WINDOW` are read by everything; changing one silently
  alters another slice's tile arithmetic with **no textual conflict**. `git rebase`
  succeeds and the second slice measures a different grid.
- **A shared Questions module is append-only.** Adding `zoomPercent()` does not
  change what `stateAt()` does. Two slices appending collide **textually**, which
  rebase surfaces and a human resolves in seconds.

So the axes can coexist: shared modules are safe when they hold pure additive
capability, dangerous when they hold configuration everything reads.

## Sketch

```
features/harness/board.tsx          Ability   — mount/unmount, the one active board, cellButton
features/harness/interactions.tsx   Interactions — toggle, advance, wheel, drag, click toolbar
features/harness/questions.tsx      Questions — cell state, generation, live count, zoom %, ruler labels
features/harness/<feature>.tsx      Tasks     — feature-specific compositions + its WorldWindow
```

**Skip Actors.** Screenplay's Actor exists to model multiple personas and to carry
Abilities. This app has one user and one ability (drive the jsdom app); an Actor
would be ceremony with no second case to justify it. Adopt the decomposition, not
the vocabulary wholesale.

**Do not adopt Serenity/JS the library.** It is a framework with its own runner
integration and this repo uses `@amiceli/vitest-cucumber`. The Serenity/JS handbook
is entirely library-specific and offers no guidance on adopting the pattern
standalone — so this is pattern-borrowing, and the mapping above is ours to own.

## Touches

`features/harness/*` (a re-split), `CLAUDE.md`'s description of the harness layer,
and `rules/no-domain-imports-in-black-box-steps.yml`'s prose — though **not** its
regex: the allowlist already admits any `./harness/<kebab-name>`, so
`interactions.tsx` and `questions.tsx` are legal today with no rule change. A
behavior-preserving refactor, so the design is the deliverable and the bar is that
nothing moves.

## Open questions

- **Is it too early?** The pattern is described as suiting "highly complex
  solutions" and requiring "more technical knowledge" of its maintainers. Our
  harness is ~400 lines serving **one** converted feature. The honest case for
  acting now is that five conversions are queued and each adds capability — the
  cheapest moment to choose an axis is before, not after. The honest case against
  is that we would be decomposing against four projected clients and one real one,
  which is the objection `architect` already had to answer once for the core.
- **Does it belong in the same slice as the mock-harness restructure?** Both
  restructure the harness, and `mock-harness-spike` also proposes moving ownership
  to `architect → coder → cleaner`. Doing them together means one disruption; doing
  them apart means each is independently revertible.
- **Which tier does the fake replace?** Under `mock-harness-spike`, a verified fake
  swaps behind `Board`. Under this decomposition the natural seam is the **Ability**
  — fake the mount, keep Interactions and Questions real. That is a cleaner seam and
  worth checking before either lands.
