---
name: only-harness-writes-reach-the-language-server
title: Only harness writes reach the language server — decide which remedy closes the gap
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

### This is the protocol working as specified, which is why no server setting fixes it

LSP 3.17 says that after `textDocument/didOpen` "the document's truth is now managed by
the client and the server must not try to read the document's truth using the document's
Uri." A **correct** server is required to ignore the disk for an open document. So there
is no server-side configuration to find, and the search for one would have been wasted
effort — the remedy is necessarily client-side. The protocol's own remedies are
`workspace/didChangeWatchedFiles` for closed files and a buffer reload for open ones, and
both live in the client.

The same failure class is open against other clients — `zed-industries/zed#48439`,
"Zed shows cached/old file content when file is modified outside the editor" — so this is
a client-implementation gap, not something peculiar to this harness.

### How large is the stale set

Bounded, and smaller than feared: **the harness registers a file with the server on an
LSP operation, not on a `Read`.** Measured — a probe was created, read through the `Read`
tool, `sed`-ed, and then hovered for the first time; the hover returned the **new**
bytes. So merely reading a file does not enrol it, and the stale set is the intersection
of "files this session has run an LSP operation against" with "files written
out-of-band". That first set is invisible to the agent and accumulates silently for the
life of the session, which is what makes any per-file remedy hard to apply correctly —
see the Sketch.

### Facts about the servers, same date

- **Per-session, not one global**, spawned **lazily on the session's first LSP call**,
  rooted at the session's cwd **at spawn**. Verified with `pgrep` + `lsof -a -p <pid> -d cwd`.
- **`EnterWorktree` does not re-root or restart one.** After entering, the session's
  server kept both its pid and its original cwd.
- **≈85MB resident each** (~78MB `tsserver.js` + a 5–8MB wrapper), via `ps` — so the
  candidate's "if it is a gigabyte each" worry does not hold.
- **One observed server had been alive since Aug 25** — a fortnight of frozen snapshots.
  Servers are nonetheless recycled at some point: a server observed serving this session
  at 09:12 was gone by 12:50 and had been replaced, so "one server per session for the
  session's life" is not safe to assume in either direction.
- **A server is a child process of its own session's `claude`**, confirmed by `ppid`. That
  is what makes a per-session kill possible without disturbing a concurrent session — the
  fortnight-old server above belonged to a different `claude` pid entirely.
- **Killing a server clears every cached snapshot, and the harness restarts it
  transparently.** Measured: a file staled at `BRAVO` against a disk holding `CHARLIE`
  returned `CHARLIE` on the first hover after the server was killed, with no error
  surfaced and a fresh server parented to the same session.
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

Three remedies were measured. They differ mainly in **whether they need to know which
files are stale** — and since that set is invisible (see "How large is the stale set"),
that is the axis that matters, not implementation cost.

| Remedy                    | Needs the stale set?         | Automatable by a hook?          | Cost                                       |
| ------------------------- | ---------------------------- | ------------------------------- | ------------------------------------------ |
| Trivial `Edit` per file   | **yes**, and it is invisible | **no** — hooks lack tool access | free, but silent whenever a file is missed |
| Kill the session's server | no                           | yes, scoped by `ppid`           | discards the project index; cold start     |
| LSP proxy                 | no                           | n/a — always on                 | a permanent moving part                    |

1. **Write the mechanism down — LANDED, and no longer part of this slice.**
   `doc-comments.md` Part 2 §7's first hover hazard now names the write path rather than
   recency, gives the refresh idiom, and records that a `Read` does not enrol a file. The
   measurements sit in `doc-comments.rationale.md`, the register they belong to and one
   exempt from every Vale rule. `workflow.md` carries a peer rule under its own
   "Language server" heading, because that file is read unconditionally by all five roles
   and by the orchestrating session while `doc-comments.md` is trigger-read by three —
   and the seat that runs `git rebase` on every landing had no route to the rule.
   **What remains open is the mechanism, not the documentation.** Read those three files
   before re-deriving any of it.

2. **The per-file `Edit` refresh — demoted to a last resort.** A trivial `Edit` does
   replace the snapshot from disk wholesale, so the edit need not touch the region being
   hovered. But applying it correctly requires enumerating the stale set, and only half of
   that set is knowable: `git diff --name-only` gives the files that changed, while
   nothing exposes which files the session has enrolled with the server. Worse, **a hook
   cannot close the gap**, because the refresh has to go through `Edit`/`Write` and hooks
   run shell commands with no tool access; a hook can compute a list and tell the agent,
   but the agent must still comply per file. Its failure is silent and the wrong answer is
   usually right — the bug's own worst property, inherited whole. An earlier draft of this
   file called this remedy free to adopt; that was written before the stale-set problem
   was understood, and it is withdrawn.

3. **Kill the session's server on out-of-band writes.** Needs no knowledge of the stale
   set, and is `ppid`-scopeable so it cannot disturb a concurrent session. A
   `PostToolUse` hook matching `git` and format commands is the natural trigger — not
   every Bash call, for the cost reason below.

