---
name: crap4ts-scores-a-tree-that-no-longer-exists
title: Make crap4ts refuse a coverage file older than the sources it scores
created: 2026-09-06
---

## Context

`crap4ts` reads `coverage/coverage-final.json` and **never generates it**. It
also never checks how old it is, and emits no staleness warning of any kind.

`hardener` hit this on `jsdoc-in-src`: stage 5 came back **FAIL, 16 functions
above threshold, worst 30.0**, with coverage reading `0.0` for most files. No
function had changed — the slice was comment-only. Istanbul keys functions by
**source location**, so relocating a comment block shifts every function below
it and orphans the stale entries, which then read as uncovered. Regenerating
coverage restored the byte-identical baseline (140 functions, 0 above
threshold, worst 6.0).

**The direction is what makes this worth fixing.** Here it failed loud, and a
loud failure gets investigated. But the same staleness in the other direction
fails **open**: coverage collected against an older, better-covered tree
produces a confident PASS about a tree that no longer exists. Nothing in the
output distinguishes that from a real pass.

This is the family `mutation-testing.md` already names — a run that reports a
confident number about nothing — and the same shape as `perf-report`'s
leftover `reports/perf/latest.md`, which CLAUDE.md already warns "reads as a
successful run of the current tree". `crap4ts` is a **gate**, which makes it
the worst place in the repo for that failure mode to live undocumented.

## Narrowed 2026-09-11: only one direction fails open

**Absent coverage fails closed.** Measured on `vale-styles-is-reachable-by-vitests-default-include`,
in two separate fresh worktrees on crap4ts 1.0.1 with `patches/crap4ts+1.0.1.patch` applied:

```
npm run crap4ts          (no coverage/)          EXIT: 3
npm run crap4ts:scripts  (no coverage-scripts/)  EXIT: 3
```

with `No coverage data found in <checkout>` and the searched paths named. So a `cleaner` or a
`hardener` in a fresh worktree gets a loud nonzero, not a confident pass. **That half needs no fix
and this idea does not cover it.**

A `hardener` handoff reported exit 0 for that case and the orchestrating session relayed it. Both
were wrong, and the cause is almost certainly the pipeline trap `mutation-testing.md` already
documents as its own failure mode: `npm run crap4ts 2>&1 | tail` yields the exit status of `tail`.
Read `$?` on its own line against a redirected log. Recorded here because the false claim is the kind
that makes a real hazard look bigger than it is, and a reader who checks the cheap half and finds it
sound may stop reading.

**What remains is staleness, and it is the direction that matters.** Coverage that exists but
describes an older tree produces a real-looking number with nothing in the output distinguishing it
from a true pass. The `jsdoc-in-src` incident above is that failure caught in its loud direction; the
quiet direction is the same file being _better_ covered than the tree it is scoring.

Measured again on the same slice's integration run: `main`'s `coverage/coverage-final.json` predated
the landing commit by over two hours and `crap4ts` read it without complaint. The `hardener` that
found it regenerated coverage first by instruction, not because anything in the tool said to.

## Sketch

Cheapest useful version: compare the mtime of `coverage/coverage-final.json`
against the newest mtime among the files it scores, and refuse — nonzero, with
the offending paths named — when the coverage file is older. Refusing is right
rather than warning, since the whole point is that the number is not
trustworthy and a warning on a gate gets read as a pass.

A stronger version keys off content rather than time (a hash of the scored file
set, written alongside the coverage output), which survives a checkout that
resets mtimes. Probably not worth it unless the mtime version proves flaky.

The narrower alternative is to make `npm run crap4ts` depend on
`npm run test:coverage` so it cannot run on a stale file at all. That trades a
fast gate for a slow one, on every invocation, to prevent a failure that a
timestamp check catches for free — but it is the only version that cannot be
skipped, and it deserves weighing rather than dismissing.

## Touches

The crap4ts patch in `patches/` (see `quality-tooling.md`, which documents it),
or a wrapper under `scripts/` — note a `scripts/` program owes CRAP ≤ 6, its
own vitest suite, `dry4ts` and mutation testing, which is a lot of machinery
for a timestamp comparison. `hardener.md`'s stage 6, if the remedy is a
documented "regenerate coverage first" step rather than a mechanical guard.

## Open questions

- **Is this a tool fix or a workflow fix?** Making stage 6 always run
  `npm run test:coverage` first is a one-line change to `hardener.md` and needs
  no code. It is also exactly the kind of discipline-held invariant that the
  gate exists to replace, and it does nothing for anyone running `crap4ts`
  directly.
- **Does `dry4ts` have the same exposure?** It scores sources directly rather
  than reading a coverage artifact, so probably not — but "probably" is doing
  work there and it is a gate too.
- **Does the mtime check misfire under `git checkout`?** Checking out a branch
  rewrites source mtimes and would make fresh coverage look stale, failing
  safe but noisily on every branch switch. That may be frequent enough here,
  with two or three concurrent worktrees, to sink the cheap version.
