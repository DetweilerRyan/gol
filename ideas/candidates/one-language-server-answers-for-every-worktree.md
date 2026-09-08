---
name: one-language-server-answers-for-every-worktree
title: Stale LSP hovers come from the write path, not the worktree — decide what to do about it
created: 2026-09-06
---

## Context

This candidate was filed after `jsdoc-in-src` hit two LSP failures, and it asserted a
mechanism for the second one: _a server rooted at the primary checkout has no file
watcher on files in another worktree, so it reads such a file once and nothing ever
invalidates that read._ Its own text conceded this was "inference from observed
behaviour, not a measurement", and its Sketch proposed per-worktree servers derived the
way `dev-port.ts` derives a port.

**A spike on 2026-09-08 measured it. The mechanism was wrong, and so was the competing
guess that the server was merely lagging behind the agent's writes. The variable is
neither the worktree nor elapsed time — it is _which tool performed the write_.**

### The measurement

Spike conditions: macOS, Claude Code 2.1.231, `typescript-lsp@1.0.0`,
`typescript-language-server` from the global nvm install, one throwaway worktree, and
untracked probe files carrying a nonce sentinel in a JSDoc summary. Probe files were
deleted afterwards; both trees ended clean. Every hover used an **absolute** path except
where the misroute was the thing being tested.

| Arm               | Setup                                                                     | Result                                                               |
| ----------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1 — in-root       | probe inside the server's **own** root, edited with `sed`                 | stale at t = 0s, 45s, 117s, 265s. Never converged.                   |
| 2 — cross-tree    | probe in a worktree, absolute path, server rooted at the primary checkout | **first** read fresh; after a `sed` edit, stale at t = 0s and ~220s. |
| 3 — native root   | same file after `EnterWorktree` into that worktree                        | same stale answer; no new server spawned, pid and cwd unchanged.     |
| control — re-read | `cat`, then the harness `Read` tool, on the stale file                    | no effect.                                                           |
| control — Edit    | the harness `Edit` tool on the worktree probe                             | **fresh immediately.**                                               |
| control — `sed`   | `sed` again on that same file, right after the Edit succeeded             | stale again.                                                         |
| control — Write   | the harness `Write` tool over a `sed`-staled probe                        | **fresh immediately**, same as `Edit`.                               |
| control — refresh | trivial `Edit` **elsewhere** in a `sed`-staled file (a trailing newline)  | **whole file re-synced** — the unrelated `sed` change showed up too. |

**The cache is whole-file, not comment-only.** Changing `(a: number): number` to
`(a: string): string` alongside the summary left the reported **signature** stale too, so
every LSP operation is served from the frozen buffer — `findReferences` and
`goToDefinition` included, not just `hover`.

### The mechanism, as measured

The server answers from a snapshot the **harness** sends it. The first LSP touch of a
file transmits its then-current content; after that, only a write made **through the
harness's own `Edit`/`Write` tool** updates that snapshot. A write that bypasses the
harness leaves it frozen indefinitely — `sed`, `cat >`, a heredoc, and by extension
`git rebase`, `git checkout`, and anything that rewrites files underneath the session
such as `npm run format`. `Edit` and `Write` were each measured to re-sync; the
out-of-band forms above were measured only for `sed`, `cat >` and heredocs, and the
`git`/Prettier cases are inference from the same write path rather than separate
measurements.

**The re-sync is whole-file, and that is what makes a refresh idiom possible.** A
trivial `Edit` to an unrelated part of a staled file — a trailing newline at the end —
made the server pick up a `sed`-authored change to the comment block as well. So the
snapshot is replaced wholesale from disk on any harness write, not patched at the edited
range.

That explains the original `toggleLibrary` failure exactly: the correction was rebased
away, and a rebase is an out-of-band write, so the pre-rebase snapshot was served
forever. It also explains why the failure looked worktree-shaped — the worktree work was
simply where out-of-band writes were happening.

**Both prior explanations are refuted.** Not the missing watcher: the in-root arm, where
a watcher is supposed to exist, never converged either, so the project root is not the
variable. Not lag: five minutes produced no movement, and the same file went fresh
instantly under an `Edit`, so it is not latency.

### Facts about the servers, same date

- **Per-session, not one global**, spawned **lazily on the session's first LSP call**,
  rooted at the session's cwd **at spawn**. Verified with `pgrep` + `lsof -a -p <pid> -d cwd`.
- **`EnterWorktree` does not re-root or restart one.** After entering, the session's
  server kept both its pid and its original cwd.
- **≈85MB resident each** (~78MB `tsserver.js` + a 5–8MB wrapper), via `ps` — so the
  candidate's "if it is a gigabyte each" worry does not hold.
