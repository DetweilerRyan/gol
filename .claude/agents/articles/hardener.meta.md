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

## Why stage 4 runs `test:scripts` before `test:browser`

`hardener.md`'s stage 4 says to run `npm run test:scripts` first, and states the consequence without
the incident.

The case that produced the rule was not a slice that touched `scripts/`. It was a slice that edited
`features/` and broke a `scripts/` test asserting on `features/` content. The design intent is that a
role working inside `scripts/` substitutes the parallel commands, and that intent covers only a slice
that touches the directory.

So a red `scripts/` gate can sit on `main` for several consecutive slices, because a slice touching no
`scripts/` file never runs it. Measured at the time: the run cost 1.59s, cheaper than stage 8, so
guessing was strictly worse than running it.

The ordering within the stage is the second half. A red unit test in `scripts/` aborts the mutation
gate before it can score anything, which is the same confident-number-about-nothing family this repo
documents elsewhere. Running it first fails in seconds rather than after a dry run.

## What the reference-check ordering rests on

`hardener.md` puts `reference-check` at stage 2 and says its remediation moves `crap4ts` and Stryker's
incremental cache.

The mechanism is Istanbul's: coverage is keyed by source location, so relocating a comment block
shifts every function below it and orphans the stale entries, which then read as uncovered. A
comment-only edit is therefore not inert for either gate.

`agent-doc-check` correctly sits last for the opposite reason: its fixes are pure prose with nothing
downstream to invalidate.

## The predicate's retired second conjunct

CLAUDE.md's mutation-invariance clause once carried a second conjunct covering a gap that
`sharedExclude` has since closed.

The `unit` project's include is unrooted, so before `sharedExclude` named the directory entries,
vitest collected a probe test file placed in any of them. One under `ideas/` importing `src/` would
have run inside the Stryker sandbox. `vale-styles-is-reachable-by-vitests-default-include` and its
predecessors closed that, and the conjunct was retired rather than left as a second thing to check.

## Why the integration mode had to be written down

`hardener.md`'s integration-run exception exists because the merge protocol's step 5 calls for exactly
it and nothing in this file defined it. A post-merge run following the file as written would have
stopped at its first finding outside a changed-files manifest that an integration run does not have.

## Why the allowlist entries are not all secured the same way

`hardener.md`'s stage 5 says the orchestrating session computes the invariance predicate and the role
never grants itself the exemption. It does not say how the entries are secured, because the role acts
on the instruction rather than on the reasoning.

Every entry is structurally safe by a different means. A fixed filename cannot match a test glob at
all. A `features/**` entry rests on `stryker.config.json`'s `ignorePatterns`. A directory entry rests
on `vite.config.ts`'s `sharedExclude` naming that directory, which is why the exclusion for a new
directory has to land before the allowlist entry that depends on it.

**What the checker does not prove.** A `written-argument` entry is verified only to the extent that a
fixed filename cannot become a test. That nothing in the run reads the file is an inventory taken on a
date, not a proof. So a green `npm run mutation-invariance` is not evidence for that tier in the way it
is for the other two. `mutation-invariance.config.json` records which means secures which entry, and
`mutation-testing.rationale.md` carries each entry's argument.

## Why a fast incremental run is not a suspicious one

`hardener.md` says to trust the score rather than the clock. The reason it is phrased as a one-way
rule: a very fast incremental run is the **expected** result on an unchanged tree, so treating speed as
a symptom produces false alarms.

The inverse is what matters and is what the rule keeps. Incremental mode fails safe — it re-tests more
than needed and never falsely reuses a stale result — so a fast run is never evidence that something
was checked. The cache lives at `reports/stryker-incremental.json` and is gitignored, so a fresh clone
pays full cost on its first run. That is the safe default rather than a misconfiguration.

## What mid-cycle re-invocation closes

`hardener.md` says the role may be re-invoked when an adjudicated fix touches `src/`.

The hole it closes belonged to the old four-pack pipeline. Under it, `qa` fixed its own findings and
re-ran only build, property, CRAP and DRY — so a late-cycle fix never saw the mutation gates at all.
Re-invoking the whole sequence is what makes an adjudicated fix as gated as the original
implementation.

## Why the spike check is two commands rather than a judgement

`hardener.md` tells the role to run `git status --porcelain -- src/ scripts/` and
`git log --grep='[spike]' -- src/ scripts/`, and to stop if either returns anything.

A spike implementation satisfies a **provisional** contract — one still being drafted when the spike
ran. Nobody commits one. The failure the pair prevents is un-gated code reaching `main` behind a
contract that was never ratified, which is not a thing a later stage can detect: the code compiles,
the tests pass, and nothing records that the contract it answers was a draft.

## Why stage 8 runs last, and stage 2 does not

Both positions are about what a stage's own remediation invalidates.

`agent-doc-check`'s fixes are prose in `.claude/**` and `CLAUDE.md`, with nothing downstream to
invalidate, so it is safe last. Measured at the time: about 1s wall, of which the checking itself is
sub-100ms and the rest is `tsx` startup.

`reference-check`'s fixes are comment-only edits to `src/` and `scripts/`, which move both `crap4ts`
and Stryker's incremental cache, so it has to precede them.
