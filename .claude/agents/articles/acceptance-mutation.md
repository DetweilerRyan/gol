# Article: The acceptance-mutation Runner

**Audience:** product. **Read when:** before your first `npm run acceptance-mutation` in a slice.

> The measurements behind every ruling here are in `acceptance-mutation.rationale.md`. It holds the delimiter runs, the decimal regression, the per-assertion measurement and the readings later corrected. Read it when you are **changing** a ruling below, never in order to follow one.

## What it is, and who owns it

`scripts/acceptance-mutation/` is **owned by `product`, not `hardener`**. It mutates the _spec_ and asks whether the scenario notices, so both sides of what it measures are `product`'s.

It mutates individual values in `.feature` Examples tables, **never source code**, and reruns the target's generated Playwright spec to check the scenario actually notices. The concept comes from unclebob's Acceptance-Pipeline-Specification.

**In practice this hardens the Gherkin layer against itself.** The weaknesses it has surfaced were in step definitions absorbing a mutated value without noticing, rather than in the framework-free modules. **Treat it as acceptance-suite quality assurance, not as evidence the Gherkin layer is finding core-logic bugs unit tests miss.**

## The two-phase batched design

Every mutant, and every baseline copy of a target, is written as its own `.feature` file into one shared temp tree at `.features-gen/acceptance-mutation/`. That tree is in-tree deliberately: playwright-bdd's module resolution fails out-of-tree.

Each of the run's two phases — baseline, then mutants — does exactly one `bddgen` generate plus one `playwright test` run over the whole batch. No process is spawned per mutant. See `run.ts`'s own header comment for the design.

**`run.ts` holds only I/O and composition**, and is excluded from `crap4ts.scripts.config.ts` and `stryker.scripts.config.json` by their `**/run.ts` globs. The parts inside the gates own the decisions:

- `mutation-sites.ts` owns which values are mutable, and how a mutant is located and rendered.
- `mutant-plan.ts` owns what a mutant _is_ — its ordinal, its mutated value, its mutated text.
- `mutant-tree.ts` owns what its filename looks like.
- `report-format.ts` owns how the report's Site column prints.

**That split is load-bearing rather than tidy.** Classification looks a result up by the mutant's filename. A record whose name and text came from different sites would misattribute a kill or a survivor. Nothing in the output would notice it.

<!-- Closed decision: the cost measurement that ratified the batched form over a per-mutant spawn is in `acceptance-mutation.rationale.md`. -->

## The parser adapter, and the registry behind it

**`gherkin-document.ts` is the sole `@cucumber/*` importer**, of `@cucumber/gherkin` and `@cucumber/messages`. `rules/no-cucumber-parser-outside-adapter.yml` enforces that boundary from the other side.

It hands back real `Scenario` nodes **with their steps, examples and locations intact**, rather than a cells-only projection, so the next mutator needs no second parse.

`mutation-sites.ts` holds two `Record<SiteKind, …>` registries, one finder and one renderer per kind. **A `SiteKind` missing either half is a type error in that file** under `npm run build`, whose `tsc -b` references `tsconfig.scripts.json`. It is never a silently-empty mutant set, nor a renderer that throws on the first mutant of its kind.

`text-span.ts` is the parser-free other half. A `TextSpan` is a half-open, single-line column range, and `spliceSpan` touches exactly those bytes. That is why a mutant differs from its original on **one line**. A full AST re-render would instead re-pad every cell in the table to the new widest value.

**The registry exists because the mutable surface is meant to grow beyond Examples cells.** Mutating step text, scenario names or DocStrings was a _different program_ against a scanner keyed on `Examples:`. Against this one it is one more registered file. Today there is exactly one kind, `examples-cell`, in `examples-cell-sites.ts`.

**A kind needing a new traversal root widens the adapter too, and that is the sanctioned direction. Widen the adapter rather than reaching around it** — the rule's own `note:` says so.

<!-- Closed decision: what the registry cost to extend, measured with a throwaway kind, and which files did not change, are in `acceptance-mutation.rationale.md`. -->

## Three guards, each closing a way to report a confident number about nothing

**Targets are discovered from `features/`**, not from a hardcoded table — `discovery.ts`, over `scripts/feature-files.ts`. Every `.feature` file present is a target. Discovery no longer pairs a target against a `*.steps.test.ts(x)` file at all. The generated Playwright spec a mutant runs against does not exist yet at discovery time. See `discovery.ts`'s own comment for why that pairing check was dropped rather than adapted.

An active target is one with at least one mutation site. **Every active target's unmutated feature runs once, batched with every other target's baseline, before any mutant is written.** A baseline that is not green aborts the whole run, naming the target. Not green means no matching spec in the report, zero specs collected, a failure, or a skipped spec.

There is then no trustworthy spec count to compare its mutants against. Proceeding would misreport them, rather than merely under-report.

