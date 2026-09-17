# The merge protocol: landing a slice on `main`

**Audience:** the orchestrating seat, which runs every step. `hardener` reads step 5's exemption
clause when an invoking prompt names it. **Read when:** before landing a slice — at step 1, rather
than part-way through a merge.

CLAUDE.md's "Running slices concurrently" carries the serial-landing rule and the worktree isolation
this protocol assumes. Read that section first; nothing here repeats it.

## The protocol

1. **Rebase, do not merge.** In the slice's worktree: `git fetch && git rebase main`. This keeps `main` linear, which is what `workflow.md`'s "a prior role's commit" ordinal reasoning assumes, and keeps each slice's `By <role>.` chain readable in order.
2. **The slice's own session resolves its own conflicts**, in its own worktree — it has the context the orchestrator does not. `main` never enters a conflicted state.
3. **Re-run the gate on the rebased branch, still in the worktree.** Invoke `hardener` again. It must use `npm run test:mutation:full`. The rebase brought in another slice's moved and renamed files, which is exactly the file-level assumption the incremental cache cannot survive. **The one exception: if the merge is mutation-invariant, stage 5 does not run at all.** See the clause under step 5, and evaluate its predicate here, at this step.

   Pay attention to `npm run ast-grep:rules` here specifically. It is the gate most likely to have been broken by the _other_ slice's renames invalidating a `files:` glob. Post-rebase, that breakage is legitimately yours.

