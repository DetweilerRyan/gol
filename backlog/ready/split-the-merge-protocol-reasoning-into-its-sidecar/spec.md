---
name: spec
title: Spec — split merge-protocol.md's clause-level reasoning into its evidence sidecar
created: 2026-09-18
---

# Spec: split the merge protocol's reasoning into its sidecar

**Slice:** `split-the-merge-protocol-reasoning-into-its-sidecar`
**Kind:** `enabler-process` · **Author:** `coach` SPEC, 2026-09-18 · **Executes:** `writer`

Three files change. Nothing else in the tree moves.

| File                                        | Change                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `.claude/references/merge-protocol.md`      | Whole-file replacement — the register split, given verbatim as item M0     |
| `.claude/references/merge-protocol.meta.md` | Four new sections, one appended bullet, three in-place fixes — items S1–S9 |
| `CLAUDE.md`                                 | One sentence on the `merge-protocol` routing bullet — item C1              |

---

## Part 0 — the rulings that bind every item

Read these before executing any item. They are what `coach` REVIEW will check the landed
corpus against.

**R-A. The cut is instruction against explanation, per `prose.md`'s "Instruction stays.
Explanation moves."** A sentence stays when it says what to do, what not to do, when, or under
what precondition. It moves when it says why the rule is shaped that way and the reader's next
action is the same either way. The four exempt classes — a trigger or failure mode, a caveat or
closed decision, a named wrong answer, a dated record a live claim rests on — stay.

**R-B. No step's instruction changes, and no step is renumbered.** Both are the proposal's
No-gos. Steps stay 1 through 9. Every word that instructs stays in
`merge-protocol.md`; it may change position within the step, never disappear from it.

**R-C. Moved prose moves verbatim, except where the move strands a referent.** Every rewrite is
named in the move table (Part 1) with the reason. `writer` makes no rewrite the table does not
name. This is the extraction record's own two-repair precedent, applied again.

**R-D. Sweep every moved and every surviving block for stranded referents.** After each move,
re-read the sentences that survive around the gap and check every `this file`, `here`, `above`,
`below`, `it`, `that` and quoted section name still has its referent. The table already names
the ones found at spec time; a further one found during execution goes back to `coach` as a
finding, per `writer.md`'s no-improvise boundary.

**R-E. The numbered line carries the action; its qualifiers go to an indented continuation
paragraph under the same number.** `Procedure.ProcedureLength` reads only a line matching
`^[0-9]+\.\s` and counts space-separated tokens on that line, marker included. Steps 3, 5 and 8
keep every instructing word, relocated below the marker. **This clears a Vale finding without
moving a word to the sidecar, so it is not a register improvement and Part 3 records it
separately.** It is the spec's one open question — see Part 5.

**R-F. The sidecar's check-readings table is protected, and its own rule binds this slice.**
`merge-protocol.meta.md` records that a row reporting a per-file reading carries a
filename-shaped token by construction, so the row recording the reference count can falsify
itself. Item S9 mandates the two-commit sequence that rule implies.

**R-G. Do not touch two fragile constructions.**

- `merge-protocol.md`'s carve-out paragraph writes `` `reference-check:` `` as two adjacent code
  spans. Written contiguously it reads as a live tokenless marker and the checker reports itself
  as stale. That paragraph stays in the instruction half, byte-for-byte.
- The `<!-- reference-check: allow latest.md -- ... -->` marker and the
  `reports/perf/latest.md` mention it excuses stay in the same file, both in the perf section.
  Separating them makes the marker stale, which is a `reference-check` failure in its own right.

---

## Part 1 — `.claude/references/merge-protocol.md`

### The move table

Every passage leaving the instruction half, and where it lands. The destination names the
sidecar section item S2 or S3 creates.

