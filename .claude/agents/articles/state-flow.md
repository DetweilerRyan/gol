# Article: State Flow: hooks, stores, and composition roots

**Audience:** coder, cleaner, architect. **Read when:** before touching a hook or a composition root, before relocating state, and at the start of every architect REVIEW or DESIGN pass.

> The measurements behind every ruling here are in `state-flow.rationale.md`. It holds the identity-churn measurements, the perf attribution, the resubscribe counts, and the readings later corrected. Read it when you are **changing** a ruling below, never in order to follow one.

### The standing preference for frequently-changing state

**Prop-drill the store, not the state.** For state that changes often — anything driven by a pointer drag or a scroll — a leaf subscribes to a small **projection** of a store. It does not receive the state as a prop and re-render the whole tree on every commit.

The store reference is stable and propagates no renders. The caller maps or filters the root state into the piece a component actually needs, and the component re-renders only when that projection changes.

**This is a preference, not a description of the landed tree.** The per-cell subscription it describes was deliberately retired in `collapse-dead-cell-layer`. Read the exception with the rule; the state-flow section below records what replaced it.

**Cache every projection.** Compare with a shallow-equality check, and return the **prior reference** when equal. Identity stability is then a property of the store, rather than something each consumer re-establishes with a `useMemo` the compiler may or may not keep.

**Prefer primitive projections where the shape allows.** A `boolean` compares by value, so the `Object.is` bail-out is free and no cache is involved. Reach for the shallow-equality cache only for object projections.

Two rulings come with it.

**Do not inject dependencies through React context here.** It complicates component unit tests. Prop-drill a store instead, precisely because a test can then construct a real store and pass it.

**Use `isShallowEqual` only for small, known-shallow projected state**, per the scope contract in its own JSDoc. It never descends into nested containers, and every call allocates. **Never reach for it to compare two `liveCells` Sets.** Write a dedicated comparison instead.

<!-- Closed decision: why the contract is bounded by allocation rather than by complexity class, and why the O(n²) fallback is `isDeepEqual`'s rather than this module's, are in `state-flow.rationale.md`. -->

### State flow

- **Live-cell state does not live in React at all.** `src/App.tsx` holds one `useState(() => createLiveCellStore(initialLiveCells))` — a stable handle, never a value that changes — and passes the store down as an opaque handle. `LifeBoard` accepts `store` and reads nothing out of it, so a generation tick never re-renders it.

  Two components subscribe, at two different granularities. `GridScrollbars` subscribes to the bounding box. `Grid` subscribes to the whole live-cell set through `useLiveCells`, because deciding which cells have a DOM element at all requires seeing all of them — see `liveCellWindow.ts`.

  **That second subscription is a deliberate, named regression.** A tick re-renders `Grid`, `GridCells` and every mounted `Cell`. It is paid for by there being far fewer mounted cells: only the live ones, plus the focus cursor.

  `App.tsx`'s one optional prop, `initialLiveCells`, exists solely for the perf harness. `undefined`, which is every normal boot, means the ordinary empty grid.

<!-- Closed decision: what the retired per-cell subscription cost, the mount counts on either side of the trade, and the `useImmer` design it replaced, are in `state-flow.rationale.md`. -->

- `src/components/GenerationHud.tsx` owns the `generation` count and the Next generation button. It advances only via that button's own click and keyboard handling, and there is no global keyboard shortcut for it. It takes `onAdvance`, wired to `store.advance`, and holds no live-cell data, so a tick re-renders the counter and nothing else above the grid.

- `src/main.tsx` is bootstrap, not a composition root. It reads `import.meta.env.MODE` and passes the _result_ down. **That check has to be at the entry module** for Rolldown to constant-fold it and tree-shake `liveCellSeed.ts` out of a normal production bundle. That is why `rules/no-logic-in-composition-root.yml` deliberately does not scope it, and why `rules/no-build-env-in-domain.yml` guards the same invariant from the other side. The file holds exactly one ternary and no other decision.

