---
name: spec
title: Spec — split merge-protocol.md's clause-level reasoning into its evidence sidecar
created: 2026-09-18
---

# Spec: split the merge protocol's reasoning into its sidecar

**Slice:** `split-the-merge-protocol-reasoning-into-its-sidecar`
**Kind:** `enabler-process` · **Author:** `coach` SPEC, 2026-09-18 · **Executes:** `writer`
**Revision 2, 2026-09-18**, after `procedure-length-clears-by-relocation` ruled the spec's one
blocking question. What that revision changed is listed at the end, under "Revision 2".

Five files change. Nothing else in the tree moves.

| File                                        | Change                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `.claude/references/merge-protocol.md`      | Whole-file replacement — the register split, given verbatim as item M0     |
| `.claude/references/merge-protocol.meta.md` | Four new sections, one appended bullet, three in-place fixes — items S1–S9 |
| `CLAUDE.md`                                 | One sentence on the `merge-protocol` routing bullet — item C1              |
| `.claude/agents/articles/prose.md`          | The relocation ruling and its condition — item P1                          |
| `.claude/agents/articles/prose.meta.md`     | The spike's measurements behind that ruling — item P2                      |

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

**R-E. The numbered line keeps the complete executable instruction; only qualification goes to
an indented continuation paragraph under the same number.** Ruled by `architect` on
`procedure-length-clears-by-relocation`, 2026-09-18, and recorded at that slice's
`findings.md`. `Procedure.ProcedureLength` reads only a line matching `^[0-9]+\.\s` and counts
space-separated tokens on that line, marker included. The measure is the correct measure rather
than a gap, and the rule stays unchanged.

**The condition binds this spec item by item.** A reader who executes marker lines alone must
perform the procedure correctly. What moves below is qualification, rationale or a worked
example — never a second action, and never the step's own applicability condition. Part 1B
applies it step by step, as `findings.md` requires, and it is why one step keeps its finding.

**Relocation still clears a Vale finding without moving a word to the sidecar, so Part 3 keeps
the two apart.** The register split alone reads 4; the ruling is what licenses clearing three of
those four.

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

`writer` makes these, step 3's marker compression in Part 1B, and no others.

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
3. **Re-run the gate on the rebased branch, still in the worktree.** Invoke `hardener` again with `npm run test:mutation:full`.

   **The one exception: if the merge is mutation-invariant, stage 5 does not run at all.** See the clause under step 5, and evaluate its predicate here, at this step.

   Pay attention to `npm run ast-grep:rules` here specifically. It is the gate most likely to have been broken by the _other_ slice's renames invalidating a `files:` glob. Post-rebase, that breakage is legitimately yours.

4. **Fast-forward `main`:** `git checkout main && git merge --ff-only <slice>` from the primary checkout.
5. **Run the full gate on `main`.** Mandatory, even though step 3 just passed on an identical tree. **The one exception: if this is a mutation-invariant merge, skip the deletion below entirely.** Read the clause below before running it:

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

## Part 1B — the completeness check, step by step

`procedure-length-clears-by-relocation`'s `findings.md` requires this check per step rather than
as a blanket claim. Three steps relocate words below their marker. Each is ruled here, and the
test is the ruling's own: **a reader who executes marker lines alone performs the procedure
correctly.**

### Step 3 — passes, but only after one compression

**The mandate is instruction, not qualification, so it stays on the marker line.** A reader who
executes "Invoke `hardener` again" alone gets `hardener`'s own stage-5 default, which is the
incremental `npm run test:mutation`. The rebase is exactly the file-level change that cache
cannot survive, and that is the whole reason step 3 exists. Leaving the mandate below the marker
would let a marker-only reader perform the step **incorrectly**, which the ruling forbids.

**So the marker line keeps the command, and two sentences become one.**

| Before (revision 1)                                                                  | After (this revision)                                                |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Marker: "Invoke `hardener` again." Body: "It must use `npm run test:mutation:full`." | Marker: "Invoke `hardener` again with `npm run test:mutation:full`." |

**This is the spec's fifth authored rewrite, and it is ruled rather than incidental.** It does
not change what step 3 instructs: the imperative carries the obligation the word "must" carried,
and no other word moves. Measured at 19 tokens, clean.

**What stays below is qualification.** The mutation-invariant exception narrows which stages
`hardener` runs, and a marker-only reader who misses it runs the fuller gate. That fails safe —
it costs one mutation run and can never produce a wrong merge. The instruction to evaluate the
predicate here fails safe the same way.

### Step 5 — fails the test, and keeps its finding

**The exception is an applicability condition on the `rm -f` in the very next block, so the
ruling forbids relocating it.** The current text says so in its own words: "Read the clause below
before running it". A marker-only reader must meet the condition before the command, not after.

**The marker line therefore cannot fit under the cap, and the floor is measured rather than
estimated.** A line carrying only the marker, the action, and the exception verbatim — no
"Mandatory", no pointer to the fence, both of which are instruction — measures **21 words**. The
cap is 20.

**Ruled: step 5 keeps its `Procedure.ProcedureLength` finding**, at 39 words after the register
split, down from 68. Clearing it would need the exception reworded, which the proposal's No-go
forbids. `writer` names it in the handoff as accepted, with the words that could not move.

### Step 8 — passes

**The marker line carries the whole action**: carry the figure forward from `product`'s VERIFY
handoff, and do not edit anything. A marker-only reader performs step 8 correctly.

**What moves below is qualification.** The `engineering.md` sentence says there is nothing in
that file to re-record, which the marker's own "This is a read, not an edit" already instructs.
The two paragraphs on noticing a moved figure are rationale and were already below the marker
before this slice.

### Steps 1, 2, 4 — no relocation at all

Each clears by the register split alone. Their markers are unchanged in structure; only
explanation left them, to `merge-protocol.meta.md`.

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
| `vale` on `prose.md`                      | ⟨measure⟩ findings, against 5 before                                                                                                             |
| `vale` on this sidecar                    | 0 — exempt by `.vale.ini`'s final `[**/*.meta.md]` section. Read that as a confident zero, never as a pass                                       |
| `vale` on this sidecar, exemption removed | ⟨measure⟩ findings, through a scratch config outside the repo carrying the same rule set as `.vale.ini`'s `[.claude/references/**/*.md]` section |
| `npm run prose-lint`                      | ⟨measure⟩ tracked files linted                                                                                                                   |