| #   | Passage leaving `merge-protocol.md`                                                                                                           | Disposition                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | Step 1: "This keeps `main` linear, which is what `workflow.md`'s … in order."                                                                 | → S2, "Step 1"                                                   |
| 2   | Step 2: "— it has the context the orchestrator does not"                                                                                      | → S2, "Step 2". Rewritten to a standalone sentence               |
| 3   | Step 3: "The rebase brought in another slice's moved … cannot survive."                                                                       | → S2, "Step 3"                                                   |
| 4   | Step 4: "`--ff-only` is the assertion that step 1 actually happened."                                                                         | → S2, "Step 4". Rewritten: subject becomes "It"                  |
| 5   | Step 5: "step 3 ran against a different Stryker cache … the next merge can trust."                                                            | → S2, "Step 5 — why the gate runs again"                         |
| 6   | Step 5: "Deleting the cache is the honest expression of intent … already names."                                                              | → S2, "Step 5 — why the cache is deleted"                        |
| 7   | Step 5: "**One path, not two, and that is deliberate.**"                                                                                      | **Deleted** — restates the obligation that survives              |
| 8   | Step 5: "`npm run test:mutation:scripts` passes no `--incremental` … of that."                                                                | → S2, "Step 5 — why only one `rm -f` path"                       |
| 9   | Step 5: "Steps 3 and 5 both mandate … could kill one is reachable."                                                                           | → S3, "Why the exemption exists". `the paths below` → the config |
| 10  | Step 5: "Left unaddressed this is not merely a cost … serial-landing rule is for."                                                            | → S3, "Why the exemption exists", second paragraph               |
| 11  | Step 5: "`stryker.scripts.config.json` carries no `ignorePatterns` … `:scripts`."                                                             | → S3, "Why the predicate is stated over the `src/` run"          |
| 12  | Step 5: "That direction is the whole design … An allowlist fails safe:"                                                                       | → S3, "Why an allowlist rather than a blocklist"                 |
| 13  | Step 5: "It once lived in CLAUDE.md, in `mutation-testing.md` … drifted apart."                                                               | → S3, "Why the list is not restated"                             |
| 14  | Step 5: "Without those two entries, the first slice … granting itself an exemption."                                                          | → S3, "Why this gate's own config is absent"                     |
| 15  | Step 5: "and that is a ruling with an argument rather than an intuition" + "Stryker's mutators operate on AST nodes … re-fates none."         | → S3, "Why a comment-only edit … cannot move the score"          |
| 16  | Step 5: "because the old argument here died … on a `features/`-only diff."                                                                    | → S3, "Why the surviving-stage list had to be re-derived"        |
| 17  | Step 5: "`delete-step-test-layer` removed that project … anything in that directory"                                                          | → S3, same section                                               |
| 18  | Step 5: "Note this does not weaken the exemption … the sentence this replaces implied."                                                       | → S3, same section, second paragraph                             |
| 19  | Step 5: "Step 4 is a fast-forward … There is no second diff worth taking, and"                                                                | → S3, "Why the predicate is computed once"                       |
| 20  | Step 5: "The `rm -f` above exists because … no longer exists." + line 69 whole                                                                | → S3, "Why the cache survives a skipped stage 5"                 |
| 21  | Step 5: "`backlog/`, `.claude/` and `CLAUDE.md` are tracked … exactly the wrong logic."                                                       | → S3, "Why the claim is worded …"                                |
| 22  | Step 5: "The rule is deliberately asymmetric … one mutation run." + line 75 whole                                                             | → S3, "Why `hardener` may refuse … never grant"                  |
| 23  | Step 5: "which is the same property that makes wrongly granting an exemption dangerous" + "A written record is not a score … the actual gap." | → S3, "Why a skip has to be recorded"                            |
| 24  | Step 5: the three middle-option paragraphs, and "and know which option was not taken"                                                         | → S4, a new `Rejected alternatives` bullet                       |
| 25  | Step 5: "This is not hypothetical, and"                                                                                                       | **Deleted** — rhetoric, no instruction and no evidence           |
| 26  | Step 5: "**Stage 6 was the example …** … repaired by `the-invariance-allowlist-…`."                                                           | → S3, final entry. `the paragraph above` → names the file        |
| 27  | Step 5: "Read this as a caution about examples in this clause."                                                                               | **Deleted** — restates "the rule is what binds"                  |
| 28  | Step 5: "It is written as a self-revocation … anything phrased as an exception to it loses."                                                  | → S3, "Why the clause is written as a self-revocation"           |
| 29  | Step 6: "After the fast-forward in step 4 the slice's tip _is_ `main`'s tip, so this marks both."                                             | → S2, "Step 6"                                                   |
| 30  | Step 7: "This repo sets `push.followTags = true` locally … will not have the setting."                                                        | → S2, "Step 7". Survivor gains its own subject                   |
| 31  | Step 8: "— it comes from there now rather than from `hardener`'s" + "and says why in the same breath: …"                                      | → S2, "Step 8 — where the figure comes from"                     |
| 32  | Step 8: "Those are the two inputs since `acceptance-mutation-on-playwright` … that layer at all."                                             | → S2, "Step 8 — the runner's two inputs"                         |
| 33  | Step 9: "The check above asserts the condition you actually care about … assertion has passed."                                               | → S2, "Step 9"                                                   |
| 34  | Perf: "Render performance is meant to be held by the architecture … as a test result."                                                        | → S2, "The perf harness"                                         |
| 35  | Perf: "It already owns exactly that sequence, and already knows when to reach for `test:mutation:full`."                                      | → S2, "The perf harness", same entry                             |

### The two pre-existing stranded referents, repaired here

Both predate this slice; `extract-the-merge-protocol` carried them over from CLAUDE.md. They are
repaired on that slice's own two-repair precedent, and recorded in item S1.

- **"read every entry below"** — the allowlist is not below and never was, because the same
  clause says the list is not restated there. It becomes "read every entry in
  `mutation-invariance.config.json`".
- **"a diff confined to the paths below"** — that sentence moves to the sidecar (row 9), where it
  names the config rather than a position.

### Four survivor rewrites, each forced by a move

`writer` makes these and no others.

| Survivor                             | Before                                             | After                                                                                           |
| ------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Step 5, the not-a-fast-path caveat   | "It is still not a fast path through the gate."    | "**The exemption is still not a fast path through the gate.**" — `It` lost its referent         |
| Step 5, the compute-once instruction | "reconstructing one from `main`'s reflog"          | "Reconstructing a second diff from `main`'s reflog" — `one` lost its referent                   |
| Step 5, the skipped-cache claim      | "differs from the one it was built from"           | "differs from the tree the cache was built from" — `the one` lost its referent                  |
| Step 7, the annotated-tag caveat     | "Note the setting only follows **annotated** tags" | "Note that `push.followTags` only follows **annotated** tags" — `the setting` lost its referent |

### Three closed decisions retained in compressed form

`prose.md`'s disposition 2 — keep the decision, move the argument that reached it. Each is
authored text, given verbatim in M0.

- Step 5, the middle option: one sentence retained, three paragraphs moved (row 24).
- Step 5, the stage-6 example: "**The rule is what binds, never an example.** An example a later
  slice can falsify is what produced the defect this clause used to carry." (rows 26, 27).
- Step 5, the single `rm -f` path: the conditional obligation retained, the account moved
  (rows 7, 8).

### One sentence split, not moved

Step 6's 37-word idea-board sentence becomes two sentences. **Every word is kept.** This is the
only edit that clears the `STE.SentenceLength` finding, and it moves nothing to the sidecar.
The clause is a restatement of CLAUDE.md's "Idea board" rule; **this spec deliberately does not
delete it**, because R-B forbids removing an instruction from a step. See Part 6.

