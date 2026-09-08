---
name: build-an-accessible-tooltip
title: Build the tooltip primitive this app has no source for
created: 2026-09-08
---

## Context

`ideas/candidates/pause-and-play-at-three-speeds.md` needs tooltips on four
icon-only buttons and files "tooltip mechanism" as an unresolved question. The
answer, researched 2026-09-08: **there is nothing to install or copy in, so the
app builds one or ships none.** Four measured findings, in the order they close
off options.

**1. Tailwind Plus does not ship a tooltip today.** `src/catalyst/` holds 27
vendored components and none is a tooltip (grepped 2026-09-08). Catalyst's own
launch material lists tooltips among components "to come, as Headless UI
evolves" — i.e. Catalyst is waiting on the same upstream this repo is.

**2. Headless UI has written one and released none.** The upstream repo carries
a complete implementation at `packages/@headlessui-react/src/components/tooltip/tooltip.tsx`
on `main` — `Tooltip` / `TooltipTrigger` / `TooltipPanel`, with show/hide delays,
a four-state visibility machine, and ARIA description wiring. It is even
**compiled into the published tarball**: `@headlessui/react@2.2.10` contains
`dist/components/tooltip/tooltip.js` and its `.d.ts`.

It is nonetheless **unreachable**. Measured on the installed 2.2.10:

| Check                                     | Result                                       |
| ----------------------------------------- | -------------------------------------------- |
| `dist/index.d.ts` / `index.js` mention it | no — zero occurrences of `tooltip`           |
| `package.json` `exports` subpaths         | none; only the root `.` condition            |
| Changelog, any version                    | never mentioned                              |
| Changelog `[Unreleased]`                  | "Nothing yet!"                               |
| Latest published version                  | 2.2.10, dated 2026-04-07 — the one installed |

So there is no import path, no deep-import escape hatch, and no announced
release. **"Wait for upstream" is a rejected option, not a deferred one** — but
it is worth watching: when it ships, Catalyst will presumably wrap it, and
whatever this slice builds should expect to be replaced rather than entrenched.

**3. Do not build on CSS anchor positioning.** A pile of 2026 blog posts declare
it "Baseline 2026" with 91% coverage and pronounce Floating UI obsolete. The
web-platform status API disagrees, queried 2026-09-08: `anchor-positioning` has
`baseline.status = "limited"` and an **empty** browser-implementations list —
no engine is recorded as having shipped the whole feature. Its sub-features
landed piecemeal and at different times per engine (`anchor-positioning-animations`
Chrome 125 / Safari 26; `anchor-positioning-position-visibility-plurals`
Firefox 147 / Safari 26.2; `anchor-positioning-transforms` Chrome 144 only),
which is precisely the fragmentation keeping the umbrella at `limited`. The
confident secondary sources were reading a sub-feature's version as the
feature's.

**4. The Popover API, by contrast, is real.** Same API: `baseline.status = "newly"`,
Baseline low date 2025-01-27, shipped Chrome 116, Firefox 125, Safari 17,
iOS Safari 18.3. Available — though whether this app _needs_ it is a separate
question (see below).

**The contract is WCAG 1.4.13 "Content on Hover or Focus" (AA)**, and it is what
actually rules out the cheap answer. Three clauses, each of which reads as a
scenario:

- **Dismissible** — `Escape` closes it without moving the pointer or focus.
- **Hoverable** — moving the pointer onto the tooltip does not close it.
- **Persistent** — it stays until dismissed, until the trigger is left, or until
  it stops being valid.

**Native `title` escapes 1.4.13 rather than satisfying it**, and getting this
backwards is easy: the SC explicitly exempts content controlled by the user
agent, and browser-built-in tooltips are its own named example. That is not a
defence of `title` — it still fails as a tooltip on its own demerits. It does
not appear on keyboard focus in most browsers, shows nothing on touch, times
out on the UA's schedule, and cannot be styled, so it cannot carry the
keybinding badges the playback buttons need.

**The clauses bind the moment the app draws its own hover content instead.**
That is what makes them this candidate's acceptance contract rather than a
stick to beat `title` with: choosing to build a tooltip is choosing to be in
scope for 1.4.13, where `title` never was.

## Sketch

`src/components/Tooltip.tsx` — **authored code inside every gate**, not
`src/catalyst/`. That directory is a vendoring boundary deliberately outside
crap4ts, Stryker and dry4ts; a component this repo writes and maintains belongs
where the gates reach it. (Vendoring a second directory would also mean three
new config exclusions.)

Shape, to be ratified by a design pass rather than settled here:

- **A trigger + panel pair**, the panel referenced by `aria-describedby` from the
  trigger. The tooltip is a **description, never a name** — the button keeps its
  braced sentence-case `aria-label`, so the accessible name is unchanged and
  `rules/no-unbraced-accessible-name.yml` still applies to the label rather than
  to the tooltip text.
