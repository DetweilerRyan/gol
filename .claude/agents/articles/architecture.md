# Article: Architecture: the framework-free modules

**Audience:** coder, cleaner, architect - **Read when:** before adding, moving, or splitting a module, and at the start of every architect REVIEW or DESIGN pass.

> Extracted verbatim from CLAUDE.md @ b5e333e, lines 107-127, 129-142. No prose was edited in the extracting commit; only the common leading indent of a fragment lifted out of a nested list was removed.

### Core logic: the framework-free modules, the hooks, and the unit-tested components

CLAUDE.md's compact module map names the framework-free modules, the hooks and the unit-tested components. **This article does not restate that list.** The map is the routing index. This article is the account of how those modules depend on each other, and what each one may not do.

**What a single module owns is its own hover.** Read the JSDoc above a declaration for its contract, and its `<module>.md` sidecar where one exists for the depth behind it. What follows is only what no single hover can hold.

### Cross-module contracts

Each of these spans more than one module, so no hover can state it alone.

- **The pan sign convention is deliberately not uniform.** Wheel-pan and scrollbar-drag follow the document-scroll convention; drag-to-pan does not. `camera.ts` and `scrollbars.ts` share the first, `dragGesture.ts` the second.
- **Only the toolbar route glides.** Wheel zoom, drag-pan, scrollbar drag and reset all stay instantaneous, and never reach `zoomGlide.ts`.

  That is both the product call and the perf one. Animating a continuous gesture fights the user's own input, and the wheel route is where the expensive zoom numbers are.

- **`APPEARANCE_STORAGE_KEY` is the one `localStorage` key** that `appearance.ts`, `src/hooks/useAppearance.ts` and the tests all agree on. It is a shared constant rather than a string repeated in three places.
- **`liveCellWindow.ts`'s "+1" may leave the mounted set, so the DOM is not a windowed view of the board.** The keyboard cursor's cell is mounted even when it sits outside the `TileRange`. That keeps the grid reachable by Tab after a pan carries the cursor off screen. It is also why a dead cell can be mounted at all.
- **`gridFocus.ts` and `liveCellWindow.ts` are two independent projections of the same camera.** Neither imports the other; the focus coordinate reaches the window as a plain argument.
- **`cellAnchor.ts` and `cellTiles.ts` are independent by construction.** `spanCells` is a parameter both take rather than a shared import, so precision bounding and mounting coverage can change without dragging each other.
- **`scrollbars.ts` is the one camera-side module that knows the game model.** It takes `ContentBounds`, which is exactly why it is separate from `camera.ts`. `liveCellWindow.ts` holds the same two-sided position over `gameOfLife.ts` and `cellTiles.ts`.
- **`liveCellSeed.ts` is a framework-free module rather than harness code, deliberately.** A seeder that silently produces the wrong population makes every perf number measured against it wrong too, and nothing downstream would notice. It lives where mutation testing and property tests can see it.

<!-- Closed decision: `advanceGeneration`'s `changed` delta has no production consumer left — `liveCellStore.ts` was the last one, and `collapse-dead-cell-layer` retired it. It survives on a ruling rather than on a caller: it is a domain fact about a generation, computed free inside the pass that already decides survival. A green run of `gameOfLife.ts`'s own unit and property tests is the whole of what guards it. -->

**The lesson generalizes past scrollbars, and it is the one worth carrying: a property over a module cannot reach an argument's provenance.** `scrollbars.property.test.ts` already asserted "the thumb never extends past the track, in either length or offset" — and it was green, and correct, throughout the entire life of the defect, because it quantifies over the `trackLengthPx` it is _handed_. The bug lived in the gap between that parameter's name and the value one call site passed for it. No property, and no amount of mutation score, over `scrollbars.ts` can see that gap; the guards that can are the parameter's own name (which is why the rename is part of the fix, not cosmetics) and an observation of the rendered result. Before concluding a module is well covered because its invariants are quantified, ask what its callers actually pass.

