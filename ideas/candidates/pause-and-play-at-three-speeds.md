---
name: pause-and-play-at-three-speeds
title: Let the board run itself — pause plus three play speeds, on buttons and on keys
created: 2026-09-08
---

## Context

The game only advances when someone presses `Next generation`. Conway's Life is a
_time_ medium — an oscillator that oscillates and a glider that glides are the
whole point, and stepping one generation per click hides both. This slice makes
the board run on its own: **pause**, and **three play speeds**, each reachable
from a button and from a key (`1` / `2` / `3` to play, `Space` to pause).

Two facts found while examining this, both of which shape the slice more than the
feature request does.

**1. It contradicts a landed contract, head-on.** `features/generation-control.feature`
is written (as of 2026-09-08) around the narrative _"I want the Next generation
control to be the only thing that advances the game / So that a keystroke meant
for something else never moves the board under me."_ Both of its scenarios are
about a keystroke **not** advancing the board. Auto-play plus global digit
shortcuts falsifies the As-a/So-that outright, and the two scenarios need
re-reading rather than deleting — "Enter advances nothing while the keyboard is on
nothing" is still a claim worth holding, but it now means _while paused_. This is
a `product` SPECIFY revision with an `architect` CONTRACT ruling on it, not a new
`.feature` bolted alongside.

**2. The generation counter is in the wrong place for a timer to reach it.**
`GenerationHud` holds `generation` in its own `useState` and increments it in the
same handler that calls `onAdvance` (as of 2026-09-08). Any playback loop that
calls `store.advance` from anywhere else advances the board and leaves the
displayed number frozen. The counter has to move — to `liveCellStore`, which is
the thing that knows an advance happened, or to lifted state — before a play loop
can exist at all. That relocation is behavior-preserving and testable on its own.

## Sketch

| Piece                            | Where                                        | Precedent to copy                                      |
| -------------------------------- | -------------------------------------------- | ------------------------------------------------------ |
| Playback state + tick arithmetic | `src/playback.ts` (framework-free)           | `src/zoomGlide.ts`                                     |
| The clock and the frame loop     | `src/hooks/usePlayback.ts`                   | `src/hooks/useZoomGlide.ts`, `useRafCoalescedPan.ts`   |
| Global `1`/`2`/`3`/`Space` keys  | window `keydown` in the playback hook        | `usePatternPlacement.ts`'s Escape listener             |
| Four icon buttons + kbd badges   | `GenerationHud` (or toolbar — see questions) | `GridToolbar.tsx`'s braced sentence-case `aria-label`s |
| Generation counter's new home    | `liveCellStore.ts` or lifted                 | —                                                      |

**`playback.ts` takes time as an argument, never reads it.** State is
`paused | playing at speed 1 | 2 | 3`; the exported arithmetic answers _"given a
playback state, a last-tick timestamp and `nowMs`, how many generations are
due?"_ — so the hook drives the clock and the module stays a pure function fully
reachable by property tests. `rules/no-ambient-time-in-domain.yml` enforces
exactly this, and names `zoomGlide.ts` as the shape to follow.

Returning generations-due as a **count** rather than a boolean matters at the top
speed: a backgrounded tab or a slow frame must not silently drop generations, and
"how many are due" is the one formulation that is testable without a real clock.

