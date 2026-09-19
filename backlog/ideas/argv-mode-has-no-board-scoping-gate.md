---
name: argv-mode-has-no-board-scoping-gate
title: Gate the board-shape hook's argv mode on the target being under backlog/
created: 2026-09-19
---

Recommended by `coach` in `amendment-1.md` on `the-board-hook-misfits-per-item-artifacts`,
2026-09-19, and carried forward at that slice's close as the fix for a second finding too.

## Situation

`scripts/board-shape-hook/` classifies a target positionally: an idea file is
`<lane>/<name>.md` or `<lane>/<item>/proposal.md`, and everything else under `backlog/` is
not a candidate. The program runs in two modes — a `--hook` mode fed by a PostToolUse
payload, and an argv mode taking a path or a board slug.

`run.ts` gates the hook mode on `isBoardPath` before resolving or reading, so an off-board
payload writes zero bytes on both streams.

## Complication

**The argv mode has no such gate, and the spec claimed it did.** `isCandidatePath` classifies
by segment count after an **attempted** `backlog/` strip, and `segmentsAfterRoot` leaves a
non-`backlog/` path's segments unchanged rather than establishing the target is board-scoped
at all. So a two-segment off-board path reads as a candidate: `src/camera.ts` reports
`6 checks, 5 findings`. One-segment and three-plus-segment off-board paths do refuse, which
is why it reads as working.

`coder` measured it rather than re-checking the claim, `coach` ruled it a false claim rather
than a defect, and amendment A1 withdrew the paragraph. **Nothing regressed** — those targets
read the same before the slice — and no path the hook can receive is misclassified.

**The obvious fix is measured worse, which is why this is its own item.** Adding
`if (!isBoardPath(target)) return false` to `isCandidatePath` strands the `^` anchor in
`segmentsAfterRoot`'s `replace(/^backlog\//, '')`: behind the guard, `zzbacklog/sub/foo.md` is
refused before the strip runs, the anchor becomes unreachable, and the mutant deleting it
survives — on a module scoring 99.33 against a `break: 95`. That trades a live, killed
invariant for a misuse case the hook cannot reach.

## Question

Where does the board gate go so the misuse case closes and the anchor stays reachable?

## Answer

Shaped by `coach`: **put the gate in `run.ts`'s argv branch, not in the pure module.**

`run.ts` is excluded from crap4ts, Stryker and dry4ts, so a guard there carries no mutants
and strands nothing. `board-shape.test.ts` calls `checkShape` directly, so every existing
test keeps reaching the anchor through the unguarded path, and the `zzbacklog` row keeps
killing its mutant.

**It resolves a second finding at the same time.** `editor` found that
`idea-assess/SKILL.md`'s stop condition says a `not a candidate` line means the target is a
per-item artifact, where argv mode also prints that line for off-board paths. With the gate
in place, the refusal line's domain narrows to exactly what the skill file already says, and
the wording becomes accurate without touching signed bytes.

## No-gos

- **Not a guard inside `isCandidatePath`.** That is the measured-worse option this item exists
  to reject.
- No change to the positional discriminator itself. The classification is correct for every
  path the hook can receive.

## Open questions

- Does the slug-resolution path need the same gate, or does resolving a bare slug against
  `backlog/ideas/` and `backlog/ready/` already establish board scope?
- What should an off-board argv target print — the same refusal line, or something that names
  the reason? The refusal line's text is currently shared with the per-item-artifact case,
  which is what made the `SKILL.md` wording imprecise.
- `run.ts` carries no mutants by design, so a guard there is unmeasured by the mutation gate.
  What test pins it — a spawn test in `run.test.ts`, which kills nothing but does pin the wire
  contract?
