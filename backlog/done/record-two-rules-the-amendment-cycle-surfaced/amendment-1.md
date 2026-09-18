# Amendment 1 — 2026-09-18, the thread and the bare count

`coach` REVIEW, slice `record-two-rules-the-amendment-cycle-surfaced`, against tip `94caf45`.
**This amendment needs the user's re-sign-off before `writer` runs.**

Two items, both in files already in the manifest. No file is added.

**The verbatim blocks are fenced as `text`, not as `markdown`, for the reason `spec.md` states in
its preamble.** Each Find block starts and ends on a whole line of the target file. Both were
applied to the tree and reverted, so each anchor is known to match exactly once.

## Obligations disclosure, per the rule this slice just landed

A1 is live in `pipelines.md` as of `94caf45`, so it binds its own slice's first amendment.

- **E1 replaces no block.** It inserts a paragraph, so no obligation can leave through it.
- **E2 replaces a two-line block.** The block carries one obligation — read `prose.md`'s shapes
  under "How a pass damages the file it cleans" — and the replacement carries that same
  obligation. **What the replacement drops is the numeral `four`, and dropping it is the item.**
  Nothing else in the block moves.

## What this supersedes, and nothing else

| Spec item | Disposition                                                     |
| --------- | --------------------------------------------------------------- |
| C1        | One paragraph added at the head of the section it landed, by E1 |
| A1        | Two words removed from its replacement text, by E2              |

B1 and B2 stand untouched, as does the rest of A1 and C1. The live instruction set is `spec.md`
plus this amendment, read in that order.

## Part E — the items

### E1 — `.claude/agents/articles/prose.meta.md`, thread the two measurements

**Why.** `editor` AUDIT found that the sidecar already records this mechanism three days earlier,
under "The write-time hook's shape ruling (2026-09-15)", measured with a contraction-bearing
probe. That record closes with "The same hazard is worth knowing anywhere else Vale is ever handed
a path". C1 is the discharge of that anticipation and does not know it exists.

**An anticipation with no thread to its discharge is the future-tense form `claim-discipline.md`
names as rotting worst.** Nothing falsifies it: on the day the discharge lands, the sentence still
reads as an anticipation. The two measurements agree, so this is not a contradiction — the defect
is that a reader opening the sidecar to change item 12 finds two independent records and no thread,
and re-measures a third time or edits one of them alone.

**This is the running slice's own doing, which is what makes it an in-cycle fix rather than a
candidate.** C1 is my prose, and I wrote it without checking whether the sidecar already held the
mechanism. `handoffs.md` rules that case: prefer an in-cycle fix, the worktree is open.

**Find**, the section's heading and the line below it:

```text
## `vale` given an absolute path lints nothing (2026-09-18)

Measured on vale 3.20.0 in the `record-two-rules-the-amendment-cycle-surfaced` worktree, with
```

**Replace with:**

```text
## `vale` given an absolute path lints nothing (2026-09-18)

**This mechanism was measured once before, and this section discharges that record's own
anticipation.** "The write-time hook's shape ruling (2026-09-15)" measured it with a
contraction-bearing probe, and records that the hook relativizes a path before Vale runs. So
`prose.md`'s item 12 is reachable only by a hand-run. What this section adds is the file-count
discriminator and the subdirectory case.

Measured on vale 3.20.0 in the `record-two-rules-the-amendment-cycle-surfaced` worktree, with
```

**The 2026-09-15 record is not edited, and that direction was considered.** A forward pointer
added to it would be a retro-edit of a dated record, which this corpus does not do. The thread
runs from the new section to the old one, which is the direction that cannot rot.

**The head is the placement, not the tail.** A reader who reads the table and stops must still
learn that an earlier record exists.

**It carries `editor`'s live fact in one clause rather than as a second subject.** The hook
relativizes before Vale runs, so item 12 is reachable only by a hand-run. That bounds who the
entry is for, and B2 already instructs a hand-run correctly, so nothing in `prose.md` moves.

### E2 — `.claude/references/pipelines.md`, drop the bare count from A1

**Why.** A1 says "the four in `prose.md`". That is a count of another file's structure with no
enumeration beside it — `claim-discipline.md`'s silent-failure form, and the exact class
`backlog/ideas/apply-the-census-count-rule-everywhere.md` names. If `prose.md` grows a fifth
shape, A1 tells `coach` to check four and `coach` checks four. That is a silent under-check of the
obligation the rule exists to catch.