- **Each hook in `src/hooks/` owns exactly one piece of state or one browser API, and delegates the actual rules to a framework-free module.** That split is what keeps the rules testable without a jsdom environment. Put new logic in the pure module and let the hook stay a thin adapter.

  - `useCamera.ts` owns the `Camera` as local `useState` and exposes pan, zoom, wheel, center and scrollbar-drag actions that delegate to `camera.ts` and `scrollbars.ts`. Every one of them routes through a single private `commit()` that **cancels any in-flight zoom glide first**. That funnel exists because reset is only one of five external writers. Wheel zoom, drag-pan, scrollbar drag and the arrow-key reveal-pan are the others, and one cancel site is what stops the fifth being forgotten. The glide's own frames call `setCamera` directly and deliberately bypass `commit()`.
  - `usePatternPlacement.ts` owns the `PlacementState` and its Escape-to-cancel listener, delegating every transition to `patternPlacement.ts`. It takes the place-a-pattern commit callback. Single-shot stamping — read the armed pattern, commit it, disarm — is therefore one action here, rather than a two-call sequence a caller could get wrong.
  - `useElementSize.ts` isolates `ResizeObserver`.
  - `useWheelInput.ts` isolates the native, non-passive `wheel` listener and hands callers a `WheelInput` instead of a DOM event.
  - `useGridPointerGestures.ts` isolates pointer capture and drag-vs-tap resolution, delegating the threshold math to `dragGesture.ts`. It reports rect-relative pixels and never touches a `Camera`.
  - `useInitialCentering.ts` isolates the one-shot first-non-zero-measurement latch, using `useLayoutEffect` plus a ref so no frame paints uncentered.
  - `useCellTiles.ts` holds two independent sticky values as two `useState`s: a `TileRange` for mounting coverage and an `Anchor` for precision bounding. It returns the range as an object, reference-stable by `nextTileRange`'s own contract. The anchor's pixel offset comes back as scalars. It delegates each keep-or-rebase decision independently: the range to `cellTiles.ts`'s `nextTileRange`, the anchor to `cellAnchor.ts`'s `nextAnchor`. Read the hook's comment on why both coverage checks run during render rather than in a `useEffect`.
  - `useRafCoalescedPan.ts` isolates `requestAnimationFrame`. It sums however many pan deltas arrive within one frame into a single `onPan` call. It also exposes `flush()`. A pointerup then settles the camera synchronously, instead of waiting on a queued frame.
  - `useZoomGlide.ts` is this repo's other animation-frame owner. It mirrors that lifecycle with one deliberate difference: **an unfinished glide at unmount is cancelled, never flushed**. A coalesced pan owes its caller an already-accumulated delta, while a half-arrived-at cellSize is owed to nobody.

    It also holds the one state that makes the design exact. **Every frame recomputes `zoomCameraToCellSize` from the camera the glide started at, never from the previous frame's result.** So the completion frame is bit-identical to an instantaneous zoom.

  - `useMatchMedia.ts` is the shared `useSyncExternalStore` subscribe and getSnapshot plumbing for a boolean `matchMedia` query. **jsdom does not implement `matchMedia` at all.** So any test mounting a tree that reaches it must call `src/test-support/domStubs.ts`'s `stubMatchMedia`. That holds whether the test reaches it directly or through one of its two composers. **It carries no defensive fallback on purpose**: an unstubbed test throwing loudly beats shipping a branch no gate can exercise.
  - `useReducedMotion.ts` composes it with `'(prefers-reduced-motion: reduce)'` and returns the raw boolean unchanged. `useSystemAppearance.ts` composes it with `'(prefers-color-scheme: dark)'` and maps the boolean onto `'dark'` or `'light'`. That pair used to each carry an identical private subscribe and getSnapshot, extracted once the duplication became cross-file rather than hypothetical.
  - `useLiveCells.ts` is a `useSyncExternalStore` adapter over the store's whole live-cell set, the exact shape `useContentBounds.ts` already had over the bounds snapshot.
  - `useGridFocus.ts` owns the keyboard focus cursor, delegating every transition to `gridFocus.ts`. It keeps for itself only what React genuinely owns. That is synchronizing real DOM focus onto whichever cell is current, on both the keyboard and the pointer route, plus the one-shot initial centering.
  - `useAppearance.ts` owns the one `AppearancePreference` as local `useState`, seeded from `localStorage` via `appearance.ts`'s `parseAppearancePreference`. It resolves that against `useSystemAppearance.ts`'s live value through `resolveAppearance`. It is the one `useEffect` that pushes the result onto `<html>`'s `dark` class. Tailwind's `dark:` variant and `src/index.css`'s `@custom-variant` override both key off that class. **Call it exactly once, from `App.tsx`** — a second call site would hold a second `useState` the two could desync against.

  **`useMatchMedia.ts`'s `subscribe` and `getSnapshot` are inline closures over `query`**, not module-level named functions. So their identity stability, and therefore `useSyncExternalStore`'s resubscribe avoidance, is **provided by React Compiler rather than being structural**. `useMatchMedia.test.ts` pins it with an `it.skipIf(underStryker)` no-resubscribe assertion, plus an **unskipped companion built on a changing query** which resubscribes in both configs.

<!-- Closed decision: the measured add and remove counts with and without the compiler, why the companion is not built from a fresh closure, and why `listenerCount()` cannot serve, are in `state-flow.rationale.md`. -->

