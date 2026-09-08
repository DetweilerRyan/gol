# Article: Mutation Testing (Stryker)

**Audience:** cleaner, hardener, the orchestrating session

**Read when:**

- before ruling any survivor equivalent
- at `hardener` stage 5
- when granting a mutation-invariant merge exemption

> The measurements behind every rule here are in `mutation-testing.rationale.md`: the slices each was
> found in, the figures, the source files read, and the readings later corrected. Read it when you are
> **changing** a rule below, never in order to follow one.

## Read a survivor list as a list of candidates

`npm run test:mutation` covers the whole `mutate` list, but Stryker caches results and re-tests only the
mutants whose source _or covering tests_ changed. A mutant in one module is often killed by a test in
another. That is why incremental mode accounts for a moved test, and a source-file-scoped run would
not.

**Stryker misreports a mutant's fate in three measured ways, and every one needs a human to resolve.**
They share a direction: each reports a mutant as _not killed_ when it is. The score falls and someone
investigates. None has ever inflated a score. They share a remedy: **hand-apply the mutant and run the
unfiltered suite. That is the only verdict this repo treats as authoritative.**

1. **Per-test attribution.** A non-equivalent mutant is reported `Survived` with its actual killers
   listed as having run. What Stryker says about _which_ test did the work is not a coverage fact.
2. **Incremental reuse of a static mutant.** An incremental run **is not authoritative for a static
   mutant after a test-side-only edit** — cached results are reused even though the covering test file
   changed. This is a `:full` trigger.
3. **A mutant that crashes the reporter.** It scores `RuntimeError`, which is not evidence about the code
   at all. **Expect the reason string `Cannot convert object to primitive value`, not a fixed site
   list.** Resolve it the same way each time rather than treating it as new.

### A `NoCoverage` mutant cannot be ruled equivalent

`cleaner.md`'s demonstration rule says to hand-apply a survivor and run the unfiltered suite; green means
equivalent. **That inference is only valid for a mutant the suite actually reaches.** For a `NoCoverage`
mutant the suite is green because nothing drives the code. So the run cannot distinguish "this mutation
cannot change behaviour" from "nothing exercises this yet", and those need opposite responses.

**Read the `NoCoverage` column before ruling on a survivor.** If a mutant is uncovered, the finding is
the coverage gap, and equivalence is not yet a question that can be asked.

This is also why a scoped scan is weaker than it looks. `NoCoverage` is reported per run, so a mutant
uncovered in a narrow scan may be covered in a full one. A mid-slice figure is not the figure the gate
will produce.

### Reaching a mutant is necessary but not sufficient

A **covered** mutant can still be undiscriminated. Coverage reports that the line executed. Equivalence
needs a test that executes it **in a state where the mutated and original programs disagree**. Nothing in
Stryker's output says whether the suite ever builds one.

**Before ruling a covered survivor equivalent, name the input or state at which the two programs would
differ, then ask whether any test constructs it.** If you can name one and no test builds it, the finding
is a missing case rather than an equivalence. The honest report is then "unverified".

Two practical notes:

- **The discriminating case usually belongs as another row on the test that already covers the line.**
  A standalone version risks tripping `dry4ts`.
- **A genuine equivalence tends to come with a mechanism, not only a green run.** If you can argue it
  from the language or the framework's own semantics, the green run merely agrees with you.

### The fourth failure has no tool in it: a shell pipeline eating the exit status

`cmd | tail` exits with `tail`'s status, `cmd || echo …` exits 0 by construction, and `set -o pipefail`
is not on by default in a non-interactive shell. The wrapper reports success and the answer you got is
about the wrapper. Every measured instance in this repo ran the same direction: **a red gate or a failed
run reading as green.**

**Measure the tool, not the pipeline.** Redirect to a file and read `$?` on the very next line, then
inspect the file:

```bash
npm run dry4ts > out.log 2>&1; echo "EXIT=$?"
```

Anything you add after the command — a pipe, an `||`, an `&&` — is a second program whose exit status is
the one you will end up quoting. This matters most for the commands whose whole purpose is to fail:
`dry4ts`, `ast-grep:rules`, `agent-doc-check`, `gherkin-lint`, `build`.

Note what this shares with the three Stryker modes above: **the command reported success and the thing
you asked about never ran.** A green line is a claim, and a claim is worth what the command that produced
it measured.

## When to reach for `npm run test:mutation:full`

Whenever the cache's file-level assumptions break:

- `stryker.config.json` changed in either key that decides what the run sees. `mutate` picks the files
  to mutate; **`ignorePatterns`** picks the files that reach the sandbox at all, and therefore which
  tests exist to kill anything
