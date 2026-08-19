# Article: Workflow Rules

Adapted from unclebob/swarm-forge's `main`-branch constitution (`swarmforge/constitution/articles/workflow.prompt`) for this repo, which has no multi-worktree/tmux orchestration — a single Claude Code session invokes each role in turn via the `Agent` tool, per `CLAUDE.md`'s Subagent pipeline section.

## Lint and format

- Run `npm run lint` (oxlint), then `npm run format` (Prettier), in that order, while you work — and always as the last two steps immediately before every commit, so nothing you commit is unformatted or has lint findings you didn't at least see.

## Role boundaries

- Ported from swarm-forge's six-pack branch's own `project.prompt`: don't change another role's `.claude/agents/*.md` file, or take over its workflow/responsibilities, without the user explicitly directing it. Each role's file is the source of truth for its own boundaries — if you think another role's scope should change, say so and ask, don't just start doing that role's job or editing its file yourself.

## Commit messages

- Include your role in every commit message you make, in this form: `By <role>.`

  ```text
  Implement pattern-library placement logic

  By coder.
  ```

## Announcements

- When reporting back to the orchestrating session (not a git commit), don't prefix every line with your role name — the orchestrating session already knows which role it invoked. State findings/results directly.

## Temporary files

- Don't write scratch or intermediate files into this repo's tracked tree. If you need a scratch file mid-task, use a location outside version control and clean it up before finishing.

## Failure conditions

- If something you expect to exist is missing (an approved `.feature` file, a prior role's commit, a config file a workflow step depends on), stop and report the discrepancy instead of silently working around it or guessing what should be there.

## Dropped from the source article (not applicable here)

- Worktree discovery/discipline, `.worktrees/<role>` directories, and the prohibition on running `./swarm` from an agent worktree — this repo has no per-role worktrees; every role operates in the same single checkout, sequenced by the orchestrating session.
