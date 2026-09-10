# Article: Architecture: the framework-free modules

**Audience:** coder, cleaner, architect - **Read when:** before adding, moving, or splitting a module, and at the start of every architect REVIEW or DESIGN pass.

> Originally extracted verbatim from CLAUDE.md at commit b5e333e. `migrate-architecture-depth` later moved the per-module bullets into each module's own JSDoc hover, so that provenance describes the extraction and no longer describes this file.

### Core logic: the framework-free modules, the hooks, and the unit-tested components

CLAUDE.md's compact module map names the framework-free modules, the hooks and the unit-tested components. **This article does not restate that list.** The map is the routing index. This article is the account of how those modules depend on each other, and what each one may not do.

**What a single module owns is its own hover.** Read the JSDoc above a declaration for its contract, and its sidecars beside the source where they exist — `<module>.md` for worked depth, `<module>.rationale.md` for the evidence. What follows is only what no single hover can hold.

### Cross-module contracts

Each of these spans more than one module, so no hover can state it alone.

- **The pan sign convention is deliberately not uniform.** Wheel-pan and scrollbar-drag follow the document-scroll convention; drag-to-pan does not. `camera.ts` and `scrollbars.ts` share the first, `dragGesture.ts` the second.
- **Only the toolbar route glides.** Wheel zoom, drag-pan, scrollbar drag and reset all stay instantaneous, and never reach `zoomGlide.ts`.

  That is both the product call and the perf one. Animating a continuous gesture fights the user's own input, and the wheel route is where the expensive zoom numbers are.

- **Persisted appearance goes through `appearance.ts`'s `APPEARANCE_STORAGE_KEY`, never a fresh string literal.** The hook that writes it and the module that parses it must name one key. Whoever adds a second persistence site is exactly the reader who would not think to hover the constant.
- **`liveCellWindow.ts`'s "+1" may leave the mounted set, so the DOM is not a windowed view of the board.** The keyboard cursor's cell is mounted even when it sits outside the `TileRange`. That keeps the grid reachable by Tab after a pan carries the cursor off screen. It is also why a dead cell can be mounted at all.
- **`gridFocus.ts` and `liveCellWindow.ts` are two independent projections of the same camera.** Neither imports the other; the focus coordinate reaches the window as a plain argument.
- **`cellAnchor.ts` and `cellTiles.ts` are independent by construction.** `spanCells` is a parameter both take rather than a shared import, so precision bounding and mounting coverage can change without dragging each other.
- **`scrollbars.ts` is the one camera-side module that knows the game model.** It takes `ContentBounds`, which is exactly why it is separate from `camera.ts`. `liveCellWindow.ts` holds the same two-sided position over `gameOfLife.ts` and `cellTiles.ts`.
- **`liveCellSeed.ts` is a framework-free module rather than harness code, deliberately.** A seeder that silently produces the wrong population makes every perf number measured against it wrong too, and nothing downstream would notice. It lives where mutation testing and property tests can see it.

**`advanceGeneration`'s `changed` delta survives on a ruling rather than on a caller.** `liveCellStore.ts` was its last production consumer, and `collapse-dead-cell-layer` retired it. It stays because it is a domain fact about a generation, computed free inside the pass that already decides survival. `gameOfLife.ts`'s own unit and property tests are the whole of what guards it. Do not read a green suite as evidence that something uses it.

**Every framework-free module carries a property test, with two deliberate exceptions, both in `src/equality/`.** `is-strict-equal.ts` is a wrapper over `Object.is` with no invariant to quantify over. `container-equality.ts` states no contract of its own — it is the walker both comparators inject into, so `is-shallow-equal.property.test.ts` and `is-deep-equal.property.test.ts` cover it from both sides. Read a missing `*.property.test.ts` anywhere else as a gap rather than as a third exception.

**A property over a module cannot reach an argument's provenance.** A property quantifies over the values it is _handed_. A defect in the gap between a parameter's name and what a call site passes stays invisible to it. No mutation score over that module reaches it either.

Two guards can see such a defect:

- the parameter's own name, which is why a rename is part of the fix rather than cosmetics
- an observation of the rendered result

So before concluding a module is well covered because its invariants are quantified, ask what its callers actually pass. `src/scrollbars.rationale.md` carries the worked case behind this rule.

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

**Prefer flat at `src/` root for a single cohesive module.** A subdirectory suits a set of siblings that belong together, as `src/equality/` shows.

Measured twice against ast-grep 0.45.1: once before `src/equality/` existed, and again on the landed tree. Both runs used a throwaway probe module plus a `.test.ts` twin. The domain rules fired on the module and never on the twin. This paragraph previously claimed the opposite; it was wrong.

**File naming follows the same split.** `src/` root modules and `src/hooks/` are camelCase, and `src/components/` is PascalCase. `src/equality/` keeps its ported kebab-case names. That is a decision rather than drift: a reader looks those names up to trace the code to its source.

**`src/catalyst/` sits apart from all of the above.** It is vendored third-party Tailwind Catalyst UI, dropped in as source rather than installed as a dependency. This project does not author it, and it is deliberately outside every quality gate.

Three entries hold that. `crap4ts.config.ts` and `stryker.config.json` each carry an explicit `src/catalyst/**` exclusion, and `.dry4tsrc.json` ignores `**/catalyst/**`. `scripts/halstead4ts/run.ts` inherits the first by resolving crap4ts's globs.

**That is an exclusion rather than an omission.** Both tools measure `src/**` by glob, so anything dropped into `src/` is scored unless something says otherwise. A second vendored directory would need the same three entries added.

**Treat it as a library boundary.** Read it to learn a component's props. Do not refactor it to this repo's conventions, and do not add it to a tool's include list.
