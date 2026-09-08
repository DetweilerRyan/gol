# 0002. Resync the language server from disk with an LSP proxy

- **Status:** Proposed
- **Date:** 2026-09-08

**Proposed, not Accepted, for one specific reason:** every measurement supporting the
chosen option came from a conforming LSP client written for the spike, not from the
Claude Code harness itself. That proves the language server sees the write; it does not
prove the harness's own client tolerates a proxy end to end. This ADR is promoted to
Accepted only after that run. See Verification.

## Context and problem statement

`.claude/agents/articles/doc-comments.md` Part 2 makes `LSP` hover **load-bearing**: a
role is told that if the hover answers its question it should stop, and not open the
defining file. That instruction is only safe if a hover tells the truth.

It does not, reliably. Measured 2026-09-08 (full ruling and arm-by-arm evidence in
`ideas/candidates/only-harness-writes-reach-the-language-server.md`):

> Once a file has been touched by an LSP operation, every later answer about it is served
> from a snapshot the harness holds. Only a write through the harness's own `Edit`/`Write`
> tool updates that snapshot. Writes that bypass the harness — `sed`, `cat >`, a heredoc,
> `git rebase`, `git checkout`, `npm run format` — never reach the server, **in any tree,
> for the life of the session.**

Elapsed time (five minutes), `cat`, the `Read` tool, and `EnterWorktree` were each
measured **not** to clear it. The frozen buffer is whole-file, not comment-only: a changed
type signature went stale alongside the changed doc comment, so `findReferences` and
`goToDefinition` are served from it too, not only `hover`.

**Two earlier explanations were measured and refuted**, which is why this ADR exists
rather than a smaller fix. The original idea attributed it to a missing file watcher
outside the server's project root; the in-root arm, where a watcher is supposed to exist,
never converged either. A competing guess attributed it to the server lagging behind
writes; five minutes produced no movement, and the same file went fresh instantly under
an `Edit`. Neither the worktree nor elapsed time is the variable — the write path is.

**This is the protocol working as specified.** LSP 3.17: after `textDocument/didOpen`
"the document's truth is now managed by the client and the server must not try to read the
document's truth using the document's Uri." A _correct_ server is required to ignore the
disk for an open document. There is therefore no server-side setting to find, and the
protocol's own remedies — `workspace/didChangeWatchedFiles` for closed files, a buffer
reload for open ones — both live in the client. The same failure class is open against
other clients (`zed-industries/zed#48439`), so this is a client-implementation gap rather
than something peculiar to this harness.

**Why it bites this repo harder than most.** Hover is load-bearing by instruction, and
sessions running under auto mode are simultaneously told to prefer Bash for file edits.
The two compose into a role confidently reading its own pre-edit bytes. The concrete cost
already paid: during `jsdoc-in-src`, a hover reported a claim that had been corrected and
rebased away — text present in no tree on disk.

## Decision drivers

Ordered. The first is what eliminates most options.

1. **Must not require knowing which files are stale.** The stale set is the intersection
   of "files this session ran an LSP operation against" and "files written out-of-band".
   The second half is enumerable (`git diff --name-only`); the first is **not exposed
   anywhere** and accumulates silently for the life of the session. It is bounded —
   measured, a `Read` does not enrol a file — but bounded is not visible.
2. **Must not depend on a role remembering.** Every role is a fresh, stateless
   invocation; a discipline that must be recalled at the right moment protects only the
   hovers someone thought to protect.
3. **Must not fail silently.** The bug's worst property is that a wrong answer is usually
   right — the copies agree everywhere the work has not touched. A remedy that inherits
   that property adds confidence without adding correctness.
4. **Cost proportional to the problem**, in both runtime and maintenance.

## Options considered

### A. Per-worktree language servers

The original proposal: derive a per-checkout server root the way `dev-port.ts` derives a
per-checkout port.

**Rejected — the mechanism it rests on was measured false.** The in-root arm never
converged, so the project root is not the variable, and per-worktree servers would not
have fixed either observed failure. Separately, no LSP plugin exposes a root or cwd knob:
the union of `lspServers[*]` keys across every plugin in the official marketplace manifest
is `command`, `args`, `extensionToLanguage`, `startupTimeout`. Servers also turned out to
be per-session already, spawned lazily on first LSP call, and cost ≈85MB each rather than
the gigabyte the proposal feared — so the resource objection that motivated the design was
also unfounded.