- a module was split or renamed
- test files were moved or deleted rather than edited in place
- **a module changed that other mutated files import, even when neither those files nor their tests
  changed**

Prefer it whenever genuinely unsure: a false-clean score is worse than a slow one.

**That last trigger is the one nothing announces, and it is why the cache does not simply fail safe.**
`IncrementalDiffer` decides reuse per mutant from three things and no others, and **there is no
dependency-graph analysis anywhere in it.** So when a module changes, every cached result for its
importers is reused wholesale, because none of their own bytes moved. **The exposure is bidirectional,
and one direction is dangerous.** A cached `Killed` is reused even if the dependency change made that
test stop killing, which reports the score too _high_.

## The seed pin, and what it does not license

`fast-check-stryker-seed.ts` pins fast-check's seed to `424242` when and only when `'__stryker__' in
globalThis`, through two `setupFiles` entries. `rules/no-fast-check-outside-property-file-ts.yml` and its
`-tsx` twin keep a property test from being declared where neither entry reaches.

**Do not pin the seed globally.** Exploration is the whole point of that layer, and this repo separately
requires repeated property runs when a slice edits a property file. Pinning only under Stryker, leaving
`npm run test:property` exploratory, is the one variant that is not self-defeating.

**A pinned seed does not make the deterministic `it.each` twin redundant.** Pinning makes each mutant run
see one fixed sample of the input space. So a property that only _sometimes_ catches a mutant becomes
deterministic about a mutant it may not catch. A twin states which inputs matter; a pinned seed freezes
an arbitrary draw.

**When ruling a survivor equivalent, treat "its only plausible killer is a property test" as a
disqualifying answer.** Give the invariant a deterministic twin — an `it.each` over pinned inputs, whose
titles are stable — and re-run the gate before ruling.

## `features/` is not in Stryker's sandbox

`stryker.config.json` carries `"ignorePatterns": ["/features"]`, so the whole directory is never copied
into `.stryker-tmp/` and nothing in it can run, kill, or be attributed a kill.

**Keep the entry even though it now subtracts nothing.** Its remaining job is to stop a _future_ test file
placed under `features/` from silently entering the mutation run, and in that role it fails **safe**.

Three things about it are easy to trip over:

- **The leading `/` is load-bearing.** It anchors the pattern to the project root, so it matches
  `features/` and not some nested `src/features/`.
- **`ignorePatterns` has no effect whatsoever under `--inPlace`**, which mutates the real tree instead of
  a sandbox copy. No npm script passes that flag today.
- **A rename of `features/` breaks this entry silently.** An `ignorePatterns` glob that matches nothing is
  not an error and emits no warning.

**Excluded from Stryker is still not unmutated.** `features/` keeps its own mutation signal in
`npm run acceptance-mutation`, which mutates the Examples tables and asks whether the steps notice. That
runner never touches this machinery — it spawns `bddgen` and `playwright test` against the real tree, so
the sandbox and its `ignorePatterns` are not in the picture.

**If `crap4ts` and Stryker ever disagree about a line, close the gap with a jsdom or unit test under
`src/`, never by reaching back into `features/`.**

## The two caches

The two Stryker configs keep **separate** caches — `reports/stryker-incremental.json` for `src/`,
`reports/stryker-incremental-scripts.json` for `scripts/`. One shared cache across two different `mutate`
lists would corrupt both.

**A `--mutate`-scoped run must never pass `--incremental`.** It would record that subset as if it were
the whole project and make the next full-scope run report a false-clean score.

Both cache paths are gitignored, so a fresh clone or CI pays full cost on the first run. That is the safe
default, not a misconfiguration.

**The `scripts/` cache is declared rather than used.** `npm run test:mutation:scripts` passes no
`--incremental` flag, so that side always pays full cost and never writes its file at all — not even on
an aborted run. The separate path still earns its line, because it is what makes adding the flag safe.

> **Turning that flag on is not a one-line change.** `honest-scripts-cache-deletion` reduced merge-protocol
> step 5's `rm -f` to the `src/` path alone. A slice that adds `--incremental` there has to put the second
> path back and restore the plural in the clause beside it. Note the `--mutate` prohibition above
> does **not** reach `test:mutation:scripts`: that is a config-scoped run with its own `mutate` list and
> its own `incrementalFile`.

## Two footguns on the `--mutate` CLI flag

**It is last-wins, not accumulating, and it is silent about it.** `--mutate 'src/a.ts' --mutate 'src/b.ts'`
mutates **only `src/b.ts`** — no error, no warning. The correct form for several targets is one
comma-separated flag: `--mutate 'src/a.ts,src/b.ts'`.

**Sanity-check the `Found N of M file(s) to be mutated` line against the number of files you intended.**
`N` is the real assertion that the scoping worked. A scoped scan that silently covered one file of five
looks identical to one that covered all five and found nothing.

<!-- reference-check: allow src/a.ts -- illustrative hypothetical CLI example, not a real file -->
<!-- reference-check: allow src/b.ts -- illustrative hypothetical CLI example, not a real file -->

**A CLI `--mutate` overrides the config's own `mutate` exclusions.** It **replaces** the config's array
whole rather than merging into it, negations included. So a scoped scan can mutate the very files the
config excludes: `run.ts` shells, or worse, the test files themselves. There a mutated assertion can be
killed by its neighbours and the score stays plausible.

**Carry every negation from the config's `mutate` array through onto the flag.** For `scripts/`:

```bash
npx stryker run stryker.scripts.config.json \
  --mutate 'scripts/<program>/*.ts,!scripts/**/*.test.ts,!scripts/**/run.ts,!scripts/**/test-support.ts' \
  --dryRunOnly