### Item M0 — the replacement body

Replace the whole of `.claude/references/merge-protocol.md` with the block below. Lines 1
through 8 are unchanged and are reproduced so the file can be written in one action.

````markdown
# The merge protocol: landing a slice on `main`

**Audience:** the orchestrating seat, which runs every step. `hardener` reads step 5's exemption
clause when an invoking prompt names it. **Read when:** before landing a slice — at step 1, rather
than part-way through a merge.

CLAUDE.md's "Running slices concurrently" carries the serial-landing rule and the worktree isolation
this protocol assumes. Read that section first; nothing here repeats it.

## The protocol

1. **Rebase, do not merge.** In the slice's worktree: `git fetch && git rebase main`.
2. **The slice's own session resolves its own conflicts**, in its own worktree. `main` never enters a conflicted state.
3. **Re-run the gate on the rebased branch, still in the worktree.** Invoke `hardener` again.

   It must use `npm run test:mutation:full`. **The one exception: if the merge is mutation-invariant, stage 5 does not run at all.** See the clause under step 5, and evaluate its predicate here, at this step.

   Pay attention to `npm run ast-grep:rules` here specifically. It is the gate most likely to have been broken by the _other_ slice's renames invalidating a `files:` glob. Post-rebase, that breakage is legitimately yours.

4. **Fast-forward `main`:** `git checkout main && git merge --ff-only <slice>` from the primary checkout.
5. **Run the full gate on `main`.** Mandatory, even though step 3 just passed on an identical tree.

   **The one exception: if this is a mutation-invariant merge, skip the deletion below entirely.** Read the clause below before running it:

   ```bash
   rm -f reports/stryker-incremental.json
   ```

   then invoke `hardener` on `main` with the whole tree as its scope.

   **Adding `--incremental` to `npm run test:mutation:scripts` re-arms this deletion**, so a slice that adds it must put the second path back here.

   **Mutation-invariant merges — the one exemption, and it is stage 5 only.**

   **The predicate quantifies over `npm run test:mutation`, the `src/` run, and that scope is load-bearing rather than incidental.** Nobody has ruled on whether the whole-tree gate at step 5 includes `npm run test:mutation:scripts`. Until someone does, **read every entry in `mutation-invariance.config.json` as argued for the `src/` run only**, and treat `features/**` under the `scripts/` run as unverified rather than safe.

   **The predicate is an allowlist of paths that cannot move the score, not a list of the paths that can.** An unanticipated path simply runs the gate.

   **The predicate is computed, not recalled.** The allowlist lives in `mutation-invariance.config.json`, and `npm run mutation-invariance` evaluates it. Run it in the slice's worktree, after step 1's rebase:

   ```bash
   npm run mutation-invariance -- --diff main...HEAD
   ```

   Exit **0** means the diff is mutation-invariant. Exit **2** means it is not, and the output names the first disqualifying path. Exit **1** means the config itself failed validation, so **no verdict was computed** — read that as "run stage 5", never as a pass. Redirect to a file and read `$?` on the next line. A pipe replaces the exit status with the pipe's own.

   **The list is not restated here, and that is deliberate.** Each entry's argument lives in `.claude/agents/articles/mutation-testing.meta.md`, which the checker binds to the config: its check C4 fails when a config path has no prose there. So add an entry by editing the config and writing its argument, never by editing prose alone. **Adding a path requires the argument, not the intuition.** The failure mode of a wrong entry is a skipped stage that reads exactly like a passing one.

   **`mutation-invariance.config.json` and `schemas/**` are themselves on the absent list.** A diff that widens the allowlist therefore re-arms the full run in that same diff.

   **A comment-only edit under `src/` cannot move the mutation score.** Ruled 2026-09-09 by the user. **This is not an allowlist entry.** `src/**` stays off the list, and the exemption is claimed per diff, by demonstrating the diff is comment-only rather than by matching a path.

   **One carve-out, and it is why the demonstration has to be per diff.** A comment carrying a _directive_ is not inert. `// prettier-ignore`, `@ts-expect-error`, an `eslint-disable`, and this repo's own `` `reference-check:` `` and `# ast-grep-rule-check:` markers all change what a tool does. Any of those re-arms the full run. So show the diff contains no such line before claiming this, the same way the path predicate is computed rather than recalled.

   **Every other stage still runs — but re-derive which of them can actually move.**

   A `features/`-only diff moves neither `crap4ts` nor `dry4ts`, which scores `src` alone. What still moves on such a diff is **`npm run build`**: `tsconfig.app.json`'s `include` is `["src", "features", "perf"]`, so a type error there fails stage 1. For the `.claude/**` and `CLAUDE.md` entries, **`npm run agent-doc-check`** moves too.

   **That list is per-entry, not universal, so re-derive it for the entry you are exempting.** A `rules/**` or `rule-tests/**`-only diff moves a different set. `build` is not among them, since `tsconfig.app.json`'s `include` names neither directory. **Stage 2, `npm run reference-check`, does move**, because a deleted rule file breaks any doc line citing its filename. So does **stage 8, `npm run agent-doc-check`**, whose check 5 reads the live `rules/` listing against `.claude/agents/articles/ast-grep-rules.md`.

   **The exemption is still not a fast path through the gate.**

   **Compute the predicate once, in step 3's worktree after the rebase, and carry the answer to step 5.** Reconstructing a second diff from `main`'s reflog is a worse way to ask the same question.

   **When stage 5 is skipped, step 5 does not delete the incremental cache.** Under this predicate **no mutated file and no collected test differs** from the tree the cache was built from.

   State it that way, and not as "the tree Stryker sees is byte-identical". That stronger claim is literally false, and false in the dangerous direction.

   **`hardener` may refuse an exemption; it may never grant itself one.**

   So the orchestrating session evaluates the predicate and hands it to `hardener` in the invoking prompt, naming the diff it was computed over. Absent that instruction, `hardener` runs stage 5, full stop. But `hardener` **may** check the handed-down claim against `git diff --name-only`, and **must** run stage 5 anyway if it can falsify it. A verification that comes back "invariant" grants nothing on its own; only the instruction does.

   **Record every skip.** A skipped stage produces no artifact. So `hardener`'s handoff must name the skip, the instruction it was handed, and the diff that instruction covered, and this merge carries that forward.

   **The middle option — a plain `npm run test:mutation` in place of the skip — was considered and is not what this clause does.** Do not reopen it here. It changes what the gate measures, so it is a slice of its own.

   **The exemption is self-revoking.** If `hardener`'s own remediation at any stage writes a file outside the allowlist, the exemption is void from that point and stage 5 runs.

   **The trigger is stage 1.** `tsconfig.app.json`'s `include` is `["src", "features", "perf"]`, so a type error a `features/`-only diff introduces is a real `npm run build` failure, and its fix can reach `src/`. That adds a file Stryker mutates, _after_ the stage that would have measured it was skipped.

   **The rule is what binds, never an example.** An example a later slice can falsify is what produced the defect this clause used to carry.

   Stage 8, `npm run agent-doc-check`, is not a replacement trigger. It moves on the doc entries, but its remediation is prose and cannot reach `src/`. See `.claude/agents/hardener.md`'s stage 5.

