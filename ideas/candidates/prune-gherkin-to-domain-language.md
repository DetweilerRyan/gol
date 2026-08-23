---
name: prune-gherkin-to-domain-language
title: Prune the Gherkin layer to domain-level scenarios and switch on the lint rules we own
created: 2026-08-23
---

## Context

Slice F. `CLAUDE.md` already concedes that six of seven features overlap the unit
tests with "the same functions, frequently the same literal inputs". The Examples
tables carrying that overlap are also the entire acceptance-mutation surface —
**142 mutants today**, most of them re-checking arithmetic the unit tests own.

The lever, stated once: _an Examples table is the entire mutant surface; a
table-less scenario costs zero mutants._ Pruning to domain-level scenarios takes
142 → ~68 while keeping a scenario for every feature. **No `.feature` file is
deleted** — each still states what its area of the product does.

## Sketch

Per feature: **verify replacement coverage exists → prune → re-run gates.** Never
the reverse.

| Feature                | Mutants | Action                                                                                                                          |
| ---------------------- | ------: | ------------------------------------------------------------------------------------------------------------------------------- |
| `grid-reference-lines` | 40 → 12 | delete the 4×6 viewport-range table; keep the every-10-cells outline minus unreachable ±100 rows                                |
| `mouse-wheel-controls` |  22 → 0 | keep "wheel pans, shift-wheel zooms" table-less; axis resolution is a browser-quirk workaround owned by `useWheelInput.test.ts` |
| `infinite-grid`        |  12 → 0 | keep the file — it states the grid is unbounded — both scenarios table-less at reachable coordinates                            |
| `grid-scrollbars`      |   8 → 0 | delete the drag table (its `ratio 0` row is unreachable by construction); keep the 2–3 scenarios `aria-valuenow` can express    |
| `camera-pan-and-zoom`  |  8 → ~4 | keep reset + clamping (observable as `300%`/`40%`), re-express the table in percentages                                         |

### It also switches on the gherkin-lint rules already installed

`gherkin-lint-plus` ships ~35 rules; `.gherkin-lintrc` enables **6**. Zero new
dependencies. Trialled against the current features, 18 added rules produced **4
findings** total — adoption is nearly free. Fold it into this slice rather than
giving it its own, because the highest-value rule's findings are in the exact two
features this slice already rewrites.

- **`no-restricted-patterns`** — 15 findings, all in `grid-scrollbars` and
  `camera-pan-and-zoom`: `offsetX`, `offsetY`, `thumb ratio`, `returns`. This
  **mechanises the domain-altitude rule** architect currently applies by judgment.
  Implementation vocabulary is leaking into the contract today.
- **`only-one-when`** — 2 findings, one clearly right: `camera-pan-and-zoom`'s
  reset scenario is pan → zoom → reset, where the first two `When`s are setup
  masquerading as actions.
- `scenario-size`, `name-length`, `max-scenarios-per-file` — 2 trivial findings.
- Nine structural rules — 0 findings, pure insurance.
- The tag rules — skip; this repo uses no tags.

**`no-restricted-patterns` belongs to `architect`, not `product`.** It is a blunt
regex over step text, and the failure mode is someone widening the allowlist to
get green — the same move as narrowing an arbitrary to clear a finding. It sits
alongside `rules/*.yml` in ownership even though it lives in `.gherkin-lintrc`.

## Touches

All seven `features/*.feature` files, `.gherkin-lintrc`, and whatever replacement
unit tests the coverage check turns out to require. The acceptance-mutation
baseline in `.claude/agents/articles/engineering.md` moves and must be re-recorded.

## Open questions

- **Hard-gated on the pilot's P3/P4.** `stryker.config.json` has no test filter, so
  the steps files feed `break: 85` on `src/` and crap4ts line coverage today.
  Deleting scenarios can break gates that have nothing to do with Gherkin. If
  P3/P4 fail, the failing files name exactly which scenarios need replacement unit
  tests _before_ their table is pruned — that re-sequences this slice, it doesn't
  cancel it.
- Row deletions renumber every downstream acceptance-mutation seed key
  (`${feature}:${rowIndex}:${columnName}`), reshuffling the whole mutant set. That
  is the strongest argument for `gherkin-ast-mutation`, and worth deciding
  ordering against.
- Whether `grid-reference-lines`' surviving 12-row table is still the right
  altitude, or whether it should also go table-less.
