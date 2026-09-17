# Rationale: The merge protocol

**Audience:** whoever is changing a step in `merge-protocol.md`. **Read when:** amending,
narrowing, or overturning one — never in order to follow one.

## Extraction record

`extract-the-merge-protocol`, 2026-09-17. Before this slice, CLAUDE.md's `### Merge
protocol` section — the heading, the serial-landing paragraph, the nine numbered steps,
and the perf-ownership paragraphs — measured 18,657 bytes of CLAUDE.md's 89,387, 20.9
percent, measured on the commit `extract-the-merge-protocol` branched from. The body
moved to `.claude/references/merge-protocol.md` byte-for-byte, and `editor` AUDIT and
`coach` REVIEW each verified it that way: no word, emphasis, ordinal, or indentation
changed. `coach` REVIEW then found two referents the move had broken and ruled two
repairs, which are the only departures from the original bytes. Step 5's allowlist
paragraph read "It once lived in this file", where "this file" meant CLAUDE.md and now
named the wrong one; it names CLAUDE.md outright. Step 6 read `See "Idea board" above`,
pointing at a section this file does not have; it names CLAUDE.md's section. Both are
recorded here so a later diff against CLAUDE.md's history finds them accounted for
rather than unexplained. `.claude/references/merge-protocol.meta.md` — this file — was
created empty of moved prose; nothing in the moved block qualified as evidence rather
than instruction, so there was nothing to route here from the move itself.

## Placement ruling and its test

**A fact that binds before step 1 stays in CLAUDE.md; a fact that binds inside the
protocol moves.** The serial-landing rule binds before any merge starts — it decides how
many slices the seat runs concurrently — so it stayed. Everything from "Rebase, do not
merge" onward binds only once a merge is underway, so all of it moved.

The precedent is the mutation-invariance allowlist, which once lived in CLAUDE.md,
`mutation-testing.md`, and `hardener.md` at once and drifted apart across the three. A
single procedure restated in more than one file is the failure mode this placement
ruling exists to avoid, and this move keeps the protocol in exactly one place.

## Rejected alternatives

- **A bare pointer with nothing retained.** Rejected: the serial-landing rule binds
  while planning a slice, before any merge starts, so a reader who never opens the
  reference still needs it in CLAUDE.md.
- **Restating the step-3/step-5 `test:mutation:full` mandates in CLAUDE.md.** Rejected,
  on the three-file drift precedent above: a restatement is a second copy nothing
  compares, and it is exactly how the allowlist drifted the first time.
- **Splitting the clause-level reasoning into this sidecar in the same slice.** Deferred:
  a move plus a rewrite in one slice cannot be reviewed as a move, since a reviewer
  cannot tell which lines are relocation and which are edit.

## Known-stale window

Three files still name `CLAUDE.md` as the merge protocol's home, and
`extract-the-merge-protocol` did not repoint them:

- `vite.config.ts`'s path-allowlist comment
- `schemas/mutation-invariance.schema.json`, in two `description` strings
- `scripts/mutation-invariance/checks.ts`'s module header

All three sit outside the write boundary the spec set for `writer`, which named each by
path. That instruction is the boundary. All three are also on the mutation-invariance
**absent** list — `vite.config.ts`, `schemas/**` and `scripts/**` each appear there — so
editing any of them would have re-armed a full mutation run for a prose move. Read that
as a cost that argues for the boundary, never as the boundary itself: absent-list
membership constrains what a diff costs, not who may write a file. The retained
CLAUDE.md pointer keeps those three citations navigable — a reader following any of them
reaches CLAUDE.md, then `.claude/references/merge-protocol.md` one hop further. An
`enabler-technical` item is recommended to repoint the three directly.

## Check readings at landing

| Check                         | Reading                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wc -c CLAUDE.md`             | 72,607 bytes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `npm run reference-check`     | exit 0, 524 files scanned, 3,154 references found                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `npm run agent-doc-check`     | exit 0, 54 doc files, 8 agent files, 31 rules                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `npm run mutation-invariance` | exit 0, config valid, no `--diff` given                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `vale` on `CLAUDE.md`         | 26 findings before, 21 after. Seven left with the moved block. Two are new, both `STE.SentenceLength`: 34 words on the new reference-tier bullet, 28 words on routing branch 1. Two worsened: branch 1's `Procedure.ProcedureLength` 68 → 116 words, and the `backlog/ready/` bullet's `STE.SentenceLength` 26 → 31. `coach` REVIEW accepted all four, since every sibling bullet and every sibling routing branch already carries the identical finding. The spec's table predicted 19 and 0 new; that prediction was wrong |
| `vale` on `merge-protocol.md` | 7 findings — 6 `Procedure.ProcedureLength`, 1 `STE.SentenceLength`. All seven are the CLAUDE.md findings the move carried over, verified as the same seven by message                                                                                                                                                                                                                                                                                                                                                        |
| `vale` on this sidecar        | 0 — exempt by `.vale.ini`'s final `[**/*.meta.md]` section                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `npm run prose-lint`          | 498 tracked files linted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

**Re-measure the reference count after any edit to this table, and do not carry the
figure above across one.** The count moves when a row gains or loses a token shaped like
a file name, and every row here that reports a per-file reading carries one by
construction. So the row recording the count can falsify itself, and in this slice it did
so twice. The first time, `editor` landed a cleaning pass after `writer` had measured. The
second time, the two per-file Vale rows were added after the measurement and moved the
table's own token count by one. That second miss was diagnosed at the time as the config
file name in the exemption row; it was not. That name ends in an extension the checker
never scans, and the glob beside it is discarded for holding a wildcard. The correction
changed digits alone, which is the only edit to this table that provably adds no token.
