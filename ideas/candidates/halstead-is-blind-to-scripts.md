---
name: halstead-is-blind-to-scripts
title: The Halstead report cannot see scripts/, so architect reviews it without that signal
created: 2026-08-25
---

## Context

Raised by `architect` at `acceptance-mutation-on-playwright`'s REVIEW, and demonstrated by that
slice rather than reasoned about.

`scripts/halstead4ts/run.ts` resolves **`crap4ts.config.ts`'s** `include`/`exclude` globs — which
cover `src/**` and nothing else. That resolution is deliberate and good: it exists so the file
list cannot go stale independently of crap4ts's, which it previously did as two hand-synchronized
arrays. The blindness is a side effect of resolving the **`src/`-scoped** config specifically, not
of the resolving.

**The demonstration:** that slice changed roughly 1,500 lines, every one of them in `scripts/` and
root configs — a runner rewritten from vitest to batched Playwright, three modules split for
complexity, two new modules extracted. `architect`'s Halstead report came back **byte-identical to
`main`'s**. The role whose job includes reading Halstead as an advisory complexity signal had no
signal at all for the only code the slice touched.

`crap4ts.scripts.config.ts` already exists and is already the parallel `scripts/` is held to
(CRAP threshold 6, same as `src/`), so there is something to resolve against.

## Why this is worth more than it looks

`scripts/` is where every other gate's tooling lives — the mutation runner, the rule checker, the
doc checker, the perf reporter. CLAUDE.md's own argument for holding it to `src/`'s threshold is
that "it's the tooling every other role's quality gate runs on". The same argument reaches the
advisory signal: a `scripts/` program drifting toward unreadability degrades every gate that runs
through it, and the one report that might have said so cannot see it.

Note this is **advisory only** and must stay so. FTA's score formula is unpublished, which is why
`halstead4ts` is report-only and never a CI gate — that reasoning does not change with scope.

## Sketch

Teach `scripts/halstead4ts/run.ts` to resolve **both** configs and report two tables, or accept a
config path so `npm run halstead4ts:scripts` becomes the parallel command the rest of the
`scripts/` tooling already has (`test:scripts`, `crap4ts:scripts`, `dry4ts:scripts`,
`test:mutation:scripts`). The second reads more like the house pattern and keeps each report's
scope legible; the first means nobody has to remember a second command.

Two things to check rather than assume:

- **fta-cli's size floor.** It returns an empty array — not a zeroed one — for files at or under
  ~6 code lines, which is why `src/equality/is-strict-equal.ts` renders as an explicit
  `not scored (under FTA size floor)` row. `scripts/` has small modules too; confirm they land in
  that row rather than vanishing.
- **The exclusions carry across.** `crap4ts.scripts.config.ts` excludes `**/run.ts` and
  `**/test-support.ts`. A Halstead report that included the ungated `run.ts` shells would report
  on code no other `scripts/` gate scores, which is a different inconsistency rather than a fix.

## Touches

`scripts/halstead4ts/run.ts` and its tests, `package.json` (if a second script lands), CLAUDE.md's
`halstead4ts` bullet and Commands table, and `.claude/agents/architect.md` if the role gains a
second report to read.

## Open questions

- Two tables from one command, or a second command? The house pattern says second command; the
  forget-to-run risk says one.
- Is there any _other_ `src/`-scoped tool with the same blindness? `dry4ts` already has a
  `dry4ts:scripts` parallel and `crap4ts` has `crap4ts:scripts`, so `halstead4ts` may be the only
  one — worth confirming, since the answer decides whether this is a one-line pattern gap or a
  category.