4. **Fast-forward `main`:** `git checkout main && git merge --ff-only <slice>` from the primary checkout. `--ff-only` is the assertion that step 1 actually happened.
5. **Run the full gate on `main`.** Mandatory, even though step 3 just passed on an identical tree — step 3 ran against a different Stryker cache and a different `coverage/`. This run is what rebuilds `main`'s own caches into a state the next merge can trust. **The one exception: if this is a mutation-invariant merge, skip the deletion below entirely.** Read the clause below before running it:

   ```bash
   rm -f reports/stryker-incremental.json
   ```

   then invoke `hardener` on `main` with the whole tree as its scope. Deleting the cache is the honest expression of intent. It is not stale; it is describing a tree that no longer exists, which is the situation `.claude/agents/articles/mutation-testing.md` already names.

   **One path, not two, and that is deliberate.** `npm run test:mutation:scripts` passes no `--incremental` flag, so the `scripts/` side **never writes `reports/stryker-incremental-scripts.json` at all** — see `.claude/agents/articles/mutation-testing.md` for the source-level verification of that. Adding the flag is what re-arms this deletion, so a slice that adds it must put the second path back here.

   **Mutation-invariant merges — the one exemption, and it is stage 5 only.** Steps 3 and 5 both mandate `npm run test:mutation:full`, and for some diffs that is two full runs measuring a quantity that provably did not move. `stryker.config.json`'s `mutate` list covers only `src/**`, and its `ignorePatterns` keeps `features/` out of the sandbox entirely. So for a diff confined to the paths below, neither a mutant nor a test that could kill one is reachable.

   **The predicate quantifies over `npm run test:mutation`, the `src/` run, and that scope is load-bearing rather than incidental.** `stryker.scripts.config.json` carries no `ignorePatterns` at all. Two `scripts/` tests read `features/*.feature` from the live tree. So a `features/**`-only diff can change a `scripts/` test's outcome, and therefore a mutant's fate, under `npm run test:mutation:scripts`. Nobody has ruled on whether the whole-tree gate at step 5 includes that run. Until someone does, **read every entry below as argued for the `src/` run only**, and treat `features/**` under the `scripts/` run as unverified rather than safe.

   Left unaddressed this is not merely a cost. It is a standing incentive to bundle unrelated features into one slice, to pay the bill once. That is the opposite of what the serial-landing rule is for.

   **The predicate is an allowlist of paths that cannot move the score, not a list of the paths that can.** That direction is the whole design. A blocklist fails **open**: a path nobody thought to list silently skips the mutation gate, and a skipped run reads exactly like a passing one. That is the same dangerous direction as the `ignorePatterns` glob that matches nothing, already described in `.claude/agents/articles/mutation-testing.md`. An allowlist fails safe: an unanticipated path simply runs the gate.

   **The predicate is computed, not recalled.** The allowlist lives in `mutation-invariance.config.json`, and `npm run mutation-invariance` evaluates it. Run it in the slice's worktree, after step 1's rebase:

   ```bash
   npm run mutation-invariance -- --diff main...HEAD
   ```

   Exit **0** means the diff is mutation-invariant. Exit **2** means it is not, and the output names the first disqualifying path. Exit **1** means the config itself failed validation, so **no verdict was computed** — read that as "run stage 5", never as a pass. Redirect to a file and read `$?` on the next line. A pipe replaces the exit status with the pipe's own.

   **The list is not restated here, and that is deliberate.** It once lived in this file, in `mutation-testing.md` and in `hardener.md` at the same time, and the three drifted apart. Each entry's argument now lives in `.claude/agents/articles/mutation-testing.meta.md`, which the checker binds to the config: its check C4 fails when a config path has no prose there. So add an entry by editing the config and writing its argument, never by editing prose alone. **Adding a path requires the argument, not the intuition.** The failure mode of a wrong entry is a skipped stage that reads exactly like a passing one.

   **`mutation-invariance.config.json` and `schemas/**` are themselves on the absent list.** A diff that widens the allowlist therefore re-arms the full run in that same diff. Without those two entries, the first slice to edit the allowlist would be granting itself an exemption.

   **A comment-only edit under `src/` cannot move the mutation score, and that is a ruling with an argument rather than an intuition.** Ruled 2026-09-09 by the user. Stryker's mutators operate on AST nodes: arithmetic, conditionals, literals. A comment is not one, so a comment-only diff creates no mutant, removes none, and re-fates none. **This is not an allowlist entry.** `src/**` stays off the list, and the exemption is claimed per diff, by demonstrating the diff is comment-only rather than by matching a path.

   **One carve-out, and it is why the demonstration has to be per diff.** A comment carrying a _directive_ is not inert. `// prettier-ignore`, `@ts-expect-error`, an `eslint-disable`, and this repo's own `` `reference-check:` `` and `# ast-grep-rule-check:` markers all change what a tool does. Any of those re-arms the full run. So show the diff contains no such line before claiming this, the same way the path predicate is computed rather than recalled.

   **Every other stage still runs — but re-derive which of them can actually move, because the old argument here died with the `acceptance` project.** That argument was that `npm run test:coverage` ran four projects, the `acceptance` one mounted `<App />`, and its coverage landed on `src/`. So `crap4ts` genuinely moved on a `features/`-only diff.

   `delete-step-test-layer` removed that project. **Measured on the landed tree, `coverage/coverage-final.json` now contains zero `features/` entries.** No vitest project loads anything in that directory, so a `features/`-only diff moves neither `crap4ts` nor `dry4ts`, which scores `src` alone.

   What still moves on such a diff is **`npm run build`**: `tsconfig.app.json`'s `include` is `["src", "features", "perf"]`, so a type error there fails stage 1. For the `.claude/**` and `CLAUDE.md` entries, **`npm run agent-doc-check`** moves too.

   **That list is per-entry, not universal, so re-derive it for the entry you are exempting.** A `rules/**` or `rule-tests/**`-only diff moves a different set. `build` is not among them, since `tsconfig.app.json`'s `include` names neither directory. **Stage 2, `npm run reference-check`, does move**, because a deleted rule file breaks any doc line citing its filename. So does **stage 8, `npm run agent-doc-check`**, whose check 5 reads the live `rules/` listing against `.claude/agents/articles/ast-grep-rules.md`.

   Note this does not weaken the exemption. The predicate is an allowlist of paths that cannot move the **mutation score**, and that is more clearly true now, not less. It does mean the honest claim is narrower than it used to be. This exempts one stage from one run, and the stages that remain are fewer than the sentence this replaces implied. It is still not a fast path through the gate.

   **Compute the predicate once, in step 3's worktree after the rebase, and carry the answer to step 5.** Step 4 is a fast-forward, so the tree step 5 gates is byte-identical to the one step 3 gated. There is no second diff worth taking, and reconstructing one from `main`'s reflog is a worse way to ask the same question.

   **When stage 5 is skipped, step 5 does not delete the incremental cache.** The `rm -f` above exists because the cache describes a tree that no longer exists. Under this predicate **no mutated file and no collected test differs** from the one it was built from.

   State it that way, and not as "the tree Stryker sees is byte-identical". That stronger claim is literally false, and false in the dangerous direction. `backlog/`, `.claude/` and `CLAUDE.md` are tracked and _are_ copied into the sandbox; only `/features` is ignored. A reader might check the stronger claim, find it false, and reason "well, these are in the sandbox too". That would extend the allowlist by exactly the wrong logic.

   Deleting the cache would tax the next merge with a full cold run in exchange for nothing. That answers step 5's own "different cache" justification on its own terms, rather than waiving it.

   **`hardener` may refuse an exemption; it may never grant itself one.** The rule is deliberately asymmetric, because the two errors differ. Wrongly granting is silent and permanent; wrongly refusing costs one mutation run.

   So the orchestrating session evaluates the predicate and hands it to `hardener` in the invoking prompt, naming the diff it was computed over. Absent that instruction, `hardener` runs stage 5, full stop. But `hardener` **may** check the handed-down claim against `git diff --name-only`, and **must** run stage 5 anyway if it can falsify it. A verification that comes back "invariant" grants nothing on its own; only the instruction does.

   That is the narrower prohibition the safety argument actually justifies. A role that can excuse itself from its own gate is not a gate, which says nothing about a role that can decline an excuse.

   **Record every skip, and know which option was not taken.** A skipped stage produces no artifact, which is the same property that makes wrongly granting an exemption dangerous. So `hardener`'s handoff must name the skip, the instruction it was handed, and the diff that instruction covered, and this merge carries that forward. A written record is not a score, but it makes a skip distinguishable from a pass, which was the actual gap.

   **The middle option was considered and is not what this clause does.** Since the cache is retained here by design, a plain `npm run test:mutation` would still produce a real score — most of the saving _plus_ the missing evidence. Its cost argument got considerably stronger once `pin-stryker-seed-to-unblind-the-mutation-gate` removed the `@fast-check/vitest` floor. A warm run on an unchanged tree is now 24s, rather than the ~3m45s that paragraph used to record.

   It is still not adopted, for a reason the collapse does not touch and which is specific to step 3. That branch was **just rebased onto a `main` that moved**, so the worktree's cache is stale with respect to everything the rebase brought in. That is the protocol's own stated reason for mandating `:full` there. The 24s figure is measured for a warm cache on an unchanged tree, and says nothing about that case.

   The argument is much stronger at step 5, where `main`'s own cache differs from the tree by exactly the invariant diff. So the middle option is really a step-5 proposal. It changes what the gate measures, so it is a slice of its own rather than a paragraph here.

   **The exemption is self-revoking.** If `hardener`'s own remediation at any stage writes a file outside the allowlist, the exemption is void from that point and stage 5 runs.

   This is not hypothetical, and **the trigger is stage 1**. `tsconfig.app.json`'s `include` is `["src", "features", "perf"]`, so a type error a `features/`-only diff introduces is a real `npm run build` failure, and its fix can reach `src/`. That adds a file Stryker mutates, _after_ the stage that would have measured it was skipped.

   **Stage 6 was the example this clause used to give, and the paragraph above now refutes it.** That example rested on the `acceptance` project, whose removal left `coverage/coverage-final.json` with zero `features/` entries, so `crap4ts` cannot legitimately move on an allowlist-only diff. The example outlived its premise and was repaired by `the-invariance-allowlist-omits-paths-that-provably-cannot-move-a-mutant`. Read this as a caution about examples in this clause. **The rule is what binds.** An example a later slice can falsify is what produced the defect.

   Stage 8, `npm run agent-doc-check`, is not a replacement trigger. It moves on the doc entries, but its remediation is prose and cannot reach `src/`.

   It is written as a self-revocation rather than as a caveat, because it then resolves safely for a careless reader. The skip instruction is the more specific and more recent one, so anything phrased as an exception to it loses. See `.claude/agents/hardener.md`'s stage 5.

