---
name: e2e-support-layer-shape-post-bdd
title: Re-examine whether the hand-written e2e layer and the barrel still have the right shape
created: 2026-09-02
---

## Context

Raised as _"why do `features/screenplay/` and `features/steps/` still exist when we've completely
migrated to playwright-bdd?"_ **Measured before filing, and the premise inverts for one of the two
directories** — that correction is recorded here so the question is not re-opened in the wrong
form, and so nobody acts on it by deleting something load-bearing.

**`features/steps/` is not a survival of the pre-bdd world — it _is_ the migration.**
`playwright.config.ts:18` wires it straight into `defineBddProject`:

```ts
const bdd = defineBddProject({
  features: ['features/*.feature'],
  steps: 'features/steps/*.ts',
})
```

Those eight modules are what bddgen compiles the `.feature` files against. Delete them and
generation fails **all-or-nothing across every feature**, not just the one. The layer that _was_
deleted by the migration is a different thing with a confusingly similar name: the seven vitest
step files `features/*.steps.test.ts(x)` plus `features/harness/`, removed by
`delete-step-test-layer`. `features/` contributes zero tests to `npm test` today. **If a memory
says "the step layer was deleted", it means that one.**

**`features/screenplay/` is also not vestigial** — it is imported by the step modules _and_ by the
hand-written specs, so it is shared support for both, not a leftover serving only the older one. A
first pass at this measurement appeared to catch `screenplay/viewport.ts` importing the barrel back
(which `rules/no-barrel-import-in-screenplay.yml` forbids, and which would close an ESM cycle); it
is a **comment** mentioning the barrel, not an import, and `npx ast-grep scan --filter
no-barrel-import-in-screenplay` exits 0 with no findings. Not a defect.

**What survives the correction are two real questions, both about shape rather than existence.**

### Question 1 — is the hand-written `*.e2e.spec.ts` layer still the right size?

This one _is_ the pre-bdd artifact: **8 files**, hand-written, running in the same browser at the
same viewport as the generated specs. `triage-paired-specs` already cut it hard — 62 tests down to
27, one whole file deleted — on the rule that a hand-written spec now holds only the **residue** a
Gherkin scenario cannot state, in four categories (hit-testing/stacking, the computed
accessibility tree, rendered pixel geometry, native-event delivery). Every remaining test carries a
header naming the claim it uniquely holds.

So the honest question is not "why does this exist" but **whether the discipline has held since**,
and whether the four categories are still the right cut. Two slices have added to this layer since
that triage (`scrollbar-thumb-overflows-its-track`, and `hover-click-agreement.e2e.spec.ts` is new),
which is exactly the drift a re-audit would look for. Note `product`'s SPECIFY pass on
`wheel-zoom-ignores-magnitude-and-pinch` has just flagged one of its own planned residue claims as
possibly-duplicative under this same rule — evidence the rule is live and being applied, and a
worked example to audit against.

### Question 2 — does the barrel still earn being mandatory?

`features/e2e-helpers.ts` is a **pure re-export file** — 0 function definitions, 8 re-export
blocks, **58 names**. `rules/no-domain-imports-in-bdd-steps.yml` allowlists exactly
`playwright-bdd`, `@playwright/test` and `../e2e-helpers`, making the barrel the **mandated** single
entry point rather than a convenience.

That allowlist was written when the helpers were one 468-line module. `screenplay-e2e-decomposition`
has since split them into seven role modules with an acyclic layering
(`viewport`/`notepad`/`elements`/`questions`/`interactions`/`tasks`/`expectations`). The question the
split did not re-ask: with that structure in place, is funnelling every step module through one
58-name surface still better than allowlisting `../screenplay/*` directly? A step module importing
`../screenplay/questions` states which Screenplay role it depends on; importing the barrel states
nothing.

## Sketch

Deliberately thin — the answer may well be "no change", and that is a legitimate outcome for both
questions.

For Q1, an audit rather than a refactor: for each of the ~27 remaining hand-written tests, does its
header name a claim in one of the four residue categories, and is that claim absent from every
`.feature`? The reverse obligation applies to anything deleted — a test may not be removed without
its claim being restated in `features/**`, and a deletion resting on **subsumption** rather than a
demonstrated failure must say so in the commit.

For Q2, the cheap probe is to widen the allowlist by one entry and repoint a single step module,
then read what it costs: does the import list get more informative, or just longer? Note the
barrel's retention is what keeps the allowlist from widening, so this is a genuine trade rather
than a cleanup.

## Touches

`features/*.e2e.spec.ts`, `features/e2e-helpers.ts`, `features/steps/*.ts`,
`rules/no-domain-imports-in-bdd-steps.yml` (+ its fixture), and CLAUDE.md's testing-structure
section, which describes both structures in detail and would go stale on any change.

**`rules/` belongs to `architect` alone**, so Q2 cannot be actioned by `cleaner` — it needs a
DESIGN or REVIEW pass. That alone may be the argument for taking Q1 and Q2 as separate slices.

## Open questions

- **Is Q1 worth a slice at all so soon after `triage-paired-specs`?** Re-auditing a layer someone
  deliberately triaged two slices ago risks re-litigating a settled decision. The trigger for
  actually running it might be better stated as a count — e.g. when N tests have been _added_ to
  the layer since the triage — than as a standing invitation.
- For Q2, is there a third option: keep the barrel for the hand-written specs (which legitimately
  want breadth) while allowlisting `../screenplay/*` for step modules (which want specificity)?
- Does `no-domain-imports-in-bdd-steps`'s allowlist have a **deletion trigger** the way this repo's
  ARIA reach-arounds do? If the barrel is retained on purpose, that reasoning should live next to
  the rule rather than only in CLAUDE.md.
