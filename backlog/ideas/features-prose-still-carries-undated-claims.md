---
name: features-prose-still-carries-undated-claims
title: Apply the undated-cross-file-claims convention to features/, which no role pruned
created: 2026-09-07
---

## Situation

`no-undated-cross-file-claims` landed the convention in
`.claude/agents/articles/engineering.md`: a comment may state why, but not an undated
present-tense fact about another file. It pruned `src/`, `scripts/`, `perf/`, root `*.ts`,
`rules/`, `rule-tests/` and the docs surface.

## Complication

**`features/` was excluded and still carries the defect.** It is `product`'s manifest, and no role
in that slice had the write boundary for it. Measured 2026-09-07:

| Shape                  | Sites  | Where                                                                                                                                                                                                                                                                                                                                    |
| ---------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"this slice"` records | **15** | `hud-layout-and-shortcuts.e2e.spec.ts` 124/125 · `camera-pan-and-zoom.e2e.spec.ts` 191/207 · `hover-click-agreement.e2e.spec.ts` 49/58/288 · `screenplay/questions.ts` 83/512/555 · `steps/mouse-wheel-controls.ts` 89/110 · `steps/keyboard-grid-navigation.ts` 48 · `steps/pattern-library.ts` 20 · `steps/camera-pan-and-zoom.ts` 125 |
| undated `reds N tests` | **2**  | `hud-layout-and-shortcuts.e2e.spec.ts` 76, 83                                                                                                                                                                                                                                                                                            |
| caller rosters         | **2**  | `screenplay/interactions.ts` 77, 84                                                                                                                                                                                                                                                                                                      |

One is nearly compliant already: `hud-layout-and-shortcuts.e2e.spec.ts:83`'s "reds 3 tests" block
already names its counting universe, the measuring roles and the tree — it wants only the slug
(`re-audit-hand-written-e2e-residue`, confirmed by `git log -L`). Line 76's "reds 5 tests" is the
genuinely undated one.

## Question

Small `product` pass, or let it drain as files are touched?

## Answer

**Probably a small `product` pass, but the counter is real.** For: 19 sites is an afternoon, the
convention exists and is written down, and `features/` prose is read by `product` on every slice.
Against: nothing checks it — `npm run reference-check` catches dead _references_, not undated
_claims_ — so this drains at the same rate whether or not a slice is spent on it, and the
`src/` sweep needed **four** passes to converge (`architect` DESIGN, `coder`, `cleaner`,
`architect` REVIEW), each finding instances the last missed.

That convergence record is the strongest argument here, and it cuts both ways: a one-pass
`features/` sweep will not be complete either, so its value is the sites it fixes rather than the
class it closes.

## Touches

`features/**` only — specs, step modules, `screenplay/`. `product` owns all of it; no other role
may write there. No `src/`, no config, no gate change.

## Open questions

- **Does `product` have a trigger to read `engineering.md`'s new section?** It reads the three
  house articles unconditionally, and the convention lives in one of them, so yes — but the
  section is new and no role file names it. Worth checking whether a pointer is owed.
- **Is a `"this slice"` in an `.e2e.spec.ts` header a record or an indexical?** The convention's
  carve-out keeps procedural indexicals — text that instructs a future reader, who is always
  inside _some_ slice. A spec header describing why a test exists is a record. A step module's
  note about how to extend it may not be. The 15 sites above are classified as records on a quick
  read, not a careful one.
- **Should it ride along with the next `features/`-touching slice instead?** That is the
  drain-as-touched option with a deadline, and it avoids spending a slice on prose alone.