6. **Tag the slice's final commit**, annotated, as `slice/<slice-name>`:

   ```bash
   git tag -a slice/<slice> -m "<slice>: <one line on what the slice delivered>"
   ```

   Tag after step 5 rather than before it. The tag says the slice is done, and it is not done until the gate on `main` passes.

   The `slice/` prefix is load-bearing. A bare tag sharing the slice branch's name makes every `git log <name>` ambiguous until the branch is deleted in step 9. It also makes `git tag -l 'slice/*'` a list of every completed slice. Annotated rather than lightweight, so the tag carries its own date and message.

   If the slice began as an entry on the idea board, its folder already sits at `backlog/done/<slice>/` by now. The slice moves it there as its final commit, before step 3's gate, and the retrospective deletes it later. See CLAUDE.md's "Idea board". This tag is the permanent completion record either way.

7. **Push `main` and the tag:** `git push --follow-tags` (plain `git push` leaves the tag behind).

   Note that `push.followTags` only follows **annotated** tags reachable from what you are pushing. A lightweight tag is silently left behind, which is one more reason step 6 specifies `git tag -a`.

8. **Carry the acceptance-mutation figure forward** from `product`'s VERIFY handoff. This is a read, not an edit.

   `engineering.md` records **no literal**, so there is nothing in that file to re-record.

   What the step is actually for is noticing when the figure moved, and whether the slice explains it. A slice that touched no `.feature` and no `features/steps/*.ts` leaves the Examples-table mutant surface byte-identical, so a moved figure wants an explanation before it is accepted.

   Note the surface being identical does not by itself guarantee identical kill outcomes. A `src/` change to a module the steps exercise can flip a mutant's fate while the unmutated baseline stays green. That is exactly why a move is a finding to understand rather than a new baseline to record.

9. **Retire the worktree:**

   ```bash
   git worktree remove <path>
   git merge-base --is-ancestor <slice> main && git branch -D <slice>
   git worktree prune
   ```

   Assert the ancestry yourself rather than leaning on `git branch -d`. `-d`'s built-in "fully merged" test measures against whatever branch is currently checked out. Under concurrency the primary checkout is normally sitting on some _other_ slice's branch, so `-d` refuses a slice that is in fact already `main`. (Safe, but it stops you every time.) The tag is what preserves the slice's identity once the branch is gone.

The next slice repeats from step 1 against the new `main`.

## Runs the seat owns outside the protocol

<!-- reference-check: allow latest.md -- generated by npm run perf-report and gitignored, so it never resolves against the tracked tree -->

**`npm run test:perf` is owned by the orchestrating session, not by any role.** It appears in no role's checklist deliberately.

So the orchestrator decides when a slice is perf-relevant, and runs `npm run test:perf` **followed by** `npm run perf-report`. Skipping the second leaves the previous run's `reports/perf/latest.md` in place, reading as a successful run of the current tree. The orchestrator also regenerates the `main` baseline first whenever `src/` or `perf/` has moved since that report's own commit. Check it: the report names the commit it was generated from. A role may _recommend_ a run in its handoff, which is a useful signal; no role runs it.

There is deliberately no dedicated perf role for this. The post-merge gate is `hardener`, invoked on `main` and told that it is verifying an integration rather than a slice. The whole tree is then in scope.
````

---

## Part 2 — `.claude/references/merge-protocol.meta.md`

Nine items. Section order after the edit: header, Extraction record, **S1**, Placement ruling
and its test, **S2**, **S3**, Rejected alternatives (with **S4** appended), Known-stale window,
**S5**, **S8**.

### Item S1 — insert a new section immediately after `## Extraction record`

```markdown
## Register split record

`split-the-merge-protocol-reasoning-into-its-sidecar`, 2026-09-18. `extract-the-merge-protocol`
moved the protocol byte-for-byte and deferred the instruction-versus-explanation split, which is
the third rejected alternative below. This slice ran it. Every block below moved verbatim from
`merge-protocol.md`, except where moving it stranded a referent; each such rewrite is named at the
block that carried it.

**Three clauses were deleted rather than moved.** Each restated something the instruction half
already says, which is the only deletion `prose.md` licenses:

- Step 5's "One path, not two, and that is deliberate", whose content survives as the conditional
  obligation the instruction half keeps.
- Step 5's "This is not hypothetical, and", ahead of "the trigger is stage 1".
- Step 5's "Read this as a caution about examples in this clause", whose content survives as "The
  rule is what binds, never an example".

**Two stranded referents predating this slice were repaired**, on the two-repair precedent the
extraction record sets:

- The exemption clause read "read every entry below". The allowlist is not below and never was,
  since the same clause says the list is not restated there. It names `mutation-invariance.config.json`.
- The same clause read "a diff confined to the paths below". That sentence moved here, and it names
  the config too.
```

### Item S2 — insert a new section immediately after `## Placement ruling and its test`

```markdown
## Why each step is shaped as it is

**Step 1 — rebase rather than merge.** This keeps `main` linear, which is what `workflow.md`'s "a
prior role's commit" ordinal reasoning assumes, and keeps each slice's `By <role>.` chain readable
in order.

**Step 2 — the slice's own session resolves its own conflicts.** It has the context the orchestrator
does not.

**Step 3 — why `npm run test:mutation:full` is mandated there.** The rebase brought in another
slice's moved and renamed files, which is exactly the file-level assumption the incremental cache
cannot survive.

**Step 4 — why `--ff-only`.** It is the assertion that step 1 actually happened.

**Step 5 — why the gate runs again on an identical tree.** Step 3 ran against a different Stryker
cache and a different `coverage/`. The step-5 run is what rebuilds `main`'s own caches into a state
the next merge can trust.

**Step 5 — why the incremental cache is deleted rather than reused.** Deleting the cache is the
honest expression of intent. It is not stale; it is describing a tree that no longer exists, which
is the situation `.claude/agents/articles/mutation-testing.md` already names.

**Step 5 — why only one `rm -f` path.** `npm run test:mutation:scripts` passes no `--incremental`
flag, so the `scripts/` side never writes `reports/stryker-incremental-scripts.json` at all — see
`.claude/agents/articles/mutation-testing.md` for the source-level verification of that.

**Step 6 — why the tag marks both.** After the fast-forward in step 4 the slice's tip is `main`'s
tip.

**Step 7 — why `--follow-tags` is written out.** This repo sets `push.followTags = true` locally, so
a plain `git push` already carries the tag. The flag stays written out because `.git/config` is not
tracked, so a fresh clone or a CI checkout will not have the setting.

**Step 8 — where the acceptance-mutation figure comes from.** It comes from `product`'s VERIFY
handoff now rather than from `hardener`'s. `engineering.md` says why it records no literal in the
same breath as recording none: "a literal in this file is wrong the moment the second one lands".

**Step 8 — the runner's two inputs.** `.feature` files and `features/steps/*.ts` became the two
inputs at `acceptance-mutation-on-playwright`. `*.steps.test.*` was the second input before it, and
the runner no longer touches that layer at all.

**Step 9 — why the ancestry assertion is safe.** The `git merge-base --is-ancestor` check asserts
the condition you actually care about, and `-D` cannot do damage because it only runs once that
assertion has passed.

**The perf harness — why no per-slice stage and no perf role.** Render performance is meant to be
held by the architecture — the world-anchored tile keys, the eviction hysteresis — rather than
re-measured on every slice. A per-slice harness stage would quietly recast an architectural
guarantee as a test result. `hardener` already owns exactly the post-merge sequence, and already
knows when to reach for `test:mutation:full`.
```

### Item S3 — insert a new section immediately after item S2's section

```markdown
## The stage-5 exemption — the argument behind the clause

**Why the exemption exists.** Steps 3 and 5 both mandate `npm run test:mutation:full`, and for some
diffs that is two full runs measuring a quantity that provably did not move. `stryker.config.json`'s
`mutate` list covers only `src/**`, and its `ignorePatterns` keeps `features/` out of the sandbox
entirely. So for a diff confined to the paths `mutation-invariance.config.json` allowlists, neither
a mutant nor a test that could kill one is reachable.

Left unaddressed this is not merely a cost. It is a standing incentive to bundle unrelated features
into one slice, to pay the bill once. That is the opposite of what the serial-landing rule is for.

**Why the predicate is stated over the `src/` run alone.** `stryker.scripts.config.json` carries no
`ignorePatterns` at all. Two `scripts/` tests read `features/*.feature` from the live tree. So a
`features/**`-only diff can change a `scripts/` test's outcome, and therefore a mutant's fate, under
`npm run test:mutation:scripts`.

**Why an allowlist rather than a blocklist.** That direction is the whole design. A blocklist fails
open: a path nobody thought to list silently skips the mutation gate, and a skipped run reads exactly
like a passing one. That is the same dangerous direction as the `ignorePatterns` glob that matches
nothing, already described in `.claude/agents/articles/mutation-testing.md`. An allowlist fails safe.

**Why the list is not restated in the instruction half.** It once lived in CLAUDE.md, in
`mutation-testing.md` and in `hardener.md` at the same time, and the three drifted apart.

**Why this gate's own config is on the absent list.** Without `mutation-invariance.config.json` and
`schemas/**` as absent entries, the first slice to edit the allowlist would be granting itself an
exemption.

**Why a comment-only edit under `src/` cannot move the score.** The 2026-09-09 ruling rests on an
argument rather than an intuition. Stryker's mutators operate on AST nodes: arithmetic, conditionals,
literals. A comment is not one, so a comment-only diff creates no mutant, removes none, and re-fates
none.

**Why the surviving-stage list had to be re-derived.** The old argument died with the `acceptance`
project. That argument was that `npm run test:coverage` ran four projects, the `acceptance` one
mounted `<App />`, and its coverage landed on `src/`. So `crap4ts` genuinely moved on a
`features/`-only diff. `delete-step-test-layer` removed that project. Measured on the landed tree,
`coverage/coverage-final.json` now contains zero `features/` entries, and no vitest project loads
anything in that directory.

That re-derivation does not weaken the exemption. The predicate is an allowlist of paths that cannot
move the mutation score, and that is more clearly true after it, not less. It does mean the honest
claim is narrower than it used to be: the exemption covers one stage of one run, and the stages that
remain are fewer than the sentence it replaced implied.

**Why the predicate is computed once.** Step 4 is a fast-forward, so the tree step 5 gates is
byte-identical to the one step 3 gated. There is no second diff worth taking.

**Why the cache survives a skipped stage 5.** The `rm -f` exists because the cache describes a tree
that no longer exists, and under the predicate it does not. Deleting it would tax the next merge with
a full cold run in exchange for nothing. That answers step 5's own "different cache" justification on
its own terms, rather than waiving it.

**Why the claim is worded "no mutated file and no collected test differs".** `backlog/`, `.claude/`
and `CLAUDE.md` are tracked and are copied into the sandbox; only `/features` is ignored. A reader
might check the stronger "byte-identical tree" claim, find it false, and reason "well, these are in
the sandbox too". That would extend the allowlist by exactly the wrong logic.

**Why `hardener` may refuse an exemption but never grant itself one.** The rule is deliberately
asymmetric, because the two errors differ. Wrongly granting is silent and permanent; wrongly refusing
costs one mutation run. That is the narrower prohibition the safety argument actually justifies. A
role that can excuse itself from its own gate is not a gate, which says nothing about a role that can
decline an excuse.

**Why a skip has to be recorded.** A skipped stage produces no artifact, which is the same property
that makes wrongly granting an exemption dangerous. A written record is not a score, but it makes a
skip distinguishable from a pass, which was the actual gap.

**Why the clause is written as a self-revocation rather than as a caveat.** It then resolves safely
for a careless reader. The skip instruction is the more specific and more recent one, so anything
phrased as an exception to it loses.

**Stage 6 was the example this clause used to give, and the `features/`-only stage list in
`merge-protocol.md` refutes it.** That example rested on the `acceptance` project, whose removal left
`coverage/coverage-final.json` with zero `features/` entries, so `crap4ts` cannot legitimately move
on an allowlist-only diff. The example outlived its premise and was repaired by
`the-invariance-allowlist-omits-paths-that-provably-cannot-move-a-mutant`.
```

### Item S4 — append one bullet to the existing `## Rejected alternatives` list

Append below the existing third bullet. Change nothing above it.

```markdown
- **The middle option: a plain `npm run test:mutation` in place of the skip.** Since the cache is
  retained by design, a plain run would still produce a real score — most of the saving plus the
  missing evidence. Its cost argument got considerably stronger once
  `pin-stryker-seed-to-unblind-the-mutation-gate` removed the `@fast-check/vitest` floor. A warm run
  on an unchanged tree is now 24s, rather than the ~3m45s that paragraph used to record. It is still
  not adopted, for a reason the collapse does not touch and which is specific to step 3. That branch
  was just rebased onto a `main` that moved, so the worktree's cache is stale with respect to
  everything the rebase brought in. That is the protocol's own stated reason for mandating `:full`
  there. The 24s figure is measured for a warm cache on an unchanged tree, and says nothing about
  that case. The argument is much stronger at step 5, where `main`'s own cache differs from the tree
  by exactly the invariant diff. So the middle option is really a step-5 proposal, and it changes
  what the gate measures, so it is a slice of its own.
```

### Item S5 — retitle the existing check-readings heading

Replace `## Check readings at landing` with:

```markdown
## Check readings at landing — `extract-the-merge-protocol`
```

The table below it is a dated record of that slice, and this slice must not overwrite it. The
retitle is what makes that legible once a second table exists.

### Item S6 — fix the record-sense indexical in the re-measure paragraph

In the paragraph beginning "**Re-measure the reference count after any edit to this table**",
replace:

> and in this slice it did so twice

with:

> and in `extract-the-merge-protocol` it did so twice

This is the form `claim-discipline.md` mandates: name the slice, never "this slice", in anything
that is a record. A backticked bare slug adds no filename-shaped token, so it cannot move the
recorded reference count.

### Item S7 — close the `vale` on `CLAUDE.md` row

That row ends without a period. Add one. It sits inside the protected table, and a period adds
no token of any shape, so it is safe on the same ground as the digits-only correction the
paragraph below the table records. Item S9 re-measures regardless.

### Item S8 — add this slice's own check-readings section

Add at the end of the file, after the re-measure paragraph. Fill every digit from `writer`'s own
runs per item S9. Do not copy a figure out of this spec except where the row says the spec
measured it.

```markdown
## Check readings at landing — `split-the-merge-protocol-reasoning-into-its-sidecar`

The re-measure rule above binds this table too.

| Check                                     | Reading                                                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wc -c` on `merge-protocol.md`            | before 19,078 bytes, after ⟨measure⟩                                                                                                             |
| `wc -c` on this sidecar                   | before 10,350 bytes, after ⟨measure⟩                                                                                                             |
| `wc -c CLAUDE.md`                         | before 72,607 bytes, after ⟨measure⟩                                                                                                             |
| `npm run reference-check`                 | exit 0, ⟨measure⟩ files scanned, ⟨measure⟩ references found                                                                                      |
| `npm run agent-doc-check`                 | exit 0, ⟨measure⟩ doc files, ⟨measure⟩ agent files, ⟨measure⟩ rules                                                                              |
| `npm run mutation-invariance`             | exit 0, config valid, no `--diff` given                                                                                                          |
| `vale` on `merge-protocol.md`             | ⟨measure⟩ findings, against 7 before — 6 `Procedure.ProcedureLength`, 1 `STE.SentenceLength`                                                     |
| `vale` on `CLAUDE.md`                     | ⟨measure⟩ findings, against 21 before                                                                                                            |
| `vale` on this sidecar                    | 0 — exempt by `.vale.ini`'s final `[**/*.meta.md]` section. Read that as a confident zero, never as a pass                                       |
| `vale` on this sidecar, exemption removed | ⟨measure⟩ findings, through a scratch config outside the repo carrying the same rule set as `.vale.ini`'s `[.claude/references/**/*.md]` section |
| `npm run prose-lint`                      | ⟨measure⟩ tracked files linted                                                                                                                   |

**The instruction half's drop has three causes, and only one of them is the register split.**
Measured on the drafted text before landing: moving explanation to this sidecar alone clears
steps 1, 2 and 4, and takes steps 3, 5 and 8 from 71, 68 and 61 words to 50, 39 and 30 — all three
still over `Procedure.ProcedureLength`'s 20-word cap, so a register split alone reads 4 findings
rather than 0. Relocating those three steps' qualifiers into indented continuation paragraphs
under the same number clears three of the four. Splitting step 6's 37-word idea-board sentence
clears the fourth.

**The sidecar's own zero is bought by the exemption, not earned.** That is why the row above
records what this file reports with the exemption removed. Reproduce it by copying
`.vale.ini`'s `[.claude/references/**/*.md]` rule keys into a scratch config outside the repo,
under a `[*.md]` section with absolute `StylesPath` entries pointing at this checkout's
`vale-styles/` and `.vale/`, and running `vale --config=<scratch> <copy of this file>`.
```