### B. A server-side setting, or `workspace/didChangeWatchedFiles`

**Rejected — foreclosed by the specification.** The client owns an open document's truth;
a conforming server must not read disk for it. `didChangeWatchedFiles` addresses closed
files and workspace indexing, not the open-document case that fails here, and it is a
notification the _client_ must send. Both remedies live on the side we cannot modify.

### C. Per-file trivial `Edit` refresh, as convention

Measured to work, and more cheaply than expected: an `Edit` replaces the server's snapshot
from disk **wholesale**, so a trailing newline at the end of a file picks up a `sed` change
to its comment block. `Write` behaves identically.

**Rejected as the primary remedy — it violates drivers 1, 2 and 3 simultaneously.**
Applying it correctly requires enumerating a set that is half invisible. It cannot be
automated away: a hook could compute the changed-files half and tell the agent, but the
refresh itself must go through `Edit`/`Write`, and **hooks run shell commands with no tool
access**, so the loop cannot be closed. And missing one file produces a confident wrong
answer with nothing failing.

Retained as a **manual fallback** — it costs nothing to use when a role knows it has just
written out-of-band to a file it is about to hover. It is not a policy.

### D. Kill the session's language server on out-of-band writes

Measured working: a file staled at `BRAVO` against a disk holding `CHARLIE` returned
`CHARLIE` on the first hover after the server was killed, and the harness restarted it
transparently. Needs **no** knowledge of the stale set, satisfying driver 1. A server is a
child process of its own session's `claude` (confirmed by `ppid`), so a `PostToolUse` hook
could scope the kill to its own session without disturbing a concurrent one.

**The strongest rejected option, and the fallback if the chosen one fails.** Rejected as
primary on driver 4 and on risk:

- **It discards the whole project index**, so the next LSP call pays a cold start —
  documented at "a few seconds to load in a big project", and `microsoft/vscode#206297`
  exists precisely because a full restart is considered too heavy, requesting a
  syntax-server-only restart to reduce the downtime.
- **`maxRestarts` is a real hazard and is unmeasured.** The plugin schema caps restart
  attempts; a hook firing on every out-of-band write could plausibly exhaust it and leave
  a session with **no server at all** — degrading a stale answer into a silently absent
  tool. One kill was observed to restart cleanly; the cap was not probed.
- **No precedent for automating it.** Manual restart is canonical and first-class
  everywhere — VS Code's `TypeScript: Restart TS Server`, Neovim's `:lsp restart` (added
  after `neovim/neovim#13946`) — and Microsoft tracks this exact failure class
  (`microsoft/vscode#7790`, `microsoft/TypeScript#44066`). But the only _automated_
  restart found, `rbuckton/tsserver-live-reload`, watches `tsserver.js` itself rather than
  project state. Automating on this trigger would be maintained without a pattern to copy.

One asymmetry in that precedent is worth recording, because it is easy to read the
prior art as more reassuring than it is: **in VS Code the staleness self-heals in about two
minutes**, so restarting there is an impatience optimisation. Here it never self-heals, so
the same action would be a correctness mechanism. The precedent supports the mechanism
while understating the stakes.

### E. Do nothing; document the hazard only

**Rejected**, though the documentation half is adopted regardless. Prose alone leaves
drivers 2 and 3 unaddressed, and the hazard has already produced one false claim that
survived into a slice.

### F. An LSP stdio proxy that resyncs open documents from disk — **chosen**

A transparent proxy spawns the real `typescript-language-server`, forwards both
directions, tracks documents the client opens, watches their **containing directory**, and
injects a full-content `textDocument/didChange` into the server-bound stream when disk
diverges. Prototype and evidence in `spikes/lsp-fs-sync/`.

Watching the directory rather than the file is load-bearing: `sed -i ''`, `git checkout`
and Prettier all replace the inode, which silently detaches a file-level watch after the
first change. The proxy also owns the version namespace toward the server, rewriting the
version on every client `didChange`, which is what keeps versions monotonic however client
edits and disk events interleave.

Measured, each scenario run twice — once direct, once proxied:

