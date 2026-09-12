# Rationale: State Flow

**Audience:** whoever is changing a rule in `state-flow.md`. **Read when:** you are amending, narrowing or
overturning one of those rules — never in order to follow one.

No role carries a read trigger for this file. `state-flow.md` is written to be actionable on its own; this
file holds the evidence behind it, so a rule can be argued with rather than only obeyed. Everything below
is history: what was measured, in which slice, by what method, and which readings were later corrected.
Several figures describe trees that no longer exist — **do not quote a number forward from this file
without re-deriving it.**

## Where this article came from

`state-flow.md` was extracted verbatim from CLAUDE.md at `b5e333e`, lines 143-166. No prose was edited in
the extracting commit. Only the common leading indent of a fragment lifted out of a nested list was removed.
That note stood inside the article until `split-state-flow-article` moved it here.

## What this split found

Three enumerations were re-derived on 2026-09-09. One was wrong. The pass did **not** re-derive the two
list-shaped enumerations, and the REVIEW pass afterwards found both incomplete — recorded below, so the
claim here is what was checked rather than what was written.

**Wrong: "a fourteenth hook would enter this section's enumerated list".** That appears in the argument for
declining a shared `useLatestRef` helper. `src/hooks/` holds sixteen hooks, so a new one would be the
seventeenth. The numeral was correct when written and drifted twice without anyone noticing, because it sits
inside a closed decision that nobody reopened. The article now names no ordinal there.

**Correct on re-derivation**, and each was checked rather than assumed:

- **"Five such refs across four hooks."** Verified by listing every `const …Ref = useRef` declaration in
  `src/hooks/`, then filtering to those a dependency-array-free `useEffect` reassigns: `onCameraRef` and
  `prefersReducedMotionRef` in `useZoomGlide.ts`, `onPanRef` in `useRafCoalescedPan.ts`, `cameraRef` in
  `useCamera.ts`, and `placementRef` in `usePatternPlacement.ts`. Five, across four.
- **"All seven returned actions" of `useCamera`.** Its return literal carries eight keys. One is `camera`,
  the state itself, so seven are actions. The claim is exact rather than approximately right.

**What the REVIEW pass then found, by re-deriving the two lists this audit skipped.**

- **The per-hook bullet list covered fifteen of sixteen hooks.** `useContentBounds.ts` appeared only inside
  the `useLiveCells` bullet, as the shape that hook copied. It never had a bullet of its own, so the gap
  predated the split. Left alone deliberately, because that whole list was ruled to migrate out of the
  article — which `migrate-module-depth` then did, so the gap closed by deletion rather than by correction.
- **Layer B's roster named three test files and there are more.** `useGridFocus.test.ts` pins `setFocus`
  identity, which is easy to miss because the same hook supplies two of the three standing exemptions, and
  `useMatchMedia.test.ts` pins the same property through a resubscribe count. Both are now named.

## The identity contract: what `stable-hook-identities` measured

**The churn was measured in both directions rather than argued.** `useCamera`'s private `commit()` closes
over `useZoomGlide`'s controller, and every one of its seven returned actions closes over `commit()` — or,
for the two centered-zoom actions, over the controller directly. Before the slice all seven were stable.
With the controller rebuilt per render, none were.

**`zoomInCentered` and `zoomOutCentered` were a ruled exception that `stable-hook-identities` superseded.**
They were held to churn legitimately, because they captured `camera`. That slice made them read it through a
ref at call time instead, which is why `useCamera.test.ts` now asserts all seven rather than five.

**Declaration order is load-bearing, and the failure is silent.** Placing the ref-syncing effect above
`const prefersReducedMotion = useReducedMotion()` compiles, type-checks and passes every other test in the
repo, while leaving the controller unmemoized and the change inert.

**The three guards were verified red against both fault arms** — the unfixed tree, and the misordered
variant above. `useZoomGlide.test.ts`'s companion, "reads prefers-reduced-motion at click time", was
separately verified to be the **only** test in the repo that reds when the ref assignment is dropped. That
is what guards the path under Stryker, where the three skipped guards do not run at all.

### The jsdom cost, and the perf attribution that outran it

In jsdom the churn tore down and re-added `#grid-content`'s non-passive `wheel` listener on every camera
commit. `useWheelInput`'s effect is keyed `[ref, onWheelInput]`, and `onWheelInput` is `applyWheel`.
Measured: **4 registrations at mount and 10 after a six-frame paced pan before the fix, 4 and 4 after it.**