**Each outcome is read from Playwright's JSON reporter**, never a regex over console text. `PLAYWRIGHT_JSON_OUTPUT_FILE` is written to a fresh path per phase, so a crashed run can never be scored off a previous one's file.

- `killed` requires the same collected-spec count as the baseline, zero skipped specs, and at least one `unexpected` spec.
- A mismatched count, or any skipped spec, is `error` instead.
- A matching, unskipped count with zero failures is `survived`.

<!-- Closed decision: the classifier defect this repaired, where a suite broken at import scored a kill on every mutant, is in `acceptance-mutation.rationale.md`. -->

## A vacuous hundred percent is a designed state, and the reading to avoid

**A target with no Examples table contributes zero mutants.** It is reported as `0 mutants (no Examples table): <feature>` rather than silently dropped. The aggregate then reads a defined `100.0%`.

**A table-less target is not baselined either, so this runner says nothing whatever about whether its scenarios pass.** The reading to avoid is treating a `100.0%` beside a zero-mutant label as any kind of green. **The green that means something for such a feature is its own `bdd` project run, and nothing here.**

Running the tool scoped to a table-less feature is routine rather than a mistake, and the runner prints which features those are on every run. **Read that list from the output rather than from any figure written down.**

A target excluded by `--feature` is filtered before it becomes a plan, so it is never in that list. The label says only what it can actually observe.

<!-- Closed decision: the measured case where a feature with every scenario red still printed 100.0% at exit 0 is in `acceptance-mutation.rationale.md`. -->

## The temp tree is flat, and two constraints follow

One shared `features/` directory holds every target's baseline and mutants, so a nested target's path is flattened into a single filename — `/` becomes `__`, in `mutant-tree.ts`'s private `baseName`.

**First, a feature path that reaches the temp tree may not contain `_`.** The flattening is not injective, so the deriver rejects the input that makes it unsafe. It exits 1 and names the file.

**Scope that to targets that reach the temp tree, not to `features/` as a whole.** A table-less feature under an underscored directory is reported as an ordinary zero-mutant target, and never throws.

Nothing enforces this at authoring time and nothing needs to. `product` runs this tool in both SPECIFY and VERIFY, so an underscore-named target with a table fails inside the slice that adds it.

**Second, and only until `intent-driven-layout` lands: discovery is recursive but execution is not.** A nested `.feature` would be mutated by this runner and never run by `npm run test:e2e` at all. `npm run gherkin-lint` does recurse, so `product`'s lint gate is not part of the gap. **`intent-driven-layout` owns `playwright.config.ts`; until it lands, keep `features/` flat.**

<!-- Closed decision: why the flattening rejects rather than encodes, and the planted probe that measured the execution gap, are in `acceptance-mutation.rationale.md`. -->

## Two structural mutation classes, and why the mutant count does not move

**Every Examples data cell is exactly one mutation site and yields exactly one mutant.** `buildMutantRecords` calls `mutateValue` once per site. So a new class **dilutes** the existing ones — each cell gets one mutant, with the class chosen by a draw — rather than multiplying them.

**A class count is only ever moved by changing the _site_ model.** `assertUniqueSeedKeys` forbids that as written, since two sites for one cell would share a seedKey.

**`tuple-list.ts` owns paren-delimited numeric tuple lists; `mutateCommaList` owns the flat rest.** `isTupleList` accepts a value that is **wholly** a comma-separated list of parenthesised, fixed-arity integer tuples, and its `VALUE_RULES` entry sits **ahead** of the comma-list rule.

It emits two classes, chosen by a first draw that is taken unconditionally, so the draw sequence never depends on data shape:

- **component-change** — mutate one component. This is the pre-existing behaviour.
- **swap-x-y** — transpose a 2-tuple's two components. Offered only for arity 2, and only for pairs whose components differ, since swapping `(2, 2)` would be a byte-identical no-op mutant.

**Swap is why the class was worth adding, and the reason is an assertion rather than a shape.** A component-change is caught by "every cell the table names is on screen". A swap whose transpose is already a live cell passes that check vacuously. Only the reverse assertion catches it: "and nothing else is". **That is what makes `features/steps/pattern-library.ts`'s bidirectionality load-bearing rather than belt-and-braces.**

<!-- Closed decision: the per-pattern swap measurement, and the deleted paren-shaving patch it replaced, are in `acceptance-mutation.rationale.md`. -->

## The honest residual, which is narrower than "parens are handled"

**That wider reading is the one to avoid.** `isTupleList` is anchored and total: a value that is not _wholly_ a fixed-arity numeric tuple list is rejected, and **falls through to `mutateCommaList`, where it may still syntax-break**.

That reaches more shapes than it sounds like. An item delimited by anything else — `[x, y]`, `{a, b}`, `<x, y>`, a bare `0 0` — a doubly-parenthesised `((0, 0))`, a list mixing arities, and a paren list whose items are not numeric.