- **One observed server had been alive since Aug 25** — a fortnight of frozen snapshots.
- **No LSP plugin exposes a root/cwd knob.** The union of `lspServers[*]` keys across
  every plugin in the official marketplace manifest is `command`, `args`,
  `extensionToLanguage`, `startupTimeout`; the installed `typescript-lsp@1.0.0` payload
  is a LICENSE and a README with no `plugin.json`. This shows no plugin _uses_ such a
  key, not that the schema forbids one.

### What survives unchanged

**The misroute half, reconfirmed on the same date.** With the two trees' probes carrying
different sentinels, a **relative** path returned the primary checkout's sentinel — it
resolves against the session's cwd, not the tree being edited. This is client-side path
resolution, independent of everything above, and absolute paths stay mandatory under
every outcome. `workflow.md`'s worktree bullet and `doc-comments.md` Part 2 §7's
misroute paragraph both stand as written.

`doc-comments.md` §7's staleness paragraph also stands — it says the server "serves
hover from its own copy of a file, which can be stale after an on-disk edit", which is
correct and is now explained rather than corrected. Note the edit it recorded was made
during a sweep, and the "on-disk edit" phrasing turns out to be the operative detail.
No article states the no-watcher mechanism; it lived only in this file, and is gone from
it as of this rewrite.

## Sketch

The original sketch — per-worktree servers — **would not have fixed either failure** and
is withdrawn. What the measurement leaves is a different and wider problem:

> Any role that edits a file with a Bash command and then hovers it reads its own
> pre-edit bytes, in **any** tree, for the rest of the session.

That is not a worktree hazard, and this repo actively steers into it: `doc-comments.md`
Part 2 makes hover load-bearing ("if the hover answers your question, stop; do not open
the defining file"), while sessions running under auto mode are told to prefer Bash for
file edits. The two instructions compose into a role confidently reading a stale answer.

Candidate responses, cheapest first:

1. **Write the mechanism down** in `doc-comments.md` Part 2 §7, replacing the
   suspected-cause framing with the measured one, and state the rule it implies: a hover
   is trustworthy only if every write to that file this session went through
   `Edit`/`Write`. After a `git` operation or a Bash-authored edit, hover is unsafe until
   the file is re-touched through the harness.
2. **Give roles a forced-refresh recipe.** Measured and available: make any trivial
   `Edit` to the file — it replaces the server's snapshot from disk wholesale, so the
   edit need not touch the region you care about. Adding and removing a trailing newline
   is a net-zero form of it. This is what a role should do after a rebase, a branch
   switch, a `npm run format`, or its own Bash-authored edit, before trusting a hover.
3. **Reconsider the auto-mode "prefer Bash for edits" guidance** for this repo, since it
   is what converts the hazard from rare to routine.

## Touches

`.claude/agents/articles/doc-comments.md` (Part 2 §7, the staleness paragraph and the
hover-before-Read habit in Part 3). Possibly `workflow.md` if the rule is judged to
belong beside the misroute bullet rather than in the doc-comments article. No `src/`, no
`scripts/`, no `.claude/settings.json` — the plugin-config approach is withdrawn.

Docs-only, so the merge-protocol mutation-invariance allowlist covers it.

## Open questions

- **Is this file still named for a refuted framing?** `name` is the branch and tag
  identity end to end, and this one says "for every worktree" when the finding is not
  about worktrees. Renaming a candidate ahead of widening it is precedented on this board
  and is done as its own commit. Ryan's call.
- **What forces a refresh short of a new session? — answered.** Measured to _not_ work:
  elapsed time (5 min), `cat`, the `Read` tool, and `EnterWorktree`. Measured to work:
  `Edit`, `Write`, and a trivial `Edit` to an unrelated part of the file. What remains
  open is not the mechanism but the ergonomics: a refresh a role must _remember_ to
  perform protects only the hovers it remembers to protect, which is the same weakness
  this file already flags for the misroute.
- **How far does the staleness reach?** The signature went stale alongside the comment,
  so the whole buffer is frozen; whether `findReferences` and `goToDefinition` return
  stale _results_ across files was inferred from that, not measured directly.
- **Does this warrant a mechanical guard, or is prose enough?** The failure is silent and
  the wrong answer is usually right — the same combination the original file flagged for
  the misroute. Nothing can check a hover, so a guard would have to act on the write path
  instead, which is a much larger change than the problem may justify.
- **Is the two-week-old server a separate concern?** A session's server outliving many
  branch switches means its frozen snapshots can predate work that has since landed and
  been rebased away — which is the original `toggleLibrary` failure's exact shape.
