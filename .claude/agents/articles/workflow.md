# Article: Workflow Rules

Adapted from unclebob/swarm-forge's `main`-branch constitution (`swarmforge/constitution/articles/workflow.prompt`) for this repo, which has no tmux orchestration — a single Claude Code session invokes each role in turn via the `Agent` tool, per `CLAUDE.md`'s Subagent pipeline section. It does have worktrees, but along a different axis than the source article's: one per **slice**, not one per role (see below).

## Lint and format

- Run `npm run lint` (oxlint), then `npm run format` (Prettier), in that order, while you work — and always as the last two steps immediately before every commit, so nothing you commit is unformatted or has lint findings you didn't at least see.

## Role boundaries

- Ported from swarm-forge's six-pack branch's own `project.prompt`: don't change another role's `.claude/agents/*.md` file, or take over its workflow/responsibilities, without the user explicitly directing it. Each role's file is the source of truth for its own boundaries — if you think another role's scope should change, say so and ask, don't just start doing that role's job or editing its file yourself. (The `specifier`+`qa` → `product` merge, and `architect` gaining ADJUDICATE, were directed by the user — see the merge commit.)

## Commit messages

- Prefix the subject with the slice name, and name your role in the body, in this form:

  ```text
  pattern-library-placement: implement placement logic

  By coder.
  ```

- Both halves are required. `By <role>.` alone no longer identifies a commit: every role runs in every slice, and several slices may be in flight at once, so without the prefix a `git log` on `main` interleaves two slices' role sequences with nothing to tell them apart.
- **Acceptance-spike commits carry `[spike]` in the subject** and `By <role> (spike).` in the body — for example `pattern-placement: [spike] draft contract` / `By product (spike).`. The spike's _implementation_ is never committed at all (see `product.md`), so this marker only ever appears on contract drafts. `hardener` and `product` both check that no `[spike]` commit touched `src/` or `scripts/`.

## Announcements

- When reporting back to the orchestrating session (not a git commit), don't prefix every line with your role name — the orchestrating session already knows which role it invoked. State findings/results directly.

## Temporary files

- Don't write scratch or intermediate files into this repo's tracked tree. If you need a scratch file mid-task, use a location outside version control and clean it up before finishing.

## Failure conditions

- If something you expect to exist is missing (an approved `.feature` file, a prior role's commit, a config file a workflow step depends on), stop and report the discrepancy instead of silently working around it or guessing what should be there.
- **If a whole-repo gate fails on a file outside your slice's changed-files manifest, do not fix it.** Your worktree is isolated from every other slice, so a failure there is either a pre-existing break on `main` or something a rebase just brought in — both belong to the orchestrating session, not to you. Report the failing gate, the failing file, and the fact that it sits outside your manifest, then stop. Fixing it widens your diff across a slice boundary and turns a clean fast-forward into a conflicted merge.

## Worktrees and branches

- **One slice, one git worktree, one branch, one Claude Code session.** The branch is named for the slice — the same stable name `product` invents, per `handoffs.md`. Every role in a cycle runs in that slice's worktree and commits to that slice's branch.
- **Never commit to `main`.** `main` is written to only by the merge protocol in `CLAUDE.md`'s "Running slices concurrently" section, which the orchestrating session drives. If you find yourself on `main`, or in a directory that isn't your slice's worktree, stop and report it rather than committing.
- The worktree may live outside the repo (`../gol-claude-worktrees/<slice>`) or inside it (`.claude/worktrees/<slice>`, where Claude Code's own `EnterWorktree` puts it). Both are supported and both are invisible to git, Prettier, oxlint, and vitest. Each worktree has its own `node_modules` (run `npm ci` once when it's created) and its own dev-server port, derived in `dev-port.ts`.
- **Never `git checkout`, `rebase`, `merge`, or `push`.** Those are the orchestrating session's, for the same reason: you can only see your own slice.

## Dropped from the source article (not applicable here)

- `.worktrees/<role>` directories and the prohibition on running `./swarm` from an agent worktree. This repo's worktrees are per-slice, not per-role: all six roles run in the same worktree, one after another, and it's the slices that run in parallel.