4. **An LSP proxy that resyncs open documents from disk — the recorded decision.**
   `adr/0002-lsp-proxy-for-out-of-band-writes.md` chooses this option and says why each
   other one lost. It is **Proposed rather than Accepted**, deliberately, and promoting it
   is a decision this slice inherits rather than makes. Prototyped and measured in
   `spikes/lsp-fs-sync/` on branch `lsp-fs-sync`: all five out-of-band writes named above
   go stale unproxied and fresh proxied, with the in-band `didChange` path proven
   unbroken. It is the only option that addresses the cause rather than periodically
   discarding the symptom, and the only one with a permanent maintenance cost.

5. **Reconsider the auto-mode "prefer Bash for edits" guidance** for this repo, since it
   is what converts the hazard from rare to routine. Independent of which remedy wins.

### Precedent for the restart remedy

Restarting is the canonical, first-class remedy in every editor: VS Code ships
`TypeScript: Restart TS Server`, and Neovim has `:lsp restart` — added after
`neovim/neovim#13946` recorded that it "lacks a first-class way to restart servers".
Microsoft tracks this exact failure class in `microsoft/vscode#7790` ("Switching branches
results in spurious TypeScript errors") and `microsoft/TypeScript#44066` ("Stale errors
for a few minutes after switching branches").

**One difference in that precedent changes what restarting means here.** In VS Code the
staleness self-heals in roughly two minutes, and people restart because ~20s beats
waiting; restarting there is an impatience optimisation. This harness has no watcher at
all — measured, five minutes with no convergence, and structurally never — so the same
action is a **correctness** requirement rather than a speed-up. The precedent supports the
mechanism while understating the stakes.

**Automating it, by contrast, has essentially no precedent.** The only automated restart
found is `rbuckton/tsserver-live-reload`, which watches the `typescript.tsdk` folder and
restarts when `tsserver.js` itself changes — the same watch-then-restart shape, but aimed
at people hacking on TypeScript rather than at stale project state. Nothing was found that
auto-restarts on a branch switch or an out-of-band write.

**And the documented cost is why nobody automates it.** A restart is "a few seconds to
load in a big project", and `microsoft/vscode#206297` asks for a syntax-server-only
restart specifically to avoid a full restart's downtime — the community treating a full
restart as too heavy to do casually. That argues for a narrow trigger, and against an
eager one.

## Touches

`.claude/agents/articles/doc-comments.md` (Part 2 §7, the staleness paragraph and the
hover-before-Read habit in Part 3). Possibly `workflow.md` if the rule is judged to
belong beside the misroute bullet rather than in the doc-comments article. The
plugin-config approach is withdrawn, so nothing in `.claude/settings.json` on that
account.

**Scope depends on which remedy is chosen, and only the first stays docs-only:**

- Remedy 1 or 2 alone — docs-only, and the merge-protocol mutation-invariance allowlist
  covers it.
- Remedy 3 (kill-hook) — adds a hook to `.claude/settings.json`. Still inside the
  allowlist, but it is executable configuration rather than prose and wants its own
  verification.
- Remedy 4 (proxy) — `spikes/lsp-fs-sync/` exists on branch `lsp-fs-sync` and introduces
  a new top-level `spikes/` directory, which is a repo-shape decision in its own right.
  Promoting it to `scripts/` would pay the full gate freight (CRAP ≤ 6, its own vitest
  suite, `dry4ts:scripts`, mutation testing), and that is outside the allowlist.

## Open questions

- **Was this file named for a refuted framing? — settled.** It was:
  `one-language-server-answers-for-every-worktree` named the worktree explanation the
  spike disproved. Renamed for the measured mechanism instead, move-only so
  `git log --follow` reads across it. The old name is worth knowing when reading commits
  before that point, since `name` is the identity end to end — file, branch, and the
  eventual `slice/<name>` tag.
- **What forces a refresh short of a new session? — answered.** Measured to _not_ work:
  elapsed time (5 min), `cat`, the `Read` tool, and `EnterWorktree`. Measured to work:
  `Edit`, `Write`, a trivial `Edit` to an unrelated part of the file, and killing the
  server. The ergonomic weakness that remains applies to the per-file forms only, and is
  now stated in the Sketch rather than here.
- **Which remedy, and is more than one wanted?** The real decision this file now carries.
  Remedy 1 is worth doing regardless; 3 and 4 are alternatives rather than complements,
  and 4 already exists in prototype. Nobody has automated a restart on this trigger
  before, so remedy 3 would be maintained without a precedent to copy.
- **Would the kill-hook exhaust `maxRestarts`?** The plugin schema caps restart attempts,
  and a hook firing on every out-of-band write could plausibly hit that cap and leave a
  session with no server at all — a silent loss of the tool rather than a stale answer.
  Inferred from the documented field, not measured; one kill was observed to restart
  cleanly. This is the main thing to measure before adopting remedy 3.
- **Does the proxy survive contact with the real harness?** Every proxy row was measured
  against a conforming LSP client written for the spike, which proves the server sees the
  write but not that the harness's own client tolerates the proxy end to end. Needs the
  opt-in install, and note the official `typescript-lsp` plugin must be disabled first
  since the first server registered for an extension wins.
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