```

`--dryRunOnly` instruments and then stops, so the check costs one initial test run rather than a full
scan. **The `Instrumented N source file(s)` line is a second sanity check** alongside `Found N of M`. It
counts files that actually got mutants, so a count above the number of non-test modules you scoped is
this footgun.

When a scoped scan reports a cluster of `NoCoverage` in one file, suspect this before believing the gap —
an unscoped full run would never see it.

## A `Timeout` counts toward the score as a kill

So a timed-out mutant never appears among survivors. Two consequences to hold together:

- **A timeout is not evidence a test discriminates.** It is a wall-clock artifact, and the survivor set
  at the margin moves between runs because of it.
- **Contamination therefore masks survivors rather than inventing them.** A run whose timeouts spike is
  not a stricter run; it is a run whose survivor list you cannot trust to be complete.

## Statement removal: there is a mutator, and it has two blind spots

Stryker **does** have one — `emptyExpressionMutator`, reported as `CallExpression` — which turns a bare
call **statement** into `;`. Do not record "there is no mutator for this" as a reason.

It does **not** reach two cases:

- **A call in expression position**, where it yields `void 0` instead. A clamp like `Math.max(0, …)`
  genuinely has no removal mutant.
- **A statement whose own subtree contributes any other mutant.** The mutator drops its removal mutant
  whenever that happens.

**Hand-breaking the line is still one command and still the only way to be sure.**

## The mutation-invariant merge allowlist is structurally safe

Every entry on CLAUDE.md's merge-protocol step 5 allowlist is safe. But **not all for the same kind of
reason, and the difference is what you have to protect**:

- **`CLAUDE.md` and `README.md`** — safe as a matter of **fact**: a fixed filename cannot match a test
  glob.
- **`features/**`** — safe by `stryker.config.json`'s `ignorePatterns` keeping it out of the sandbox.
- **`ideas/**` and `.claude/**`** — safe by `vite.config.ts`'s `sharedExclude` naming both directories,
  so a test file placed in either is collected by no vitest project and can kill nothing.

**Those three config entries are load-bearing for this exemption specifically**, not just for a tidy test
run:

- Deleting `sharedExclude`'s `'ideas/**'` or `'.claude/**'` re-opens a hole that a per-merge grep would
  otherwise have to cover.
- Deleting `ignorePatterns`' `/features` breaks the allowlist a different way. No extra check would
  help, because the Gherkin layer would simply be back in the sandbox. **That failure is silent, and it
  moves the score up.**

**Making a path structurally safe is a precondition for putting it on the allowlist, not a follow-up.**
`vite.config.ts`'s `unit` project inherits an **unrooted** include, so it reaches every directory
`sharedExclude` does not name. `perf/`, `rules/`, `rule-tests/`, `patches/` and `public/` are all
collected today. None is on the allowlist, which is exactly why they need no exclusion: a diff touching
one fails the path check and the gate runs. It is also exactly why **adding any of them to the allowlist
would first mean excluding it from vitest.**

**Gitignored paths cannot reach this predicate at all**, which is a different fact from being excluded
from vitest. `.stryker-tmp*/**` and `.features-gen/**` need `sharedExclude` entries yet want no allowlist
entry, because they never appear in `git diff --name-only main...HEAD`. A `git add -f` would put one
there — at which point it is tracked, fails the allowlist, and the gate runs. Fails safe.

**Do not invert that into "gitignored, therefore safe from collection".** Those two entries exist
precisely because it is not.