**The numeral is the only thing that can rot, and it buys nothing the pointer does not.** Closing
the list from `pipelines.md` was rejected: `coach` does not close another article's list. Restating
the shapes was rejected too, under `prose.md`'s rule against a restatement beside a pointer.

**Find:**

```text
and records each dropped obligation as restored or as ruled out. The shapes to look for are the
four in `prose.md`, under "How a pass damages the file it cleans".
```

**Replace with:**

```text
and records each dropped obligation as restored or as ruled out. The shapes to look for are in
`prose.md`, under "How a pass damages the file it cleans".
```

**E2 is separately declinable, and the cost of declining it is stated rather than hidden.** It is
one class removed from `editor`'s "arguable, raised not asserted" register by my ruling, not by a
new measurement. Sign E1 alone and E2 becomes either an accepted residue named in this file or an
instance on the census candidate. Neither is free: the numeral then sits in signed corpus text
that nothing re-checks.

## Expected readings, measured rather than predicted

Measured 2026-09-18 by applying E1 and E2 to the working tree at tip `94caf45`, reading, and
reverting. Every Vale reading was taken with a repo-relative path from the repo root.

| Check                                        | At tip `94caf45`                   | Measured with E1 and E2 applied        |
| -------------------------------------------- | ---------------------------------- | -------------------------------------- |
| `npm run reference-check`                    | 524 files, 3,156 refs, no failures | 524 files, **3,157** refs, no failures |
| `npm run agent-doc-check`                    | 54 docs, 8 agents, 31 rules, clean | unchanged, clean                       |
| `npm run prose-lint`, total findings         | 165                                | **165** — the items add none           |
| `vale .claude/references/pipelines.md`       | 0 warnings in 1 file               | 0 warnings in 1 file                   |
| `vale .claude/agents/articles/prose.meta.md` | 0 in 1 file, by exemption          | 0 in 1 file, by exemption              |
| `npx prettier --check` on the two files      | clean                              | clean, with no reflow                  |

**Read the `prose.meta.md` row as a confident zero.** E1's paragraph is exempt by `.vale.ini`'s
final `[**/*.meta.md]` section, so no rule sees it. The `in 1 file` count is what separates that
exemption from a run that reached no file, which is the distinction the section itself records.

## Stopping condition, falsifier and fallback

`pipelines.md` asks for these at a **second** amendment. They are stated here anyway, because the
preceding slice reached four rounds and this is the cheapest point to bound this one.

**Stopping condition, checkable by reading.** The sidecar's two records of the absolute-path
mechanism are threaded in one direction, from the newer to the older. No instruction in
`pipelines.md` or `prose.md` carries a bare count of another file's structure. Every obligation
`spec.md` carried is live in the corpus or named as ruled out here.

**Falsifier.** A third independent record of the same Vale mechanism, anywhere in the corpus. That
would mean the sidecar's growth is the defect rather than any missing pointer, and a pointer
between two of three records would make it worse.

**Fallback, decided now.** Do not write Amendment 2. Close the cycle with the residue named in the
REVIEW handoff, and recommend an `enabler-process` candidate that consolidates the sidecar's Vale
path-handling records in one pass.

## Findings ruled without repair

- **`testing-layers.meta.md`'s "it has grown twice".** The list has grown four times. Pre-existing,
  wrong before this slice touched anything, and the file is outside the manifest. **What made it
  visible:** this slice read that citation while ruling where to place item 12. Its load-bearing
  half is still correct and is the reason `spec.md` appended rather than inserted. **Disposition:
  an instance on `backlog/ideas/apply-the-census-count-rule-everywhere.md`**, whose Situation names
  "another article's structure" as exactly this class — no new board item. The fix there is to drop
  the numeral, never to change `twice` to `four`, which rots again on the next growth.

## Re-sign-off

The user signs this amendment before `writer` runs. The cycle then re-enters at step 2, scoped to
`.claude/agents/articles/prose.meta.md` and `.claude/references/pipelines.md`, and nothing else.
`editor` CLEAN runs over `writer`'s new manifest, and `coach` REVIEW closes against `spec.md` and
this amendment together.
