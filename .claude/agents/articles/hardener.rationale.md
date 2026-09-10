# Rationale: `hardener`

Evidence behind the rules in `.claude/agents/hardener.md`. No role has a read trigger for this file.
It is read when a rule in that file is being changed, never in order to follow one.

Every rule these cases produced is stated in the role file and is actionable there without this one.
Nothing here restates a rule.

## A single green property run passed a slice that was 13% flaky

This is not hypothetical. In `fix-tile-hysteresis` this role reported `141/141` on a single run and passed the slice; the verification role (then `qa`, now `product`) then found the same file failed **8 times in 60 runs**, and the defect had been in the tree for two commits. The property asserted a real-number theorem over a float amplitude whose realized value rounded across a tile boundary.

## `test:scripts` was red on `main` for several consecutive slices

Measured: `npm run test:scripts` was **red on `main` for several consecutive slices** before anyone noticed, because none of them touched `scripts/`. The retired `gherkin-examples` test module (since split by `gherkin-ast-mutation`; `examples-cell-sites.test.ts` pins the same real-tree facts today) pinned which features carry Examples tables, and `prune-gherkin-to-domain-language` removed `infinite-grid.feature`'s. Every slice after it landed on a red `test:scripts` and passed every gate.

## The same red test also aborted the `scripts/` mutation gate

Measured on `main` at `1895906`: `npm run test:mutation:scripts` **also aborted, exit 1**, at Stryker's dry run — `ConfigError: There were failed tests in the initial test run`, naming that same pinned test. That gate **is** in the substitution table, so even a slice that touched `scripts/` and substituted correctly would have hit a wall. Two `scripts/` gates were unrunnable, not one.

## The incremental cache once had a structural floor

Stage 5's incremental run used to carry a structural floor of ~10% of mutants and ~3m45s, re-tested even when nothing changed at all. `@fast-check/vitest` interpolated the run's seed into each property test's _title_, and Stryker's `IncrementalDiffer` matches cached results _by test name_, so every property test looked brand-new every run. `pin-stryker-seed-to-unblind-the-mutation-gate` removed it.

## The `acceptance` project, and the stage 5 / stage 6 disagreement it caused

`crap4ts` scores `coverage/coverage-final.json`, produced by `npm run test:coverage` through `vite.config.ts`, which then ran a fourth `acceptance` project over the jsdom step tests. Stryker's sandbox omitted `features/` entirely, via `ignorePatterns`. So a line reachable only from a step test read as _covered_ in stage 6. Its mutants were killable only by a non-`features/` test in stage 5.

That same project is why the mutation-invariant exemption's self-revocation clause used to name stage 6. `npm run test:coverage` ran four vitest projects and the `acceptance` one mounted `<App />`, so a `features/`-only diff could genuinely move `crap4ts`. `delete-step-test-layer` removed the project, `vite.config.ts` now defines three (`unit`, `property`, `dom`), and the premise died with it.