**Whether that explained `pan-min-zoom-50k`'s roughly 8ms regression at 1280×900 was left as a hypothesis
jsdom cannot test**, having no compositor. The orchestrator's post-merge run then closed it. With the fix
landed that scenario read **41.80 / 47.53 / 41.70ms at 1280×900** and **58.30 / 58.33 / 58.40ms at
1920×1080**, against a regressed 50.00 / 50.00 / 49.91 / 50.00 and 66.70 / 66.60 / 66.07 / 66.60, and a
pre-`smooth-zoom-transitions` baseline of 42.70 / 41.81 / 41.91 and 58.45 / 58.33 / 60.02. Fully recovered
at 1920, and recovered in two of three runs at 1280.

**Read that as the identity churn being the cost, not as proof the listener re-registration is the whole
mechanism.** The perf harness cannot separate them, and two earlier explanations of this same 8ms were
confidently stated and refuted.

**It also inverts an assumption made during the investigation.** 1280 was treated as the stable viewport and
1920 as the noisy one. This run is the other way round, so **neither viewport should be trusted from a
single sample.**

**The mechanism originally proposed was refuted.** That mechanism was memoization bailing and re-rendering
every mounted cell. `Cell` and `GridCells` render counts are byte-identical in both arms, because those
renders are driven by the tile-range rebuild that `perf/pan.perf.spec.ts`'s 400px-per-move pan forces on
every move at `MIN_CELL_SIZE` regardless. So acceptance for the fix was identity stability plus its guards,
deliberately independent of the perf number. The recovery above is corroboration rather than the thing that
made the slice correct.

### Why the structural proxy was rejected

**The tempting proxy — "no inline arrow functions in a hook's returned object literal" — is exactly
backwards on this codebase, and it was tested rather than assumed.** `usePatternPlacement`'s four inline
arrows are all identity-stable, and the one function that churned, `stampArmedPattern`, was a hoisted
declaration.

The real discriminator is **forward reference**: a declaration referenced from a closure appearing above it.
Measured by moving `Grid.tsx`'s `activateCell` back to that form, which reds exactly one `Grid.test.tsx`
test. That is scope analysis rather than a syntax pattern, which is why no `ast-grep` rule can express it.

### Why the three exemptions are exemptions

Each was measured rather than judged.

- **`useGridFocus.moveFocus` and `jumpToEdge`** churn on `focus` and `camera`, but reach only `Grid`'s local
  `handleKeyDown` and from there `#grid-content`'s `onKeyDown` prop. That is a DOM property assignment with
  no memoized subtree behind it, so stabilising them buys nothing.
- **`useGridPointerGestures`' `handlers` container** churns when any member does, but `Grid` spreads it
  rather than passing it down. React then diffs the four members individually, and each is memoized against
  its own dependencies.
- **`useCellTiles`'s view object** is a projection whose change is the point.

### The `useLatestRef` helper that was declined

Proposed at the fourth ref site by `cleaner`, and ratified as declined at `stable-hook-identities`' REVIEW.
Three reasons, and the count trigger has already fired once and returned the same answer.

The load-bearing content at each site is the why-**this**-value comment, which any extraction leaves in
place, so the mechanical saving is roughly two lines per site. `useZoomGlide.ts`'s two-refs-in-one-effect
shape does not fit a single-value API without either splitting that effect — the exact declaration-ordering
hazard measured above, where a plausible reordering passes and fixes nothing — or generalizing the API for
one caller. And a new hook would enter the article's enumerated hook list and every gate, for that saving.

**`dry4ts`'s silence here is a `minNodes: 20` floor artifact rather than evidence against duplication**,
since each occurrence's effect body is one or two statements. Do not cite a clean run as a finding either
way.

**Reopen on a shape change rather than on a count.** A site where the one-effect-flush lag is not
acceptable, and wants a module to argue the timing in. Or a single-value site whose why-comment turns out to
be boilerplate.

## The `useMatchMedia` resubscribe measurement

Measured at `dark-mode-following-system-appearance`'s REVIEW pass, on the shipped config: **1
`addEventListener` call and 0 `removeEventListener` calls across three re-renders**, for `useMatchMedia`
directly and through both composers.

With the `babel({ presets: [reactCompilerPreset()] })` entry removed from an otherwise identical jsdom
config: **4 adds and 3 removes** — one resubscribe per render, on the hook `useZoomGlide.ts` reads once per
pointermove of a drag-pan.

**That is the `stable-hook-identities` class exactly**, which is why it is pinned rather than assumed. The
companion test is deliberately not built from a fresh-closure construction: measured, the compiler flattens
those too, so such a companion would red the shipped config.

**`listenerCount()` structurally cannot serve here.** A resubscribe removes and re-adds, leaving the net
count at 1 either way. That is why `MatchMediaController` grew `addCallCount` and `removeCallCount` beside
it.

**jsdom does not implement `matchMedia` at all.** Measured: `undefined` in this repo's `dom` project, while
`requestAnimationFrame` and `performance.now` both exist.

## Why `isShallowEqual` is bounded by allocation rather than asymptotics