**Icons: `@heroicons/react` is already a dependency and is imported nowhere in
`src/` (measured 2026-09-08)** — this slice would be its first use, so it also
sets the precedent for how icons are sized, coloured in both schemes, and hidden
from AT (`aria-hidden`, with the button's own `aria-label` carrying the name).
Candidate glyphs: `PauseIcon`, then `PlayIcon` / `ForwardIcon` / a third that
reads faster still. Three plays must be distinguishable **as a rank**, not just
as three shapes.

**Keybinding badges are part of the button, not the tooltip** — the ask is
explicit that the buttons carry an icon and a key and no words. A small `kbd`-ish
element in the corner of each button, `aria-hidden` so the name stays
`Play at medium speed` rather than `Play at medium speed 2`.

**Tooltips describe; they never name.** `aria-describedby` to a rendered element,
so the accessible _name_ stays the sentence-case label and the tooltip text is the
description. No Catalyst or Headless UI tooltip primitive exists in this tree
(checked 2026-09-08) — see the open question.

**Ryan signs off the visuals before implementation.** Icon choice, badge
treatment, active-speed styling and placement are his call, taken on a rendered
screenshot rather than described in prose — a design step in the slice, ahead of
`coder`.

## Touches

`src/playback.ts` (new), `src/hooks/usePlayback.ts` (new), `src/liveCellStore.ts`,
`src/components/GenerationHud.tsx`, `src/App.tsx` or `LifeBoard.tsx` for the
wiring, `features/generation-control.feature` + `features/steps/generation-control.ts`,
`features/screenplay/` (new controls to reach), CLAUDE.md's module map and
accessible-name list, `.claude/agents/articles/architecture.md` and `state-flow.md`.

**This trips the design-pass triggers, on at least three counts** — it creates new
modules, it crosses the framework-free → hook → component layering, and it moves
state that a landed component currently owns. Run `architect` in DESIGN mode
before `coder`, and probably CONTRACT mode before that, since finding 1 is a
contract question rather than an implementation one.

Perf-relevant: at the top speed the board advances continuously, which is the
first sustained load this app has ever put on the render path. Worth an
orchestrator-run `npm run test:perf` + `npm run perf-report`.

## Open questions

- **What are the three speeds?** Needs concrete numbers (generations per second).
  Ranked how — linear, or roughly doubling?
- **Is `Space` pause-only, or a toggle?** The ask says pause. Pause-only is
  cleaner (`1`/`2`/`3` resume, so there is no ambiguity about _which_ speed a
  toggle resumes at), but a toggle is what most players' hands expect.
- **Shortcut vs. focused control — the precedence rule, and it is not one case
  but three.** `Space` natively activates a focused `<button>`, so `Space` on the
  focused `Next generation` control, or on a focused `Cell` (Enter/Space are that
  cell's own activation), would both fire the control _and_ pause. Digits are
  quieter but not silent: a window listener still hears `1` while the pattern
  library dialog is open, since Headless UI inerts `#root` and the dialog sits
  outside it. Decide once, for all shortcuts, and write it as a scenario.
- **Which speed reads as active?** Three play buttons imply a selected one —
  `aria-pressed`, a radio group, or a paint-only treatment. Not stated in the ask;
  needed before the a11y contract can be written.
- **What does `Next generation` do mid-play?** Step-and-pause is the conventional
  answer; a no-op and a step-without-pausing are both defensible.
- **Tooltip mechanism — now its own candidate**, since nothing exists to consume:
  see `ideas/candidates/build-an-accessible-tooltip.md`, which found that neither
  Catalyst nor any released Headless UI ships one. The decisive argument against
  native `title` turned out not to be styling but WCAG 1.4.13, which it fails on
  all three clauses. Landing that candidate first gives this slice a primitive;
  landing it after means building tooltips twice.
- **Where do four more buttons live?** The HUD already overlaps the row ruler —
  see `ideas/candidates/hud-panel-occludes-the-row-ruler.md` — and widening it makes that worse;
  the toolbar is the other corner and has its own ghosting problem recorded in
  the same file. Neither surface is currently a good host, so this may want that
  candidate resolved first.
- **How does `product` assert timed advancement black-box?** Wall-clock waits are
  the flake source this suite has avoided so far. Asserting _"advanced at all
  within N ms"_ plus _"the fast speed advances more in the same window than the
  slow one"_ may be the honest ceiling; a test-only clock hook would be more
  precise and more invasive.
- **Reduced motion.** `useReducedMotion` exists and `zoomGlide` honours it. Does a
  running simulation count as motion to suppress, or is it content?