The last of those is pinned rather than claimed: `mutation-rules.test.ts`'s PINNED table keeps `(2026-05-13, P3D), (1, 2)` as the boundary fixture, re-pinned to its syntax-breaking mutant.

**So a step parsing a comma-list column still owes the bidirectional check plus an explicit count.** The count reports a shortened expected list, and the reverse inclusion catches it if the count is removed.

**One shape is worse than that, and it is a measured regression: a paren pair with decimal components.** `TUPLE_LIST_SHAPE` requires integer components, so a value like the app's own default camera offset is coordinate-shaped, paren-delimited and rejected. Such a mutant still dies, but through the parser dropping an unparseable item rather than through the assertion noticing a wrong coordinate.

**`mutateCommaList` is deliberately not paren-aware, and restoring that is a rejected remedy.** Removing the flat splitter's paren-shaving patch was a decision rather than an accident. Reinstating it puts two theories of a coordinate list back into the program, which is what the tuple grammar exists to remove.

**`tuple-grammar-rejects-decimal-components` was closed without code, and the re-open trigger is stated from both sides.** Two roles can independently build the world where this bites, and nothing mechanical will say so.

- **From `product`'s side:** an Examples cell that is paren-delimited and carries a non-integer numeric component. No cell in `features/` carries a fractional value today. `.gherkin-lintrc`'s `no-restricted-patterns` also bans `\boffset ?[xy]\b`, so the one genuinely fractional quantity this app has is precluded from the contract rather than merely absent from it.
- **From `scripts/`' side:** any widening of `TUPLE_LIST_SHAPE`'s integer components, or of the step's PAIR regex. **The three deliberately-mirrored copies must move in one slice or silently disagree.**

<!-- Closed decision: the two independent measurement runs, the three things that narrowed the finding, why a decimal column and this trigger are disjoint, and the cost of each rejected remedy -- widening the grammar, and restoring paren-awareness in the fall-through -- are in `acceptance-mutation.rationale.md`. -->

## Three copies of the coordinate grammar exist, deliberately

Nothing mechanical checks that they agree.

`tuple-list.ts` parses the grammar structurally. `features/steps/pattern-library.ts` scans it with a lenient `matchAll` regex. And `tuple-list.test.ts` plus `tuple-list.property.test.ts` each carry a **byte-identical mirror of the step's regex** as their oracle.

**The oracles mirror the step rather than reusing `tuple-list.ts`'s own parser deliberately**, since a mutator checked against its own parser is self-agreeing and proves nothing.

**No `ast-grep` rule is possible**, because matching is within one file and this is cross-file regex agreement. An import-based test is out too: `parseCellList` is not exported, and importing the step module executes `createBdd()` registration. **The tether is comments naming each other**, and system-level agreement is checked by `npm run acceptance-mutation` itself, which is the tool whose entire job that is.

## `tuple-list.ts` never imports `mutation-rules.ts`

`mutation-rules.ts`'s `VALUE_RULES` entry imports `isTupleList` and `mutateTupleList`, so an import back would close a cycle. oxlint's `import/no-cycle` is an **error** here.

The entry therefore passes `mutateValue` in as a `ValueMutator` parameter, on `src/equality/container-equality.ts`'s injected-comparator precedent.

**That is not merely cycle avoidance.** It makes a component's mutation **defined as** recursion through `VALUE_RULES`, exactly what `mutateCommaList` does with its fragments. The alternative is a direct `mutateInteger` call that merely agrees with it today. A rule later inserted ahead of the integer rule is then picked up, instead of silently diverging.

`seeded-random.ts` is the shared leaf both files import — `RandomFn`, `seededRandom` and `nonzeroDelta` — and holds no mutation rule.

## Keep the count assertion, for the reason its own comment gives

**The set equality is the sole detector of the same-length swap class, and the count is the sole detector of nothing.** Keep the count anyway, and not for detection.

It is the only **auto-retrying** assertion in the step, and every non-retrying read after it depends on it having settled the render. `previewCellPositions` and both `filter` reads are non-retrying, so the `toHaveCount` is what settles React's hover render before any of them happen. **Deleting it trades a race for nothing.**

## The headline figure cannot move across a change of this kind

**This is the single most misreadable thing here.** Both mutation classes are lethal, so the run scores the same on either side of a class change. Anyone comparing a before-and-after figure will conclude nothing happened.

What such a change buys is **which assertion earns the score**. A mutation score is a ratio over the mutants that die, rather than a record of what killed them.

**It generalises: when a fix changes the _kind_ of mutant a generator emits rather than how many die, no mutation score can see it.**

<!-- Closed decision: the three-run measurement of which assertion reports which class, and the framing error made twice while the slice was in flight, are in `acceptance-mutation.rationale.md`. -->