**The instruction half's drop has three causes, and only one of them is the register split.**
Measured on the drafted text before landing: moving explanation to this sidecar alone clears
steps 1, 2 and 4, and takes steps 3, 5 and 8 from 71, 68 and 61 words to 50, 39 and 30 — all three
still over `Procedure.ProcedureLength`'s 20-word cap, so a register split alone reads 4 findings
rather than 1. Relocating step 3's and step 8's qualifiers into indented continuation paragraphs
clears two of the four, and splitting step 6's 37-word idea-board sentence clears a third.

**The relocation is licensed rather than assumed.** `architect` ruled the shape legitimate on
`procedure-length-clears-by-relocation`, 2026-09-18, on a measured corpus exposure of 51 findings
and 28 numbered steps already carrying an over-cap body while reading clean.
`.claude/agents/articles/prose.md` carries the ruling and its condition, and `prose.meta.md` the
measurement.

**Step 5 keeps its finding, and that is the ruling applied rather than ignored.** Its exception is
an applicability condition on the command in the next block, which the ruling forbids relocating.
A marker line carrying only the action and that exception verbatim measures 21 words against a cap
of 20, so the finding is irreducible without rewording an instruction.

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

## Part 2C — `prose.md` and `prose.meta.md`

**Ruled: the `prose.md` ruling rides this spec rather than becoming its own process item — and
the user may strike it.** `architect` left the choice to the seat; the seat put it to me. Three
reasons, and one cost stated plainly.

- **The ruling's evidence has no other home.** `findings.md` sits in
  `backlog/done/procedure-length-clears-by-relocation/`, and CLAUDE.md's Idea board says the
  retrospective **deletes** that folder. A separate process item is a race against that deletion.
- **This slice is the ruling's first application.** Without item P1, three relocated steps land
  in `merge-protocol.md` with no rule behind them, and the next reader cannot tell a ruled shape
  from a slip.
- **The reviewers of this slice need it.** `editor` AUDIT and `coach` REVIEW check Part 1B
  against a rule; a rule that is not yet written is a rule they must take from a board folder.

**The cost.** This slice's scope widens from one pair to one pair plus a corpus-wide ruling, so
`editor` and `coach` REVIEW carry two subjects instead of one. The diff stays inside `.claude/**`
and so stays mutation-invariant. **If you prefer the narrower slice, strike Part 2C and the seat
raises an `enabler-process` item; Part 1B and item M0 are unaffected either way.**

The split between the two items is the house rule: `prose.md` gets the ruling and its condition,
`prose.meta.md` gets the measurements.

### Item P1 — `prose.md`

Insert at the end of the section `### Procedure.ProcedureLength — act on every finding`, after
its existing "One exemption survives and it is real" paragraph. Add nothing above it.

**Two things about this item are deliberate and will look like defects to a reviewer.**

- **It adds an accepted-residual class to a rule whose heading says "act on every finding".** The
  heading stays, because the class is narrow: a step whose complete executable instruction will
  not fit. `merge-protocol.md`'s step 5 is the first instance and this slice lands it.
- **It is article prose, not a rule file, so it is `writer`'s edit rather than `architect`'s.**
  `architect` authored the ruling and named `prose.md` as its home; no `vale-styles/` file and no
  `.vale.ini` key changes.

```markdown
**Relocation below the marker is a legitimate remedy, and it carries one condition.** Ruled
2026-09-18 on `procedure-length-clears-by-relocation`'s measurement. The rule reads the marker line
alone, so moving words into an indented continuation paragraph clears a finding. That is the
corpus's existing register rather than a loophole: 28 numbered steps already carry a body over the
cap and read clean.

**The condition is that the marker line keeps the complete executable instruction.** A reader who
executes marker lines alone must perform the procedure correctly. What moves below is qualification,
rationale or a worked example. Never a second action, and never the step's own applicability
condition.

**Check that condition step by step, never as a blanket claim over a file.** A step whose complete
instruction will not fit under the cap keeps its finding. Name such a step in the handoff as
accepted, with the words that could not move.

**The body is bounded rather than unlinted.** `STE.SentenceLength` and `STE.ParagraphLength` both
reach a continuation paragraph, and the marker's own sentence does not count toward the six. So
relocation moves words from a procedural cap into a descriptive one, which is the split ASD-STE100
itself draws.
```

Measured at spec time: this block adds **0** findings, so `prose.md` stays at its current 5.

### Item P2 — `prose.meta.md`

Append as a new final section. The file's existing sections are dated headings in this shape.

```markdown
## Why `Procedure.ProcedureLength` was left measuring the marker line alone (2026-09-18)

`procedure-length-clears-by-relocation` asked whether the rule's marker-line measure is an
incidental gap. `architect` ruled it the correct measure, with no rule change, no companion rule
and no `enabler-technical`. The parent slice was
`split-the-merge-protocol-reasoning-into-its-sidecar`, whose spec was blocked on the answer.

**Exposure.** 51 of 51 current findings clear by relocation alone, across 9 files — 44 percent of
the corpus's 116 numbered steps. `product.md` 13, `coder.md` 8, `cleaner.md` 6,
`merge-protocol.md` 6, CLAUDE.md 5, `architect/contract-mode.md` 4, `testing-layers.md` 4,
`engineering.md` 3, `mutation-testing.md` 2.

**The shape is already the corpus's.** 44 of the 116 steps carry an indented body, and **28 pass
the rule while marker plus body exceeds 20 words**, 27 of them through plain continuation
paragraphs. Twenty of those 27 are `prose.md`'s own numbered enumerations of failure modes, which
are numbered statements rather than procedures — a separate known imprecision.

**What lints the body, measured.** A 31-word continuation paragraph fires `STE.SentenceLength`. A
7-sentence one fires `STE.ParagraphLength`, a 6-sentence one is clean, and the marker's own
sentence does not count toward the six. A 26-word marker line fires `ProcedureLength` and does
**not** fire `SentenceLength`, so on the marker line `ProcedureLength` is the only length rule.

**Closing the rule was rejected on the measure, not on cost.** A total-words-per-step cap has no
ASD-STE100 basis, and it would convert the 28 legitimate shadow steps into findings. The
instruction-against-rationale split inside a body is not mechanically decidable:
`OneInstruction`'s imperative-verb discriminator fails there, because rationale is full of quoted
imperatives. The `.good` fixture such a rule would owe cannot be written honestly, and that
impossibility is itself the evidence.

**A companion body rule was rejected as drift.** The body is already bounded by two enabled `STE`
rules, so a second rule would report one defect at two precisions — the reason `.vale.ini`
disables `STE.ProcedureLength` by name. The priced-in cost is 5 words per sentence, 25 against 20,
plus the loss of a per-step total.

**One probe defect, caught and corrected.** The first exposure scan used the git pathspec
`.claude/references/**/*.md`, which matches nothing, because git's `**/` needs an intermediate
directory. It silently dropped the reference tier and reported 45 against vale's 51. Only the
reconciled run, 51 against 51, is reported above.

**Not measured, stated rather than inferred.** Whether `SentenceLength` reaches sub-bullet text
under a numbered step. The register classification of all 28 bodies, as against the hand-sampled
extremes. `ParagraphLength` segmentation away from the 6-to-7 boundary.

**The parent slice's own application.** `split-the-merge-protocol-reasoning-into-its-sidecar`
relocated three steps and ruled a fourth unfixable: `merge-protocol.md`'s step 5 keeps its
finding, because its exception is an applicability condition on the command in the next block,
and a marker line carrying only the action and that exception measures 21 words against a cap of 20.
```