**The `SCROLLBAR_THICKNESS_PX` ↔ Tailwind-class coupling is guarded in two different places, in two different directions, and neither can be collapsed into the other.** The constant's _value_ is pinned by jsdom: `Scrollbar.test.tsx` and `GridScrollbars.test.tsx` deliberately restate `- 10` as a literal rather than importing the constant, so the subtraction carries its own mutants instead of trivially agreeing with the source. The constant's _agreement with the class_ is not visible there at all — jsdom has no stylesheet and no layout — and it is not visible to the generated bdd layer either, which reads `aria-valuenow` and the announced visible proportion, both derived from `computeScrollbarMetrics`, which never sees a track length: measured, all 73 e2e tests then in the suite passed both before and after a change that moves every rendered thumb by 10px. The sole channel is `grid-scrollbars.e2e.spec.ts`'s containment test, comparing the thumb's bounding box against its parent track's in a real browser. Read its guarantee as **one-directional**: it catches the constant _lagging_ the CSS inset (measured — that is exactly the deliberately-red step-1 commit, four failing sample points), and it structurally cannot catch the constant _leading_ it, since a track computed shorter than the painted one still satisfies `computeThumbGeometry`'s pinned containment and merely paints a slightly short thumb. **The leading direction is not unguarded, though — it is guarded by the other layer, and the two do not collapse into each other.** Measured, bumping `SCROLLBAR_THICKNESS_PX` to 20 against an unchanged `right-2.5`: `npm run test:e2e` stays at **74 passed**, the full suite, while exactly **4 of the 21 tests** in `Scrollbar.test.tsx` + `GridScrollbars.test.tsx` red — precisely the four carrying the `- 10` literal restatements, with the sub-thickness clamp test still green. So the coupling is guarded in both directions by two different layers: **lagging by the browser**, the only thing that can see paint; **leading by the jsdom restatements**, the only thing that pins the constant's value. That is also what makes "never import the constant into its own tests" a rule with a measured consequence rather than only a mutation-score rationale — importing it would make expected identical to actual and delete the leading-direction guard outright. The one cell of that matrix nothing covers is a _coordinated_ leading edit, constant and literals moved together, and nothing needs to: its worst case is the benign short thumb the derivation above already describes. Note also that a bare numeric constant is not a mutation site at all in this tree's enumeration (a scoped run over the two components produced 71 mutants, none of them on `SCROLLBAR_THICKNESS_PX`'s value) — the jsdom literal restatements are what stand in for the mutant Stryker will not generate. **No `ast-grep` rule is possible here**: the invariant relates a TypeScript number to a browser-computed layout box, and ast-grep can see neither side of that.

One more measured fact, about `Scrollbar.tsx` rather than this module, since it reads as defensive code someone will want to delete: the `Math.max(0, …)` at that subtraction site has no mutant expressing its _removal_ (Stryker swaps `Math.max`→`Math.min` and `-`→`+`, both of which the ordinary geometry tests kill), so `Scrollbar.test.tsx`'s sub-thickness-viewport test is its only guard — deleting the clamp redded exactly **1 test** — that one — of the 663 across 54 files `scrollbar-thumb-overflows-its-track`'s tree held; the denominators move with the suite, the numerator is the claim. It pins the component's total contract over a `number` prop, not an app-reachable state: `GridScrollbars.tsx` returns `null` unless both dimensions are positive, so nothing in the app passes a viewport that small. Why that clamp carries no removal mutant at all — and why a bare `foo()` statement does — is in `mutation-testing.md`.

**The framework-free modules form a small acyclic graph, and keeping it acyclic is the point of the split.**
The edges, as they stand:

- `appearance.ts`, `gameOfLife.ts`, `camera.ts`, `dragGesture.ts`, `cache.ts`, and `is-strict-equal.ts` import nothing
- `patternLibrary.ts` → `gameOfLife.ts`
- `gridGeometry.ts` → `camera.ts`
- `zoomGlide.ts` → `camera.ts`
- `cellTiles.ts` → `camera.ts`
- `cellAnchor.ts` → `camera.ts` (neither imports the other — `spanCells` is a parameter both take rather than a shared import)
- `scrollbars.ts` → `camera.ts` + `gameOfLife.ts` (the single place the camera side touches the game model)
- `patternPlacement.ts` → `patternLibrary.ts`
- `liveCellSeed.ts` → `gameOfLife.ts`
- `liveCellStore.ts` → `gameOfLife.ts` + `patternLibrary.ts` + `equality/is-shallow-equal.ts`
- `liveCellWindow.ts` → `gameOfLife.ts` + `cellTiles.ts`
- `gridFocus.ts` → `camera.ts` + `gridGeometry.ts` (and deliberately neither imports the other — see both bullets above)
- `container-equality.ts` → `is-strict-equal.ts`
- `is-shallow-equal.ts` → `container-equality.ts` + `is-strict-equal.ts`
- `is-deep-equal.ts` → `container-equality.ts`

**`cache.ts` and `src/equality/**` were imported wholesale rather than grown from a feature**, by the `import-utilities` slice. `is-shallow-equal.ts` acquired its first caller in the `live-cell-store` slice. `cache.ts` and `is-deep-equal.ts` still have none.

They live inside every gate rather than in a `src/catalyst/`-style exclusion, precisely because this repo now maintains them. **`rules/*.yml` covers a new domain module with no rule edits**, whether it sits at `src/` root or in a subdirectory. ast-grep's `*` crosses `/`, so the domain rules' `files: src/*.ts` glob reaches `src/<dir>/*.ts`. **Their `ignores: src/*.test.ts` entry reaches `src/<dir>/*.test.ts` by the same rule**, so the test files under a subdirectory fall out exactly as they do at the root. `crap4ts.config.ts` and `stryker.config.json` scope by `src/**`, so they reach a subdirectory too.

**Prefer flat at `src/` root for a single cohesive module.** A subdirectory suits a set of siblings that belong together, as `src/equality/` shows. (Measured twice against ast-grep 0.45.1 — once before `src/equality/` existed and again on the landed tree, both times with a throwaway probe module plus a `.test.ts` twin: the domain rules fired on the module and never on the twin. This paragraph previously claimed the opposite; it was wrong.) File naming follows the same split: `src/` root modules and `src/hooks/` are camelCase, `src/components/` is PascalCase, and `src/equality/` deliberately keeps the kebab-case names it was ported under — a decision, not drift, since the file names double as the identifiers a reader looks up when tracing these back to their source.

**`src/catalyst/` sits apart from all of the above.** It is vendored third-party Tailwind Catalyst UI, dropped in as source rather than installed as a dependency. This project does not author it, and it is deliberately outside every quality gate.

Three entries hold that. `crap4ts.config.ts` and `stryker.config.json` each carry an explicit `src/catalyst/**` exclusion, and `.dry4tsrc.json` ignores `**/catalyst/**`. `scripts/halstead4ts/run.ts` inherits the first by resolving crap4ts's globs.

**That is an exclusion rather than an omission.** Both tools measure `src/**` by glob, so anything dropped into `src/` is scored unless something says otherwise. A second vendored directory would need the same three entries added.

**Treat it as a library boundary.** Read it to learn a component's props. Do not refactor it to this repo's conventions, and do not add it to a tool's include list.
