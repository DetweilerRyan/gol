# Spike: making out-of-band writes visible to the language server

**Status: prototype. Measured working, not gate-ready.** Deliberately in `spikes/`
rather than `scripts/`, because `scripts/` carries CRAP ≤ 6, its own vitest suite,
`dry4ts:scripts` and mutation testing, and none of that is paid here. Promoting it means
paying that freight — see "If this graduates" below.

## The problem

Measured 2026-09-08 (see
`ideas/candidates/one-language-server-answers-for-every-worktree.md` for the full
ruling): once the harness sends `textDocument/didOpen`, every later hover is served from
the snapshot the harness holds. Writes that bypass the harness — `sed`, `cat >`, a
heredoc, `git rebase`, `git checkout`, `npm run format` — never reach the server, in any
tree, for the life of the session. Elapsed time, `cat`, the `Read` tool and
`EnterWorktree` all fail to clear it.

**This is not a bug in the language server.** LSP 3.17 says that after `didOpen` "the
document's truth is now managed by the client and the server must not try to read the
document's truth using the document's Uri." A correct server is _required_ to ignore the
disk. So the remedy has to come from the client side — and since we cannot modify the
client, it comes from a shim wearing the server's clothes.

## The design

`proxy.mjs` is a transparent LSP stdio proxy. It spawns the real
`typescript-language-server`, forwards both directions, and additionally:

- tracks every document the client opens (`didOpen` / `didClose`);
- watches the **containing directory** of each open file — not the file — because
  `sed -i ''`, `git checkout` and Prettier all replace the inode rather than writing in
  place, which silently detaches a file-level watch after the first change;
- on a debounced change, hashes the file and, if it differs from what the server was
  last given, injects a full-content `textDocument/didChange` into the **server-bound
  stream only**. The client never sees these.

It also **owns the version namespace toward the server**, rewriting the version on every
client `didChange`. That is what keeps versions monotonic no matter how client edits and
disk events interleave; the `didChange then sed` scenario below is the regression guard
for it.

### Why forcing disk content over the client's buffer is safe here

In a normal editor this proxy would be dangerous: it would clobber unsaved buffers.
Claude Code has no unsaved-buffer concept — every `Edit`/`Write` is flushed to disk
before the notification goes out — so disk is always the truth. **That assumption is the
whole basis for this approach, and it is the first thing to re-check if the harness ever
gains buffered edits.**

## Evidence

`node run-matrix.mjs` spawns a real `typescript-language-server` twice per scenario —
once directly, once through the proxy — opens a fixture, hovers, performs the write, and
hovers again. Measured 2026-09-08, stable across three consecutive runs and also at
`SETTLE_MS=300`:

| scenario                    | direct (control) | through proxy |
| --------------------------- | ---------------- | ------------- |
| `sed -i` (inode replace)    | stale            | **fresh**     |
| `cat >` (truncate in place) | stale            | **fresh**     |
| `git checkout <branch>`     | stale            | **fresh**     |
| `git rebase`                | stale            | **fresh**     |
| `prettier --write`          | stale            | **fresh**     |
| client `didChange` only     | fresh            | **fresh**     |
| `didChange` then `sed`      | partial (`MID`)  | **fresh**     |

The last two are regression guards rather than demonstrations. The `didChange` row must
be fresh in _both_ columns — the in-band path was never broken, and a proxy that broke it
would be worse than the bug. The interleaved row is the one that would catch bad version
bookkeeping: unproxied, the client's change lands and the later `sed` is dropped.

**The harness grades itself**, and that guard is load-bearing: its first draft reported a
clean control sweep while in fact returning `null` for all ten hovers, because the
fixture directory had no resolvable `typescript` install. It now asserts the pre-mutation
hover is `ALPHA` everywhere before any row counts as evidence, and exits nonzero
otherwise.

```bash
node run-matrix.mjs                       # needs typescript-language-server on PATH
PRETTIER_BIN=/abs/path/to/prettier node run-matrix.mjs
```

## Trying it for real

Not installed by anything here — wiring it in changes every session on the machine, so
it is opt-in only.

```
/plugin marketplace add <repo>/spikes/lsp-fs-sync/marketplace
/plugin install typescript-lsp-fs-sync@gol-local-plugins
```

Two things to know before doing that:

- **Disable the official `typescript-lsp` plugin first.** Per the plugin docs, when more
  than one enabled server declares the same extension, the first registered wins and the
  others never start — so leaving both on may silently keep the unproxied server.
- **The path in `marketplace.json` is absolute** and points at the primary checkout. A
  worktree running its own copy would need its own entry, or the file moved somewhere
  stable.

## Known gaps

- **Untested inside the Claude Code harness itself.** Every row above comes from a
  conforming LSP client driven by `run-matrix.mjs`. That proves the server sees the
  write; it does not prove the harness's own client tolerates the proxy end to end.
  That is the next measurement, and it needs the opt-in above.
- **No `didClose` handling for the watcher lifetime beyond removal** — directory
  watchers are never torn down once created. Bounded by the number of distinct
  directories touched in a session, but not zero.
- **Incremental `didChange` leaves the tracked hash stale**, which can only cause a
  redundant resync, never a missed one. Harmless, but it means the hash is an
  optimisation rather than a correctness mechanism.
- **A redundant resync fires after every harness `Edit`**, since the harness writes to
  disk and the watcher sees it. Idempotent, but it is extra traffic per edit.
- **Node's `fs.watch` on a directory is not recursive here** and gives no ordering
  guarantees; the 60ms debounce is empirical, not derived.

## If this graduates

Moving to `scripts/lsp-fs-sync/` means a `run.ts` shell over pure modules, unit tests
under `npm run test:scripts`, CRAP ≤ 6, `dry4ts:scripts`, and mutation testing — the
standard freight. The framing decision first, though, is whether this belongs in this
repo at all: it fixes a harness-wide problem, not a Game-of-Life one, so the natural home
may be upstream rather than here. The alternative already measured and available is
purely conventional — a trivial `Edit` re-syncs the whole file from disk, so a role can
refresh deliberately — which costs nothing to adopt and nothing to maintain.