- **The open/close machine may want to be a framework-free module** — hover
  intent, the show/hide delays, `Escape`, and the pointer-moved-onto-the-panel
  grace period are all arithmetic over elapsed time and events, which is the
  same argument `zoomGlide.ts`/`useZoomGlide.ts` already won. If it goes that
  way it inherits `rules/no-ambient-time-in-domain.yml`: time is an argument.
  Flagged as a design-pass question, not decided.
- **Read the upstream implementation as prior art — but not as a reference
  implementation of the contract above.** Headless UI is MIT (verified
  2026-09-08 against Headless UI's own `LICENSE` and the installed package's own
  `license` field), so its state machine may be studied or adapted with
  attribution rather than re-derived. What it is worth taking: the four-state
  machine (Hidden / Initiated / Visible / Hiding), the 750ms show and 300ms hide
  delays, the module-level singleton store that keeps at most one tooltip
  visible app-wide, and the `aria-describedby`-only-while-visible wiring.

  **What it does not appear to buy you is 1.4.13.** Read on the published 2.2.10
  build and confirmed against the `main` source, 2026-09-08: `TooltipPanel`
  carries **no pointer handlers at all** — only a ref, `role="tooltip"` and a
  style — so moving the pointer onto the panel does not hold it open, and the
  300ms hide delay is a grace period rather than the **hoverable** clause. And
  `Escape` is handled solely in the trigger's own `onKeyDown`, with no
  document-level listener, so a tooltip raised by hover while focus sits
  elsewhere has nothing to dismiss it — which reads as a **dismissible** gap
  too. Both readings are from code rather than from a browser; verify in one
  before treating them as settled, and note the whole component is unreleased,
  so it may simply not be finished.

**First consumers:** the four pause-and-play controls, plus the existing `+` and
`−` glyph buttons in `GridToolbar.tsx`, whose meaning is currently carried by
`aria-label` alone and is invisible to a sighted mouse user. That second set is
what makes this a primitive rather than a detail of one slice.

**Sequencing.** This is a dependency of
`ideas/candidates/pause-and-play-at-three-speeds.md`, not a part of it. Landing
it first gives that slice a primitive to consume; landing it after means that
slice ships tooltips twice. It is also perfectly viable **on its own** — the two
toolbar glyph buttons justify it without the playback work existing at all.

## Touches

`src/components/Tooltip.tsx` (new), possibly `src/tooltip.ts` (new, if the state
machine splits out), `src/components/GridToolbar.tsx`, a new `.feature` for the
1.4.13 contract plus its `features/steps/` module and `features/screenplay/`
reach, CLAUDE.md's component list, and
`.claude/agents/articles/architecture.md`.

Design-pass triggers hit: it creates a module (possibly two), and it may cross
the framework-free → component layering. Run `architect` DESIGN before `coder`.

## Open questions

- **Does this app need positioning logic at all?** The consumers sit in
  fixed overlay corners with no overflow clipping, so plain absolute positioning
  relative to the trigger may be sufficient and collision/flip logic may be
  imaginary work. Check the actual corners before reaching for anything.
- **Popover API, or a plain absolutely-positioned element?** The popover top
  layer solves stacking-context escape — a problem this app may not have, given
  the overlay siblings are already top-level. Earn it or skip it. **Upstream
  went neither way**: Headless UI's tooltip uses the Popover API nowhere
  (grepped, 2026-09-08 — no `popover` attribute, no `showPopover`/`hidePopover`)
  and instead portals the panel into `document.body` and positions it with the
  `@floating-ui/react` it already depends on. That is a data point rather than a
  precedent — Headless UI is a general-purpose library that must survive
  arbitrary host layouts, and this app is one page whose overlay corners are
  known.
- **Show and hide delay values**, and whether hover intent needs a movement
  threshold or just a timer.
- **The hoverable clause's geometry.** If there is a visual gap between trigger
  and panel, the pointer crosses dead space and the tooltip closes under it.
  Bridge with an invisible padding region, or leave no gap.
- **Touch.** There is no hover on touch, and a tooltip must therefore stay
  strictly supplementary — `aria-describedby` already reaches AT without any
  hover occurring. Decide whether touch shows it at all, or nothing.
- **Reduced motion** on the fade — `useReducedMotion` exists and `zoomGlide`
  honours it; a tooltip that appears instantly is arguably better for everyone.
- **How does `product` assert "persistent" black-box** without a wall-clock
  wait? Same flake concern the playback candidate raises.
- **Does the keybinding badge belong in the tooltip text too?** The playback
  buttons carry an `aria-hidden` key badge; repeating it in the description is
  either helpful redundancy or noise.