`container-equality.ts`'s `consumeEquivalent` matches Set members through `Set.delete`, which is
SameValueZero. Under `isStrictEqual` it can never succeed on the fallback linear scan where that lookup
failed, so the shallow Set path is O(n). The O(n²) fallback belongs to `isDeepEqual`, whose comparator can
match a structurally-equal member the lookup misses.

Every call allocates: a same-size copy of the second `Set`, plus a key array per side for the object path.
**It is the allocation that bounds the contract, not the complexity class.**

## What `collapse-dead-cell-layer` changed, and what it cost

**The per-cell subscription was retired deliberately.** `Grid` now subscribes to the whole live-cell set
through `useLiveCells`, because deciding which cells have a DOM element at all requires seeing all of them.
A tick therefore re-renders `Grid`, `GridCells` and every mounted `Cell`, where the retired per-cell
`useLiveCell` subscription re-rendered only the cells that actually flipped.

**It is paid for by there being far fewer mounted cells** — the live ones plus the focus cursor, rather than
one per tile slot in range. At minimum zoom the old design mounted roughly **34,000 tile slots**; the new
one mounts nothing at all on an empty board.

The retired hook was `useLiveCell`, and `subscribeCell` — the store method it subscribed through — was
retired with it.

**This replaced `use-immer`'s `useImmer`**, since removed from `package.json`. A producer hands back a new
`Set` identity every tick, which defeats React Compiler's memoization however deep the prop drilling goes,
so every visible cell re-rendered on every tick.

**`Grid.test.tsx` was rescoped by the same slice.** It used to pay for roughly **1,575-button, 500ms-per-test
renders** when `Grid` rendered the whole tree itself.

## The split itself, measured

Split by `split-state-flow-article`, 2026-09-09. Re-derive rather than quoting these forward.

The byte and Vale rows were re-taken after the REVIEW pass, on the tree that pass produced. **The four
classifier rows predate it** and describe the tree as it stood at the final content commit, because the
classifier is not runnable from here. Read them as the shape of the split, not as a current reading.

| Measure                            | Before |  After |
| ---------------------------------- | -----: | -----: |
| Article bytes                      | 27,298 | 20,709 |
| Sidecar bytes                      |      — | 14,856 |
| Blocks in the article              |     21 |     70 |
| Rationale bytes inside the article |  3,149 |  9,142 |
| Entanglement                       |    67% |    76% |
| Backticked slice slugs             |      5 |      2 |
| Vale mechanical findings           |     67 |      0 |

**Read the rationale-bytes and entanglement rows with the confound `testing-layers.meta.md` records.**
A block-level classifier cannot compare a file against itself across a pass that changes paragraph
granularity, and mandate 6 changes it drastically. The byte count is the row that compares.

**This article entered at 67% entanglement, the lowest of any article split so far.** `engineering.md`
entered at 82%, `quality-tooling.md` at 87%, and `testing-layers.md` at 91%. The low figure is a property of
its shape: a few enormous bullets carry most of the prose, and a bullet that runs to 6,893 bytes reads as
one block whether or not its content is mixed. **Do not read a low entering entanglement as an easy split.**

**Per-module interface depth makes up 29% of the article, and it is scheduled to leave.** Measured
2026-09-09: 4,486 bytes across fourteen per-hook sub-bullets, plus 1,536 across four per-component bullets.
Those modules already carry their own JSDoc, so the article restates what a hover already gives a caller.
CLAUDE.md's routing branch 4 sends that content to JSDoc, or to a sidecar beside the source,
rather than to a shared article. **Ruled 2026-09-09 by the user**: land this split as it stands, then
migrate the module depth in its own slice, before `architecture.md` is split. **Done by
`migrate-module-depth`**, which took the article to 18,886 bytes and left five cross-module constraints
where fourteen per-hook bullets had been. Nothing in this sidecar moved with it, because this
file holds evidence rather than interface depth, so the table above still describes the tree its own caption
names. The hook block alone moved; the four per-component bullets below it are untouched.

**Two of the six drafted constraints failed the test the article states for them, and the REVIEW pass
resolved them differently.** `useGridPointerGestures.ts`'s rect-relative-pixels entry was cut: its hover
carries the rule _and_ the caller's half of it, so the entry was a second copy of a hover rather than
something no hover could hold. `useCellTiles.ts`'s entry was kept and rewritten, because its original
justification — "the guarantee is stated at the bottom of this section rather than in the hook" — was false;
the hook's hover does state reference-stability, and what no hover holds is `Grid.tsx` resting on it three
modules away. The general lesson is the one the rules already carry in the other direction: when a kept item
fails its own stated test, fix the item or the test, never soften the test to keep the item.

**The classifier is a reimplementation.** Calibrated against `engineering.md`, whose figures were recorded
three slices earlier, it reads 10,839 rationale bytes and 83% entanglement where that split recorded 12,457
and 91%. It is systematically low on both.
