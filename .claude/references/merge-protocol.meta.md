# Rationale: The merge protocol

**Audience:** whoever is changing a step in `merge-protocol.md`. **Read when:** amending,
narrowing, or overturning one — never in order to follow one.

## Extraction record

`extract-the-merge-protocol`, 2026-09-17. Before this slice, CLAUDE.md's `### Merge
protocol` section — the heading, the serial-landing paragraph, the nine numbered steps,
and the perf-ownership paragraphs — measured 18,657 bytes of CLAUDE.md's 89,387, 20.9
percent, measured on this branch's starting commit. The body moved to
`.claude/references/merge-protocol.md` byte-for-byte: no word, emphasis, ordinal, or
indentation changed. `.claude/references/merge-protocol.meta.md` — this file — was
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

Three files still name `CLAUDE.md` as the merge protocol's home, and this slice did not
repoint them:

- `vite.config.ts`'s path-allowlist comment
- `schemas/mutation-invariance.schema.json`, in two `description` strings
- `scripts/mutation-invariance/checks.ts`'s module header

All three sit outside this role's write boundary (`vite.config.ts` and `scripts/` are
named exclusions; the schema is on the mutation-invariance absent list for an unrelated
reason). The retained CLAUDE.md pointer keeps those three citations navigable — a reader
following any of them reaches CLAUDE.md, then `.claude/references/merge-protocol.md` one
hop further. An `enabler-technical` item is recommended to repoint the three directly.

## Check readings at landing

| Check                         | Reading                                                                                                                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wc -c CLAUDE.md`             | 72,358 bytes                                                                                                                                                                             |
| `npm run reference-check`     | exit 0, 524 files scanned, 3,144 references found                                                                                                                                        |
| `npm run agent-doc-check`     | exit 0, 54 doc files, 8 agent files, 31 rules                                                                                                                                            |
| `npm run mutation-invariance` | exit 0, config valid, no `--diff` given                                                                                                                                                  |
| `npm run prose-lint`          | 498 tracked files linted; findings on `merge-protocol.md` are the pre-existing ones the byte-for-byte move carried over from CLAUDE.md, verified line-for-line against the pre-move file |