**`useZoomGlide.ts`'s returned controller is identity-stable across renders.** That is a contract with named guards, rather than an incidental property. What keeps it stable is that the controller closes over nothing that varies per render. `onCamera` and the reduced-motion preference are both read through refs, reassigned in the hook's single dependency-array-free effect, which is what lets React Compiler memoize it.

**Declaration order is load-bearing.** Placing that effect above `const prefersReducedMotion = useReducedMotion()` leaves the controller unmemoized and the change inert, while compiling, type-checking and passing every other test in the repo.

Three guards pin it, each `it.skipIf(underStryker)`. Stryker's per-expression instrumentation defeats React Compiler's memoization, so an ungated identity assertion reds the **dry run** and `npm run test:mutation` never starts. Each carries an unskipped companion proving the instrument non-vacuous. The skipped guards do not run under Stryker at all, so a companion is the only thing guarding its path there. Build one that reds when the guarded code breaks, never one that only proves the harness runs.

`useZoomGlide.test.ts` pins controller identity across a re-render. `useCamera.test.ts` pins the whole returned surface. It also pins all seven actions across a pan. `LifeBoard.test.tsx` pins no `wheel` re-registration during a six-frame drag pan.

<!-- Closed decision: the churn measured in both directions, the two fault arms every guard was verified against, and the perf regression this was chased down for, are in `state-flow.rationale.md`. -->

**The general contract, established by `stable-hook-identities`: a hook-returned function must not capture render-varying state it only needs at call time. Where such a function crosses a component boundary as a prop, a test asserts its identity.**

**Sync the value into a ref, inside a dependency-array-free `useEffect`.** That is the sanctioned mechanism. Never `useCallback`, which `rules/no-manual-memo-ts` and `-tsx` forbid under React Compiler. Never a write during render, which the compiler forbids outright; `useRafCoalescedPan.ts` carries that trap's explanation. Five such refs exist across four hooks: `onCameraRef` and `prefersReducedMotionRef` in `useZoomGlide.ts`, `onPanRef` in `useRafCoalescedPan.ts`, `cameraRef` in `useCamera.ts`, and `placementRef` in `usePatternPlacement.ts`.

**The call-time read is semantically better, not merely a memoization trick.** `stampArmedPattern` reads the placement when the click happens, rather than when the render happened. That is what makes it impossible to stamp a pattern `Escape` cancelled in between. The same holds for the camera a zoom click zooms from.

**It is a scoped contract, not a blanket rule, and the exemptions carry their reasons at the site.** A blanket "everything a hook returns is identity-stable" is unachievable for projections, since `useCellTiles`'s view object _must_ change when the camera moves. It would also spend real complexity on churn that provably costs nothing.

Three exemptions stand. `useGridFocus.moveFocus` and `jumpToEdge` reach only a DOM property assignment with no memoized subtree behind it. The comment at their declaration site names the condition that reopens it: either becoming a prop of a memoized child. `useGridPointerGestures`' `handlers` container is spread rather than passed down, so React diffs its members individually. `useCellTiles`'s view object is a projection whose change is the point.

**What decides an exemption is where the churn lands, not whether it happens.** Each one is a measurement rather than a judgement call.

**Guarded in two layers, and no `ast-grep` rule is possible.** Layer A is the durable one: composition-level render-count guards. They currently live in `Grid.test.tsx` and `LifeBoard.test.tsx`, and both count `Cell` render calls through `vi.mock('./Cell', { spy: true })`. Layer B is per-hook identity assertions, added only where capture risk exists: `useCamera.test.ts`, `usePatternPlacement.test.ts`, `useZoomGlide.test.ts` and `useGridFocus.test.ts`, which pins `setFocus` even though the two exempt functions beside it stay unpinned. `useMatchMedia.test.ts`'s no-resubscribe guard is the same layer read through its effect. Both layers use the skip-plus-companion idiom above.

**Identity is a property of compiled output, so tests are the only instrument that can see it.** The discriminator is forward reference, which is scope analysis rather than a syntax pattern.

<!-- Closed decision: why the obvious structural proxy is backwards on this codebase, what each exemption measured, and why a shared `useLatestRef` helper was proposed and declined, are in `state-flow.rationale.md`. -->