| scenario                    | direct (control) | through proxy |
| --------------------------- | ---------------- | ------------- |
| `sed -i` (inode replace)    | stale            | **fresh**     |
| `cat >` (truncate in place) | stale            | **fresh**     |
| `git checkout <branch>`     | stale            | **fresh**     |
| `git rebase`                | stale            | **fresh**     |
| `prettier --write`          | stale            | **fresh**     |
| client `didChange` only     | fresh            | **fresh**     |
| `didChange` then `sed`      | partial (`MID`)  | **fresh**     |

The last two rows are regression guards, not demonstrations. The in-band `didChange` path
must stay fresh in **both** columns — a proxy that broke it would be worse than the bug.
The interleaved row is what catches bad version bookkeeping: unproxied, the client's change
lands and the later `sed` is dropped.

Stable across three consecutive runs and at `SETTLE_MS=300`. The harness grades itself and
that guard earned its place: its first draft reported a clean control sweep while in fact
returning `null` for all ten hovers, because the fixture directory had no resolvable
`typescript` install.

## Decision

**Adopt the LSP proxy (F).** Driver 1 settles it: the proxy and the server-kill are the
only options that need no knowledge of the stale set, and between those two the proxy is
the one that fixes the cause rather than periodically discarding the symptom — it resyncs
the file that changed, when it changes, at no per-event cost, where the kill throws away a
whole project index to recover from one edit.

Option C is retained as a manual fallback and option D as the fallback design if the proxy
fails Verification. The documentation half of option E is adopted regardless of which
mechanism wins, because none of them makes the hazard legible to a reader on its own.

## Consequences

**Positive**

- Out-of-band writes become visible automatically; no role has to know or remember
  anything, satisfying drivers 1–3.
- The in-band `Edit`/`Write` path is measured unbroken.
- The hazard stops being a standing tax on `doc-comments.md`'s hover-first instruction,
  which is the guidance that made it costly in the first place.

**Negative**

- **A permanent moving part** sitting in the path of every LSP call in every session. When
  it misbehaves it will look like the language server misbehaving.
- **It rests on an assumption about the harness, not about LSP.** Forcing disk content
  over the client's buffer is safe _only_ because Claude Code has no unsaved-buffer
  concept — every `Edit`/`Write` is flushed before the notification is sent. In a normal
  editor this proxy would clobber unsaved work. **This is the first thing to re-check if
  the harness ever gains buffered edits**, and it is the assumption most likely to be
  invalidated by someone else's change rather than ours.
- **Version-namespace ownership is subtle** and is the part most likely to break under a
  protocol change; it is covered by exactly one regression scenario today.
- **Opt-in install is fiddly**: the official `typescript-lsp` plugin must be disabled
  first, because the first server registered for an extension wins and the others never
  start — so a half-done install silently keeps the unproxied server, which looks exactly
  like the proxy not working.
- A redundant resync fires after every harness `Edit`; idempotent, but extra traffic.
- Directory watchers are never torn down within a session.

**Neutral / deferred**

- The prototype lives in a new top-level `spikes/` directory, which is a repo-shape
  decision not settled by this ADR.
- Whether this belongs in this repo at all is open: it fixes a harness-wide problem, not a
  Game-of-Life one, so upstream may be the better home. Promoting it to `scripts/` would
  pay full gate freight (CRAP ≤ 6, its own vitest suite, `dry4ts:scripts`, mutation
  testing).

## Verification

**Promotion to Accepted requires one measurement:** install the proxy via the local
marketplace in `spikes/lsp-fs-sync/marketplace/`, with the official `typescript-lsp`
plugin disabled, and confirm in a real session that (a) hover, `goToDefinition` and
`findReferences` all still work, and (b) a `sed` edit followed by a hover returns the new
bytes.

**What would falsify this decision:**

- The harness's own LSP client rejecting the proxy, or the injected `didChange` frames,
  in a way that cannot be fixed within the proxy.
- The harness gaining unsaved buffers, which invalidates the safety argument outright.
- The maintenance cost exceeding the hazard — for instance if the harness upstream fixes
  this by sending `didChangeWatchedFiles` or by reloading buffers, at which point this ADR
  should be superseded and the proxy deleted rather than kept.

**If it is falsified**, option D (kill-hook) is the fallback, and the measurement it needs
first is whether repeated kills exhaust `maxRestarts`.
