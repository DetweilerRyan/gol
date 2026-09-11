---
name: prose-lint-silently-ignores-its-arguments
title: prose-lint accepts and discards any argument, where every sibling program throws
created: 2026-09-11
---

## Situation

`scripts/prose-lint/run.ts` reads no argv at all. Every other `tsx`-run program in `scripts/` that
takes options routes argv through `node:util`'s `parseArgs` in **strict** mode, so an unrecognized
flag or a bare positional throws rather than being ignored. `npm run acceptance-mutation` is the
worked example, and CLAUDE.md documents that behaviour as deliberate.

Found by `architect` in the DESIGN pass for `prose-lint-runner-is-shell-not-typescript`, and ruled
out of that slice's remit: the port was behaviour-preserving, and the shell it replaced ignored argv
too.

## Complication

**The silence is the same fail-open shape this program exists to fight.** `npm run prose-lint -- --fix`
or `npm run prose-lint -- src/cache.ts` runs a full clean pass over the whole tracked tree, prints its
count line, and exits 0. The operator reads a scoped run that never happened, or a fix that was never
applied. A count line saying 417 is the only clue, and it is the clue a reader has already learned to
read as success.

That is exactly the confident-zero family the program's own header enumerates, arriving through the
one channel the header does not cover.

## Question

Does the runner reject unknown argv, or grow the flag an operator is reaching for when they pass one?

## Sketch

The cheap version is `parseArgs` in strict mode with an empty `options` object and
`allowPositionals: false`, matching `scripts/acceptance-mutation/`'s precedent. Any argument then
throws, which is the honest answer while the program takes none.

`scripts/single-flag-arg.ts` already exists at `scripts/` root, shared by more than one program. Read
it before writing anything — this may be a call to an existing helper rather than new code.

The larger version asks what an operator passing an argument actually wants. A path scope is the
obvious candidate, and it has a real hazard measured during the port: vale given **one** nonexistent
path exits 0 silently, and given **two or more** with one missing raises E100 and exits 2. A
single-path scope therefore sits in the silent half, which is the wrong half for this program.

## Touches

- `scripts/prose-lint/run.ts`, and a test for the rejection
- Possibly `scripts/single-flag-arg.ts` if the helper fits
- `CLAUDE.md`'s command list, if a flag is added rather than merely rejected

`scripts/**` is on the mutation-invariance **absent** list, so this re-arms the full mutation run by
construction.

## Open questions

- **Is rejection enough, or is it annoying?** A program that refuses every argument is honest and
  also slightly hostile. Weigh against how often anyone would pass one.
- **`classifyProbe` is already at CRAP 6.0, the threshold**, and `decide` at 5 with the same ceiling.
  Argv handling belongs in neither — put it in `run.ts` or a new module, not in an existing guard
  chain. See the related candidate on functions sitting at exactly threshold.