- `src/components/LifeBoard.tsx` is the composition root for the camera and placement state. It calls `useCamera` and `usePatternPlacement`, derives `previewPositions` and `armedPattern` from already-tested pure functions, and supplies `Grid`'s `renderOverlays` render prop with the ruler, zoom percentage, scrollbars, toolbar, and pattern-library modal.

  **The stacking order there is load-bearing.** All of them are `position: absolute` with auto z-index, and a later sibling wins hit-testing. So `GridToolbar` at `top-2 right-2` must render after `GridScrollbars`' track, or it cannot be clicked where it overlaps.

  It deliberately touches **no** live-cell data — it forwards only the `store` handle and `store.toggle` — so a generation tick never re-renders it. The content-bounds subscription that used to sit here was pushed down into `GridScrollbars`, the one overlay that needs it.

  `LifeBoard.tsx` is deliberately outside every quality gate, like `App.tsx`. `rules/no-logic-in-composition-root.yml` keeps it wiring-only mechanically rather than unit-test coverage doing it. Its own small `LifeBoard.test.tsx` exists only to recover the two behaviors no unit below it can prove alone. Those are that a pointer tap on the grid reaches `usePatternPlacement`'s single-shot `stampArmedPattern`, and the Patterns-button-while-placing cancel path.

- `src/components/Grid.tsx` owns the measurement through `useElementSize`, the pointer and wheel listeners through `useGridPointerGestures` and `useWheelInput`, the one-shot initial centering through `useInitialCentering`, and the DOM sibling-not-ancestor layering between `#grid-content` and whatever `renderOverlays` returns.

  **It imports none of `GridToolbar.tsx`, `PatternLibraryModal.tsx`, `RulerLabel.tsx` or `Scrollbar.tsx` directly.** Those are inverted: `Grid` takes a `renderOverlays(context)` render prop, where `context` carries only what `Grid` measures and its caller cannot — viewport `size` and the computed `visibleRange`. `LifeBoard` supplies the actual overlay components rather than `Grid` hardcoding them.

  The deliberate exceptions are `Grid → GridCells → Cell`, `Grid → GridLines`, `Grid → HoverIndicator` and `Grid → PatternPreview`. Cells must render _inside_ `#grid-content`, and owning that containment is exactly why `Grid` exists as its own component rather than folding into `LifeBoard`.

  Inside `#grid-content`, `Grid` renders these siblings in DOM order: `GridLines`, a transformed layer div wrapping `GridCells`, `HoverIndicator`, then `PatternPreview`. Later-in-DOM wins among same-level absolutely-positioned siblings. So lines paint furthest back, and every opaque live cell occludes them. The preview paints over both the cell buttons and the hover indicator.

  **The pan transform sits on that inner layer div and never on `#grid-content` itself.** That is load-bearing rather than stylistic. `useGridPointerGestures` and `useWheelInput` both call `getBoundingClientRect()` on `#grid-content`, so a transform there would shift that rect and silently resolve every tap and hover to the wrong world cell. `Grid.test.tsx` asserts `#grid-content` carries no transform, before and after a pan. A second test asserts the layer div's transform matches a pure `translate(...)` and contains no `scale`. This app re-lays-out on zoom instead of scaling, which keeps `getBoundingClientRect()` and layout units from disagreeing the way a scaled scroll container's would.

  **`GridCells` no longer decides which cells exist.** `Grid` calls `liveCellsInRange(liveCells, tiles.range, gridFocus.focus)` once per render, then hands the finished array down. See `liveCellWindow.ts`. `GridCells` only lays it out, one `Cell` per entry, keyed by that cell's own `CellKey` — a stable identity for as long as the cell stays alive.

  **The CellTile component is deleted**, along with the per-tile dead-or-alive loop it wrapped. `useCellTiles`'s world-anchored `TileRange` survives as the _bound_ on that projection, rather than as a set of things to render. The intra-tile pixel math in `cellOffsetPx` moved down into `GridCells`.

  `Cell.tsx` takes its own aliveness as a plain `isAlive` prop instead of holding a per-cell store subscription. The one `liveCellsInRange` call that decided to mount it already knows. It takes a finished CSS `transform` string rather than pixel numbers, so it holds neither a `Camera` nor any pixel geometry.

  **It paints solid when alive and nothing at all when dead.** `GridLines.tsx`'s own white base fill and gridlines show through, which is why a dead-but-focused cell must stay transparent rather than white.

  `PatternPreview.tsx` is the one place that stays camera-exact. It sits outside the transformed layer and recomputes `worldToScreen` per position. That is affordable, because it is bounded by the armed pattern's own size rather than by the viewport.

  **A pan that stays within the tile range's eviction hysteresis still re-renders no cell.** `liveCellsInRange`'s three inputs — the store's set identity, `nextTileRange`'s by-reference range, and the focus cursor — are all unchanged, so React Compiler bails on the call.

  `Grid.tsx` has its own unit tests in `Grid.test.tsx`, scoped to that composition: the DOM layering contract, the place-versus-toggle dispatch, and one thin wiring test per hook. The hooks and pure modules it composes, and the four inverted overlay components, are each tested on their own.

<!-- Closed decision: what `Grid.test.tsx` used to cost before that rescoping, and the mount counts the tile-slot design paid, are in `state-flow.rationale.md`. -->