### Item S9 — the two-commit measurement sequence

R-F's consequence. Execute in this order.

1. Make every prose edit in items M0, S1–S8 and C1.
2. Write each `⟨measure⟩` cell's **wording** in its final form, and fill its digits from runs
   made against the working tree with all of step 1 applied.
3. Commit.
4. Re-run `npm run reference-check`, `npm run prose-lint`, and the three `wc -c` commands.
5. If any digit moved, correct **digits only** in a second commit. Change no word. If nothing
   moved, there is no second commit. Either way, say in the handoff which happened.

Step 5's digits-only constraint is the sidecar's own recorded correction method, and it is the
only edit to that table proven to add no token.

---

## Part 2B — `CLAUDE.md`

### Item C1 — the routing bullet for this pair

**Ruled: yes, this line is in reach.** CLAUDE.md's Documentation map says what each sidecar
carries, and that is a routing fact: a reader who is about to change the stage-5 exemption
decides from this line which half of the pair to open. After items S2 and S3 the line's summary
is incomplete, and an incomplete routing line sends that reader to the wrong file.

On the `merge-protocol.md` bullet — the one opening
**`` `.claude/references/merge-protocol.md` ``** — replace this sentence:

> Its sidecar carries the extraction record, the placement ruling and the rejected alternatives.

