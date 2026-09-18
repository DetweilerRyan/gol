# The merge protocol: landing a slice on `main`

**Audience:** the orchestrating seat, which runs every step. `hardener` reads step 5's exemption
clause when an invoking prompt names it. **Read when:** before landing a slice — at step 1, rather
than part-way through a merge.

CLAUDE.md's "Running slices concurrently" carries the serial-landing rule and the worktree isolation
this protocol assumes. Read that section first; nothing here repeats it.

## The protocol

1. **Rebase, do not merge.** In the slice's worktree: `git fetch && git rebase main`.
2. **The slice's own session resolves its own conflicts**, in its own worktree. `main` never enters a conflicted state.
3. **Re-run the gate on the rebased branch, still in the worktree** — `hardener` must use `npm run test:mutation:full`.

   **The one exception: if the merge is mutation-invariant, stage 5 does not run at all.** See the clause under step 5, and evaluate its predicate here, at this step.

   Pay attention to `npm run ast-grep:rules` here specifically. It is the gate most likely to have been broken by the _other_ slice's renames invalidating a `files:` glob. Post-rebase, that breakage is legitimately yours.

4. **Fast-forward `main`:** `git checkout main && git merge --ff-only <slice>` from the primary checkout.
5. **Run the full gate on `main`.** Mandatory, even though step 3 just passed on an identical tree. **The one exception: if this is a mutation-invariant merge, skip the deletion below entirely.** Read the clause below before running it:

   ```bash
   rm -f reports/stryker-incremental.json
   ```

   then invoke `hardener` on `main` with the whole tree as its scope.

   **Adding `--incremental` to `npm run test:mutation:scripts` re-arms this deletion.** A slice that adds it must put `reports/stryker-incremental-scripts.json` back into the `rm -f` block above.

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

   **The rule is what binds, never an example.** An example a later slice can falsify is what produced a defect here once.

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
