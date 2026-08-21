# Article: Handoff Rules

Adapted from unclebob/swarm-forge's `main`-branch constitution (`swarmforge/constitution/articles/handoffs.prompt`). The source article describes a file-based `git_handoff`/`note` message protocol driven by helper scripts (`swarm_handoff.sh`, `ready_for_next.sh`, `done_with_current.sh`) and tmux wake-ups across per-role worktrees — none of that machinery exists in this repo. Worktrees do, but per **slice** rather than per role (see `workflow.md`), so they carry no handoff traffic: within a slice, every role works in the same worktree and hands off in sequence. What's portable is the underlying discipline:

## Sending a handoff

- Commit your changes to the slice branch first, then report back to the orchestrating session — this is this repo's equivalent of a `git_handoff` message. See each role file's own "Handoff" section for what to report and who's invoked next.
- Report **two** file lists, not one:
  - Your **changed-files manifest** — the exact output of `git diff --name-only main...HEAD`, which is the whole slice's diff against `main`.
  - The files **your own pass** touched, as a subset of it.

  The next role uses the second as its work scope and the first as its verification scope. Nothing else is a substitute: `git status` is empty the moment you commit, and `git diff HEAD~1` is wrong as soon as a role makes two commits. Every instruction that says "the files the previous role touched" means this manifest.

- Always report back and hand off to the next role in the cycle when you finish your part of a task, even if your pass made no substantive change (e.g. cleanup found nothing to clean) — don't silently stop the chain.
- Use a stable, descriptive name for the slice of work you're handing off (the specifier invents it; every later role in the same cycle should keep using it) so it's unambiguous across the whole specifier → coder → cleaner → architect → hardener → qa cycle what's being worked on.

## Concurrent slices

- Several slices may be in flight at once, each in its own worktree on its own branch. You see only your own, and that is deliberate — don't go looking for the others.
- Never edit a file your slice's approved scope doesn't cover, even to fix something that is obviously broken. See `workflow.md`'s failure conditions for why, and what to report instead.
- The slice name is the branch name and the worktree directory name, not just a label in prose.

## When blocked

- When blocked by ambiguity, a contradiction, or a conflict between the spec and what you're finding in the code, stop and ask for clarification (report it back to the orchestrating session, which relays to the user) rather than guessing and proceeding.

## Dropped from the source article (not applicable here)

- The entire `swarm_handoff.sh`/`ready_for_next.sh`/`done_with_current.sh` file-based message protocol, `type: git_handoff`/`type: note` header formats, `priority: NN` fields, tmux notifications, and merge-only broadcast semantics for the terminal handoff — this repo has no daemon or persistent process wiring roles together; the orchestrating Claude Code session invokes each role directly via the `Agent` tool and sequences the handoffs itself, per `CLAUDE.md`.