6. **Tag the slice's final commit**, annotated, as `slice/<slice-name>`:

   ```bash
   git tag -a slice/<slice> -m "<slice>: <one line on what the slice delivered>"
   ```

   After the fast-forward in step 4 the slice's tip _is_ `main`'s tip, so this marks both. Tag after step 5 rather than before it. The tag says the slice is done, and it is not done until the gate on `main` passes.

   The `slice/` prefix is load-bearing. A bare tag sharing the slice branch's name makes every `git log <name>` ambiguous until the branch is deleted in step 9. It also makes `git tag -l 'slice/*'` a list of every completed slice. Annotated rather than lightweight, so the tag carries its own date and message.

   If the slice began as an entry on the idea board, its folder already sits at `backlog/done/<slice>/` by now — the slice moves it there as its final commit before step 3's gate, and the retrospective deletes it later. See "Idea board" above. This tag is the permanent completion record either way.

7. **Push `main` and the tag:** `git push --follow-tags` (plain `git push` leaves the tag behind).

   This repo sets `push.followTags = true` locally, so a plain `git push` already carries the tag. The flag stays written out here because `.git/config` is not tracked, so a fresh clone or a CI checkout will not have the setting. Note the setting only follows **annotated** tags reachable from what you are pushing. A lightweight tag is silently left behind, which is one more reason step 6 specifies `git tag -a`.

8. **Carry the acceptance-mutation figure forward** from `product`'s VERIFY handoff — it comes from there now rather than from `hardener`'s. This is a read, not an edit. `engineering.md` deliberately records **no literal**, and says why in the same breath: "a literal in this file is wrong the moment the second one lands". So there is nothing in that file to re-record.

   What the step is actually for is noticing when the figure moved, and whether the slice explains it. A slice that touched no `.feature` and no `features/steps/*.ts` leaves the Examples-table mutant surface byte-identical, so a moved figure wants an explanation before it is accepted. Those are the two inputs since `acceptance-mutation-on-playwright`; `*.steps.test.*` was the second one before it, and the runner no longer touches that layer at all.

   Note the surface being identical does not by itself guarantee identical kill outcomes. A `src/` change to a module the steps exercise can flip a mutant's fate while the unmutated baseline stays green. That is exactly why a move is a finding to understand rather than a new baseline to record.

9. **Retire the worktree:**

   ```bash
   git worktree remove <path>
   git merge-base --is-ancestor <slice> main && git branch -D <slice>
   git worktree prune
   ```

   Assert the ancestry yourself rather than leaning on `git branch -d`. `-d`'s built-in "fully merged" test measures against whatever branch is currently checked out. Under concurrency the primary checkout is normally sitting on some _other_ slice's branch, so `-d` refuses a slice that is in fact already `main`. (Safe, but it stops you every time.) The check above asserts the condition you actually care about, and `-D` cannot do damage because it only runs once that assertion has passed. The tag is what preserves the slice's identity once the branch is gone.

The next slice repeats from step 1 against the new `main`.

## Runs the seat owns outside the protocol

<!-- reference-check: allow latest.md -- generated by npm run perf-report and gitignored, so it never resolves against the tracked tree -->

**`npm run test:perf` is owned by the orchestrating session, not by any role.** It appears in no role's checklist deliberately. Render performance is meant to be held by the architecture — the world-anchored tile keys, the eviction hysteresis — rather than re-measured on every slice. A per-slice harness stage would quietly recast an architectural guarantee as a test result.

So the orchestrator decides when a slice is perf-relevant, and runs `npm run test:perf` **followed by** `npm run perf-report`. Skipping the second leaves the previous run's `reports/perf/latest.md` in place, reading as a successful run of the current tree. The orchestrator also regenerates the `main` baseline first whenever `src/` or `perf/` has moved since that report's own commit. Check it: the report names the commit it was generated from. A role may _recommend_ a run in its handoff, which is a useful signal; no role runs it.

There is deliberately no dedicated perf role for this. The post-merge gate is `hardener`, invoked on `main` and told that it is verifying an integration rather than a slice. The whole tree is then in scope. It already owns exactly that sequence, and already knows when to reach for `test:mutation:full`.
