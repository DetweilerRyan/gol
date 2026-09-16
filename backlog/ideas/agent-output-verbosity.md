---
name: agent-output-verbosity
title: Cut the token cost of the quality gates' stdout
created: 2026-08-23
---

## Context

Every pipeline role reads tool output through a context window, and several
gates print far more than a role needs to act. Measured on a clean tree:

| Command                       | stdout     | Notes                                                                                         |
| ----------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `npm run gherkin-dry`         | ~626 lines | 87 findings printed in full; the same data already lands in `reports/gherkin-dry/report.json` |
| `npm run acceptance-mutation` | ~146 lines | one table row per mutant, survivors and killed alike                                          |
| `npm run crap4ts`             | 5937 bytes | full 54-function table, ANSI colour included                                                  |
| `npm run halstead4ts`         | 2384 bytes | 21 rows; the table is the deliverable                                                         |
| `npm test` (green)            | 286 bytes  | already minimal — vitest's default reporter is non-TTY aware                                  |
| `npm run ast-grep` (clean)    | 0 bytes    | nothing to do                                                                                 |

So the cost is concentrated in three places, not spread evenly. `crap4ts`
already ships the fix: `--summary` prints one 67-byte line that still names
the count above threshold and the worst score, and still gates by exit code.

## Sketch

Roughly in impact order:

1. `gherkin-dry` — stdout becomes a summary plus the report path; the JSON keeps
   everything. `product` already reads the JSON directly.
2. `acceptance-mutation` — print survivors and errors only; put the full table
   behind `--verbose`.
3. Stryker's `clearTextReporter` in both configs — `skipFull`, `reportTests:
false`, `logTests: false`, `allowColor: false`. Keep `reportMutants` (the
   diffs are the point) and keep `progress` (the `progress` library already
   no-ops when stdout is not a TTY).
4. Coverage `reporter: ['text', 'json']` → `['text-summary', 'json']` in both
   vitest configs. `crap4ts` only ever reads the JSON.
5. Role files switch their re-confirmation runs to `crap4ts -- --summary`,
   leaving `cleaner`'s diagnostic run on the full table.

## Touches

`scripts/gherkin-dry-checker/`, `scripts/acceptance-mutation/`,
`stryker.config.json`, `stryker.scripts.config.json`, `vite.config.ts`,
`vitest.scripts.config.ts`, plus the role files that name these commands.

New formatting logic must live in a tested pure module, not in `run.ts` —
`run.ts` is excluded from both `crap4ts.scripts.config.ts` and
`stryker.scripts.config.json`, so formatting written there dodges the gates
that would otherwise cover it. `halstead4ts/report.ts` and
`ast-grep-rule-check/decide.ts` are the pattern to copy.

## Open questions

- `acceptance-mutation`'s summary line is a recorded baseline in
  `engineering.md`, and merge-protocol step 8 re-records it. Keep that line
  byte-stable and move only the per-mutant rows?
- `acceptance-mutation` classifies killed-vs-error by regex against the child
  vitest run's stdout (`/Test Files\s+\d+/`). That coupling is invisible and
  breaks if the reporter ever changes. Worth pinning `--reporter=default` on
  that spawn as its own step, independent of the rest.
- Vitest 4 ships an `agent` reporter. Identical to default on a green run; its
  failure output is unmeasured. Measure before adopting.
