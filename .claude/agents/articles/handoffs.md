# Article: Handoff Rules

Adapted from unclebob/swarm-forge's `main`-branch constitution (`swarmforge/constitution/articles/handoffs.prompt`). The source article describes a file-based `git_handoff`/`note` message protocol driven by helper scripts (`swarm_handoff.sh`, `ready_for_next.sh`, `done_with_current.sh`) and tmux wake-ups across per-role worktrees — none of that exists in this repo. What's portable is the underlying discipline:

## Sending a handoff

- Commit your changes first, then report back to the orchestrating session with what you did and which files changed — this is this repo's equivalent of a `git_handoff` message. See each role file's own "Handoff" section for what to report and who's invoked next.
- Always report back and hand off to the next role in the cycle when you finish your part of a task, even if your pass made no substantive change (e.g. cleanup found nothing to clean) — don't silently stop the chain.
- Use a stable, descriptive name for the slice of work you're handing off (the specifier invents it; every later role in the same cycle should keep using it) so it's unambiguous across the whole specifier → coder → cleaner → architect → hardener → qa cycle what's being worked on.

## When blocked

- When blocked by ambiguity, a contradiction, or a conflict between the spec and what you're finding in the code, stop and ask for clarification (report it back to the orchestrating session, which relays to the user) rather than guessing and proceeding.

## Dropped from the source article (not applicable here)

- The entire `swarm_handoff.sh`/`ready_for_next.sh`/`done_with_current.sh` file-based message protocol, `type: git_handoff`/`type: note` header formats, `priority: NN` fields, tmux notifications, and merge-only broadcast semantics for the terminal handoff — this repo has no daemon or persistent process wiring roles together; the orchestrating Claude Code session invokes each role directly via the `Agent` tool and sequences the handoffs itself, per `CLAUDE.md`.
