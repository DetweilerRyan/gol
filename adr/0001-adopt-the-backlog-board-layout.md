# 0001. Adopt the backlog board layout

- **Status:** Accepted (not yet frozen)
- **Date:** 2026-09-16
- **Accepted:** 2026-09-16 by Ryan, per point, at the reevaluation of the
  `backlog-board-redesign` epic (its board file's git history carries every dated ruling)

## Context and problem statement

The idea board was two lanes of flat files, `ideas/candidates/` and `ideas/todo/`, with
promotion a file move and completion a deletion. Two problems, one measured and one stated.
Measured: artifacts a slice's phases produce had no home — a design conclusion was re-derived
four times by three roles because no later pass could read the first pass's reasoning, two of
the four being independent `architect` DESIGN rulings reaching the same conclusion. Stated: the
user disliked the lane names. The original 2026-08-24 proposal answered both by adopting the
`intent-driven` OpenSpec layout wholesale; the 2026-09-16 reevaluation re-judged that proposal
point by point against a tree three landed slices had changed under it.

## Decision drivers

- Durable homes for per-item artifacts (a design, a dispatch plan, a spike's findings), so a
  later pass verifies against a record rather than a memory.
- One slug as the item's identity end to end — board file, branch, `slice/` tag.
- Lane-as-directory with `ls` as the board; no gate, no board machinery in `scripts/`.
- Fail-safe interactions with the standing checkers (vitest collection, mutation-invariance,
  reference-check, Vale) rather than silent holes.
- Names that say what a thing is, in the Agile Alliance vocabulary the repo already prefers.

## Options considered

### The `intent-driven` OpenSpec layout (the original proposal) — declined

`openspec/` with `backlog/`, `changes/<slice>/` folders, and `specs/` capability directories.
Declined 2026-09-16: the recognizability case failed twice over — the `backlog/` lane was in
neither framework, and with the spec move declined the directory would have advertised a tool
this repo does not run and a spec format it does not contain. The distinctive elements worth
keeping (per-change design/tasks artifacts, scaled applicability, this ADR tier) survive
without the substrate.

### Capability spec directories (`specs/<capability>/`) — declined

Declined 2026-09-16: the three-file bundle a directory would have united died with
`delete-step-test-layer`; the live pairing was measured at 12 `.feature` ↔ 12 step modules,
1:1 by name, so colocation already read off the filenames. The shared layer (global step
registry, `features/screenplay/`, the barrel) resists per-capability grouping, and the
coupling bill had grown past the proposal's estimate via two checkers that post-dated it
(`mutation-invariance`, `reference-check`).

### `changes/archive/` for completed items — superseded

The original proposal adopted a dated archive. Superseded 2026-09-16 by `backlog/done/` as a
**retrospective queue**: a completed item's folder waits there until a periodic retrospective
extracts what the work can teach, then is deleted. The drift objection to an archive (an
ungated copy accretes and disagrees with what landed) dissolves because the lane is bounded
and emptied by its own process. The `slice/` tag stays the permanent completion record.

### `status:` in frontmatter, files never moving — rejected

The prevailing git-native-tracker convention. Rejected on the record when the board was
created, and re-confirmed by this decision: the directory is the status, one fact one home.
`kind:` is a different fact and is allowed in frontmatter.

## Decision

The three-lane `backlog/` board, as ruled per point at the reevaluation: `ideas/<name>.md`
(raw, flat), `ready/<name>/` (assessed against the definition of ready; a folder holding
`proposal.md` always and further artifacts scaled by kind), `done/<name>/` (completed,
awaiting retrospective). `kind: story | enabler | spike | epic` in frontmatter, ruled by the
assessment and written by the orchestrating seat, planning — never authorizing — the role
cycle. Promotion stays a move-only commit; completion becomes a `git mv` into `done/`. The
driver that settled it: every durable-artifact need is met without adopting a substrate whose
recognizability case had failed.

## Consequences

- Positive: a promoted item can carry its design and dispatch plan beside its proposal; the
  identity slug survives from idea file to tag; the board stayed gate-free.
- Negative: promotion renames every file to `proposal.md`, so a citation of a board file's
  old basename breaks at promotion — measured the day the migration landed, when three
  citations of a promoted file's name needed retargeting to the slice slug. Cite slugs, not
  board filenames.
- Negative: `done/` deletion waits on a retrospective whose trigger and owner were left
  unruled; until ruled, the lane only grows.
- Neutral: the landing migration (`slice/backlog-board-migration`, 2026-09-16) walked the
  checker chain — a fresh collection probe for `backlog/**`, the mutation-invariance
  allowlist, reference-check's scan scope, the Vale `Board` glob, the assessment hook's path
  filters.

## Verification

What would falsify this decision: `done/` accreting without retrospectives until it is the
archive this decision declined; the per-item artifacts going unused, leaving folders that are
flat files with extra path depth; or the kind-to-cycle mapping being treated as authorizing
skips without the per-diff demonstration. To revisit, measure lane sizes, artifact counts per
completed item, and whether any skip was granted on the label alone.

---

**A frozen `Accepted` ADR is immutable.** Correct one by writing a superseding ADR and
marking this one `Superseded by`, never by editing it. This record is `Accepted (not yet
frozen)`: the decision binds while the wording absorbs what adoption teaches. See `README.md`
for the four statuses and who freezes.
