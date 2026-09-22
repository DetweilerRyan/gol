---
name: vale-ini-does-not-reach-four-prose-surfaces
title: Extend .vale.ini's register sections to README, output-styles, perf and scripts
created: 2026-09-21
---

Found by `editor` AUDIT on `slice/a-reader-finds-a-sidecar-without-an-inventory` as that slice's
F5, and split out by `coach` REVIEW the same day. The slice fixed the **prose** half — its A3
narrows a claim that said the lint mechanics are the same for every sidecar. This is the
**config** half, which no process-enabler slice may touch: `.vale.ini` is `architect`'s alone.

## Situation

`.vale.ini` carries a register section per prose surface. Measured 2026-09-21: six surfaces have
one — `.claude/agents/**/*.md`, `.claude/skills/**/*.md`, `.claude/references/**/*.md`,
`CLAUDE.md`, `src/**/*.md` and `backlog/**/*.md`.

`[**/*.meta.md]` exempts every sidecar, on every surface, with no enumeration. So the exemption
half of the convention is universal and the lint half is not.

## Complication

**An instruction file outside those six surfaces has an unlinted instruction half**, while its
sidecar would be exempt wherever it sat. The convention reads as symmetric and is not.

**Measured 2026-09-21 on `main` at `e6899c9`.** The four surfaces this idea proposes hold three
tracked `.md` files between them:

| Surface                  | Tracked `.md`                                  |
| ------------------------ | ---------------------------------------------- |
| `README.md`              | itself                                         |
| `.claude/output-styles/` | `brief.md`                                     |
| `scripts/**/*.md`        | `board-shape-hook/board-shape.meta.md`, exempt |
| `perf/**/*.md`           | none                                           |

**So two of the four sections would be inert the day they land.** `scripts/**/*.md` reaches one
file that `[**/*.meta.md]` then exempts, and `perf/**/*.md` reaches nothing. An inert rule is a
hazard this repo names in two other checkers: `vale-fixture-check`'s check 5 exists because a
style wired into no section passes its other checks by being invisible to them, and
`ast-grep-rule-check` refuses a `files:` glob that resolves to nothing.

**The live near-instance is real rather than hypothetical.** `board-shape.meta.md`'s own header
calls itself the sidecar tier's first instance outside `src/`. Its instruction half is a JSDoc
hover, which `[*.{ts,tsx}]` does reach. A `<module>.md` calling half beside it would not be
reached by anything.

**The finding count is unmeasured, and measuring it is the first task rather than a precondition
someone else supplies.** `prose.md`'s landing constraint forbids enabling a rule over a backlog,
so the count decides whether this is one edit or an edit plus a remediation pass. The seat
attempted the count on 2026-09-21 with a relocated copy of `.vale.ini` and hit `E201` twice —
the config's `StylesPath` is relative, so a copy outside the repo root does not resolve. Whoever
takes this should probe in place rather than repeat that.

## Question

Which of the four surfaces should `.vale.ini` reach, and what does each cost in findings that
must be cleared or declined by name before the section can land?

## Answer

Shaped, not specified. Measure first, then enable — in that order, because `prose.md` forbids
enabling over a backlog.

Two surfaces have a live file and a real count to take: `README.md` and
`.claude/output-styles/brief.md`. Two have none today, and whether they are still worth declaring
is the open question below rather than a decision this file makes.

Where the count is too large to clear, the remedy is `.vale.ini`'s own: switch the offending rule
off by name in that section, with the reason recorded, rather than leaving the surface unlinted
altogether.

## No-gos

- **Not `adr/`. Ruled by the user 2026-09-21.** `adr/README.md` states that a frozen `Accepted`
  record is immutable and is corrected by writing a superseding ADR. A finding inside one could
  never be fixed in place, so the section would be a permanent backlog by construction — which is
  the exact state `prose.md`'s landing constraint exists to prevent.
- **No change to the prose that describes the mechanics.** That half landed with the parent slice
  as its A3, and this item neither restates nor revisits it.
- **No new rule and no new style.** The work is which surfaces an existing enabled set reaches.

## Open questions

- **Do `perf/**/*.md` and `scripts/**/*.md` get forward-declared sections despite matching nothing
  live today?** The precedent cuts both ways. `ast-grep-rule-check` carries a reason-required
  opt-out for a rule authored ahead of the file it scopes, so declaring ahead is a sanctioned
  practice when the reason is written down. Against that, an inert section is indistinguishable
  from a working one until the first file arrives.
- **Does `src/**/*.md` still describe where the module-sidecar tier has reached?** `prose.md`
  describes that scope as "the module sidecars beside the source", and the tier now has an
  instance under `scripts/`. Coupled to this work and possibly the same edit.
- **Is the count small enough to clear in the same slice as the enable?** Unmeasured. If it is
  not, this is an enable plus a remediation pass, and the remediation is prose work on surfaces
  that belong to nobody in particular.