with this sentence:

> Its sidecar carries the extraction record, the per-step rationale, the stage-5 exemption's argument, the placement ruling and the rejected alternatives.

**Change nothing else on that line, and no other line of CLAUDE.md.** The sentence before it
already carries a 34-word `STE.SentenceLength` finding; leave it. The replacement sentence is 20
words, measured clean at spec time, so CLAUDE.md's reading stays at 21.

---

## Part 3 — the expected check readings

Measured at spec time on this worktree's tip, against drafted copies outside the repo. `writer`
re-measures; a divergence from a number below is a finding for the handoff, not a thing to
reconcile silently.

| Check                                    | Before                                        | Expected after                            | How the spec knows                                                                                                                                                                   |
| ---------------------------------------- | --------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vale` on `merge-protocol.md`            | 7                                             | **0**                                     | Measured on the drafted M0 body through a scratch config reproducing the live reading                                                                                                |
| `vale` on `CLAUDE.md`                    | 21                                            | **21**                                    | Measured on the drafted C1 line: the pre-existing 34-word finding is untouched, the edited sentence is 20 words                                                                      |
| `vale` on the sidecar                    | 0                                             | **0**, by exemption                       | `.vale.ini`'s final `[**/*.meta.md]` section. Guaranteed by construction, proves nothing                                                                                             |
| `vale` on the sidecar, exemption removed | n/a                                           | **2** `STE.SentenceLength`                | Measured on the drafted S1–S4 blocks. This is the honest cost of the exemption                                                                                                       |
| `npm run reference-check`                | exit 0, 524 files, 3,151 refs                 | exit 0, 524 files, **a count that rises** | Every token moving between these two files stays inside the checker's scan set, so a move alone cannot change the count. The new sections add occurrences of already-resolving names |
| `npm run agent-doc-check`                | exit 0, 54 doc files, 8 agent files, 31 rules | **unchanged**                             | No file is added or removed; every `npm run` name used already resolves                                                                                                              |
| `npm run mutation-invariance`            | exit 0                                        | **exit 0**                                | The config is not edited                                                                                                                                                             |
| `npm run prose-lint`                     | 504 files                                     | **504 files**                             | No file is added or removed                                                                                                                                                          |
| `npm run format:check`                   | clean                                         | **clean**                                 | `proseWrap` is Prettier's default `preserve`, so no prose is rewrapped                                                                                                               |

**Read the 7 → 0 drop with its decomposition, never on its own.** The register split alone
reads **4**, measured. Part 2's item S8 mandates that the decomposition lands in the sidecar
rather than only here.

**Read the sidecar's 0 as a confident zero.** `.vale.ini` exempts `*.meta.md`, so every sentence
moved into it stops being linted rather than being fixed. The exemption-removed row is the
counter-measurement, and 2 is the number it hides.

---

## Part 4 — out of scope

- **`merge-protocol.md`'s step numbering.** Other files cite the steps by ordinal. No step is
  added, removed, merged or renumbered.
- **What any step instructs.** Every instructing word survives in the instruction half.
- **CLAUDE.md's "Merge protocol" pointer**, under "Running slices concurrently". It summarises
  the instruction half — "the protocol's steps, the mutation-invariant stage-5 exemption and its
  computed predicate, and the perf runs this seat owns". All three still live there after the
  split. **Ruled: no edit.**
- **CLAUDE.md's sidecar-pair index**, the "Reference pairs in `.claude/references/`" bullet. It
  names which pairs exist, not what fills them, and that bullet says so itself. Unchanged by this
  slice. **Ruled: no edit.**
- **The three files in the Known-stale window** — `vite.config.ts`,
  `schemas/mutation-invariance.schema.json`, `scripts/mutation-invariance/checks.ts`. They are
  outside `writer`'s write boundary and on the mutation-invariance absent list. The section
  recording them is not edited. The `enabler-technical` it recommends is still unwritten; see
  Part 6.
- **`.vale.ini`.** No rule is enabled, disabled or re-levelled. `architect` owns that file and
  this slice does not reach it.
- **The check-readings table of `extract-the-merge-protocol`.** Retitled and given two residue
  fixes, items S5 to S7. No reading in it is restated or recomputed.

---

## Part 5 — the open question for the user

**One ruling in this spec is mine to propose and yours to make.**

Three of the seven Vale findings are cleared by relocating **instruction** words from a numbered
step's own line into an indented continuation paragraph under the same number. No word leaves
`merge-protocol.md`, no instruction changes, and the ordinals are untouched. Steps 3, 5 and 8 are
the three.

`Procedure.ProcedureLength` reads only the line that carries the numbered marker. So the
relocation clears a real finding without improving the register at all. `prose.md`'s stated
remedy for that rule is "state one instruction per step and move the reasoning to prose below the
list", which sanctions moving **reasoning** down — it does not speak to moving an instruction
down.

- **Option A, what this spec assumes.** Accept the relocation. The step's numbered line carries
  the action; its mandates, exceptions and pointers sit in a continuation paragraph under the
  same number. The file already uses that shape for step 3's `ast-grep:rules` paragraph and for
  the whole exemption clause. Post-split reading: **0**.
- **Option B.** Refuse it. Steps 3, 5 and 8 keep their qualifiers on the numbered line and carry
  a residual `Procedure.ProcedureLength` finding each, named in the handoff as accepted. Post-split
  reading: **3**, all `Procedure.ProcedureLength`.

**Recommendation: Option A.** The finding it clears is real — a 71-word numbered step is a genuine
defect — and the fix keeps every word of instruction in the step it belongs to. Option B lands
three findings nobody intends to clear, which is what `prose.md`'s landing constraint exists to
prevent.

If you rule B, the only change to this spec is that steps 3, 5 and 8 in item M0 revert to their
current single-line shape with the moved explanation removed, and item S8's table records 3.

---

## Part 6 — recommendations flowing out of this spec

For the seat to capture as board items. None is executed here.

1. **`enabler-technical` — repoint the three files that still name `CLAUDE.md` as the merge
   protocol's home.** `vite.config.ts`'s path-allowlist comment,
   `schemas/mutation-invariance.schema.json`'s two `description` strings, and
   `scripts/mutation-invariance/checks.ts`'s module header. Already recommended by
   `extract-the-merge-protocol`; restated because this slice confirms the window is still open.
2. **Candidate idea — step 6 restates CLAUDE.md's `ready/` → `done/` rule.** The clause "the
   slice moves it there as its final commit, before step 3's gate" is a third copy of a rule that
   already lives in CLAUDE.md's "Idea board" and in `pipelines.md`'s story exit. `prose.md`
   forbids an instruction file carrying a restatement of a section it cites. This spec keeps the
   clause because R-B forbids removing an instruction, so the deletion needs its own ruled slice.
3. **Candidate idea — `Procedure.ProcedureLength` cannot see a continuation paragraph.** Part 5's
   question generalises: any numbered step in this corpus can clear the rule by moving words one
   line down. Whether that is the intended remedy or a gap in the rule is `architect`'s question,
   and it wants a measurement across the corpus before anyone changes the rule.
4. **Candidate idea — the reference-tier `Instruction.*` rules are still off.** `.vale.ini` holds
   them off for `.claude/references/**` over a measured 6-finding backlog on
   `definition-of-ready.md`. This slice adds no finding to that backlog and does not clear it.
   Enabling them is a slice of its own.

---

## Touches

- `.claude/references/merge-protocol.md` — item M0, whole-file replacement.
- `.claude/references/merge-protocol.meta.md` — items S1 through S9.
- `CLAUDE.md` — item C1, one sentence on the `merge-protocol` routing bullet.

Nothing else. No `src/`, no `scripts/`, no `rules/`, no `vale-styles/`, no `.vale.ini`, no
config. The diff is confined to `.claude/**` and `CLAUDE.md`, both on
`mutation-invariance.config.json`'s allow list, so the landing diff is expected to compute as
mutation-invariant at merge step 3.

## Open questions

1. **Part 5's ruling — accept or refuse the numbered-line relocation for steps 3, 5 and 8.**
   Option A reads 0 findings, Option B reads 3. Recommendation: A. This is the one question that
   blocks item M0.
2. **Part 6's four recommendations** are for the seat's board, not for this slice. None needs a
   ruling now.

`writer` has no authority to execute any item above until the user signs this spec.
