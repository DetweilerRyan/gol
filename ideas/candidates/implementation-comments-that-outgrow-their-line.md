---
name: implementation-comments-that-outgrow-their-line
title: Move implementation comments that do not need their line into <module>.rationale.md
created: 2026-09-09
---

## Situation

`migrate-architecture-depth` made the per-module sidecar a **pair**, split by filename:
`<module>.md` holds interface depth for whoever is calling, `<module>.rationale.md` holds
measurements, rejected alternatives and corrections for whoever is changing. CLAUDE.md branch 4
and `doc-comments.md` rule 7 define it.

That rollout has so far only moved prose **out of the shared articles**. It has not looked at the
`//` comments already sitting inside the modules — and that is where most of the volume is.

**Measured 2026-09-09 on `migrate-architecture-depth`, over `src/` minus `catalyst/`,
`test-support/` and test files: 39 files carry a `//` block of six lines or more, holding 1,625
comment lines between them.** The heaviest:

| Lines in 6+ blocks | Longest single block | File                        |
| ------------------ | -------------------- | --------------------------- |
| 233                | 91                   | `src/cellTiles.ts`          |
| 208                | 52 (13 blocks)       | `src/components/Grid.tsx`   |
| 91                 | 31                   | `src/liveCellStore.ts`      |
| 80                 | 32                   | `src/components/Cell.tsx`   |
| 73                 | 49                   | `src/hooks/useGridFocus.ts` |
| 73                 | 29                   | `src/zoomGlide.ts`          |
| 39                 | 39 (one block)       | `src/hooks/useCellTiles.ts` |

`cellTiles.ts`'s 91-line block explains **two** lines of code, and its tail is a benchmark with a
viewport size and an accepted-not-fixed ruling. That is evidence by CLAUDE.md branch 5's own test,
one tier down from where branch 5 operates.

## Complication

**Moving a comment out of source removes information from the point of edit, and nothing checks a
sidecar's contents.** Re-probed 2026-09-09: a made-up `.ts` token planted inside a module sidecar
left `npm run reference-check` green. So this trades edit-time discoverability for readability, and
the trade is only worth making if the stub pays it back.

**The unit of decision is the paragraph, not the block.** That same 91-line block also says _"see
`EVICT_LAG_TILES`' header"_ and cites `tileRangeHolds`' asymmetry note. Those are
colocation-dependent and must stay. A block-level move would take them with it and break both.

**A wrong move is silent.** A comment relocated away from the line it protected leaves no trace at
that line, so the next person to edit there simply does not learn the constraint existed. Unlike the
article splits, there is no Vale count and no gate that moves.

## Question

Which implementation comments genuinely do not benefit from sitting on their line, and how does a
reader decide without re-litigating it per comment?

## Answer

**Encode the test in `doc-comments.md`, then apply it. The doc change is part of this slice, not a
follow-up** — the rollout has already shown that a convention applied before it is written gets
re-derived differently by the next reader.

Proposed test, to be ratified by `architect` before any comment moves:

**Stays at the line if ANY of these hold:**

1. It explains a specific token or expression nearby — "the `- 1` is because the range is inclusive"
2. It warns against an edit at that spot — "do not reorder these two, pointer capture releases first"
3. It is shorter than the code it explains, and so is colocated by construction

**Moves to `<module>.rationale.md` if:**

1. It argues a module-wide decision that no single line owns
2. It records a measurement, a benchmark, a fuzzing run, or a rejected alternative
3. It is longer than the code it explains — colocation is already lost, since the reader scrolls
   past the argument to reach the code

Test 3 is the mechanical half and is what would have caught `cellTiles.ts` with no judgment
exercised.

**The stub is mandatory and must state the constraint, not point at it.** `cache.ts` set the
precedent: it names the ruling ("Deliberately MUTABLE ... a performance ruling rather than an
oversight") and then cites the file. A bare "see the sidecar" reads as optional and stops nobody.
A move without a constraint-stating stub is a net loss and should fail review.

**Stage it.** Rank by comment-lines-per-line-of-code-explained and take the heaviest few first,
rather than sweeping 39 files in one diff.

## Touches

- `.claude/agents/articles/doc-comments.md` — rule 7 gains the stay/move test and the stub rule.
  **This is the deliverable that outlives the slice**; the relocations are its first application.
- `CLAUDE.md` branch 4 — one clause, only if the test changes what branch 4 already says
- `src/` modules in the table above, plus their new `<module>.rationale.md` files
- Comment-only edits throughout, so no mutant is created or re-fated. Confirm per diff that no
  **directive** comment moved, since that carve-out is what makes the ruling per-diff rather than
  per-path.

Sizeable enough for an `architect` DESIGN pass: it crosses many modules, and the test itself is the
artifact worth ratifying before code moves.

## Open questions

- **Is test 3 mechanisable?** `module-depth-as-a-token-ratio` already found that comments dominate
  the implementation-to-`.d.ts` ratio, and already established that declaration-only emit is free.
  A checker reporting "comment block longer than the code it explains" may fall out of that work
  nearly for nothing. Decide whether these are one slice or two.
- **Does a moved comment need a back-reference?** The sidecar can cite the function it came from,
  but `reference-check` bans a `<file>:NN` and does not scan sidecar contents, so nothing would keep
  it honest.
- **What happens to comments in components?** `Grid.tsx` carries 208 lines across 13 blocks, but it
  is a composition root excluded from `crap4ts` and Stryker. Does the component tier get sidecars at
  all, or does its depth belong somewhere else?
- **Does this reach `scripts/`?** The census above covers `src/` only. `scripts/` is held to the same
  standards and was not measured.