---

## Part 3 — the expected check readings

Measured at spec time on this worktree's tip, against drafted copies outside the repo. `writer`
re-measures; a divergence from a number below is a finding for the handoff, not a thing to
reconcile silently.

| Check                                    | Before                                        | Expected after                            | How the spec knows                                                                                                                                                                   |
| ---------------------------------------- | --------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vale` on `merge-protocol.md`            | 7                                             | **1**, step 5's marker at 39 words        | Measured on the drafted M0 body through a scratch config reproducing the live reading. Step 5's finding is ruled irreducible in Part 1B                                              |
| `vale` on `CLAUDE.md`                    | 21                                            | **21**                                    | Measured on the drafted C1 line: the pre-existing 34-word finding is untouched, the edited sentence is 20 words                                                                      |
| `vale` on `prose.md`                     | 5                                             | **5**                                     | Measured on the drafted P1 block, which adds none                                                                                                                                    |
| `vale` on `prose.meta.md`                | 0                                             | **0**, by exemption                       | The same `[**/*.meta.md]` section. Item P2's block is a dated record and belongs to that register                                                                                    |
| `vale` on the sidecar                    | 0                                             | **0**, by exemption                       | `.vale.ini`'s final `[**/*.meta.md]` section. Guaranteed by construction, proves nothing                                                                                             |
| `vale` on the sidecar, exemption removed | n/a                                           | **2** `STE.SentenceLength`                | Measured on the drafted S1–S4 blocks. This is the honest cost of the exemption                                                                                                       |
| `npm run reference-check`                | exit 0, 524 files, 3,151 refs                 | exit 0, 524 files, **a count that rises** | Every token moving between these two files stays inside the checker's scan set, so a move alone cannot change the count. The new sections add occurrences of already-resolving names |
| `npm run agent-doc-check`                | exit 0, 54 doc files, 8 agent files, 31 rules | **unchanged**                             | No file is added or removed; every `npm run` name used already resolves                                                                                                              |
| `npm run mutation-invariance`            | exit 0                                        | **exit 0**                                | The config is not edited                                                                                                                                                             |
| `npm run prose-lint`                     | 504 files                                     | **504 files**                             | No file is added or removed                                                                                                                                                          |
| `npm run format:check`                   | clean                                         | **clean**                                 | `proseWrap` is Prettier's default `preserve`, so no prose is rewrapped                                                                                                               |

**Read the 7 → 1 drop with its decomposition and its provenance, never on its own.** The
register split alone reads **4**, measured. Relocation clears two of those four and the
sentence split clears a third; the fourth is step 5's, ruled irreducible. Relocation is licensed
by `architect`'s 2026-09-18 ruling on `procedure-length-clears-by-relocation`, which measured 51
findings of this rule corpus-wide and 28 steps already carrying an over-cap body while reading
clean. Item S8 mandates that both the decomposition and the provenance land in the sidecar rather
than only here.

**Read the sidecar's 0 as a confident zero.** `.vale.ini` exempts `*.meta.md`, so every sentence
moved into it stops being linted rather than being fixed. The exemption-removed row is the
counter-measurement, and 2 is the number it hides.

---

## Part 4 — out of scope

- **`merge-protocol.md`'s step numbering.** Other files cite the steps by ordinal. No step is
  added, removed, merged or renumbered.
- **What any step instructs.** Every instructing word survives in the instruction half. Step 3's
  marker compression is the one place two sentences become one; Part 1B rules why the instruction
  is unchanged, and it is the only such edit in the file.
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

## Part 5 — the blocking question, answered

**Revision 1's open question is closed.** `architect` ruled on
`procedure-length-clears-by-relocation`, 2026-09-18. Relocation below the marker is legitimate,
`Procedure.ProcedureLength`'s marker-line measure is the correct measure, the rule stays
unchanged, and there is no companion rule and no `enabler-technical`. Two measurements decided
it: 28 numbered steps in the corpus already carry an over-cap body and read clean, and the body
is reached by `STE.SentenceLength` and `STE.ParagraphLength` rather than being unlinted.

**The ruling arrived with a condition, and applying it changed this spec's answer.** Revision 1
assumed a post-split reading of 0. Under the condition the reading is **1**:

- **Step 3** needed a compression that revision 1 did not have. Its `:full` mandate is
  instruction, so it had to come back up onto the marker line — see Part 1B.
- **Step 5** cannot satisfy the condition at all. Its exception is an applicability condition on
  the next block's command, and the minimum compliant marker line measures 21 words against a cap
  of 20. It keeps its finding, named as accepted.
- **Step 8** passes unchanged.

**Nothing here needs your ruling.** The one thing still open is the scope choice in Part 2C: whether
the `prose.md` ruling rides this slice or becomes its own item. My recommendation and its cost are
stated there.

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
3. **Withdrawn.** Revision 1 recommended a spike on whether the rule's marker-line measure is a
   gap. `procedure-length-clears-by-relocation` ran it and answered. Items P1 and P2 record the
   answer.
4. **Candidate idea — the reference-tier `Instruction.*` rules are still off.** `.vale.ini` holds
   them off for `.claude/references/**` over a measured 6-finding backlog on
   `definition-of-ready.md`. This slice adds no finding to that backlog and does not clear it.
   Enabling them is a slice of its own.
5. **Candidate idea — 50 of the 51 `Procedure.ProcedureLength` findings are untouched.** The spike
   measured the corpus at 51 across 9 files; this slice clears 5 of `merge-protocol.md`'s 6 and
   leaves the rest. Every one of them now has a ruled remedy and none has an owner. `product.md`
   at 13 and `coder.md` at 8 are the largest. Clearing them is `enabler-process` work, and
   `prose.md`'s landing constraint argues for doing it in one slice rather than opportunistically.
6. **Recorded for the retrospective.** `backlog/done/procedure-length-clears-by-relocation/` is
   scheduled for deletion by its retrospective. Item P2 is what carries its measurements out
   first. If Part 2C is struck, the separate `enabler-process` item must land **before** that
   retrospective runs.

---

## Touches

- `.claude/references/merge-protocol.md` — item M0, whole-file replacement.
- `.claude/references/merge-protocol.meta.md` — items S1 through S9.
- `CLAUDE.md` — item C1, one sentence on the `merge-protocol` routing bullet.
- `.claude/agents/articles/prose.md` — item P1, one block in the `ProcedureLength` section.
- `.claude/agents/articles/prose.meta.md` — item P2, one appended dated section.

Nothing else. No `src/`, no `scripts/`, no `rules/`, no `vale-styles/`, no `.vale.ini`, no
config. The diff is confined to `.claude/**` and `CLAUDE.md`, both on
`mutation-invariance.config.json`'s allow list, so the landing diff is expected to compute as
mutation-invariant at merge step 3.

## Revision 2

What changed after `procedure-length-clears-by-relocation` landed, 2026-09-18.

- **R-E rewritten.** It now states the ruling, its provenance, and the completeness condition
  instead of flagging an open question.
- **Part 1B added** — the completeness check, step by step, as `findings.md` requires.
- **Step 3's marker line recompressed.** "Invoke `hardener` again. It must use `npm run
test:mutation:full`." becomes "Invoke `hardener` again with `npm run test:mutation:full`.",
  because the mandate is instruction and the condition keeps instruction on the marker.
- **Step 5's marker line restored** to carry its exception, which revision 1 had relocated. Step
  5 keeps its `Procedure.ProcedureLength` finding, and the 21-word floor behind that is measured.
- **The expected reading moves from 0 to 1.** Part 3 and item S8 both carry the new figure, the
  decomposition, and the ruling's provenance.
- **Part 2C added** — items P1 and P2, the ruling in `prose.md` and its measurements in
  `prose.meta.md`.
- **Part 6's third recommendation withdrawn**, since the spike answered it. Two new ones added:
  the 50 findings this slice does not touch, and the deletion deadline on the spike's folder.

## Open questions

1. **Part 2C's scope choice.** The `prose.md` ruling rides this slice, or becomes its own
   `enabler-process` item. **Recommendation: ride it**, because the spike's folder is scheduled
   for deletion and this slice is the ruling's first application. Cost: `editor` and `coach`
   REVIEW carry two subjects. Striking Part 2C changes nothing else in this spec.
2. **Part 6's recommendations** are for the seat's board, not for this slice. None needs a ruling
   now.

`writer` has no authority to execute any item above until the user signs this spec.

---

# Amendment 1 — 2026-09-18, after `coach` REVIEW

**Status: needs the user's re-sign-off.** It amends a spec the user signed, so the signature does
not carry over. `writer` has no authority to execute an item below until that happens.

**Why it exists.** `editor` routed eleven findings to `coach` REVIEW at branch tip `a253052`.
`writer` executed the signed spec item for item; nothing below is `writer` drift. **Six of the
eleven are contradictions the spec itself carried into the corpus**, and two more are consequences
the spec's referent sweep did not reach. The remedy belongs in this cycle, not on the board: the
worktree is open, and a board candidate for a defect this slice authored is deferred rework.

**Fifteen items across five files.** `.claude/agents/articles/mutation-testing.md` is new to the
manifest — see item A15 for why, and Part A-4 for the cost of adding it.

---

## Part A-1 — `.claude/references/merge-protocol.md`

### A1 — restore step 3's modal

`editor` flagged the modal the spec's fifth rewrite dropped, and the flag is right. The em-dash
form carries both the modal and the location inside the cap. Measured at 19 tokens, clean.

Replace line 14 in full:

```markdown
3. **Re-run the gate on the rebased branch, still in the worktree** — `hardener` must use `npm run test:mutation:full`.
```

**The completeness condition still holds.** "Re-run the gate" is the act, `hardener` is the agent,
and the command is named. A marker-only reader performs step 3 correctly.

### A2 — name the second path again

**Finding 2, and it is the spec's defect.** Before this slice the instruction half named
`reports/stryker-incremental-scripts.json`. The register split moved that sentence out, leaving
"the second path" pointing at nothing a reader of the instruction half can resolve. `prose.md`
forbids repairing it with a pointer to the sidecar.

**Ruled: naming the referent of an existing noun phrase does not change what the step instructs.**
The No-go bars changing the obligation. This restores what the slice removed and the obligation is
word for word the same act. R-D's sweep listed indexicals and missed a stranded noun phrase; that
gap is the spec's, and item A5 records it.

Replace line 29 in full:

```markdown
**Adding `--incremental` to `npm run test:mutation:scripts` re-arms this deletion.** A slice that adds it must put `reports/stryker-incremental-scripts.json` back into the `rm -f` block above.
```

### A3 — drop a narration with no antecedent

"the defect this clause used to carry" names a defect the file no longer contains, since its
example moved to the sidecar. `editor` called this arguable. **Ruled in reach**: the caution is
what binds and it survives intact.

Replace line 79 in full:

```markdown
**The rule is what binds, never an example.** An example a later slice can falsify is what produced a defect here once.
```

---

## Part A-2 — `.claude/references/merge-protocol.meta.md`

### A4 — the deleted-clause count is short by one

**Finding 4, and the spec caused it.** Row 24 of the move table routed "and know which option was
not taken" into the middle-option bullet. It did not arrive, and it is in neither half.

**Ruled: deletion is the correct disposition, and the record must say four.** The option that
phrase points at now lives in this file, so a reader of the instruction half cannot act on it.
Keeping it would have stranded it. The count sits beside its own enumeration, which is why it
fails loudly — so fix the count and add the bullet, never the count alone.

Replace the lead sentence and the list at lines 32 to 39 in full:

```markdown
**Four clauses were deleted rather than moved.** Each restated something the instruction half
already says, which is the only deletion `prose.md` licenses:

- Step 5's "One path, not two, and that is deliberate", whose content survives as the conditional
  obligation the instruction half keeps.
- Step 5's "This is not hypothetical, and", ahead of "the trigger is stage 1".
- Step 5's "Read this as a caution about examples in this clause", whose content survives as "The
  rule is what binds, never an example".
- Step 5's "and know which option was not taken", from "Record every skip, and know which option
  was not taken". The spec routed that phrase into the middle-option bullet below and it did not
  arrive. Deletion is the right disposition either way: the option it points at lives here now, so
  a reader of the instruction half cannot act on the phrase.
```

### A5 — keep the promise about named rewrites

**Finding 7.** This file promises "each such rewrite is named at the block that carried it", and
three rewrites are unnamed. The two-bullet list beside the promise covers only referents that
predate the slice.

Insert immediately after the two-bullet list that ends at line 47:

```markdown
**Three survivors were rewritten because the move stranded a referent.** Each was named in the
spec and belongs in this record too:

- `merge-protocol.md`'s skipped-cache claim read "differs from the one it was built from". "The
  one" lost its referent when the sentence above it moved, so it names the tree.
- This file's stage-6 entry read "the paragraph above now refutes it", which pointed at a
  paragraph that stayed in `merge-protocol.md`. It names that file's stage list.
- This file's skipped-stage-5 entry gained the trailing clause "and under the predicate it does
  not", carrying a negation the instruction half held through an adjacency the move removed.

**One referent the sweep missed, recorded so the next sweep is wider.** Step 5's "the second path"
was a stranded noun phrase rather than one of the indexicals the spec listed, and it survived into
the corpus. `coach` REVIEW ruled the repair, which names the file the phrase points at.
```

### A6 — widen the known-stale entry the split reached

**Finding 6.** `schemas/mutation-invariance.schema.json` is outside `writer`'s write boundary and
on the mutation-invariance absent list, so the repair is not this slice's. The **record** of it is.

Insert as a new paragraph at the end of the `## Known-stale window` section:

```markdown
`split-the-merge-protocol-reasoning-into-its-sidecar` deepened the second entry rather than
repairing it. `schemas/mutation-invariance.schema.json` cites `merge-protocol` step 5 "for why that
scope is load-bearing", and that why moved into this file, under "Why the predicate is stated over
the `src/` run alone". Step 5 still asserts the scope is load-bearing, so the citation degrades
rather than breaks: a reader reaches the assertion and this file is one hop further. The same
`enabler-technical` covers it.
```

### A7 — one fact, one home

**Finding 11.** "The cache describes a tree that no longer exists" now sits in two sections eighty
lines apart. **Ruled: the step entry under "Why each step is shaped as it is" owns the
proposition**, because that section owns step-level reasons. The exemption section needs the
proposition only to negate it, so it refers.

Replace the paragraph at lines 161 to 164 in full:

```markdown
**Why the cache survives a skipped stage 5.** The step-5 entry above says why the `rm -f` exists;
under this predicate that reason does not hold. Deleting the cache would tax the next merge with a
full cold run in exchange for nothing. That answers step 5's own "different cache" justification on
its own terms, rather than waiving it.
```

### A8 — the Vale row reads its breakdown onto the wrong number

**Finding 5, and the spec's cell was different.** The em-dash construction makes "6
`Procedure.ProcedureLength`, 1 `STE.SentenceLength`" read as the breakdown of the 1.

Replace the row in full:

```markdown
| `vale` on `merge-protocol.md` | 1 finding: step 5's marker line at 39 words, `Procedure.ProcedureLength`. Before: 7, of which 6 `Procedure.ProcedureLength` and 1 `STE.SentenceLength` |
```

### A9 — bridge 21 to 39

**Finding 5's consequence.** The paragraph reasons from 21, the irreducible floor, while the file
reads 39, and nothing landed explains the gap.

Insert as a new paragraph immediately after the step-5 paragraph at lines 290 to 293:

```markdown
**The floor and the reading are different numbers.** 21 is the minimum: a marker line carrying
nothing but the action and the exception. The line reads 39 because it also carries "Mandatory,
even though step 3 just passed on an identical tree" and the pointer into the fence below, both
instruction. Even stripped to the floor the line exceeds the cap, so the extra words are cost
rather than cause.
```

### A10 — decompose the exemption-removed figure

**The spec predicted 2 and the row landed 19, and both are right about different things.** The
spec measured the drafted S1 to S4 blocks; the row measures the whole file, which is what the row
label means. That mismatch is the spec's, and the honest repair is the decomposition the rest of
this table already uses.

Measured by `coach` REVIEW on the merge base and on the tip, through the same scratch config.

Insert as a new paragraph at the end of the section, after the reproduction instructions:

```markdown
**That 19 is mostly inherited, so read it decomposed.** The same command on this file as
`extract-the-merge-protocol` left it reports 12. The slice's own prose is the difference, not the
bulk of the number.
```

### A11 — the CLAUDE.md byte row, digits only

**Finding 1, and the spec handed `writer` the wrong before-figure.** `spec.md` carried 72,607,
which is `extract-the-merge-protocol`'s landing figure. The merge base measures **72,434**. The row
reads as a 115-byte shrink where the slice added 58 bytes.

Replace the digits in that row and nothing else:

```markdown
| `wc -c CLAUDE.md` | before 72,434 bytes, after 72,492 bytes |
```

---

## Part A-3 — `prose.md` and `prose.meta.md`

### A12 — drop the census numeral from the instruction file

**Finding 9.** "28 numbered steps already carry a body over the cap and read clean" is an undated
present-tense census with no enumeration beside it, in an instruction file.
`claim-discipline.md` says drop the numeral. **A pointer to the sidecar is not available** —
`prose.md` forbids an instruction file pointing at its own `.meta.md`. So the repair leans on the
date already in the paragraph. Measured clean.

Replace the paragraph at `prose.md` lines 291 to 295 in full:

```markdown
**Relocation below the marker is a legitimate remedy, and it carries one condition.** Ruled
2026-09-18 on `procedure-length-clears-by-relocation`'s measurement. The rule reads the marker line
alone, so moving words into an indented continuation paragraph clears a finding. That is the
corpus's existing register rather than a loophole: the same measurement found the shape already in
use across the corpus, reading clean.
```

### A13 — scope the exposure count to what it measured

**Finding 8, and `editor` named the mechanism correctly.** The spike measured whether a marker
line can always be shortened; it can, 51 of 51. The completeness condition that makes step 5 exempt
was authored by **this** slice, after that measurement. So the figure is not wrong — it is
mechanical, and the condition supersedes it.

Replace the `**Exposure.**` paragraph in full:

```markdown
**Exposure, and it is a mechanical count.** 51 of 51 findings clear the rule by relocation alone,
across 9 files — 44 percent of the corpus's 116 numbered steps. `product.md` 13, `coder.md` 8,
`cleaner.md` 6, `merge-protocol.md` 6, CLAUDE.md 5, `architect/contract-mode.md` 4,
`testing-layers.md` 4, `engineering.md` 3, `mutation-testing.md` 2. The count says a marker line
can always be shortened. It does not say the shortened line still carries the whole instruction,
because the completeness condition in `prose.md` was written after this measurement.
```

### A14 — two steps relocated, not three

**Finding 10.** Step 5 relocated nothing in the end: revision 2 put its exception back on the
marker line. Step 6's edit was an `STE.SentenceLength` split in a continuation paragraph, which the
relocation ruling never reached. Steps 3 and 8 are the two.

Replace the `**The parent slice's own application.**` paragraph in full:

```markdown
**The parent slice's own application, and the first exception to the count above.**
`split-the-merge-protocol-reasoning-into-its-sidecar` relocated two steps and ruled a third
unfixable. `merge-protocol.md`'s step 5 keeps its finding, because its exception is an
applicability condition on the command in the next block, and a marker line carrying only the
action and that exception measures 21 words against a cap of 20. So the completeness condition
removes at least one of the 51 from the exposure count, and nothing has re-measured the other 50
against it.
```

---

## Part A-4 — `mutation-testing.md`, new to the manifest

### A15 — repair the instruction this slice broke in another file

**Finding 3.** `mutation-testing.md` tells a future slice to "put the second path back and restore
the plural in the clause beside it". **This slice deleted that clause** — item A4's first bullet.
The instruction now points at nothing.

**Ruled in-cycle rather than filed.** The file is inside `writer`'s write boundary
(`.claude/**`), it is on the mutation-invariance allow list so it costs no mutation run, and the
damage is this slice's own. Filing it would be deferred rework.

**The cost, stated.** One more file in `writer`'s manifest, so `editor` CLEAN re-reads it, and
`mutation-testing.md`'s Vale baseline of 16 joins the readings to re-measure. The repair is two
lines inside one blockquote and names the same path item A2 names.

Replace the two blockquote lines:

```markdown
> step 5's `rm -f` to the `src/` path alone. A slice that adds `--incremental` there has to put
> `reports/stryker-incremental-scripts.json` back into that block. Note the `--mutate` prohibition above
```

---

## Part A-5 — execution and expected readings

**Run item S9's sequence again, unchanged.** Every prose item above plus the filled digits in one
commit; re-run `reference-check`, `prose-lint` and the `wc -c` commands; correct **digits only** in
a second commit if any moved. If none moved, no second commit, and say which happened.

**Item A11 is a digits-only correction that must land in the first commit**, because the rest of
the amendment edits the same table and would invalidate a separate digits pass.

| Check                           | At `a253052`        | Expected after the amendment                                                           |
| ------------------------------- | ------------------- | -------------------------------------------------------------------------------------- |
| `vale` on `merge-protocol.md`   | 1                   | **1** — step 5 only. Items A1 to A3 measured clean                                     |
| `vale` on `prose.md`            | 5                   | **5** — item A12 measured clean                                                        |
| `vale` on `mutation-testing.md` | 16                  | **16** — item A15 shortens a sentence inside a blockquote                              |
| `vale` on the sidecar           | 0, by exemption     | **0**, by exemption. Still a confident zero                                            |
| the sidecar, exemption removed  | 19                  | **re-measure** — items A4 to A11 add prose, so expect a rise. 12 is the inherited half |
| `npm run reference-check`       | exit 0, 524, 3,173  | exit 0, 524, **a count that rises** — A2 and A15 each add a filename-shaped token      |
| `npm run agent-doc-check`       | exit 0, 54 / 8 / 31 | **unchanged** — no file added or removed                                               |
| `npm run mutation-invariance`   | exit 0              | **exit 0** — the config is untouched                                                   |
| `npm run prose-lint`            | 507 files           | **507 files**                                                                          |
| `npm run format:check`          | clean               | **clean**                                                                              |

**Add a row to the landing table for `mutation-testing.md`**, since it is now in the manifest, and
re-measure the whole table per S9.

---

## Part A-6 — what is not amended

- **`schemas/mutation-invariance.schema.json`** — outside `writer`'s write boundary and on the
  mutation-invariance absent list, so editing it re-arms a full mutation run for a prose fix. Item
  A6 records it; the standing `enabler-technical` repoints it.
- **`testing-layers.md:149`** — `editor` names it pre-existing and not this split's doing. Out of
  scope, and no candidate: it was not created here and nothing about this slice makes it newly
  visible.
- **Step 5's `Procedure.ProcedureLength` finding** — ruled irreducible in Part 1B and measured at
  a 21-word floor. It stays, named as accepted.

---

## Part A-7 — two mechanisms the corpus does not name, recommended as their own item

**Recommendation: a separate `enabler-process` item, not this amendment.** Exact text is below so
that item's spec can lift it. Both texts measured clean at REVIEW time.

**Why not here.** This slice already carries three subjects — the pair split, the `prose.md`
relocation ruling, and now a fifteen-item amendment. These two rules bind **every** role rather
than this pair, and they deserve a user signature of their own rather than riding a merge-protocol
amendment. There is also a bootstrap objection: an amendment that creates the amendment mechanism
authorizes itself.

**The cost of deferring.** The mechanism stays unnamed for one more cycle, and Amendment 1 above is
improvised authority once more — which is the user's complaint. **Mitigation: Amendment 1 is
written in exactly the shape the text below describes**, so the item lands with a worked precedent
rather than a blank page. If you would rather not wait, say so and I will fold both into Amendment
2; the cost is two more files in `writer`'s manifest and a second `editor` AUDIT subject.

### Where each belongs, and why

| Text                      | File                                  | Why that file                                                                                                                                      |
| ------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| The amendment mechanism   | `.claude/references/pipelines.md`     | Between-invocation: an extra user gate and a re-entry point. That file already owns "The user gate sits at step 1's close"                         |
| One line on authorship    | `.claude/agents/coach.md`             | Within-invocation: who may author is a role boundary. Without it a `coach` REVIEW invocation has no amendment authority to read                    |
| The scope-preference rule | `.claude/agents/articles/handoffs.md` | It binds every reviewing pass — `coach` REVIEW, `architect` REVIEW and ADJUDICATE, `editor` AUDIT, `product` VERIFY. Every role reads that article |

`pipelines.md` states the split itself: it is the single source for between-invocation facts, and a
role file is the single source for its own within-invocation facts. Two files is the smaller cost
than one fact in the wrong register.

### Text for `pipelines.md` — a new subsection under `## Enabler-process`, after the user-gate paragraph

```markdown
### Amending a signed spec

A signed spec is the authority `writer` edits under, so changing it after sign-off needs its own
rule.

**Trigger.** `coach` REVIEW finds the landed corpus diverges from what the spec should have said,
or the seat finds the spec under-specifies a point `writer` has reached. A `writer` that cannot
execute a spec point returns it and stops; that return is a trigger, never an amendment.

**`coach` authors every amendment, in either mode. `writer` never does.** An executing role editing
its own authority is the boundary this pipeline holds.

**An amendment is dated, numbered, and appended to the item's `spec.md`.** The signed text stays
readable beside it, so a reviewer can tell an amendment from the spec.

**It needs the user's re-sign-off.** An amendment changes something only the user signed, so the
original signature does not carry across it.

**The cycle then re-enters at step 2**, scoped to the files the amendment names. `editor` CLEAN
runs over `writer`'s new manifest, and `coach` REVIEW closes against the spec and its amendments
together.
```

### Text for `coach.md` — one bullet in `## Owns`

```markdown
- **Spec amendments.** A signed spec changes only through a dated amendment you author and append
  to the item's `spec.md`, in either mode; `writer` never amends. The user re-signs, because an
  amendment changes something only the user signed.
```

Three sentences including the bolded lead, which is what `Instruction.ListItemSentences` counts.
A four-sentence draft tripped it; that is why the `pipelines.md` pointer is absent here, and
`coach.md` already carries a read trigger for that file.

### Text for `handoffs.md` — a new section

```markdown
## Resolve a finding in the cycle that made it

**Prefer an in-cycle fix to a board candidate whenever the finding is the running slice's own
doing.** The worktree is open and the context is loaded. A candidate for a defect this slice
authored is deferred rework rather than a backlog item.

**File a candidate only for a finding the slice cannot resolve.** Two cases qualify: the fix
reaches outside the slice's write boundary, or it needs a ruling the slice has no authority to
make. A finding that is merely inconvenient is neither.

**Recommend the expansion with its cost. Never grant it.** Scope belongs to the user. Name the
files the fix adds, what re-runs because of them, and what the slice carries if it is declined.

**A pre-existing finding the slice did not create is out of scope by default.** Say so, and say
what made it visible.
```

### One thing that item must settle and this one does not

`coach.md`'s `description:` frontmatter is what the seat reads when routing. It does not mention
amendments, so a seat that has not read the role file would not know to hire `coach` for one.
Whether to widen it is that item's call, and `agent-doc-check` validates the field either way.

---

# Amendment 2 — 2026-09-18, after `coach` REVIEW round 2

**Status: needs the user's re-sign-off**, on the same ground as Amendment 1.

**Four items, one file.** All four are in `.claude/references/merge-protocol.meta.md`, and all four
are in text Amendment 1 authored. `writer` executed Amendment 1 in full and returned no findings;
`editor` CLEAN verified every item byte-for-byte and every reading. Nothing below is `writer`
drift.

## Part B-0 — the diagnosis, because it decides whether a third round is worth running

**Thirteen findings across two rounds. Zero in the instruction half's rules. Zero in `writer`'s
execution. Zero in prose that was moved.** Every one is in prose `coach` authored that **describes
or counts the slice's own edits**: a count of deletions, a count of rewrites, a number describing
the file the number sits in.

**That is one defect class, not thirteen defects.** A self-describing record is written while the
thing it describes is still changing, so it falsifies itself as the edit continues. This file
already names the hazard for exactly one row — "the row recording the count can falsify itself" —
and nobody generalised it. Amendment 1 then added more instances of the same shape, and two were
wrong.

**The two new findings are that class, precisely.** A10's decomposition restated a figure that the
row beside it owns, so the row moved to 24 and the paragraph still argued from 19. A5's count stood
beside an enumeration that was never complete, which is finding 4's shape exactly.

### The stopping condition

Three properties, all checkable by reading rather than by re-measuring. **After Amendment 2 the
pair should satisfy all three.**

1. **No record paragraph in this pair states a count of this file's own current state.** The table
   row is that number's only home. Item B1 is what makes this true.
2. **Every count that remains stands beside a complete, adjacent enumeration.** `claim-discipline.md`
   permits that form because it cannot drift with the tree. Item B2 is what makes this true.
3. **Every figure about another file or another landing is dated or attributed to a slice.** The
   12 in item B1 and the spike's figures in `prose.meta.md` already are.

**A figure about a different file is not in this class and does not move.** The 39 in the
step-5 paragraph describes `merge-protocol.md`, which this file's edits cannot change. Leaving it
is deliberate, not an oversight.

### Ruled: Amendment 2 is the last, and here is the falsifier

**I expect convergence**, because Amendment 2 adds no new self-describing count. B1 removes one,
B2 replaces one incomplete enumeration with two complete ones, B3 narrows a promise so it stops
claiming coverage it does not enumerate, and B4 is two phrases.

**If `editor` finds a third-round defect of this same class in Amendment 2's own text, do not write
Amendment 3.** That would be the third attempt to keep a self-describing record consistent with a
corpus being edited under it, and the evidence would then say the shape is wrong rather than the
wording. **The fallback: strip the register-split record to the move table alone and move the
accounting into this spec artifact.** `backlog/` is not corpus, nothing downstream reads it as a
rule, and it does not have to stay consistent with anything. Recording it here so the seat does not
have to invent it under pressure.

---

## Part B-1 — the four items

### B1 — re-derive A10's decomposition against the row

**Finding 1.** The row reads 24; the paragraph argues from 19. "That" has no antecedent but the
row. `editor` measured all three figures: tip 24, merge base 12, intermediate tip `a253052` 19.

**Ruled: not a digit swap.** Three clauses are wrong, not one. **19 was never a landing** — it is
this slice's own intermediate tip, which never reached `main`, standing unlabelled beside a 12 that
**is** a landing. And "mostly inherited" inverts: 12 of 24 is exactly half.

**The repair removes the figure rather than correcting it**, per stopping condition 1. The
paragraph keeps the method and the dated attribution; the row keeps the arithmetic.

Replace the final paragraph of the section in full:

```markdown
**Read the exemption-removed row decomposed, and take the current figure from the row.** The same
command on this file as `extract-the-merge-protocol` left it reports 12, which is the inherited
half. Restating the current figure here would put one number in two places, and the row is its
home.
```

### B2 — complete A5's enumeration, and label the two classes apart

**Finding 2.** Three of six rewrites go unrecorded. `editor` confirmed all four survivors against
`git show d8a9738:.claude/references/merge-protocol.md`, and `coach` REVIEW re-confirmed each by
grep before writing this item.

**`editor`'s secondary note is right and this item acts on it.** Two of the three landed bullets are
**moved blocks**, not survivors, which is not the word's sense elsewhere in this pair. The promise
at line 29 is scoped to "every block below", so it reaches only those two — the promise is
discharged and the **label** overreached. The four survivors are a different class the record
should carry anyway.

**Ruled: keep both counts.** A count over its own adjacent bullets is explicitly permitted by
`claim-discipline.md`, because it cannot drift with the tree. **The numeral was never the defect
here — the enumeration was incomplete at authoring, and the numeral is what made that visible.**
Stripping it would have hidden the next omission.

Replace the block beginning "**Three survivors were rewritten because the move stranded a
referent.**" and its three bullets, in full:

```markdown
**Two moved blocks were rewritten on arrival**, which is what the promise above covers:

- This file's stage-6 entry read "the paragraph above now refutes it", which pointed at a
  paragraph that stayed in `merge-protocol.md`. It names that file's stage list.
- This file's skipped-stage-5 entry gained the trailing clause "and under the predicate it does
  not". An adjacency in the instruction half carried that negation, and the move removed it.

**Four survivors in `merge-protocol.md` were rewritten because the move stranded a referent.** Each
stayed put while the sentence it leaned on left:

- The skipped-cache claim read "differs from the one it was built from". "The one" lost its
  referent when the sentence above it moved, so it names the tree.
- Step 5's not-a-fast-path caveat opened "It is still not a fast path", where "It" was the
  exemption named in the paragraph that moved. It names the exemption.
- Step 5's compute-once instruction read "reconstructing one from `main`'s reflog", where "one"
  was the second diff the moved sentence introduced. It names the second diff.
- Step 7's annotated-tag caveat read "Note the setting only follows", where "the setting" was
  `push.followTags`, named in the sentence that moved. It names the setting.
```

### B3 — bound what the record claims to cover

**Not an `editor` finding; `coach` REVIEW's own.** Item B2 fixes one incomplete enumeration, and
the record would still imply it covers edits it enumerates nowhere — step 3's marker recompression,
step 6's sentence split, step 5's narration trim. **Enumerating them adds a fourth list to a record
that has now failed twice on lists.** Bounding the claim closes the class instead.

Insert as a new paragraph immediately after the register-split record's opening paragraph, before
"**Four clauses were deleted rather than moved.**":

```markdown
This record accounts for the moves, and for every rewrite a move forced. Edits made for other
reasons live in the slice's spec and its amendments. Those include a marker line recompressed, a
sentence split and a narration trimmed.
```

### B4 — two `this slice` indexicals this slice authored

**`editor` raised these as arguable. Ruled in reach.** `claim-discipline.md` bans the record-sense
indexical outright, and these two sit in text this slice wrote. The extraction record's own
instances are pre-existing and stay.

**The distinction against item S6, which made the opposite call look inconsistent.** S6's instance
sat far from any dateline inside a rule paragraph, where the referent really was recoverable only
by `git log -S`. These two are near their dateline — which is why they read as arguable, and why
the repair is a phrase rather than a restructure.

Two edits:

- In the register-split record's opening paragraph, **delete the sentence "This slice ran it."** It
  restates what the dateline and the section heading already say, which is the only deletion
  `prose.md` licenses.
- Replace the lead of the two-bullet stranded-referent list:

```markdown
**Two stranded referents the split inherited were repaired**, on the two-repair precedent the
extraction record sets:
```

---

## Part B-2 — execution and expected readings

Item S9's sequence, unchanged: every prose item plus filled digits in one commit, a re-run, then a
digits-only second commit if anything moved.

| Check                           | At `7b41590`        | Expected after                                                                                               |
| ------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `vale` on `merge-protocol.md`   | 1                   | **1** — the file is not edited                                                                               |
| `vale` on `CLAUDE.md`           | 21                  | **21** — not edited                                                                                          |
| `vale` on `prose.md`            | 5                   | **5** — not edited                                                                                           |
| `vale` on `mutation-testing.md` | 16                  | **16** — not edited                                                                                          |
| `vale` on the sidecar           | 0, by exemption     | **0**, by exemption                                                                                          |
| the sidecar, exemption removed  | 24                  | **re-measure** — B2 and B3 add prose, B1 and B4 remove some. All four measured clean, so expect a small rise |
| `npm run reference-check`       | exit 0, 524, 3,177  | exit 0, 524, **re-measure** — B2 adds two `merge-protocol.md` occurrences                                    |
| `npm run agent-doc-check`       | exit 0, 54 / 8 / 31 | **unchanged**                                                                                                |
| `npm run mutation-invariance`   | exit 0              | **exit 0**                                                                                                   |
| `npm run prose-lint`            | 507 files           | **507 files**                                                                                                |
| `npm run format:check`          | clean               | **clean**                                                                                                    |

**Then check the three stopping conditions by reading**, and say in the handoff whether each holds.
That check is the close, not the finding count.

---

## Part B-3 — disposed without an edit

- **A2 and A15 place one obligation in two files.** `editor` raised it as arguable. **Ruled out of
  scope, and filed** — see Part B-4. The duplication is pre-existing in form: before this slice
  `mutation-testing.md` restated the same obligation and pointed at a clause that no longer
  existed, so A15 made it less wrong rather than more. Collapsing it needs a ruling on **which file
  owns the `--incremental` obligation**, which reaches into `mutation-testing.md`'s own structure.
  `pipelines.md` calls that a split signal, and this slice has no authority to make it.
- **Step 5's `Procedure.ProcedureLength` finding.** Still accepted, still measured at a 21-word
  floor.
- **The extraction record's own `this slice` instances.** Pre-existing, dated 2026-09-17, out of
  scope. Item B4 fixes only what this slice wrote.

## Part B-4 — board candidates from round 2

Two, and both meet the filing bar: each needs a ruling this slice has no authority to make.

1. **`enabler-process` — which file owns the `--incremental` obligation.** `merge-protocol.md` step
   5 and `mutation-testing.md`'s blockquote both instruct a future slice to restore
   `reports/stryker-incremental-scripts.json`. `prose.md` forbids an instruction file restating a
   section it cites. The fix is one of them citing rather than restating, and choosing which is a
   ruling about `mutation-testing.md`'s structure.
2. **`enabler-process` — `claim-discipline.md` does not name the self-describing count.** Part
   B-0's diagnosis generalises past this pair: **a count of your own in-flight diff is a census of
   a moving target**, and the article's census rule does not reach it. Thirteen findings across two
   rounds are the evidence. It binds every role, so it is not this slice's to add.

**Neither is deferred rework.** Neither is a defect this slice created, and neither can be settled
inside a merge-protocol register split.
