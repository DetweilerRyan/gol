---
name: prose-lint-runner-is-shell-not-typescript
title: The prose-lint runner is a shell script, so five gates cannot see it
created: 2026-09-10
---

## Context

`scripts/prose-lint/run.sh` landed in `0bedcb6` as the ninth `scripts/` program. Every other one is
`run.ts`. CLAUDE.md opens the section with "`scripts/` is TypeScript, not JavaScript, and is its own
project", and holds it to CRAP 6 with its own vitest suite.

`architect` ruled it a defect in the `lint-jsdoc-with-vale` REVIEW pass, and routed it here rather
than rewriting it in that pass.

A `.sh` reaches none of the machinery that section describes:

| gate                      | reaches `run.sh`? | why                                               |
| ------------------------- | ----------------- | ------------------------------------------------- |
| `npm run test:scripts`    | no                | vitest collects `*.test.ts`                       |
| `npm run crap4ts:scripts` | no                | TypeScript only                                   |
| `npm run dry4ts:scripts`  | no                | TypeScript only                                   |
| `test:mutation:scripts`   | no                | Stryker mutates TS/JS ASTs                        |
| `npm run reference-check` | no                | scans `.ts`/`.tsx`/`.yml`/`.yaml` and the doc set |

The last row is the one with teeth. `run.sh`'s header cites `prose-linting.md` twice by name. Rename
that article and nothing reports it, which is the exact defect `reference-check` exists to catch.

The script also carries real logic that nothing tests: four failure branches, a `git ls-files` glob
list, a `src/catalyst/` exclusion, and a file count derived through `wc -l`. That count is the
script's whole point, and no test pins it.

## Sketch

Port to `scripts/prose-lint/run.ts`, on the shape the other eight already use. A pure `decide()` over
parsed input, I/O isolated to `run.ts`, one file per concern, and its own `.test.ts`.

Behaviour to preserve exactly: never fail on a finding, fail on absent binary, absent `.vale/`,
unloadable config, or empty file list. Keep the trailing count line, which is what distinguishes a
measured zero from a run that linted nothing.

Worth testing rather than asserting: whether the `sh` version's file count and the `tsx` version's
agree on the same tree.

## Touches

- `scripts/prose-lint/run.sh` deleted, `scripts/prose-lint/run.ts` plus modules and tests added
- `package.json` — the `prose-lint` script stops being `sh …`
- `CLAUDE.md` — the "Nine programs" paragraph and the "Eight of the nine run via `tsx`" sentence both
  lose their carve-out

## Open questions

- Does `reference-check` want a `.sh` extension added anyway, independent of this port? A future
  shell file would have the same blind spot.
- The four failure branches are process-level. How much of that is worth a unit test versus one
  integration test per branch?
